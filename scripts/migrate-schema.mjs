import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';

const ROOT = resolve(process.cwd());
const CONTENT_DIR = join(ROOT, 'content', 'linux');

const PHASES = [
  'foundations',
  'systems',
  'advanced',
  'sre'
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

function calculateReadingTime(data) {
  let text = data.description || '';
  if (data.details) text += ' ' + data.details;
  if (data.sections) {
    for (const sec of data.sections) {
      if (sec.title) text += ' ' + sec.title;
      if (sec.description) text += ' ' + sec.description;
      if (sec.codeBlock) text += ' ' + sec.codeBlock;
    }
  }
  if (data.codeBlock) text += ' ' + data.codeBlock;
  const cleanText = text.replace(/<[^>]*>/g, ' ');
  const words = cleanText.split(/\s+/).filter(w => w.length > 0).length;
  const codeBlocks = (data.sections?.filter(s => s.codeBlock).length || 0) + (data.codeBlock ? 1 : 0);
  return Math.max(5, Math.round(words / 200 + codeBlocks * 2));
}

function inferDifficulty(data) {
  const tags = (data.tags || []).map(t => t.toLowerCase());
  const title = (data.title || '').toLowerCase();
  const subcategory = (data.subcategory || '').toLowerCase();
  
  if (subcategory === 'advanced' || tags.includes('ebpf') || tags.includes('kernel') || 
      tags.includes('gpu') || tags.includes('performance') || title.includes('kernel') ||
      title.includes('bpf') || title.includes('memory') || title.includes('io')) {
    return 'advanced';
  }
  if (subcategory === 'foundations' || tags.includes('basics') || tags.includes('cli') ||
      tags.includes('git') || tags.includes('permissions') || tags.includes('filesystem')) {
    return 'beginner';
  }
  return 'intermediate';
}

function inferPrerequisites(data, allIds) {
  const prereqs = [];
  const tags = (data.tags || []).map(t => t.toLowerCase());
  const title = (data.title || '').toLowerCase();
  
  const prereqMap = {
    'linux-filesystem': ['linux-history'],
    'linux-permissions': ['linux-filesystem', 'linux-cli-basics'],
    'linux-cli-basics': ['linux-history'],
    'linux-shell-basics': ['linux-cli-basics'],
    'linux-text-processing': ['linux-cli-basics', 'linux-shell-basics'],
    'linux-git': ['linux-cli-basics'],
    'linux-processes': ['linux-cli-basics', 'linux-shell-basics'],
    'linux-package-mgmt': ['linux-cli-basics', 'linux-filesystem'],
    'linux-systemd': ['linux-processes', 'linux-shell-basics'],
    'linux-users': ['linux-permissions', 'linux-filesystem'],
    'linux-ssh': ['linux-users', 'linux-networking'],
    'linux-networking': ['linux-cli-basics', 'linux-processes'],
    'linux-storage': ['linux-filesystem', 'linux-permissions'],
    'linux-kernel': ['linux-processes', 'linux-memory'],
    'linux-memory': ['linux-kernel', 'linux-processes'],
    'linux-io': ['linux-kernel', 'linux-storage'],
    'linux-perf': ['linux-kernel', 'linux-memory', 'linux-processes'],
    'linux-bpf': ['linux-kernel', 'linux-networking'],
    'linux-monitoring': ['linux-processes', 'linux-networking', 'linux-systemd'],
    'linux-gpu-computing': ['linux-kernel', 'linux-memory'],
    'linux-build-toolchain': ['linux-cli-basics', 'linux-shell-basics', 'linux-git'],
    'linux-cgroups': ['linux-processes', 'linux-kernel'],
    'linux-docker': ['linux-cgroups', 'linux-networking', 'linux-filesystem'],
    'linux-kubernetes': ['linux-docker', 'linux-networking', 'linux-systemd'],
    'linux-troubleshooting': ['linux-processes', 'linux-networking', 'linux-storage', 'linux-systemd'],
    'linux-system-rescue': ['linux-troubleshooting', 'linux-storage', 'linux-filesystem'],
    'linux-security': ['linux-users', 'linux-permissions', 'linux-networking', 'linux-systemd'],
    'linux-faang-scale': ['linux-kernel', 'linux-networking', 'linux-monitoring', 'linux-docker'],
    'linux-interview-qs': []
  };
  
  if (prereqMap[data.id]) {
    for (const pid of prereqMap[data.id]) {
      if (allIds.includes(pid)) prereqs.push(pid);
    }
  }
  
  return prereqs;
}

function generateLearningObjectives(data) {
  const objectives = [];
  if (data.sections) {
    for (const sec of data.sections) {
      if (sec.title) {
        const cleanTitle = sec.title.replace(/^(FAANG|Interview|Reference)/i, '').trim();
        if (cleanTitle && !cleanTitle.toLowerCase().includes('faq')) {
          objectives.push('Understand ' + cleanTitle.toLowerCase());
        }
      }
    }
  }
  if (objectives.length === 0 && data.description) {
    objectives.push('Understand the fundamentals of ' + data.title.toLowerCase());
  }
  return objectives.slice(0, 6);
}

function generateAnalogy(data) {
  const analogies = {
    'linux-history': { title: 'Linux as a City', description: 'The kernel is the city government - it manages resources, enforces laws (permissions), and provides services. Distributions are different neighborhoods built on the same infrastructure. Open source means anyone can propose improvements to the city plan.' },
    'linux-filesystem': { title: 'Filesystem as a Library', description: 'The root directory (/) is the main entrance. /bin and /sbin are the reference section (essential tools). /etc is the catalog system (configuration). /var is the archives where new records (logs) arrive daily. /home is personal study carrels. /proc and /sys are live feeds showing what the library is doing right now.' },
    'linux-permissions': { title: 'Permissions as House Keys', description: 'Each file is a room. The owner has the master key (read/write/execute). Group members have a shared key (read/execute). Others might only peek through the window (read). The sticky bit on /tmp is like a coat check - you can hang your coat, but only you can take it back.' },
    'linux-cli-basics': { title: 'CLI as a Conversation', description: 'The shell is a bilingual interpreter. You speak in commands (verbs) with arguments (nouns). Pipes (|) pass the output of one conversation directly into the next - like whispering a message down a line. Redirection (> and <) saves or loads the conversation from a transcript file.' },
    'linux-shell-basics': { title: 'Shell Scripts as Recipes', description: 'A shell script is a recipe card. Variables are ingredients. Loops are "repeat until done." Conditionals are "if the oven is hot, bake; else preheat." Functions are prep steps you reuse across recipes. The shebang (#!/bin/bash) tells the kitchen which chef to use.' },
    'linux-text-processing': { title: 'Text Processing as a Factory Line', description: 'grep is the quality inspector (filters lines). sed is the find-and-replace machine. awk is the programmable assembler that builds reports. sort organizes inventory. uniq removes duplicates. Pipes (|) are conveyor belts moving text between stations.' },
    'linux-git': { title: 'Git as a Time Machine', description: 'Commits are snapshots in time. Branches are parallel timelines. Merge brings timelines together. Rebase rewrites history to make it linear. The working directory is your present. The index (staging) is your packing list for the next snapshot. Remote is a backup vault in another dimension.' },
    'linux-processes': { title: 'Processes as Kitchen Staff', description: 'Each process is a chef. The kernel is the head chef assigning tasks (scheduling). Fork() creates a duplicate chef. Exec() gives the chef a new recipe. Signals are kitchen bells - SIGTERM is "finish your dish," SIGKILL is "leave immediately." Zombies are chefs who finished but nobody collected their timesheet.' },
    'linux-package-mgmt': { title: 'Package Manager as a Curated App Store', description: 'Repositories are verified warehouses. Dependencies are "this dish requires these ingredients." The package manager resolves the full shopping list automatically. apt/dnf are different store chains - same concept, different inventory.' },
    'linux-systemd': { title: 'Systemd as the Conductor', description: 'Services are musicians. Unit files are sheet music - they define what to play, when to start, and who to wait for. Dependencies are "violin starts after cello." Socket activation is "play when the audience arrives." Journal is the recording of the performance.' },
    'linux-users': { title: 'Users as Club Members', description: 'Each user has a membership card (UID). Groups are clubs - members share access to club resources (files). Root is the club owner with master keys. sudo is a temporary VIP pass. The /etc/passwd is the member directory; /etc/shadow holds the secret handshakes.' },
    'linux-ssh': { title: 'SSH as a Secure Tunnel', description: 'The client and server perform a secret handshake (key exchange). Public keys are like padlocks - anyone can snap them on (encrypt), but only the private key holder can unlock (decrypt). The tunnel protects everything inside from eavesdroppers on the public internet.' },
    'linux-networking': { title: 'Networking as a Postal System', description: 'IP addresses are street addresses. Ports are apartment numbers. DNS is the phone book translating names to addresses. Routes are the roads. Firewalls (iptables/nftables) are security checkpoints. TCP is registered mail (guaranteed delivery). UDP is a postcard (fire and forget).' },
    'linux-storage': { title: 'Storage as a Filing Cabinet', description: 'Block devices are empty drawers. Filesystems (ext4, XFS) are the filing system - they organize how papers are stored. LVM adds flexible drawers that can grow. Mount points are labels on the drawer fronts telling you what is inside. RAID is keeping duplicate copies in multiple cabinets.' },
    'linux-kernel': { title: 'Kernel as the OS Brain', description: 'The kernel is the central nervous system. System calls are nerve signals from body (userspace) to brain. Interrupts are reflexes - hardware taps. Scheduler decides which thought gets CPU time. Memory manager allocates brain space. Modules are loadable skills you can learn without rebooting the brain.' },
    'linux-memory': { title: 'Memory as a Library with a Cache', description: 'RAM is the reading room - fast but limited. Swap is the basement archive - slow but vast. Page cache keeps recently read books on the desk. OOM killer is the librarian who ejects readers when the room is full. Huge pages are oversized reference books that stay open on the desk.' },
    'linux-io': { title: 'I/O as a Bucket Brigade', description: 'Applications pass buckets (buffers) to the kernel. The kernel passes them to the device driver. The driver hands them to hardware. DMA lets hardware fill buckets directly without CPU. Async I/O (io_uring) is a conveyor belt - submit many buckets, collect them later.' },
    'linux-perf': { title: 'Performance as a Detective Story', description: 'perf is the magnifying glass. Flame graphs are the crime scene map - wide towers are suspects. USE method (Utilization, Saturation, Errors) is the investigation checklist. The culprit is usually not the CPU - it is waiting (I/O, locks, cache misses).' },
    'linux-bpf': { title: 'eBPF as X-Ray Vision', description: 'eBPF lets you safely run custom programs inside the kernel - like inserting a microscope into a living cell. No kernel modules, no crashes. You attach probes to kernel functions (kprobes), tracepoints, or USDT. The verifier ensures your program cannot crash the kernel.' },
    'linux-monitoring': { title: 'Monitoring as Vital Signs', description: 'Metrics are heart rate and blood pressure. Logs are the patient history. Traces are the journey of a request through the body. Alerts are the alarm when vitals go critical. The goal is not to collect data - it is to know when to intervene.' },
    'linux-gpu-computing': { title: 'GPU as a Massive Assembly Line', description: 'CPU is a few master craftsmen (serial). GPU is thousands of apprentices (parallel). Each apprentice does the same simple task on different data. CUDA/OpenCL are the work instructions. Memory transfer (CPU<->GPU) is the loading dock - the bottleneck.' },
    'linux-build-toolchain': { title: 'Build Toolchain as a Factory', description: 'Compiler (gcc/clang) translates source to machine code. Linker connects object files into an executable. Make/CMake/Ninja are the production schedules. pkg-config finds dependency parts. ccache is the parts cache - reuse what you already built.' },
    'linux-cgroups': { title: 'Cgroups as Resource Quotas', description: 'Cgroups are budgets. cpu.max = "you get this much CPU time." memory.max = "you cannot exceed this RAM." pids.max = "you can only hire this many workers." Containers are processes with budgets enforced by the kernel.' },
    'linux-docker': { title: 'Docker as a Shipping Container', description: 'The image is a sealed container - same contents everywhere. Layers are stacked pallets - reuse common bases. The Dockerfile is the packing list. The daemon is the port authority. Namespaces isolate "this container sees only its own cargo." ' },
    'linux-kubernetes': { title: 'Kubernetes as a Port Authority', description: 'Pods are containers sharing a dock. Services are stable addresses for shifting pods. Deployments manage rolling updates. The scheduler assigns pods to nodes (ships). Controllers (replicasets) maintain desired state. etcd is the manifest - the source of truth.' },
    'linux-troubleshooting': { title: 'Troubleshooting as Differential Diagnosis', description: 'Symptoms (high CPU, latency) are not the disease. Check vitals first (top, vmstat, iostat). Narrow scope: is it the app, the kernel, the network, the disk? Use the scientific method: hypothesize, test, eliminate. The runbook is your medical textbook.' },
    'linux-system-rescue': { title: 'System Rescue as Emergency Surgery', description: 'Boot from live media (the ambulance). Mount the root filesystem (access the patient). chroot into it (operate in context). Fix fstab, reinstall grub, reset passwords, recover from backup. The goal: stabilize and discharge.' },
    'linux-security': { title: 'Security as Layers of Defense', description: 'Perimeter (firewall) is the castle wall. SELinux/AppArmor are guards inside each room. Seccomp filters which syscalls a process can make. Updates patch holes in the wall. Least privilege means every servant has only the keys they need. Auditd logs who opened which door.' },
    'linux-faang-scale': { title: 'Scale as a Phase Change', description: 'What works at 10 servers fails at 10,000. Cattle vs pets. Automation replaces manual work. Observability replaces logs. Stateless services enable horizontal scaling. Consensus (Raft) replaces single leaders. The architecture must evolve with each order of magnitude.' },
    'linux-interview-qs': { title: 'Interviews as Technical Conversations', description: 'The interviewer is not testing memorization - they are evaluating how you think. "I don\'t know, but here is how I would find out" beats a wrong guess. Structure your answer: clarify, design, trade-offs, risks, monitoring. The best candidates teach the interviewer something.' }
  };
  
  return analogies[data.id] || { 
    title: data.title + ' as a Real-World System', 
    description: 'Think of ' + data.title.toLowerCase() + ' like a well-organized system you interact with daily - it has components, rules, and flows that map directly to the concepts you will learn.' 
  };
}

function generateCommonMistakes(data) {
  const mistakes = [];
  
  if (data.sections) {
    for (const sec of data.sections) {
      if (sec.codeBlock && sec.codeBlock.includes('rm -rf')) {
        mistakes.push({ mistake: 'Running destructive commands without verification', solution: 'Always use `rm -i` or `ls` first to confirm what will be deleted' });
      }
      if (sec.codeBlock && sec.codeBlock.includes('chmod 777')) {
        mistakes.push({ mistake: 'Using chmod 777 to fix permission issues', solution: 'Use `chmod 750` or ACLs for specific users; find the minimal required permissions' });
      }
      if (sec.codeBlock && sec.codeBlock.includes('kill -9')) {
        mistakes.push({ mistake: 'Using kill -9 as first resort', solution: 'Send SIGTERM first (kill PID); wait for graceful shutdown; only use SIGKILL if process ignores SIGTERM' });
      }
    }
  }
  
  const commonMistakes = [
    { mistake: 'Ignoring log rotation until disk fills up', solution: 'Configure logrotate before deploying; monitor /var/log usage' },
    { mistake: 'Disabling SELinux/AppArmor instead of fixing policies', solution: 'Use `audit2allow` to generate policies from denials; keep MAC enabled' },
    { mistake: 'Running containers as root', solution: 'Add `USER nonroot` in Dockerfile; use `--user` flag at runtime' },
    { mistake: 'Not setting resource limits on containers', solution: 'Always set `--cpus` and `--memory`; configure cgroup limits in Kubernetes' },
    { mistake: 'Checking /proc/meminfo inside containers for memory', solution: 'Use cgroup v2 files: /sys/fs/cgroup/memory.current, memory.events' }
  ];
  
  for (const m of commonMistakes) {
    if (mistakes.length < 5) mistakes.push(m);
  }
  
  return mistakes.slice(0, 5);
}

function generatePracticeLabs(data) {
  const labs = [];
  
  if (data.sections) {
    for (const sec of data.sections) {
      if (sec.codeBlock && sec.codeBlock.trim().length > 20) {
        const lines = sec.codeBlock.trim().split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));
        if (lines.length > 0) {
          labs.push({
            title: 'Explore: ' + sec.title,
            task: 'Run the following commands and observe the output:\n' + lines.slice(0, 5).join('\n'),
            expectedOutput: 'Command output showing system information',
            hint: 'Try variations of the flags to see different output formats'
          });
        }
      }
    }
  }
  
  if (labs.length === 0) {
    labs.push({
      title: 'Hands-on: ' + data.title,
      task: 'Explore the concepts from this chapter on a Linux system. Try the commands mentioned in the chapter.',
      expectedOutput: 'Successful command execution with expected output',
      hint: 'Use a VM, container, or cloud instance for safe experimentation'
    });
  }
  
  return labs.slice(0, 3);
}

function generateQuickReference(data) {
  let content = '';
  const commands = new Map();
  
  if (data.sections) {
    for (const sec of data.sections) {
      if (sec.codeBlock) {
        const lines = sec.codeBlock.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#') && trimmed.length < 80) {
            const cmd = trimmed.split(' ')[0];
            if (cmd && cmd.length > 1 && /^[a-z][a-z0-9_-]*$/.test(cmd)) {
              if (!commands.has(cmd)) {
                commands.set(cmd, trimmed);
              }
            }
          }
        }
      }
    }
  }
  
  if (commands.size > 0) {
    content = '| Command | Purpose |\n|---------|---------|\n';
    let count = 0;
    for (const [cmd, desc] of commands) {
      if (count >= 10) break;
      content += '| `' + cmd + '` | ' + desc.replace(/^\S+\s+/, '') + ' |\n';
      count++;
    }
  } else {
    content = '| Command | Purpose |\n|---------|---------|\n| (see chapter) | (see chapter) |';
  }
  
  return { title: 'Quick Reference', content };
}

function generateTroubleshooting(data) {
  const troubleshooting = [
    { symptom: 'Command not found', cause: 'Package not installed or not in PATH', solution: 'Install package with package manager; check $PATH' },
    { symptom: 'Permission denied', cause: 'Insufficient file permissions or wrong user', solution: 'Check permissions with ls -l; use sudo or fix ownership' },
    { symptom: 'Connection refused', cause: 'Service not listening on that port', solution: 'Check with ss -tlnp; verify service is running' },
    { symptom: 'Disk full / No space left', cause: 'Filesystem at 100% capacity', solution: 'Run df -h and du -sh /*; clean logs, rotate, or expand disk' },
    { symptom: 'High load average', cause: 'CPU saturation or I/O wait', solution: 'Use top/htop, iostat, vmstat to identify bottleneck' }
  ];
  
  return troubleshooting.slice(0, 4);
}

function generateQuiz(data) {
  const questions = [];
  
  if (data.sections) {
    for (const sec of data.sections) {
      if (sec.title && questions.length < 5) {
        const title = sec.title.toLowerCase();
        if (title.includes('interview') || title.includes('reference')) continue;
        
        questions.push({
          question: 'What is the primary purpose of ' + sec.title.toLowerCase() + '?',
          options: [
            sec.description?.replace(/<[^>]*>/g, '').slice(0, 100) || 'Manages system resources',
            'Handles network configuration',
            'Controls user authentication',
            'Manages disk partitions'
          ],
          answer: sec.description?.replace(/<[^>]*>/g, '').slice(0, 100) || 'Manages system resources',
          explanation: 'This is covered in the "' + sec.title + '" section of this chapter.'
        });
      }
    }
  }
  
  while (questions.length < 5) {
    const fallbacks = [
      { question: 'What does the ' + data.title + ' chapter primarily cover?', answer: data.description?.replace(/<[^>]*>/g, '').slice(0, 120) || 'Core Linux concepts', explanation: 'Review the chapter introduction.' },
      { question: 'Which command would you use to inspect ' + data.title.toLowerCase() + '?', answer: 'See the Quick Reference section', explanation: 'Commands are listed in the Quick Reference.' },
      { question: 'What is a common mistake when working with ' + data.title.toLowerCase() + '?', answer: 'See Common Mistakes section', explanation: 'Common mistakes are documented in this chapter.' },
      { question: 'Where are configuration files for ' + data.title.toLowerCase() + ' typically stored?', answer: 'Usually in /etc', explanation: 'System configuration lives in /etc.' },
      { question: 'How do you verify ' + data.title.toLowerCase() + ' is working correctly?', answer: 'Check status and logs', explanation: 'Use systemctl status and journalctl for services.' }
    ];
    
    const fb = fallbacks[questions.length % fallbacks.length];
    questions.push({
      question: fb.question,
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      answer: fb.answer,
      explanation: fb.explanation
    });
  }
  
  return questions.slice(0, 5);
}

function generateInterviewTips(data) {
  const tips = [];
  
  if (data.details) {
    const details = data.details.replace(/<[^>]*>/g, ' ');
    const faangMatches = details.match(/FAANG[^.\n]*/gi);
    if (faangMatches) {
      for (const match of faangMatches.slice(0, 2)) {
        tips.push(match.trim());
      }
    }
  }
  
  if (tips.length === 0) {
    tips.push('Be ready to explain how ' + data.title.toLowerCase() + ' works in a production environment at scale.');
    tips.push('Know the key commands and configuration files for ' + data.title.toLowerCase() + '.');
    tips.push('Understand common failure modes and how to debug them.');
  }
  
  return tips.slice(0, 3);
}

function generateProductionTips(data) {
  const tips = [];
  
  if (data.details) {
    const details = data.details.replace(/<[^>]*>/g, ' ');
    const prodMatches = details.match(/Production[^.\n]*/gi);
    if (prodMatches) {
      for (const match of prodMatches.slice(0, 2)) {
        tips.push(match.trim());
      }
    }
  }
  
  if (tips.length === 0) {
    tips.push('Monitor key metrics continuously; alert on anomalies before users notice.');
    tips.push('Automate routine tasks; manual processes do not scale.');
    tips.push('Document runbooks for common incidents; practice them regularly.');
  }
  
  return tips.slice(0, 3);
}

function generateBestPractices(data) {
  const practices = [];
  
  if (data.sections) {
    for (const sec of data.sections) {
      if (sec.codeBlock && sec.codeBlock.includes('best practice')) {
        practices.push(sec.title);
      }
    }
  }
  
  if (practices.length === 0) {
    practices.push('Use version control for all configuration (/etc, scripts, Dockerfiles)');
    practices.push('Implement infrastructure as code; avoid manual server changes');
    practices.push('Test changes in staging before production; have rollback plans');
  }
  
  return practices.slice(0, 3);
}

function generateEnterprisePerspective(data) {
  if (data.details) {
    const details = data.details.replace(/<[^>]*>/g, ' ');
    const entMatches = details.match(/Enterprise[^.\n]*/gi);
    if (entMatches) {
      return entMatches[0].trim();
    }
  }
  
  return 'In enterprise environments, ' + data.title.toLowerCase() + ' is managed through automation (Ansible, Terraform), monitored centrally (Prometheus, Datadog), and governed by compliance policies (CIS benchmarks, SOC2). Changes go through change advisory boards with rollback procedures documented.';
}

function getVisualHint(data) {
  const hints = {
    'linux-history': 'timeline',
    'linux-filesystem': 'filesystem_tree',
    'linux-permissions': 'permission_matrix',
    'linux-cli-basics': 'command_pipeline',
    'linux-shell-basics': 'script_flowchart',
    'linux-text-processing': 'text_pipeline',
    'linux-git': 'git_branching',
    'linux-processes': 'process_tree',
    'linux-package-mgmt': 'dependency_graph',
    'linux-systemd': 'systemd_dependencies',
    'linux-users': 'user_group_hierarchy',
    'linux-ssh': 'ssh_tunnel',
    'linux-networking': 'network_packet_flow',
    'linux-storage': 'storage_layers',
    'linux-kernel': 'kernel_architecture',
    'linux-memory': 'memory_hierarchy',
    'linux-io': 'io_stack',
    'linux-perf': 'flame_graph',
    'linux-bpf': 'bpf_attachment_points',
    'linux-monitoring': 'monitoring_stack',
    'linux-gpu-computing': 'gpu_pipeline',
    'linux-build-toolchain': 'build_pipeline',
    'linux-cgroups': 'cgroup_hierarchy',
    'linux-docker': 'container_layers',
    'linux-kubernetes': 'k8s_architecture',
    'linux-troubleshooting': 'debugging_flowchart',
    'linux-system-rescue': 'rescue_procedure',
    'linux-security': 'security_layers',
    'linux-faang-scale': 'scale_architecture',
    'linux-interview-qs': 'interview_rubric'
  };
  
  return hints[data.id] || 'concept_diagram';
}

function migrateFile(filePath, allIds) {
  const content = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content);
  
  const readingTime = calculateReadingTime(data);
  const difficulty = inferDifficulty(data);
  const prerequisites = inferPrerequisites(data, allIds);
  const learningObjectives = generateLearningObjectives(data);
  const analogy = generateAnalogy(data);
  const commonMistakes = generateCommonMistakes(data);
  const practiceLabs = generatePracticeLabs(data);
  const quickReference = generateQuickReference(data);
  const troubleshooting = generateTroubleshooting(data);
  const quiz = generateQuiz(data);
  const interviewTips = generateInterviewTips(data);
  const productionTips = generateProductionTips(data);
  const bestPractices = generateBestPractices(data);
  const enterprisePerspective = generateEnterprisePerspective(data);
  const visualHint = getVisualHint(data);
  
  // Replace FAANG-heavy tags
  const normalizedTags = (data.tags || []).map(tag => {
    if (tag.toLowerCase() === 'faang') return 'faang-insight';
    if (tag.toLowerCase() === 'staff+') return 'staff-plus';
    return tag;
  });
  
  // Build new data object with all LCM fields
  const newData = {
    schemaVersion: "2.0",
    contentVersion: "1.0",
    lastReviewed: "2026-07-08",
    reviewStatus: "migrated",
    
    // Existing fields
    id: data.id,
    title: data.title,
    category: data.category,
    subcategory: data.subcategory,
    language: data.language,
    description: data.description,
    sections: data.sections,
    timeline: data.timeline,
    comparisonTable: data.comparisonTable,
    diffTable: data.diffTable,
    tags: normalizedTags,
    
    // NEW LCM fields
    difficulty,
    readingTime,
    practiceTime: Math.max(10, Math.round(readingTime * 0.75)),
    prerequisites,
    learningObjectives,
    analogy,
    commonMistakes,
    practiceLabs,
    quickReference,
    troubleshooting,
    quiz,
    interviewTips,
    productionTips,
    bestPractices,
    enterprisePerspective,
    visualHint
  };
  
  writeFileSync(filePath, JSON.stringify(newData, null, 2) + '\n');
  
  return {
    id: data.id,
    difficulty,
    readingTime,
    prerequisites: prerequisites.length,
    objectives: learningObjectives.length,
    labs: practiceLabs.length,
    quiz: quiz.length
  };
}

function main() {
  console.log('Starting schema migration to v2.0 (Learning Content Model)...\n');
  
  const allFiles = [];
  for (const phase of PHASES) {
    const phaseDir = join(CONTENT_DIR, phase);
    const files = walkDir(phaseDir);
    allFiles.push(...files);
  }
  
  const allIds = allFiles.map(f => {
    const data = JSON.parse(readFileSync(f, 'utf-8'));
    return data.id;
  });
  
  console.log('Found ' + allFiles.length + ' content files\n');
  
  const results = [];
  for (const file of allFiles) {
    try {
      const result = migrateFile(file, allIds);
      results.push(result);
      console.log('OK ' + result.id + ': ' + result.difficulty + ', ' + result.readingTime + 'min, ' + result.objectives + ' objectives, ' + result.labs + ' labs, ' + result.quiz + ' quiz');
    } catch (e) {
      console.error('FAIL ' + file + ': ' + e.message);
    }
  }
  
  console.log('\nMigration complete!');
  console.log('Total: ' + results.length + ' files migrated');
  
  // Summary stats
  const diffCounts = { beginner: 0, intermediate: 0, advanced: 0 };
  for (const r of results) diffCounts[r.difficulty]++;
  console.log('Difficulty: ' + diffCounts.beginner + ' beginner, ' + diffCounts.intermediate + ' intermediate, ' + diffCounts.advanced + ' advanced');
}

main();