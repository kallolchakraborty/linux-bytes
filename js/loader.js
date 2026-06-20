// Dynamic Content Loader for Quick Reference Documentation Portal
const routeMap = {
  '#py-basics-datatypes': 'content/python/basics/datatypes.json',
  '#py-basics-loops': 'content/python/basics/loops.json',
  '#py-basics-io': 'content/python/basics/io.json',
  '#py-basics-ds': 'content/python/basics/ds.json',
  '#py-basics-files': 'content/python/basics/files.json',
  '#py-basics-api': 'content/python/basics/api.json',
  '#python-history': 'content/python/python-history.json',
  '#git-commands': 'content/devops/git-commands.json',
  '#gil': 'content/python/gil.json',
  '#compiler': 'content/programming/compiler.json',
  '#interpreter': 'content/programming/interpreter.json'
};

async function loadContent(hash) {
  const path = routeMap[hash] || routeMap['#git-commands'];
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
    if (data.id === 'compiler' || data.id === 'interpreter' || data.id === 'gil') {
      const pageTitles = { compiler: 'How a Compiler Works', interpreter: 'How an Interpreter Works', gil: "How Python's GIL Works" };
      embedCode = `
        <div class="w-full aspect-[16/12] border border-blue-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-lg bg-white dark:bg-[#0F1115]">
          <iframe src="${data.id}.html" class="w-full h-full border-none" allowfullscreen aria-label="${pageTitles[data.id] || 'Interactive visualization'}"></iframe>
        </div>
      `;
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
        '<div class="timeline-container">' + items + '</div>' +
        '<div class="mt-4 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 text-sm leading-relaxed overflow-x-auto">' +
        '<pre><code class="' + langClass + '">' + escapeHtml(data.codeBlock) + '</code></pre></div></div>';
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
      const syntaxLabel = data.id === 'python-history' ? 'Timeline' : 'Syntax Guide';
      outlineArea.innerHTML = `
        <a href="#section-syntax" class="outline-link block text-slate-500 hover:text-brand-500 transition-colors">${syntaxLabel}</a>
        <a href="#section-dive" class="outline-link block text-slate-500 hover:text-brand-500 transition-colors">Deep Dive</a>
      `;
      setupOutlineSmoothScroll();
    }

    if (typeof Prism !== 'undefined') Prism.highlightAll();

    // Trigger entrance animations
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        const section = contentArea.querySelector('section');
        if (section) section.classList.add('anim-ready');
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
    contentArea.innerHTML = `
      <div class="p-6 border-2 border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-950/10 rounded-xl text-red-600 dark:text-red-400 text-sm">
        <h3 class="font-bold mb-1">Error Loading Document</h3>
        <p>Failed to load the requested study guide from path: ${path}. Please check your connection or try again.</p>
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
  const initialHash = window.location.hash || '#git-commands';
  loadContent(initialHash);
});

window.addEventListener('hashchange', () => {
  loadContent(window.location.hash);
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
