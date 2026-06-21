// Dynamic Content Loader for Quick Bytes Documentation Portal
const routeMap = {
  '#py-basics-datatypes': 'content/python/basics/datatypes.json',
  '#py-basics-loops': 'content/python/basics/loops.json',
  '#py-basics-io': 'content/python/basics/io.json',
  '#py-basics-ds': 'content/python/basics/ds-builtins.json',
  '#py-ds-builtins': 'content/python/basics/ds-builtins.json',
  '#py-ds-linkedlist': 'content/python/basics/ds-linkedlist.json',
  '#py-ds-stackqueue': 'content/python/basics/ds-stackqueue.json',
  '#py-ds-heap': 'content/python/basics/ds-heap.json',
  '#py-ds-tree': 'content/python/basics/ds-tree.json',
  '#py-ds-graph': 'content/python/basics/ds-graph.json',
  '#py-basics-files': 'content/python/basics/files.json',
  '#py-basics-api': 'content/python/basics/api.json',
  '#py-basics-concurrency': 'content/python/basics/concurrency.json',
  '#python-history': 'content/python/python-history.json'
};

let scrollSpyCleanup = null;
let isInitialLoad = true;

async function loadContent(hash) {
  if (scrollSpyCleanup) {
    scrollSpyCleanup();
    scrollSpyCleanup = null;
  }
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

  if (hash === '#readme') {
    try {
      const res = await fetch('README.md?t=' + Date.now());
      const md = await res.text();
      const left = document.getElementById('left-sidebar');
      const outline = document.getElementById('docs-right-outline');
      if (left) left.style.display = 'none';
      if (outline) outline.parentElement.style.display = 'none';
      document.querySelector('main').classList.remove('max-w-3xl');
      document.querySelector('main').classList.add('max-w-4xl');
      contentArea.innerHTML = '<div class="readme-content">' + marked.parse(md) + '</div>';
    } catch (e) {
      contentArea.innerHTML = '<p class="text-red-500">Failed to load README.md</p>';
    }
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active-doc-link'));
    if (document.getElementById('docs-right-outline')) document.getElementById('docs-right-outline').innerHTML = '';
    return;
  }

  try {
    const response = await fetch(path + '?t=' + new Date().getTime());
    if (!response.ok) throw new Error('Failed to fetch content');
    const data = await response.json();

    // Render content dynamically
    const langClass = data.language ? 'language-' + data.language : 'text-slate-800 dark:text-slate-200';
    let embedCode = '';
    if (data.id === 'compiler' || data.id === 'interpreter' || data.id === 'gil' || data.id === 'concurrency') {
      const pageTitles = { compiler: 'How a Compiler Works', interpreter: 'How an Interpreter Works', gil: "How Python's GIL Works", concurrency: 'Python Concurrency Visualizer' };
      embedCode = `
        <div class="w-full aspect-auto h-[530px] md:aspect-[16/12] md:h-auto border border-blue-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-lg bg-white dark:bg-[#0F1115]">
          <iframe src="${data.id}.html?t=${new Date().getTime()}" class="w-full h-full border-none" allowfullscreen aria-label="${pageTitles[data.id] || 'Interactive visualization'}"></iframe>
        </div>
      `;
      if (data.sections) {
        embedCode += `<div class="flex flex-col gap-8 mt-8">` + data.sections.map((section, idx) => {
          const sectionId = `section-${data.id}-${idx}`;
          return `
            <div id="${sectionId}" class="scroll-mt-24 flex flex-col gap-3">
              <h3 class="text-xl font-semibold text-slate-900 dark:text-white">${section.title}</h3>
              ${section.description ? `<div class="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">${section.description}</div>` : ''}
              <div class="border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-5 text-sm leading-relaxed overflow-x-auto relative group">
                <button onclick="copyCode(this)" class="absolute right-3 top-3 opacity-0 group-hover:opacity-100 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 rounded-lg text-xs font-sans text-slate-500 transition-all flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-sm">content_copy</span> Copy
                </button>
                <pre><code class="${langClass}">${escapeHtml(section.codeBlock)}</code></pre>
              </div>
            </div>
          `;
        }).join('\n') + `</div>`;
      } else if (data.codeBlock) {
        embedCode += `
          <div class="mt-6 text-xs font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Sample Code / Syntax</div>
          <div id="section-syntax" class="scroll-mt-24 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-5 text-sm leading-relaxed overflow-x-auto relative group">
            <button onclick="copyCode(this)" class="absolute right-3 top-3 opacity-0 group-hover:opacity-100 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 rounded-lg text-xs font-sans text-slate-500 transition-all flex items-center gap-1.5">
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
            ${section.description ? `<div class="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">${section.description}</div>` : ''}
            <div class="border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-5 text-sm leading-relaxed overflow-x-auto relative group">
              <button onclick="copyCode(this)" class="absolute right-3 top-3 opacity-0 group-hover:opacity-100 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 rounded-lg text-xs font-sans text-slate-500 transition-all flex items-center gap-1.5">
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
        const delay = ti * 80;
        items += `
          <div class="timeline-entry" style="animation-delay: ${delay}ms">
            <div class="timeline-dot">
              <span class="timeline-dot-year">${t.year}</span>
              <span class="timeline-dot-ring"></span>
            </div>
            <div class="timeline-body">
              <div class="flex items-center gap-2 mb-1">
                <h4 class="timeline-title">${t.title || ''}</h4>
                <span class="timeline-tag">${t.tag || 'Release'}</span>
              </div>
              <p class="timeline-event">${t.event}</p>
            </div>
          </div>
        `;
      }
      embedCode = `
        <div id="section-syntax" class="scroll-mt-24 mt-4">
          <div class="timeline-track">${items}</div>
        </div>
      `;
      if (data.codeBlock) {
        embedCode += '<div class="mt-6 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 text-sm leading-relaxed overflow-x-auto relative group">' +
          '<pre><code class="' + langClass + '">' + escapeHtml(data.codeBlock) + '</code></pre></div>';
      }
    } else {
      embedCode = `
        <div id="section-syntax" class="scroll-mt-24 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-5 text-sm leading-relaxed overflow-x-auto relative group">
          <button onclick="copyCode(this)" class="absolute right-3 top-3 opacity-0 group-hover:opacity-100 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 rounded-lg text-xs font-sans text-slate-500 transition-all flex items-center gap-1.5">
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
              <table class="w-full text-xs text-left border-collapse table-fixed">
                <thead class="bg-slate-50 dark:bg-slate-900/60 font-bold font-mono border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th class="p-3 text-slate-700 dark:text-slate-200 w-[20%] align-top">Dimension</th>
                    <th class="p-3 text-slate-700 dark:text-slate-200 w-[40%] align-top">Concurrency</th>
                    <th class="p-3 text-slate-700 dark:text-slate-200 w-[40%] align-top">Multithreading</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60">
                  ${data.diffTable.map(row => `
                    <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                      <td class="p-3 font-mono font-semibold text-orange-600 align-top">${row.dimension}</td>
                      <td class="p-3 text-slate-600 dark:text-slate-300 text-xs align-top leading-relaxed">${row.concurrency}</td>
                      <td class="p-3 text-slate-600 dark:text-slate-300 text-xs align-top leading-relaxed">${row.multithreading}</td>
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
    isInitialLoad = false;

    // Populate right outline dynamically
    const outlineArea = document.getElementById('docs-right-outline');
    if (outlineArea) {
      if (data.sections) {
        let outlineHtml = data.sections.map((section, idx) => {
          const sectionId = `section-${data.id}-${idx}`;
          return `<a href="#${sectionId}" class="outline-link">${section.title}</a>`;
        }).join('\n');
        if (data.comparisonTable) {
          outlineHtml += `\n<a href="#section-comparison" class="outline-link">Comparison Matrix</a>`;
        }
        if (data.diffTable) {
          outlineHtml += `\n<a href="#section-differences" class="outline-link">Differences Matrix</a>`;
        }
        outlineHtml += `\n<a href="#section-dive" class="outline-link">Deep Dive</a>`;
        outlineArea.innerHTML = outlineHtml;
      } else {
        const syntaxLabel = data.id === 'python-history' ? 'Timeline' : 'Syntax Guide';
        let outlineHtml = `<a href="#section-syntax" class="outline-link">${syntaxLabel}</a>`;
        if (data.comparisonTable) {
          outlineHtml += `\n<a href="#section-comparison" class="outline-link">Comparison Matrix</a>`;
        }
        if (data.diffTable) {
          outlineHtml += `\n<a href="#section-differences" class="outline-link">Differences Matrix</a>`;
        }
        outlineHtml += `\n<a href="#section-dive" class="outline-link">Deep Dive</a>`;
        outlineArea.innerHTML = outlineHtml;
      }
      setupOutlineSmoothScroll();
      scrollSpyCleanup = setupOutlineScrollSpy();
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
          link.classList.toggle('active-outline', link.getAttribute('href') === targetId);
        });
      }
    });
  });
}

function setupOutlineScrollSpy() {
  const links = document.querySelectorAll('.outline-link');
  if (links.length === 0) return null;

  const sections = Array.from(links).map(link => {
    return document.querySelector(link.getAttribute('href'));
  }).filter(Boolean);

  if (sections.length === 0) return null;

  function updateActiveLink() {
    const scrollPosition = window.scrollY + 120; // Offset for top header and layout spacing
    
    // Fallback: bottom of page
    if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 50) {
      links.forEach((link, idx) => link.classList.toggle('active-outline', idx === links.length - 1));
      return;
    }

    let activeSection = null;
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      if (section.offsetTop <= scrollPosition) {
        activeSection = section;
      } else {
        break;
      }
    }

    if (!activeSection && sections.length > 0) {
      activeSection = sections[0];
    }

    if (activeSection) {
      const activeId = activeSection.getAttribute('id');
      links.forEach(link => link.classList.toggle('active-outline', link.getAttribute('href') === `#${activeId}`));
    }
  }

  let tick = false;
  const onScroll = () => {
    if (!tick) {
      requestAnimationFrame(() => {
        updateActiveLink();
        tick = false;
      });
      tick = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  updateActiveLink();

  return () => {
    window.removeEventListener('scroll', onScroll);
  };
}

// ponytail: removed sidebar toggle — only one group, no collapsible needed

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showToast(message) {
  const existingToast = document.getElementById('clipboard-toast');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.id = 'clipboard-toast';
  toast.className = 'fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900/90 dark:bg-slate-800/90 backdrop-blur-md text-white border border-slate-700/50 px-4 py-2.5 rounded-xl shadow-xl text-sm font-sans font-medium transition-all duration-300 transform translate-y-10 opacity-0';
  toast.innerHTML = `
    <span class="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
    <span>${message}</span>
  `;

  document.body.appendChild(toast);

  requestAnimationFrame(function() {
    toast.classList.remove('translate-y-10', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
  });

  setTimeout(function() {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-10', 'opacity-0');
    setTimeout(function() {
      toast.remove();
    }, 300);
  }, 2200);
}

function copyCode(btn) {
  const codeEl = btn.parentElement.querySelector('code');
  if (!codeEl) return;
  navigator.clipboard.writeText(codeEl.textContent).then(function() {
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<span class="material-symbols-outlined text-sm text-emerald-500">check</span> Copied!';
    btn.disabled = true;
    showToast('Code copied to clipboard!');
    setTimeout(function() {
      btn.innerHTML = originalHTML;
      btn.disabled = false;
    }, 2000);
  }).catch(function(err) {
    console.error('Failed to copy: ', err);
  });
}
window.copyCode = copyCode;

window.addEventListener('DOMContentLoaded', () => {
  const initialHash = window.location.hash || '#python-history';
  loadContent(initialHash);
});

window.addEventListener('hashchange', () => {
  loadContent(window.location.hash);
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
