// Dynamic Content Loader for Quick Bytes Documentation Portal
const routeMap = {
  '#py-basics-datatypes': 'content/python/basics/datatypes.json',
  '#py-basics-loops': 'content/python/basics/loops.json',
  '#py-basics-io': 'content/python/basics/io.json',
  '#py-basics-ds': 'content/python/basics/ds.json',
  '#py-basics-files': 'content/python/basics/files.json',
  '#py-basics-api': 'content/python/basics/api.json',
  '#py-basics-concurrency': 'content/python/basics/concurrency.json',
  '#python-history': 'content/python/python-history.json',
  '#gil': 'content/python/gil.json',
  '#compiler': 'content/programming/compiler.json',
  '#interpreter': 'content/programming/interpreter.json'
};

async function loadContent(hash) {
  const path = routeMap[hash] || routeMap['#python-history'];
  const contentArea = document.getElementById('docs-dynamic-content');
  if (!contentArea) return;

  // Show loading state
  contentArea.innerHTML = `
    <div class="animate-pulse space-y-6">
      <div class="h-8 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
      <div class="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
      <div class="h-40 bg-slate-200 dark:bg-slate-800 rounded"></div>
      <div class="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6"></div>
    </div>
  `;

  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error('Failed to fetch content');
    const data = await response.json();

    // Render content dynamically
    const langClass = data.language ? 'language-' + data.language : 'text-slate-800 dark:text-slate-200';
    let embedCode = '';
    if (data.id === 'compiler' || data.id === 'interpreter' || data.id === 'gil' || data.id === 'concurrency') {
      const pageTitles = { compiler: 'How a Compiler Works', interpreter: 'How an Interpreter Works', gil: "How Python's GIL Works", concurrency: 'Python Concurrency Visualizer' };
      embedCode = `
        <div class="w-full aspect-auto h-[530px] md:aspect-[16/12] md:h-auto border border-blue-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-lg bg-white dark:bg-[#0F1115]">
          <iframe src="${data.id}.html" class="w-full h-full border-none" allowfullscreen aria-label="${pageTitles[data.id] || 'Interactive visualization'}"></iframe>
        </div>
      `;
      if (data.codeBlock) {
        embedCode += `
          <div class="mt-6 text-xs font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Sample Code / Syntax</div>
          <div id="section-syntax" class="scroll-mt-24 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-5 text-sm leading-relaxed overflow-x-auto relative group">
            <button onclick="navigator.clipboard.writeText(this.parentElement.querySelector('code').textContent)" class="absolute right-3 top-3 opacity-0 group-hover:opacity-100 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 rounded-lg text-xs font-sans text-slate-500 transition-all flex items-center gap-1.5">
              <span class="material-symbols-outlined text-sm">content_copy</span> Copy
            </button>
            <pre><code class="${langClass}">${escapeHtml(data.codeBlock)}</code></pre>
          </div>
        `;
      }
    } else if (data.sections) {
      embedCode = `<div class="flex flex-col gap-8">` + data.sections.map((section, idx) => {
        const sectionId = `section-${data.id}-${idx}`;
        return `
          <div id="${sectionId}" class="scroll-mt-24 flex flex-col gap-3">
            <h3 class="text-xl font-semibold text-slate-900 dark:text-white">${section.title}</h3>
            ${section.description ? `<p class="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">${section.description}</p>` : ''}
            <div class="border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-5 text-sm leading-relaxed overflow-x-auto relative group">
              <button onclick="navigator.clipboard.writeText(this.parentElement.querySelector('code').textContent)" class="absolute right-3 top-3 opacity-0 group-hover:opacity-100 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 rounded-lg text-xs font-sans text-slate-500 transition-all flex items-center gap-1.5">
                <span class="material-symbols-outlined text-sm">content_copy</span> Copy
              </button>
              <pre><code class="${langClass}">${escapeHtml(section.codeBlock)}</code></pre>
            </div>
          </div>
        `;
      }).join('\n') + `</div>`;
    } else if (data.timeline) {
      let items = '';
      for (let ti = 0; ti < data.timeline.length; ti++) {
        const t = data.timeline[ti];
        const cls = ti % 2 === 0 ? 'timeline-item' : 'timeline-item timeline-item-right';
        const delay = ti * 120;
        items += '<div class="' + cls + '" style="animation-delay:' + delay + 'ms">' +
          '<span class="timeline-year">' + t.year + '</span>' +
          '<span class="timeline-event">' + t.event + '</span>' +
        '</div>';
      }
      embedCode = '<div id="section-syntax" class="scroll-mt-24">' +
        '<div class="timeline-container">' + items + '</div>';
      if (data.codeBlock) {
        embedCode += '<div class="mt-4 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 text-sm leading-relaxed overflow-x-auto">' +
          '<pre><code class="' + langClass + '">' + escapeHtml(data.codeBlock) + '</code></pre></div>';
      }
      embedCode += '</div>';
    } else {
      embedCode = `
        <div id="section-syntax" class="scroll-mt-24 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-5 text-sm leading-relaxed overflow-x-auto relative group">
          <button onclick="navigator.clipboard.writeText(this.parentElement.querySelector('code').textContent)" class="absolute right-3 top-3 opacity-0 group-hover:opacity-100 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 rounded-lg text-xs font-sans text-slate-500 transition-all flex items-center gap-1.5">
            <span class="material-symbols-outlined text-sm">content_copy</span> Copy
          </button>
          <pre><code class="${langClass}">${escapeHtml(data.codeBlock)}</code></pre>
        </div>
      `;
    }

    contentArea.innerHTML = `
      <section class="flex flex-col gap-6 docs-section">
        <div class="flex flex-wrap gap-2 text-xs font-bold text-brand-500 uppercase tracking-wider">
          <span>${data.category}</span>
          <span>&bull;</span>
          <span>${data.subcategory}</span>
        </div>
        <h1 class="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">${data.title}</h1>
        <p class="text-slate-600 dark:text-slate-400 leading-relaxed text-base">${data.description}</p>
        
        ${embedCode}

        ${data.comparisonTable ? `
          <div id="section-comparison" class="scroll-mt-24">
            <h4 class="text-xs font-mono font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-3 mt-6">CPython Concurrency Comparison Matrix</h4>
            <div class="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#0E1115]">
              <table class="w-full text-xs text-left border-collapse">
                <thead class="bg-slate-50 dark:bg-slate-900/60 font-bold font-mono border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th class="p-3 text-slate-700 dark:text-slate-200">Model</th>
                    <th class="p-3 text-slate-700 dark:text-slate-200">Execution Paradigm</th>
                    <th class="p-3 text-slate-700 dark:text-slate-200">GIL Restriction</th>
                    <th class="p-3 text-slate-700 dark:text-slate-200">Memory Overhead</th>
                    <th class="p-3 text-slate-700 dark:text-slate-200">Best Suitability</th>
                  </tr>
                </thead>
                <tbody class="font-mono divide-y divide-slate-100 dark:divide-slate-800/60">
                  ${data.comparisonTable.map(row => `
                    <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                      <td class="p-3 font-semibold ${row.colorClass || 'text-slate-800 dark:text-slate-200'}">${row.model}</td>
                      <td class="p-3">${row.paradigm}</td>
                      <td class="p-3 ${row.gilColorClass || ''}">${row.gil}</td>
                      <td class="p-3">${row.memory}</td>
                      <td class="p-3">${row.suitability}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : ''}

        ${data.diffTable ? `
          <div id="section-differences" class="scroll-mt-24">
            <h4 class="text-xs font-mono font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-3 mt-6">Differences: Multithreading vs Concurrency</h4>
            <div class="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#0E1115]">
              <table class="w-full text-xs text-left border-collapse">
                <thead class="bg-slate-50 dark:bg-slate-900/60 font-bold font-mono border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th class="p-3 text-slate-700 dark:text-slate-200 w-1/4">Dimension</th>
                    <th class="p-3 text-slate-700 dark:text-slate-200 w-3/8">Concurrency</th>
                    <th class="p-3 text-slate-700 dark:text-slate-200 w-3/8">Multithreading</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60">
                  ${data.diffTable.map(row => `
                    <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                      <td class="p-3 font-mono font-semibold text-orange-600">${row.dimension}</td>
                      <td class="p-3 text-slate-600 dark:text-slate-300 text-xs">${row.concurrency}</td>
                      <td class="p-3 text-slate-600 dark:text-slate-300 text-xs">${row.multithreading}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : ''}
        
        <div id="section-dive" class="scroll-mt-24 p-5 bg-brand-50 border border-brand-100 dark:border-brand-500/20 rounded-xl text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
          <div>
            <h4 class="font-bold text-slate-900 dark:text-white mb-1">Deep Dive</h4>
            ${data.details}
          </div>
        </div>
      </section>
    `;

    // Highlight active link in left sidebar
    document.querySelectorAll('.sidebar-link').forEach(link => {
      if (link.getAttribute('href') === hash) {
        link.classList.add('active-doc-link');
      } else {
        link.classList.remove('active-doc-link');
      }
    });
    openActiveSidebarSection();

    // Populate right outline dynamically
    const outlineArea = document.getElementById('docs-right-outline');
    if (outlineArea) {
      if (data.sections) {
        let outlineHtml = data.sections.map((section, idx) => {
          const sectionId = `section-${data.id}-${idx}`;
          return `<a href="#${sectionId}" class="outline-link block text-slate-500 hover:text-brand-500 transition-colors">${section.title}</a>`;
        }).join('\n');
        if (data.comparisonTable) {
          outlineHtml += `\n<a href="#section-comparison" class="outline-link block text-slate-500 hover:text-brand-500 transition-colors">Comparison Matrix</a>`;
        }
        if (data.diffTable) {
          outlineHtml += `\n<a href="#section-differences" class="outline-link block text-slate-500 hover:text-brand-500 transition-colors">Differences Matrix</a>`;
        }
        outlineHtml += `\n<a href="#section-dive" class="outline-link block text-slate-500 hover:text-brand-500 transition-colors">Deep Dive</a>`;
        outlineArea.innerHTML = outlineHtml;
      } else {
        const syntaxLabel = data.id === 'python-history' ? 'Timeline' : 'Syntax Guide';
        let outlineHtml = `<a href="#section-syntax" class="outline-link block text-slate-500 hover:text-brand-500 transition-colors">${syntaxLabel}</a>`;
        if (data.comparisonTable) {
          outlineHtml += `\n<a href="#section-comparison" class="outline-link block text-slate-500 hover:text-brand-500 transition-colors">Comparison Matrix</a>`;
        }
        if (data.diffTable) {
          outlineHtml += `\n<a href="#section-differences" class="outline-link block text-slate-500 hover:text-brand-500 transition-colors">Differences Matrix</a>`;
        }
        outlineHtml += `\n<a href="#section-dive" class="outline-link block text-slate-500 hover:text-brand-500 transition-colors">Deep Dive</a>`;
        outlineArea.innerHTML = outlineHtml;
      }
      setupOutlineSmoothScroll();
    }

    if (typeof Prism !== 'undefined') Prism.highlightAll();

    // Trigger entrance animations
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        const section = contentArea.querySelector('section');
        if (section) section.classList.add('anim-ready');
        if (data.sections) {
          data.sections.forEach((_, idx) => {
            const sec = document.getElementById(`section-${data.id}-${idx}`);
            if (sec) sec.classList.add('anim-ready');
          });
        }
        const syntax = document.getElementById('section-syntax');
        if (syntax) syntax.classList.add('anim-ready');
        const dive = document.getElementById('section-dive');
        if (dive) {
          if (dive.getBoundingClientRect().top < window.innerHeight) {
            dive.classList.add('anim-ready');
          } else {
            const obs = new IntersectionObserver(function(entries) {
              entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                  entry.target.classList.add('anim-ready');
                  obs.unobserve(entry.target);
                }
              });
            }, { threshold: 0.15 });
            obs.observe(dive);
          }
        }
      });
    });

  } catch (error) {
    console.error("Error in loadContent:", error);
    contentArea.innerHTML = `
      <div class="p-6 border-2 border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-950/10 rounded-xl text-red-600 dark:text-red-400 text-sm">
        <h3 class="font-bold mb-1">Error Loading Document</h3>
        <p>Failed to load the requested study guide from path: ${path}. Error: ${error.message}</p>
      </div>
    `;
  }
}

function setupOutlineSmoothScroll() {
  document.querySelectorAll('.outline-link').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Highlight active right outline
        document.querySelectorAll('.outline-link').forEach(link => {
          if (link.getAttribute('href') === targetId) {
            link.classList.add('text-brand-500');
            link.classList.remove('text-slate-500');
          } else {
            link.classList.remove('text-brand-500');
            link.classList.add('text-slate-500');
          }
        });
      }
    });
  });
}

// Sidebar toggle: click handler for expand/collapse
document.addEventListener('click', function(e) {
  var toggle = e.target.closest('.sidebar-toggle');
  if (!toggle) return;

  var group = toggle.closest('.sidebar-group');
  if (!group) return;
  var collapse = group.querySelector('.sidebar-collapse');
  var chevron = group.querySelector('.sidebar-chevron');
  var expanded = toggle.getAttribute('aria-expanded') === 'true';

  // Close sibling groups
  var sibling = group.parentElement;
  if (sibling) {
    sibling.querySelectorAll('.sidebar-group .sidebar-toggle[aria-expanded="true"]').forEach(function(other) {
      if (other !== toggle) {
        other.setAttribute('aria-expanded', 'false');
        var otherCollapse = other.closest('.sidebar-group').querySelector('.sidebar-collapse');
        var otherChevron = other.closest('.sidebar-group').querySelector('.sidebar-chevron');
        if (otherCollapse) otherCollapse.style.maxHeight = '0';
        if (otherChevron) otherChevron.style.transform = 'rotate(0deg)';
      }
    });
  }

  toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  if (collapse) collapse.style.maxHeight = expanded ? '0' : collapse.scrollHeight + 'px';
  if (chevron) chevron.style.transform = expanded ? 'rotate(0deg)' : 'rotate(90deg)';
});

function openActiveSidebarSection() {
  const active = document.querySelector('.sidebar-link.active-doc-link');
  if (!active) return;
  const group = active.closest('.sidebar-group');
  if (!group) return;
  const btn = group.querySelector('.sidebar-toggle');
  const collapse = group.querySelector('.sidebar-collapse');
  const chevron = group.querySelector('.sidebar-chevron');
  if (!btn || !collapse) return;
  if (btn.getAttribute('aria-expanded') === 'true') return;
  btn.setAttribute('aria-expanded', 'true');
  collapse.style.maxHeight = collapse.scrollHeight + 'px';
  if (chevron) chevron.style.transform = 'rotate(90deg)';
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

window.addEventListener('DOMContentLoaded', () => {
  const initialHash = window.location.hash || '#python-history';
  loadContent(initialHash);
});

window.addEventListener('hashchange', () => {
  loadContent(window.location.hash);
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
