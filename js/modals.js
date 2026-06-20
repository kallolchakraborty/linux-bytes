(function() {
  'use strict';

  // ---- Templates ----

  var shareHTML = [
    '<div id="share-modal" class="hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm p-4 sm:p-10 justify-center items-center" role="dialog" aria-modal="true" aria-label="Share this page">',
    '<div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden">',
    '<div class="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">',
    '<h3 class="font-bold text-slate-900 dark:text-white">Share this page</h3>',
    '<button id="close-share-btn" class="text-xs text-slate-400 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">ESC</button>',
    '</div>',
    '<div class="p-4 border-b border-slate-200 dark:border-slate-800">',
    '<div class="flex items-center gap-2">',
    '<input id="share-url-input" type="text" readonly class="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-600 dark:text-slate-400 font-mono">',
    '<button id="copy-share-btn" class="shrink-0 px-3 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-1.5">',
    '<span class="material-symbols-outlined text-sm">content_copy</span> Copy',
    '</button>',
    '</div>',
    '<p id="copy-confirm" class="hidden text-xs text-green-600 dark:text-green-400 mt-1.5">Link copied to clipboard!</p>',
    '</div>',
    '<div class="p-4">',
    '<p class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Share via</p>',
    '<div class="flex flex-wrap gap-3">',
    '<a href="#" data-href="https://twitter.com/intent/tweet?url={url}&text={title}" target="_blank" rel="noopener noreferrer" class="share-link flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-black hover:text-white dark:hover:bg-black transition-all text-slate-600 dark:text-slate-400" aria-label="Share on Twitter/X">',
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>',
    '</a>',
    '<a href="#" data-href="https://www.linkedin.com/sharing/share-offsite/?url={url}" target="_blank" rel="noopener noreferrer" class="share-link flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-[#0A66C2] hover:text-white dark:hover:bg-[#0A66C2] transition-all text-slate-600 dark:text-slate-400" aria-label="Share on LinkedIn">',
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"></path></svg>',
    '</a>',
    '<a href="#" data-href="https://wa.me/?text={title}%20{url}" target="_blank" rel="noopener noreferrer" class="share-link flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-[#25D366] hover:text-white dark:hover:bg-[#25D366] transition-all text-slate-600 dark:text-slate-400" aria-label="Share on WhatsApp">',
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"></path></svg>',
    '</a>',
    '<a href="#" data-href="mailto:?subject={title}&body={url}" target="_blank" rel="noopener noreferrer" class="share-link flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-brand-500 hover:text-white dark:hover:bg-brand-500 transition-all text-slate-600 dark:text-slate-400" aria-label="Share via Email">',
    '<span class="material-symbols-outlined text-lg">mail</span>',
    '</a>',
    '</div>',
    '</div>',
    '</div>',
    '</div>'
  ].join('\n');

  var searchHTML = [
    '<div id="search-modal" class="hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm p-4 sm:p-10 justify-center items-start" role="dialog" aria-modal="true" aria-label="Search documentation">',
    '<div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden mt-10">',
    '<div class="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/50">',
    '<span class="material-symbols-outlined text-slate-400">search</span>',
    '<input id="modal-search-input" type="text" placeholder="Type to search study materials..." aria-label="Search query" class="w-full bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white font-medium placeholder:text-slate-400">',
    '<button id="close-search-btn" class="text-xs text-slate-400 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">ESC</button>',
    '</div>',
    '<div id="modal-search-results" class="p-4 max-h-[400px] overflow-y-auto flex flex-col gap-3" role="listbox" aria-label="Search results">',
    '</div>',
    '<div class="p-3 bg-slate-50 dark:bg-slate-800/20 border-t border-slate-200 dark:border-slate-800 flex justify-between text-xs text-slate-400 font-mono">',
    '<span>↑↓ to navigate</span>',
    '<span>Enter to select</span>',
    '</div>',
    '</div>',
    '</div>'
  ].join('\n');

  // ---- Injection ----

  document.body.insertAdjacentHTML('beforeend', shareHTML);

  var hasSearch = document.querySelector('.open-search-btn') !== null;
  if (hasSearch) {
    document.body.insertAdjacentHTML('beforeend', searchHTML);
  }

  // ---- Share Modal Logic ----

  document.addEventListener('click', function(e) {
    var btn = e.target.closest('.open-share-btn');
    if (!btn) return;
    var modal = document.getElementById('share-modal');
    var input = document.getElementById('share-url-input');
    var confirm = document.getElementById('copy-confirm');
    if (!modal) return;

    var url = window.location.href;
    var title = document.title || 'Quick Bytes';

    if (input) input.value = url;
    if (confirm) confirm.classList.add('hidden');

    var encodedUrl = encodeURIComponent(url);
    var encodedTitle = encodeURIComponent(title);

    document.querySelectorAll('.share-link').forEach(function(link) {
      link.href = (link.getAttribute('data-href') || '')
        .replace('{url}', encodedUrl)
        .replace('{title}', encodedTitle);
    });

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  });

  document.addEventListener('click', function(e) {
    if (e.target.id === 'close-share-btn' || e.target.closest('#close-share-btn')) {
      var modal = document.getElementById('share-modal');
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
    }
  });

  document.addEventListener('click', function(e) {
    var modal = document.getElementById('share-modal');
    if (!modal || modal.classList.contains('hidden')) return;
    if (e.target === modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  });

  document.addEventListener('click', function(e) {
    var copyBtn = e.target.closest('#copy-share-btn');
    if (!copyBtn) return;
    var input = document.getElementById('share-url-input');
    var confirm = document.getElementById('copy-confirm');
    if (!input) return;
    input.select();
    navigator.clipboard.writeText(input.value).then(function() {
      if (confirm) {
        confirm.classList.remove('hidden');
        setTimeout(function() { confirm.classList.add('hidden'); }, 2000);
      }
    });
  });

  document.addEventListener('keydown', function(e) {
    if (e.key !== 'Escape') return;
    var modal = document.getElementById('share-modal');
    if (modal && !modal.classList.contains('hidden')) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  });

  // ---- Search Modal Logic ----

  if (!hasSearch) return;

  var searchIndex = [
    { title: "Basics: Data Types & Operations", category: "Python", url: "docs.html#py-basics-datatypes", tags: ["python", "basics", "data", "types", "int", "float", "str", "bool", "operators"] },
    { title: "Basics: Loops & Control Flow", category: "Python", url: "docs.html#py-basics-loops", tags: ["python", "basics", "loops", "for", "while", "control", "flow", "if"] },
    { title: "Basics: Input & Output", category: "Python", url: "docs.html#py-basics-io", tags: ["python", "basics", "input", "output", "print", "formatting", "fstring"] },
    { title: "Basics: Data Structures", category: "Python", url: "docs.html#py-basics-ds", tags: ["python", "basics", "list", "tuple", "set", "dict", "comprehension"] },
    { title: "Basics: File Handling", category: "Python", url: "docs.html#py-basics-files", tags: ["python", "basics", "file", "json", "csv", "pathlib", "io"] },
    { title: "Basics: API Handling", category: "Python", url: "docs.html#py-basics-api", tags: ["python", "basics", "api", "http", "json", "xml", "requests"] },
    { title: "Multithreading & Concurrency", category: "Python", url: "docs.html#py-basics-concurrency", tags: ["python", "basics", "threading", "concurrency", "multiprocessing", "asyncio", "async", "parallel"] },
    { title: "History of Python", category: "Python", url: "docs.html#python-history", tags: ["python", "history", "guido", "van", "rossum", "timeline", "evolution"] },
    { title: "How Python's GIL Works", category: "System Internals", url: "docs.html#gil", tags: ["python", "gil", "thread", "concurrency", "multiprocessing", "lock"] },
    { title: "How a Compiler Works", category: "System Internals", url: "docs.html#compiler", tags: ["compiler", "compile", "pipeline", "ast", "lexer", "parser"] },
    { title: "How an Interpreter Works", category: "System Internals", url: "docs.html#interpreter", tags: ["interpreter", "interpret", "runtime", "execution", "repl"] },
  ];

  var _selectedIndex = -1;

  function openSearchModal() {
    var modal = document.getElementById('search-modal');
    var input = document.getElementById('modal-search-input');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (input) input.focus();
    document.body.style.overflow = 'hidden';
    _selectedIndex = -1;
    renderResults('');
  }

  function closeSearchModal() {
    var modal = document.getElementById('search-modal');
    var input = document.getElementById('modal-search-input');
    var results = document.getElementById('modal-search-results');
    if (!modal) return;
    modal.classList.remove('flex');
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    if (input) input.value = '';
    if (results) results.innerHTML = '';
    _selectedIndex = -1;
  }

  document.addEventListener('click', function(e) {
    if (e.target.closest('.open-search-btn')) {
      openSearchModal();
    }
  });

  document.addEventListener('click', function(e) {
    if (e.target.id === 'close-search-btn' || e.target.closest('#close-search-btn')) {
      closeSearchModal();
    }
  });

  document.addEventListener('click', function(e) {
    var modal = document.getElementById('search-modal');
    if (!modal || modal.classList.contains('hidden')) return;
    if (e.target === modal) closeSearchModal();
  });

  document.addEventListener('click', function(e) {
    var link = e.target.closest('#modal-search-results a');
    if (link) closeSearchModal();
  });

  document.addEventListener('keydown', function(e) {
    var modal = document.getElementById('search-modal');
    if (!modal || modal.classList.contains('hidden')) return;

    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      closeSearchModal();
      return;
    }
    if (e.key === 'Escape') closeSearchModal();
  });

  // Keyboard shortcut to open search
  document.addEventListener('keydown', function(e) {
    var modal = document.getElementById('share-modal');
    if (modal && !modal.classList.contains('hidden')) return;

    var searchModal = document.getElementById('search-modal');
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (searchModal && searchModal.classList.contains('hidden')) {
        openSearchModal();
      } else {
        closeSearchModal();
      }
    }
  });

  // ---- Search suggestions + live filtering ----

  function _escapeRe(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function _highlight(text, query) {
    if (!query) return text;
    var re = new RegExp('(' + _escapeRe(query) + ')', 'gi');
    return text.replace(re, '<mark class="bg-brand-100 dark:bg-brand-500/30 text-inherit rounded-sm px-0.5">$1</mark>');
  }

  function renderResults(query) {
    var results = document.getElementById('modal-search-results');
    if (!results) return;

    var q = query.toLowerCase().trim();

    var items;
    if (!q) {
      items = searchIndex.slice(0, 6);
    } else {
      items = searchIndex.filter(function(item) {
        return item.title.toLowerCase().includes(q) ||
               item.category.toLowerCase().includes(q) ||
               item.tags.some(function(tag) { return tag.includes(q); });
      });
    }

    _selectedIndex = -1;

    if (items.length === 0) {
      results.innerHTML = [
        '<div role="status" aria-live="polite" class="p-8 text-center text-slate-500 dark:text-slate-400 font-mono text-sm">',
        'No matches found. Try searching for "python", "basics", or "compiler".',
        '</div>'
      ].join('\n');
      return;
    }

    results.innerHTML = items.map(function(item, i) {
      var titleHtml = q ? _highlight(item.title, q) : item.title;
      var catHtml = q ? _highlight(item.category, q) : item.category;
      return [
        '<a href="' + item.url + '" role="option" class="search-result flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-brand-50 dark:hover:bg-brand-500/10 border border-slate-100 dark:border-slate-800 hover:border-brand-100 dark:hover:border-brand-500/30 rounded-lg transition-all group" data-index="' + i + '">',
        '<div class="flex flex-col gap-1">',
        '<span class="text-xs font-bold text-brand-500 uppercase tracking-wider">' + catHtml + '</span>',
        '<span class="font-bold text-slate-800 dark:text-slate-200 group-hover:text-brand-500 transition-colors">' + titleHtml + '</span>',
        '</div>',
        '<span class="material-symbols-outlined text-slate-400 group-hover:text-brand-500 transition-transform group-hover:translate-x-1">arrow_forward</span>',
        '</a>'
      ].join('');
    }).join('');

    if (!q) {
      results.innerHTML += [
        '<div role="status" aria-live="polite" class="pt-2 pb-1 text-center text-xs text-slate-400 font-mono">',
        'Type to filter all ' + searchIndex.length + ' pages',
        '</div>'
      ].join('\n');
    }
  }

  function _navigateSearch(dir) {
    var links = document.querySelectorAll('#modal-search-results .search-result');
    if (links.length === 0) return;

    if (_selectedIndex >= 0 && links[_selectedIndex]) {
      links[_selectedIndex].classList.remove('bg-brand-50', 'dark:bg-brand-500/20', 'border-brand-100', 'dark:border-brand-500/30');
    }

    _selectedIndex = (_selectedIndex + dir + links.length) % links.length;

    links[_selectedIndex].classList.add('bg-brand-50', 'dark:bg-brand-500/20', 'border-brand-100', 'dark:border-brand-500/30');
    links[_selectedIndex].focus();
  }

  // Live search filtering
  document.addEventListener('input', function(e) {
    if (e.target.id !== 'modal-search-input') return;
    renderResults(e.target.value);
  });

  // Keyboard navigation
  document.addEventListener('keydown', function(e) {
    var modal = document.getElementById('search-modal');
    if (!modal || modal.classList.contains('hidden')) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      _navigateSearch(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      _navigateSearch(-1);
    } else if (e.key === 'Enter') {
      var links = document.querySelectorAll('#modal-search-results .search-result');
      if (_selectedIndex >= 0 && links[_selectedIndex]) {
        e.preventDefault();
        window.location.href = links[_selectedIndex].getAttribute('href');
        closeSearchModal();
      }
    }
  });

  // Track selection on hover
  document.addEventListener('mouseover', function(e) {
    var result = e.target.closest('.search-result');
    if (!result) return;
    var links = document.querySelectorAll('#modal-search-results .search-result');
    if (_selectedIndex >= 0 && links[_selectedIndex]) {
      links[_selectedIndex].classList.remove('bg-brand-50', 'dark:bg-brand-500/20', 'border-brand-100', 'dark:border-brand-500/30');
    }
    _selectedIndex = Array.prototype.indexOf.call(links, result);
  });
})();
