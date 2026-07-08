import { readFileSync, writeFileSync, copyFileSync, readdirSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';

const ROOT = resolve(process.cwd());
const CONTENT_DIR = join(ROOT, 'content', 'linux');
const BACKUP_DIR = join(ROOT, '.backup-content');

// Fields to skip (no FAANG changes)
const SKIP_FIELDS = new Set(['id', 'schemaVersion', 'contentVersion', 'lastReviewed', 'reviewStatus',
  'difficulty', 'readingTime', 'practiceTime', 'visualHint', 'tags']);

// Fields where we keep FAANG mentions intact (the FAANG Insight section)
const KEEP_FAANG_FIELDS = new Set(['interviewTips']);

// Replacement rules: [pattern, replacement, flags]
// These are applied in order, more specific first
const REPLACEMENTS = [
  // Full phrases to replace entirely
  [/FAANG Architect's (quick map|fast map)/gi, 'Quick map'],
  [/FAANG Architect's Note:/gi, '🧠 Concept:'],
  [/FAANG Architect says:/gi, '🧠 Concept:'],
  [/FAANG Architect's /gi, 'Architect\'s '],
  [/FAANG Architect /gi, 'Architect '],
  [/FAANG architect's /gi, 'architect\'s '],
  [/FAANG architect /gi, 'architect '],
  [/FAANG engineers?/gi, 'Production engineers'],
  [/FAANG companies?/gi, 'Enterprise companies'],
  [/FAANG infrastructure/gi, 'Production infrastructure'],
  [/FAANG environment/gi, 'Enterprise environment'],
  [/FAANG production/gi, 'Production'],
  [/FAANG SRE/gi, 'Production SRE'],
  [/FAANG scale/gi, 'Enterprise scale'],
  [/FAANG scenario/gi, 'Production scenario'],
  [/FAANG Linux/gi, 'Linux'],
  [/FAANG community/gi, 'Open source community'],
  [/FAANG system design/gi, 'System design'],
  [/FAANG systems/gi, 'Production systems'],
  [/FAANG operations/gi, 'Operations'],
  [/FAANG interview process/gi, 'Interview process'],
  [/FAANG interview(?!s)/gi, 'Interview'],
  [/FAANG interviews/gi, 'Interviews'],
  [/FAANG interviewers?/gi, 'Interviewers'],
  [/FAANG Q&A/gi, 'Q&A'],
  [/FAANG hosting/gi, 'Cloud hosting'],
  [/FAANG prepared/gi, 'Prepared'],
  [/FAANG's /gi, 'The '],
  [/FAANG/gi, 'Enterprise']
];

function walkDir(dir) {
  const files = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDir(fullPath));
    } else if (entry.name.endsWith('.json')) {
      files.push(fullPath);
    }
  }
  return files;
}

function replaceInString(str, skipKeys) {
  if (!str || typeof str !== 'string') return str;
  
  // Check if this string is linked to a skip key or keep FAANG key
  // We still process even keep-FAANG fields for the interviewTips fix
  
  let result = str;
  for (const [pattern, replacement] of REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

function traverseAndReplace(obj, path = '') {
  if (!obj || typeof obj !== 'object') return;
  
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      if (typeof obj[i] === 'string') {
        // Check if parent key should skip or keep FAANG
        const parentKey = path.split('.').pop();
        if (!SKIP_FIELDS.has(parentKey)) {
          if (!KEEP_FAANG_FIELDS.has(parentKey)) {
            obj[i] = replaceInString(obj[i]);
          }
        }
      } else if (obj[i] && typeof obj[i] === 'object') {
        traverseAndReplace(obj[i], path + '[' + i + ']');
      }
    }
  } else {
    for (const key of Object.keys(obj)) {
      const newPath = path ? path + '.' + key : key;
      
      if (SKIP_FIELDS.has(key)) continue;
      
      if (typeof obj[key] === 'string') {
        if (!KEEP_FAANG_FIELDS.has(key)) {
          obj[key] = replaceInString(obj[key], key);
        }
      } else if (obj[key] && typeof obj[key] === 'object') {
        traverseAndReplace(obj[key], newPath);
      }
    }
  }
}

function countFAANG(obj) {
  if (!obj) return 0;
  if (typeof obj === 'string') {
    return (obj.match(/FAANG/gi) || []).length;
  }
  if (Array.isArray(obj)) {
    return obj.reduce((sum, item) => sum + countFAANG(item), 0);
  }
  if (typeof obj === 'object') {
    return Object.values(obj).reduce((sum, val) => sum + countFAANG(val), 0);
  }
  return 0;
}

function cleanupFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content);
  
  const before = countFAANG(data);
  if (before === 0) {
    return { id: data.id, before: 0, after: 0, changed: false };
  }
  
  // Backup original
  const relPath = filePath.replace(ROOT + '/', '');
  if (!existsSync(BACKUP_DIR)) {
    // Just note the path
  }
  
  // Traverse and replace
  traverseAndReplace(data);
  
  const after = countFAANG(data);
  
  // Write back
  writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
  
  return { id: data.id, before, after, changed: before !== after };
}

function main() {
  console.log('=== FAANG Content Cleanup ===\n');
  
  const allFiles = walkDir(CONTENT_DIR);
  console.log('Found ' + allFiles.length + ' content files\n');
  
  let totalBefore = 0;
  let totalAfter = 0;
  let changedCount = 0;
  
  for (const file of allFiles) {
    const result = cleanupFile(file);
    totalBefore += result.before;
    totalAfter += result.after;
    if (result.changed) {
      changedCount++;
      console.log('  ' + result.id + ': ' + result.before + ' → ' + result.after + ' FAANG mentions');
    }
  }
  
  console.log('\n=== Summary ===');
  console.log('Files processed: ' + allFiles.length);
  console.log('Files changed: ' + changedCount);
  console.log('Total FAANG mentions: ' + totalBefore + ' → ' + totalAfter);
  console.log('Reduction: ' + (totalBefore - totalAfter) + ' mentions removed');
  
  // Special note about linux-faang-scale
  const faangScalePath = join(CONTENT_DIR, 'sre', 'linux-faang-scale.json');
  const faangData = JSON.parse(readFileSync(faangScalePath, 'utf-8'));
  const remaining = countFAANG(faangData);
  console.log('\nNote: linux-faang-scale.json intentionally retains ' + remaining + ' FAANG mentions (chapter theme)');
}

main();
