import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

const ROOT = resolve(process.cwd());
const CONTENT_DIR = join(ROOT, 'content', 'linux');

function walkDir(dir) {
  const files = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkDir(fullPath));
    else if (entry.name.endsWith('.json')) files.push(fullPath);
  }
  return files;
}

function stripHtml(str) {
  return str.replace(/<[^>]*>/g, '').trim();
}

function extractCommands(codeBlock) {
  if (!codeBlock) return [];
  const lines = codeBlock.split('\n');
  const commands = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || trimmed === '') continue;
    // Skip directory paths (/bin, /etc, /var, etc.)
    if (trimmed.match(/^\/[a-z]/)) continue;
    // Skip lines that are just comments or non-commands
    if (trimmed.match(/^(#|---|\|)/)) continue;
    const cmdMatch = trimmed.match(/^(`[^`]+`|[\w][\w\.\/-]*)\s*/);
    if (cmdMatch) {
      const cmd = cmdMatch[1].replace(/`/g, '');
      // Skip if it looks like a path or key: value pair
      if (cmd.match(/^\/|:$/) || cmd.length > 40) continue;
      commands.push(cmd);
    }
  }
  return [...new Set(commands)];
}

function extractKeyConcepts(sections) {
  if (!sections) return [];
  return sections
    .filter(s => s.title && !s.title.includes('Interview') && !s.title.includes('Reference'))
    .map(s => stripHtml(s.title));
}

function generateQuiz(data) {
  const concepts = extractKeyConcepts(data.sections);
  const cmds = getAllCommands(data);
  const mainCmd = cmds[0] || 'ls';
  const topic = data.id.replace('linux-', '').replace(/-/g, ' ');
  const title = data.title || topic;

  const quizzes = [];
  
  // Q1: Definition
  if (concepts[0]) {
    const c = concepts[0];
    quizzes.push({
      question: `What is ${c}?`,
      options: [
        `A standardized directory structure that defines where files and directories should be placed on Linux systems`,
        `A tool for managing disk partitions`,
        `A network configuration protocol`,
        `A user authentication system`
      ],
      answer: `A standardized directory structure that defines where files and directories should be placed on Linux systems`,
      explanation: `The ${c} is the foundation of the Linux filesystem — everything in the system is organized under this structure.`
    });
  } else {
    quizzes.push({
      question: `What is the primary purpose of ${data.id}?`,
      options: [
        `To ${topic.replace(' ', ' ')} on modern Linux systems`,
        `To handle network configuration`,
        `To manage user accounts`,
        `To compile source code`
      ],
      answer: `To ${topic.replace(' ', ' ')} on modern Linux systems`,
      explanation: `This chapter covers the essential concepts and practical skills for ${topic}.`
    });
  }

  // Q2: Concept
  const cmdQuestion = cmds.length > 2 ? `What does \`${cmds[0]}\` do?` : `How do you list the contents of a ${topic} related directory?`;
  quizzes.push({
    question: cmdQuestion,
    options: cmds.length > 3
      ? [
          `Lists information about ${topic}`,
          `Creates a new directory`,
          `Removes files`,
          `Copies files between directories`
        ]
      : [
          `Lists files and directories in the current or specified path`,
          `Changes the current working directory`,
          `Creates a new file`,
          `Displays system information`
        ],
    answer: `Lists files and directories in the current or specified path`,
    explanation: `Use \`ls\` to explore directory contents. Combine with flags like \`-l\` (long format), \`-a\` (hidden files), and \`-h\` (human-readable sizes).`
  });

  // Q3: Practical
  quizzes.push({
    question: `Which command would you use to view disk usage of the ${topic} directory?`,
    options: [
      `du -sh /path/to/directory`,
      `cat /path/to/directory`,
      `cp -r /path/to/directory`,
      `chmod /path/to/directory`
    ],
    answer: `du -sh /path/to/directory`,
    explanation: `\`du -sh\` (disk usage, summary, human-readable) shows the total size of a directory and its contents.`
  });

  // Q4: Troubleshooting
  quizzes.push({
    question: `A user reports "Permission denied" when trying to access a ${topic} directory. What is the first command you should run?`,
    options: [
      `ls -ld /path/to/directory`,
      `chmod 777 /path/to/directory`,
      `rm -rf /path/to/directory`,
      `systemctl restart sshd`
    ],
    answer: `ls -ld /path/to/directory`,
    explanation: `\`ls -ld\` shows the directory's permissions and ownership. Always inspect before making changes — starting with \`chmod 777\` is a security anti-pattern.`
  });

  // Q5: Scenario
  quizzes.push({
    question: `In a ${topic} scenario, your monitoring alerts show ${mainCmd} failing intermittently. What is the correct debugging workflow?`,
    options: [
      `Check logs → verify configuration → test in staging → apply fix → monitor`,
      `Reboot the server immediately`,
      `Reinstall the operating system`,
      `Ignore the alert and wait for it to resolve`
    ],
    answer: `Check logs → verify configuration → test in staging → apply fix → monitor`,
    explanation: `A structured debugging workflow prevents cascading failures. Always diagnose before acting, especially in production environments where downtime has direct business impact.`
  });

  return quizzes;
}

function generatePracticeLabs(data) {
  const uniqueCmds = getAllCommands(data);
  const topic = data.id.replace('linux-', '').replace(/-/g, ' ');
  const concepts = extractKeyConcepts(data.sections);

  const labs = concepts.slice(0, 3).map((concept, i) => {
    const cmd = uniqueCmds[i] || uniqueCmds[0] || 'ls';
    const manCmd = cmd.split(/\s/)[0].replace(/[^a-z0-9_-]/g, '');
    return {
      title: `Explore: ${concept}`,
      task: `Run \`${cmd}\` and examine the output. Note the structure, key fields, and patterns you observe. Try different flags to see how the output changes.`,
      expectedOutput: `Output will vary by system. Look for structured fields, key identifiers, and configuration sections.`,
      hint: `Use \`man ${manCmd}\` to see all available flags and understand the output columns.`
    };
  });

  return labs;
}

function generateQuickReference(data) {
  const sections = data.sections || [];
  if (!sections.length) return { title: 'Quick Reference', content: '| Command | Description |\n|---|---|\n' };
  
  const rows = [];
  for (const s of sections.slice(0, 6)) {
    const cmds = extractCommands(s.codeBlock);
    const desc = s.title || stripHtml(s.description || '').substring(0, 60);
    const cleanDesc = stripHtml(desc).replace(/\s+/g, ' ').trim().substring(0, 60);
    for (const cmd of cmds.slice(0, 3)) {
      rows.push(`| \`${cmd}\` | ${cleanDesc} |`);
    }
  }
  
  if (!rows.length) {
    // Fallback to common commands
    rows.push('| `ls` | List directory contents |');
    rows.push('| `cat` | Display file contents |');
    rows.push('| `grep` | Search text patterns |');
  }
  
  return {
    title: 'Quick Reference',
    content: '| Command | Description |\n|---|---|\n' + rows.join('\n')
  };
}

function getAllCommands(data) {
  const allCmds = [];
  for (const s of (data.sections || [])) {
    const cmds = extractCommands(s.codeBlock);
    allCmds.push(...cmds);
  }
  return [...new Set(allCmds)].filter(c => c.match(/^[a-z]/) && c.length < 30);
}

function generateTroubleshooting(data) {
  const topic = data.id.replace('linux-', '').replace(/-/g, ' ');
  const cmds = getAllCommands(data);
  const mainCmd = cmds[0] || 'command';

  return [
    {
      symptom: `${mainCmd} returns unexpected output`,
      cause: `Incorrect arguments, wrong working directory, or stale cached data`,
      solution: `Verify arguments with \`man ${mainCmd}\`; check current path with \`pwd\`; clear cache if applicable`
    },
    {
      symptom: `Configuration changes not taking effect`,
      cause: `Service not reloaded or syntax error in config file`,
      solution: `Validate config syntax with built-in test flag; reload service with \`systemctl reload\` or \`restart\``
    },
    {
      symptom: `${topic} operation slow or timing out`,
      cause: `Resource exhaustion (disk I/O, memory pressure, or lock contention)`,
      solution: `Check \`iostat\`, \`free -m\`, and \`top\`; look for stuck processes with \`ps aux --sort=-%cpu\``
    },
    {
      symptom: `Permission issues accessing ${topic} resources`,
      cause: `Incorrect file ownership or overly restrictive permissions`,
      solution: `Inspect with \`ls -la\`; fix with \`chown\`/ \`chmod\`; check ACLs with \`getfacl\``
    }
  ];
}

function fixLearningObjectives(data) {
  const objectives = [];
  const concepts = extractKeyConcepts(data.sections);
  for (const c of concepts) {
    const cleaned = c.replace(/^(Understand|Learn about|Explore|How to)\s+/i, '');
    objectives.push(`Understand ${cleaned.charAt(0).toLowerCase() + cleaned.slice(1)}`);
  }
  // Remove duplicates
  return [...new Set(objectives)];
}

function fixFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content);
  const id = data.id;
  let changed = false;

  // 1. Fix quiz — always regenerate (initial auto-gen was broken)
  data.quiz = generateQuiz(data);
  changed = true;

  // 2. Fix learning objectives
  if (data.learningObjectives) {
    const fixed = fixLearningObjectives(data);
    if (fixed.length > 2) {
      data.learningObjectives = fixed;
      changed = true;
    }
  }

  // 3. Fix practice labs — always regenerate (initial auto-gen was broken)
  data.practiceLabs = generatePracticeLabs(data);
  changed = true;

  // 4. Fix quick reference — always regenerate (initial auto-gen was broken)
  data.quickReference = generateQuickReference(data);
  changed = true;

  // 5. Fix troubleshooting — always regenerate (initial auto-gen was generic)
  data.troubleshooting = generateTroubleshooting(data);
  changed = true;

  if (changed) {
    writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
    console.log(`  ${id}: quiz/labs/reference/troubleshooting/objectives rebuilt`);
  }

  return changed;
}

function main() {
  console.log('=== Auto-Generated Content Fix ===\n');
  const files = walkDir(CONTENT_DIR);
  let count = 0;
  for (const f of files) {
    if (fixFile(f)) count++;
  }
  console.log(`\nFixed ${count}/30 files.`);
  console.log('Manual review recommended for quiz content across all chapters.');
  console.log('Run: npm run validate && npm run build && npm run build:book');
}

main();
