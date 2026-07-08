// scripts/validate.mjs
// Validates JSON content files and generated assets

import fs from 'fs';
import path from 'path';

const contentDir = 'content';
const errors = [];
const validRoutes = new Set();
const validHashes = new Set();
const tagsSeen = {};

// Helper: Levenshtein distance for tag consistency checking
function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  if (a.length > b.length) { const t = a; a = b; b = t; }
  const row = Array(a.length + 1);
  for (let i = 0; i <= a.length; i++) row[i] = i;
  for (let j = 1; j <= b.length; j++) {
    let prev = j;
    for (let i = 1; i <= a.length; i++) {
      let val;
      if (b.charAt(j - 1) === a.charAt(i - 1)) {
        val = row[i - 1];
      } else {
        val = Math.min(row[i - 1] + 1, prev + 1, row[i] + 1);
      }
      row[i - 1] = prev;
      prev = val;
    }
    row[a.length] = prev;
  }
  return row[a.length];
}

// First Pass: Scan all JSON documents, collect valid routes and section hashes, check basic properties
function collectMetadata(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectMetadata(fullPath);
    } else if (entry.name.endsWith('.json')) {
      try {
        const fileContent = fs.readFileSync(fullPath, 'utf8');
        const data = JSON.parse(fileContent);

        // Check required fields
        if (!data.id) {
          errors.push(`${fullPath}: missing "id"`);
          continue;
        }
        if (!data.title) errors.push(`${fullPath}: missing "title"`);
        if (!data.category) errors.push(`${fullPath}: missing "category"`);
        if (!data.subcategory) errors.push(`${fullPath}: missing "subcategory"`);

        // LCM v2 schema validation
        if (data.schemaVersion) {
          if (data.schemaVersion !== '2.0') {
            errors.push(`${fullPath}: schemaVersion should be "2.0", got "${data.schemaVersion}"`);
          }
        } else {
          errors.push(`${fullPath}: missing "schemaVersion" (LCM v2 required)`);
        }

        if (!data.contentVersion) errors.push(`${fullPath}: missing "contentVersion"`);
        if (!data.lastReviewed) errors.push(`${fullPath}: missing "lastReviewed"`);

        if (!data.difficulty) {
          errors.push(`${fullPath}: missing "difficulty"`);
        } else if (!['beginner', 'intermediate', 'advanced'].includes(data.difficulty)) {
          errors.push(`${fullPath}: difficulty must be "beginner", "intermediate", or "advanced", got "${data.difficulty}"`);
        }

        if (data.readingTime === undefined || data.readingTime === null) {
          errors.push(`${fullPath}: missing "readingTime"`);
        } else if (typeof data.readingTime !== 'number' || data.readingTime < 1) {
          errors.push(`${fullPath}: readingTime must be a positive number, got ${data.readingTime}`);
        }

        if (data.practiceTime === undefined || data.practiceTime === null) {
          errors.push(`${fullPath}: missing "practiceTime"`);
        } else if (typeof data.practiceTime !== 'number' || data.practiceTime < 1) {
          errors.push(`${fullPath}: practiceTime must be a positive number, got ${data.practiceTime}`);
        }

        if (!data.prerequisites || !Array.isArray(data.prerequisites)) {
          errors.push(`${fullPath}: missing or invalid "prerequisites" array`);
        }

        if (!data.learningObjectives || !Array.isArray(data.learningObjectives) || data.learningObjectives.length === 0) {
          errors.push(`${fullPath}: missing or empty "learningObjectives" array`);
        }

        const id = data.id;
        validRoutes.add(id);

        // Add default guide sections
        validHashes.add(`#${id}`);
        validHashes.add(`#section-syntax`);
        if (data.comparisonTable) validHashes.add(`#section-comparison`);
        if (data.diffTable) validHashes.add(`#section-differences`);
        if (data.details) validHashes.add(`#section-dive`);

        // Add section-specific hashes
        if (data.sections && Array.isArray(data.sections)) {
          data.sections.forEach((sec, idx) => {
            validHashes.add(`#section-${id}-${idx}`);
          });
        }

        // Track and validate tag taxonomy
        if (data.tags && Array.isArray(data.tags)) {
          data.tags.forEach(tag => {
            const normalized = tag.toLowerCase().trim();
            if (!tagsSeen[normalized]) {
              tagsSeen[normalized] = [];
            }
            tagsSeen[normalized].push(fullPath);
          });
        }
      } catch (e) {
        errors.push(`${fullPath}: invalid JSON - ${e.message}`);
      }
    }
  }
}

// Second Pass: Check links, hashes, and tag taxonomy consistency
function validateContent(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      validateContent(fullPath);
    } else if (entry.name.endsWith('.json')) {
      try {
        const fileContent = fs.readFileSync(fullPath, 'utf8');
        const data = JSON.parse(fileContent);

        // Validate links inside roadmap / study plans recursively
        function checkLinks(obj, keyPath = '') {
          if (typeof obj === 'string') {
            // Match pattern docs.html#section-name or just #section-name
            const docLinkRegex = /docs\.html#([a-zA-Z0-9\-_]+)/g;
            let match;
            while ((match = docLinkRegex.exec(obj)) !== null) {
              const hash = '#' + match[1];
              const target = match[1];
              if (!validHashes.has(hash)) {
                let baseGuideId = target;
                if (target.startsWith('section-')) {
                  const parts = target.replace('section-', '').split('-');
                  if (parts.length > 1) {
                    parts.pop();
                    baseGuideId = parts.join('-');
                  }
                }
                if (!validRoutes.has(baseGuideId)) {
                  errors.push(`${fullPath} [${keyPath}]: links to non-existent guide ID "${baseGuideId}"`);
                } else {
                  errors.push(`${fullPath} [${keyPath}]: links to non-existent section hash "${hash}"`);
                }
              }
            }
            if (obj.startsWith('#') && obj.length > 1 && obj.indexOf('\n') === -1 && /^#[a-zA-Z0-9\-_]+$/.test(obj)) {
              if (!validHashes.has(obj)) {
                errors.push(`${fullPath} [${keyPath}]: links to non-existent section hash "${obj}"`);
              }
            }
          } else if (obj && typeof obj === 'object') {
            for (const k in obj) {
              if (obj.hasOwnProperty(k)) {
                checkLinks(obj[k], keyPath ? `${keyPath}.${k}` : k);
              }
            }
          }
        }
        checkLinks(data);
        // Validate LCM v2 prerequisites reference valid chapter IDs
        if (data.prerequisites && Array.isArray(data.prerequisites)) {
          for (const prereq of data.prerequisites) {
            if (!validRoutes.has(prereq)) {
              errors.push(`${fullPath}.prerequisites: "${prereq}" does not match any existing chapter ID`);
            }
          }
        }
      } catch (e) {
        // Errors already caught in first pass
      }
    }
  }
}

// Run checks
if (fs.existsSync(contentDir)) {
  collectMetadata(contentDir);
  
  // Tag consistency check: Alert if tags are extremely similar (e.g. singular/plural or typo variations)
  const tagKeys = Object.keys(tagsSeen);
  for (let i = 0; i < tagKeys.length; i++) {
    for (let j = i + 1; j < tagKeys.length; j++) {
      const tagA = tagKeys[i];
      const tagB = tagKeys[j];
      const dist = levenshtein(tagA, tagB);
      if (dist === 1 && (tagA + 's' === tagB || tagB + 's' === tagA || tagA.replace('-', '') === tagB || tagB.replace('-', '') === tagA)) {
        errors.push(`Tag taxonomy collision detected: "${tagA}" (used in ${tagsSeen[tagA].map(f => path.basename(f)).join(', ')}) and "${tagB}" (used in ${tagsSeen[tagB].map(f => path.basename(f)).join(', ')}) are too similar. Standardize tag spelling.`);
      }
    }
  }

  validateContent(contentDir);
}

if (errors.length > 0) {
  console.error('Validation failed:');
  errors.forEach(e => console.error('  - ' + e));
  process.exit(1);
} else {
  console.log('Validation passed: all JSON files, taxonomy, and link hashes valid.');
}
