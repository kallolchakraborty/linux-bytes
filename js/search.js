// Fuzzy Search & Modal Controller for Quick Reference Docs
const searchIndex = [
  // Languages
  { title: "JavaScript Array Methods", category: "Languages", url: "docs.html#js-arrays", tags: ["javascript", "js", "map", "filter", "reduce", "arrays"] },
  { title: "Go Interfaces & Structs", category: "Languages", url: "docs.html#go-interfaces", tags: ["go", "golang", "struct", "interface", "oop"] },
  { title: "Python Context Managers", category: "Languages", url: "docs.html#python-context", tags: ["python", "with", "context", "files", "resource"] },

  // System Internals
  { title: "How Python's GIL Works", category: "System Internals", url: "docs.html#gil", tags: ["python", "gil", "thread", "concurrency", "multiprocessing", "lock"] },
  { title: "How a Compiler Works", category: "System Internals", url: "docs.html#compiler", tags: ["compiler", "compile", "pipeline", "ast", "lexer", "parser"] },
  { title: "How an Interpreter Works", category: "System Internals", url: "docs.html#interpreter", tags: ["interpreter", "interpret", "runtime", "execution", "repl"] },

  // Developer Tools
  { title: "Common Git Commands", category: "Developer Tools", url: "docs.html#git-commands", tags: ["git", "commit", "push", "pull", "merge", "rebase"] },
];

window.addEventListener('DOMContentLoaded', () => {
  const searchModal = document.getElementById('search-modal');
  const searchInput = document.getElementById('modal-search-input');
  const searchResults = document.getElementById('modal-search-results');
  const openSearchBtns = document.querySelectorAll('.open-search-btn');
  const closeSearchBtn = document.getElementById('close-search-btn');

  function openModal() {
    searchModal?.classList.remove('hidden');
    searchModal?.classList.add('flex');
    searchInput?.focus();
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    searchModal?.classList.remove('flex');
    searchModal?.classList.add('hidden');
    document.body.style.overflow = '';
    if (searchInput) searchInput.value = '';
    if (searchResults) searchResults.innerHTML = '';
  }

  // Bind trigger buttons
  openSearchBtns.forEach(btn => {
    btn.addEventListener('click', openModal);
  });

  closeSearchBtn?.addEventListener('click', closeModal);

  // Close on outside click
  searchModal?.addEventListener('click', (e) => {
    if (e.target === searchModal) {
      closeModal();
    }
  });

  // Close modal when a search result is clicked
  searchResults?.addEventListener('click', (e) => {
    if (e.target.closest('a')) {
      closeModal();
    }
  });

  // Global keybinds
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (searchModal?.classList.contains('hidden')) {
        openModal();
      } else {
        closeModal();
      }
    }
    if (e.key === 'Escape') {
      closeModal();
    }
  });

  // Live filtering
  searchInput?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
      searchResults.innerHTML = '';
      return;
    }

    const filtered = searchIndex.filter(item => {
      return item.title.toLowerCase().includes(query) ||
             item.category.toLowerCase().includes(query) ||
             item.tags.some(tag => tag.includes(query));
    });

    renderResults(filtered);
  });

  function renderResults(items) {
    if (!searchResults) return;

    if (items.length === 0) {
      searchResults.innerHTML = `
        <div class="p-8 text-center text-slate-500 dark:text-slate-400 font-mono text-sm">
          No matches found. Try searching for "git", "python", or "go".
        </div>
      `;
      return;
    }

    searchResults.innerHTML = items.map(item => `
      <a href="${item.url}" class="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-brand-50 dark:hover:bg-brand-500/10 border border-slate-100 dark:border-slate-800 hover:border-brand-100 dark:hover:border-brand-500/30 rounded-lg transition-all group">
        <div class="flex flex-col gap-1">
          <span class="text-xs font-bold text-brand-500 uppercase tracking-wider">${item.category}</span>
          <span class="font-bold text-slate-800 dark:text-slate-200 group-hover:text-brand-500 transition-colors">${item.title}</span>
        </div>
        <span class="material-symbols-outlined text-slate-400 group-hover:text-brand-500 transition-transform group-hover:translate-x-1">arrow_forward</span>
      </a>
    `).join('');
  }
});
