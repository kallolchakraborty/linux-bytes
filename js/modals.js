(function() {
  'use strict';

  // ---- Templates ----

  const shareHTML = [
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

  const searchHTML = [
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

  const hasSearch = document.querySelector('.open-search-btn') !== null;
  if (hasSearch) {
    document.body.insertAdjacentHTML('beforeend', searchHTML);
  }

  // ---- Share Modal Logic ----

  document.addEventListener('click', function(e) {
    let btn = e.target.closest('.open-share-btn');
    if (!btn) return;
    let modal = document.getElementById('share-modal');
    let input = document.getElementById('share-url-input');
    let confirm = document.getElementById('copy-confirm');
    if (!modal) return;

    _lastFocusedEl = document.activeElement;

    let url = window.location.href;
    let title = document.title || 'Quick Bytes';

    if (input) input.value = url;
    if (confirm) confirm.classList.add('hidden');

    let encodedUrl = encodeURIComponent(url);
    let encodedTitle = encodeURIComponent(title);

    document.querySelectorAll('.share-link').forEach(function(link) {
      link.href = (link.getAttribute('data-href') || '')
        .replace('{url}', encodedUrl)
        .replace('{title}', encodedTitle);
    });

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (input) input.focus();
  });

  function closeShareModal() {
    let modal = document.getElementById('share-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    if (_lastFocusedEl) { _lastFocusedEl.focus(); _lastFocusedEl = null; }
  }

  document.addEventListener('click', function(e) {
    if (e.target.id === 'close-share-btn' || e.target.closest('#close-share-btn')) {
      closeShareModal();
    }
  });

  document.addEventListener('click', function(e) {
    let modal = document.getElementById('share-modal');
    if (!modal || modal.classList.contains('hidden')) return;
    if (e.target === modal) {
      closeShareModal();
    }
  });

  document.addEventListener('click', function(e) {
    let copyBtn = e.target.closest('#copy-share-btn');
    if (!copyBtn) return;
    let input = document.getElementById('share-url-input');
    let confirm = document.getElementById('copy-confirm');
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
    let modal = document.getElementById('share-modal');
    if (!modal || modal.classList.contains('hidden')) return;
    _trapFocus(e, 'share-modal');
    if (e.key === 'Escape') closeShareModal();
  });

  // ---- Search Modal Logic ----

  if (!hasSearch) return;

  const searchIndex = [
    { title: "Built-in Collections (legacy route)", category: "Python", url: "docs.html#py-basics-ds", tags: ["python", "data", "structures", "builtins", "ds-route"], },
    { title: "Data Types & Operations", category: "Python", url: "docs.html#py-basics-datatypes", tags: ["python", "basics", "bitwise", "operators", "casting", "coercion", "masking", "flags", "overflow", "shift"] },
    { title: "Loops & Control Flow", category: "Python", url: "docs.html#py-basics-loops", tags: ["python", "basics", "loops", "for", "while", "control", "flow", "if"] },
    { title: "Input & Output", category: "Python", url: "docs.html#py-basics-io", tags: ["python", "basics", "input", "output", "print", "formatting", "fstring"] },
    { title: "Built-in Collections", category: "Python", url: "docs.html#py-ds-builtins", tags: ["python", "data", "structures", "list", "tuple", "set", "dict", "collection", "basics"] },
    { title: "Linked Lists", category: "Python", url: "docs.html#py-ds-linkedlist", tags: ["python", "data", "structures", "linked", "list", "singly", "doubly", "node", "pointers"] },
    { title: "Stacks & Queues", category: "Python", url: "docs.html#py-ds-stackqueue", tags: ["python", "data", "structures", "stack", "queue", "deque", "lifo", "fifo", "popleft"] },
    { title: "Priority Queues & Heaps", category: "Python", url: "docs.html#py-ds-heap", tags: ["python", "data", "structures", "priority", "queue", "heap", "minheap", "maxheap", "heapq"] },
    { title: "Trees & BSTs", category: "Python", url: "docs.html#py-ds-tree", tags: ["python", "data", "structures", "tree", "binary", "search", "bst", "traversal", "inorder", "preorder", "postorder"] },
    { title: "Graphs & Networks", category: "Python", url: "docs.html#py-ds-graph", tags: ["python", "data", "structures", "graph", "network", "dfs", "bfs", "adjacency", "list", "traversal"] },
    { title: "File Handling", category: "Python", url: "docs.html#py-basics-files", tags: ["python", "basics", "file", "json", "csv", "pathlib", "io"] },
    { title: "API Handling", category: "Python", url: "docs.html#py-basics-api", tags: ["python", "basics", "api", "http", "json", "xml", "requests"] },
    { title: "Multithreading & Concurrency", category: "Python", url: "docs.html#py-basics-concurrency", tags: ["python", "basics", "threading", "concurrency", "multiprocessing", "asyncio", "async", "parallel"] },
    { title: "History of Python", category: "Python", url: "docs.html#python-history", tags: ["python", "history", "guido", "van", "rossum", "timeline", "evolution"] },
    { title: "Time & Space Complexity", category: "Python", url: "docs.html#py-complexity", tags: ["python", "complexity", "big-o", "time", "space", "analysis", "asymptotic"] },
    { title: "Algorithms & Patterns", category: "Python", url: "docs.html#py-algorithms", tags: ["python", "algorithms", "patterns", "two-pointers", "binary-search", "dp", "backtracking", "divide-conquer"] },
    { title: "OOP & Design Patterns", category: "Python", url: "docs.html#py-oop", tags: ["python", "oop", "design", "patterns", "solid", "decorator", "metaclass", "inheritance"] },
    { title: "Testing & Debugging", category: "Python", url: "docs.html#py-testing", tags: ["python", "testing", "pytest", "mock", "unittest", "debugging", "profiling", "tdd"] },
    { title: "Error Handling & Exceptions", category: "Python", url: "docs.html#py-exceptions", tags: ["python", "errors", "exceptions", "try", "except", "finally", "chaining", "custom"] },
    { title: "Type System & Annotations", category: "Python", url: "docs.html#py-typing", tags: ["python", "typing", "type-hints", "annotations", "mypy", "pyright", "generic", "protocol"] },
    { title: "Memory Management & GC", category: "Python", url: "docs.html#py-memory", tags: ["python", "memory", "gc", "garbage-collection", "reference-counting", "weakref", "leak"] },
    { title: "Module System & Packaging", category: "Python", url: "docs.html#py-modules", tags: ["python", "modules", "packaging", "import", "pip", "pyproject", "virtual-env", "monorepo"] },
    { title: "Functional Programming", category: "Python", url: "docs.html#py-functional", tags: ["python", "functional", "itertools", "functools", "map", "filter", "reduce", "lambda", "closure"] },
    { title: "Performance & Profiling", category: "Python", url: "docs.html#py-performance", tags: ["python", "performance", "profiling", "cprofile", "cython", "pypy", "optimization", "numba"] },
    { title: "Google Python Culture", category: "Python", url: "docs.html#py-google-culture", tags: ["python", "google", "style-guide", "readability", "code-review", "sre", "design-docs", "okr"] },
    { title: "Design Docs for Python", category: "Python", url: "docs.html#py-design-docs", tags: ["python", "design-docs", "template", "architecture", "review", "google", "staff"] },
    { title: "Security Best Practices for Python", category: "Python", url: "docs.html#py-security", tags: ["python", "security", "injection", "sast", "secrets", "pickle", "sandboxing", "supply-chain"] },
    { title: "Logging & Observability for Python", category: "Python", url: "docs.html#py-logging", tags: ["python", "logging", "observability", "opentelemetry", "structured-logging", "correlation-id", "pii", "monitoring"] },
    { title: "What exactly is an LLM?", category: "Gen AI", url: "docs.html#genai-what-is-llm", tags: ["genai", "llm", "transformer", "attention", "scaling", "next-token", "pretraining", "sft", "rlhf"] },
    { title: "KV Cache", category: "Gen AI", url: "docs.html#genai-kvcache", tags: ["genai", "kv", "cache", "attention", "inference", "memory", "decoding", "transformer"] },
    { title: "RAG — Retrieval-Augmented Generation", category: "Gen AI", url: "docs.html#genai-rag", tags: ["genai", "rag", "retrieval", "augmented", "generation", "vector", "search", "chunking"] },
    { title: "Fine-Tuning & PEFT", category: "Gen AI", url: "docs.html#genai-finetuning", tags: ["genai", "fine-tuning", "peft", "lora", "qlora", "adapter", "sft", "alignment"] },
    { title: "Prompt Engineering — Techniques & Strategy", category: "Gen AI", url: "docs.html#genai-prompt-engineering", tags: ["genai", "prompt", "engineering", "zero-shot", "few-shot", "cot", "chain-of-thought", "injection", "structured-output"] },
    { title: "Context Engineering — Managing the Window", category: "Gen AI", url: "docs.html#genai-context-engineering", tags: ["genai", "context", "engineering", "window", "lost-in-the-middle", "sliding-window", "caching"] },
    { title: "Harness Engineering — Evaluation & Benchmarks", category: "Gen AI", url: "docs.html#genai-harness-engineering", tags: ["genai", "harness", "engineering", "evaluation", "benchmark", "llm-as-judge", "mmlu", "gsm8k"] },
    { title: "Loop Engineering — Agentic Patterns & Reasoning", category: "Gen AI", url: "docs.html#genai-loop-engineering", tags: ["genai", "loop", "engineering", "react", "agent", "tool-use", "reflexion", "tree-of-thoughts"] },
    { title: "Mixture of Experts — MoE Architecture", category: "Gen AI", url: "docs.html#genai-moe", tags: ["genai", "moe", "mixture", "experts", "routing", "load-balancing", "sparse", "all-to-all"] },
    { title: "LLM Serving — Production Inference at Scale", category: "Gen AI", url: "docs.html#genai-llm-serving", tags: ["genai", "serving", "deployment", "continuous-batching", "tensor-parallelism", "pipeline-parallelism", "vllm", "prefix-caching"] },
    { title: "ML Fundamentals", category: "AI/ML", url: "docs.html#aiml-ml-fundamentals", tags: ["aiml", "ml", "fundamentals", "metrics", "classification", "regression", "cv", "bias-variance", "overfitting", "data-leakage"] },
    { title: "Supervised Learning", category: "AI/ML", url: "docs.html#aiml-supervised-learning", tags: ["aiml", "supervised", "linear-regression", "ridge", "lasso", "logistic-regression", "decision-tree", "random-forest", "xgboost", "svm", "knn"] },
    { title: "Unsupervised Learning", category: "AI/ML", url: "docs.html#aiml-unsupervised-learning", tags: ["aiml", "unsupervised", "k-means", "dbscan", "hierarchical", "gmm", "pca", "tsne", "umap", "anomaly-detection"] },
    { title: "Data-Centric AI", category: "AI/ML", url: "docs.html#aiml-ml-data-centric", tags: ["aiml", "data-centric", "quality", "augmentation", "weak-supervision", "snorkel", "active-learning", "data-debugging", "cleanlab"] },
    { title: "ML Math — Probability & Linear Algebra", category: "AI/ML", url: "docs.html#aiml-ml-math", tags: ["aiml", "math", "probability", "mle", "linear-algebra", "svd", "statistics", "hypothesis-testing", "information-theory", "kl-divergence"] },
    { title: "A/B Testing & Experimentation", category: "AI/ML", url: "docs.html#aiml-ab-testing-experimentation", tags: ["aiml", "ab-testing", "experimentation", "sample-size", "cuped", "peeking", "multiple-testing", "switchback", "variance-reduction"] },
    { title: "Activation Functions", category: "AI/ML", url: "docs.html#aiml-activation-functions", tags: ["aiml", "activation", "functions", "sigmoid", "tanh", "relu", "leaky-relu", "gelu", "swish", "softmax", "mish"] },
    { title: "Neural Network Training", category: "AI/ML", url: "docs.html#aiml-neural-network-training", tags: ["aiml", "training", "weight-init", "loss-functions", "optimizers", "adam", "dropout", "batchnorm", "mixed-precision", "fsdp"] },
    { title: "Introduction to Neural Networks", category: "AI/ML", url: "docs.html#aiml-ann-history", tags: ["aiml", "ann", "neural", "network", "history", "perceptron", "backpropagation", "transformer", "deep learning"] },
    { title: "Types of Artificial Neural Networks", category: "AI/ML", url: "docs.html#aiml-types-of-anns", tags: ["aiml", "ann", "types", "architectures", "mlp", "cnn", "rnn", "lstm", "gan", "autoencoder", "transformer", "attention", "diffusion", "ddpm"] },
    { title: "ML From Zero to Hero", category: "AI/ML", url: "docs.html#aiml-ml-zero-to-hero", tags: ["aiml", "zero-to-hero", "micrograd", "backprop", "bpe", "tokenizer", "nanoGPT", "transformer", "kv-cache", "autograd", "karpathy", "im2col", "convolution"] },
    { title: "ML Coding Patterns", category: "AI/ML", url: "docs.html#aiml-ml-coding-patterns", tags: ["aiml", "coding", "patterns", "k-means", "streaming", "auc", "lru-cache", "moving-average", "rate-limiter", "sliding-window", "metrics", "token-bucket", "ema"] },
    { title: "ML Research Papers", category: "AI/ML", url: "docs.html#aiml-ml-papers", tags: ["aiml", "papers", "research", "transformer", "resnet", "batchnorm", "adam", "dropout", "gan", "vae", "bert", "scaling-laws", "diffusion", "ddpm", "attention"] },
    { title: "ML System Design", category: "AI/ML", url: "docs.html#aiml-ml-system-design", tags: ["aiml", "system", "design", "two-tower", "recommendation", "fraud-detection", "search-ranking", "ctr", "ad-prediction", "content-moderation", "news-feed", "data-drift", "concept-drift", "shadow-deployment", "canary", "monitoring"] },
    { title: "Recommendation Systems", category: "AI/ML", url: "docs.html#aiml-recommendation-systems", tags: ["aiml", "recommendation", "recsys", "collaborative-filtering", "matrix-factorization", "two-tower", "dnn", "hnsw", "faiss", "cold-start", "exploration", "thompson-sampling", "ndcg", "evaluation"] },
    { title: "GPU Deep Dive for ML", category: "AI/ML", url: "docs.html#aiml-ml-gpu-deep-dive", tags: ["aiml", "gpu", "cuda", "memory", "hierarchy", "hbm", "sram", "flashattention", "mixed-precision", "bf16", "fp16", "quantization", "gptq", "awq", "vllm", "pagedattention", "speculative-decoding", "continuous-batching"] },
    { title: "ML Project Structure", category: "AI/ML", url: "docs.html#aiml-ml-project-structure", tags: ["aiml", "project", "structure", "human-level-performance", "avoidable-bias", "error-analysis", "train-dev", "data-mismatch", "bias-variance", "orthogonalization", "ablation", "end-to-end", "pipeline", "andrew-ng"] },
    { title: "ML Behavioral (STAR)", category: "AI/ML", url: "docs.html#aiml-ml-behavioral", tags: ["aiml", "behavioral", "star", "interview", "model-failure", "debugging", "cross-functional", "deployment", "ambiguity"] },
    { title: "FAANG Chestnut Questions", category: "AI/ML", url: "docs.html#aiml-ml-chestnut-questions", tags: ["aiml", "chestnut", "questions", "interview", "bias-variance", "backprop", "adam", "batchnorm", "auc", "cold-start", "deployment"] },
    { title: "FAANG Company Focus", category: "AI/ML", url: "docs.html#aiml-ml-company-focus", tags: ["aiml", "company", "focus", "google", "meta", "apple", "amazon", "netflix", "microsoft", "nvidia", "openai", "interview"] },
    { title: "NLP Deep Dive", category: "AI/ML", url: "docs.html#aiml-nlp-deep-dive", tags: ["aiml", "nlp", "natural-language-processing", "embeddings", "word2vec", "glove", "seq2seq", "attention", "transformer", "bert", "fine-tuning", "llm", "instruction-tuning", "ner", "pos", "text-classification"] },
    { title: "Computer Vision Deep Dive", category: "AI/ML", url: "docs.html#aiml-cv-deep-dive", tags: ["aiml", "cv", "computer-vision", "resnet", "efficientnet", "vit", "vision-transformer", "yolo", "object-detection", "u-net", "segmentation", "facenet", "arcface", "self-supervised", "data-augmentation"] },
    { title: "RL & RLHF — Reinforcement Learning", category: "AI/ML", url: "docs.html#aiml-rl-rlhf", tags: ["aiml", "rl", "reinforcement-learning", "rlhf", "dpo", "mdp", "bellman", "q-learning", "dqn", "policy-gradients", "ppo", "multi-armed-bandits", "exploration", "alignment"] },
    { title: "ML Study Roadmap", category: "AI/ML", url: "docs.html#aiml-ml-roadmap", tags: ["aiml", "roadmap", "study plan", "track", "crash", "standard", "deep", "FAANG", "interview prep", "curriculum"] },
    { title: "LLM Engineering Deep Dive", category: "AI/ML", url: "docs.html#aiml-llm-engineering", tags: ["aiml", "llm", "engineering", "prompt-engineering", "rag", "retrieval-augmented", "peft", "lora", "qlora", "fine-tuning", "rlhf", "dpo", "alignment", "safety", "red-teaming", "agents", "react", "serving", "vllm", "context-window", "rope"] },
    { title: "Staff+ ML System Design", category: "AI/ML", url: "docs.html#aiml-ml-staff-system-design", tags: ["aiml", "staff", "system-design", "ml-platform", "feature-store", "multi-stage-ranking", "real-time", "ab-testing", "experimentation", "distributed-training", "labeling", "model-lifecycle", "anomaly-detection", "capacity-planning"] },
    { title: "ML Leadership & Strategy for Staff+", category: "AI/ML", url: "docs.html#aiml-ml-leadership-strategy", tags: ["aiml", "staff", "leadership", "strategy", "technical-vision", "influence", "mentoring", "roadmap", "build-vs-buy", "incident-response", "executive-communication", "technical-debt"] },
    { title: "Production ML Operations", category: "AI/ML", url: "docs.html#aiml-ml-production-ops", tags: ["aiml", "production", "mlops", "online-learning", "bandits", "feature-engineering", "data-quality", "labeling", "active-learning", "weak-supervision", "snorkel", "network-effects", "switchback", "model-cascade", "continuous-training", "budget-aware"] },
    { title: "ML Interpretability & Responsible AI", category: "AI/ML", url: "docs.html#aiml-ml-interpretability-fairness", tags: ["aiml", "interpretability", "xai", "shap", "lime", "integrated-gradients", "counterfactual", "fairness", "bias", "responsible-ai", "model-cards", "eu-ai-act", "gdpr"] },
    { title: "ML Mock Interview Walkthroughs", category: "AI/ML", url: "docs.html#aiml-ml-mock-interviews", tags: ["aiml", "mock-interview", "system-design", "coding", "behavioral", "star", "attention", "decision-tree", "google-l6", "meta-e6", "amazon-l6"] },
    { title: "System Design Fundamentals", category: "System Design", url: "docs.html#sysdesign-fundamentals", tags: ["system", "design", "distributed", "cap", "consistent-hashing", "caching", "sharding", "consensus", "load-balancing", "cqrs"] },
    { title: "Database Fundamentals", category: "Databases", url: "docs.html#database-fundamentals", tags: ["database", "sql", "indexing", "btree", "transactions", "acid", "isolation", "normalization", "nosql", "query-optimization"] },
    { title: "FAANG Engineering Facts", category: "FAANG", url: "docs.html#faang-facts", tags: ["faang", "meta", "amazon", "apple", "netflix", "google", "scale", "facts", "interview", "system", "design", "numbers", "dynamo", "spanner", "kubernetes", "tao", "borg", "latency", "throughput", "storage"] },
  ];

  let _selectedIndex = -1;
  let _lastFocusedEl = null;

  function _getFocusable(el) {
    if (!el) return [];
    let selectors = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.from(el.querySelectorAll(selectors)).filter(function(f) {
      return f.offsetParent !== null;
    });
  }

  function _trapFocus(e, modalId) {
    if (e.key !== 'Tab') return;
    let modal = document.getElementById(modalId);
    if (!modal || modal.classList.contains('hidden')) return;
    let focusable = _getFocusable(modal);
    if (focusable.length === 0) return;
    let first = focusable[0];
    let last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function openSearchModal() {
    let modal = document.getElementById('search-modal');
    let input = document.getElementById('modal-search-input');
    if (!modal) return;
    _lastFocusedEl = document.activeElement;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (input) input.focus();
    document.body.style.overflow = 'hidden';
    _selectedIndex = -1;
    renderResults('');
  }

  function closeSearchModal() {
    let modal = document.getElementById('search-modal');
    let input = document.getElementById('modal-search-input');
    let results = document.getElementById('modal-search-results');
    if (!modal) return;
    modal.classList.remove('flex');
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    if (input) input.value = '';
    if (results) results.innerHTML = '';
    _selectedIndex = -1;
    if (_lastFocusedEl) { _lastFocusedEl.focus(); _lastFocusedEl = null; }
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
    let modal = document.getElementById('search-modal');
    if (!modal || modal.classList.contains('hidden')) return;
    if (e.target === modal) closeSearchModal();
  });

  document.addEventListener('click', function(e) {
    let link = e.target.closest('#modal-search-results a');
    if (link) closeSearchModal();
  });

  document.addEventListener('keydown', function(e) {
    let modal = document.getElementById('search-modal');
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
    let modal = document.getElementById('share-modal');
    if (modal && !modal.classList.contains('hidden')) return;

    let searchModal = document.getElementById('search-modal');
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
    let re = new RegExp('(' + _escapeRe(query) + ')', 'gi');
    return text.replace(re, '<mark class="bg-brand-100 dark:bg-brand-500/30 text-inherit rounded-sm px-0.5">$1</mark>');
  }

  function renderResults(query) {
    let results = document.getElementById('modal-search-results');
    if (!results) return;

    let q = query.toLowerCase().trim();

    let items;
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
      let titleHtml = q ? _highlight(item.title, q) : item.title;
      let catHtml = q ? _highlight(item.category, q) : item.category;
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
    let links = document.querySelectorAll('#modal-search-results .search-result');
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
    let modal = document.getElementById('search-modal');
    if (!modal || modal.classList.contains('hidden')) return;

    _trapFocus(e, 'search-modal');

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      _navigateSearch(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      _navigateSearch(-1);
    } else if (e.key === 'Enter') {
      let links = document.querySelectorAll('#modal-search-results .search-result');
      if (_selectedIndex >= 0 && links[_selectedIndex]) {
        e.preventDefault();
        window.location.href = links[_selectedIndex].getAttribute('href');
        closeSearchModal();
      }
    }
  });

  // Track selection on hover
  document.addEventListener('mouseover', function(e) {
    let result = e.target.closest('.search-result');
    if (!result) return;
    let links = document.querySelectorAll('#modal-search-results .search-result');
    if (_selectedIndex >= 0 && links[_selectedIndex]) {
      links[_selectedIndex].classList.remove('bg-brand-50', 'dark:bg-brand-500/20', 'border-brand-100', 'dark:border-brand-500/30');
    }
    _selectedIndex = Array.prototype.indexOf.call(links, result);
  });

  // ---- Readme Modal Logic & Markup ----

  const readmeHTML = [
    '<div id="readme-modal" class="hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm p-4 sm:p-10 justify-center items-start" role="dialog" aria-modal="true" aria-label="Documentation">',
    '<div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col overflow-hidden mt-4 max-h-[85vh]">',
    '<div class="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shadow-sm shrink-0">',
    '<div class="flex items-center gap-2">',
    '<span class="material-symbols-outlined text-brand-500">menu_book</span>',
    '<h3 class="font-bold text-slate-900 dark:text-white">Quick Bytes Documentation</h3>',
    '</div>',
    '<button id="close-readme-btn" class="text-xs text-slate-400 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">ESC</button>',
    '</div>',
    '<div id="readme-content" class="p-6 overflow-y-auto min-h-0 text-sm leading-relaxed text-slate-700 dark:text-slate-300 font-sans prose dark:prose-invert max-w-none">',
    '<div class="flex items-center justify-center py-12">',
    '<span class="material-symbols-outlined animate-spin text-brand-500 text-3xl">sync</span>',
    '</div>',
    '</div>',
    '</div>',
    '</div>'
  ].join('\n');

  document.body.insertAdjacentHTML('beforeend', readmeHTML);

  let readmeLoaded = false;

  function openReadmeModal() {
    let modal = document.getElementById('readme-modal');
    if (!modal) return;
    _lastFocusedEl = document.activeElement;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
    let closeBtn = document.getElementById('close-readme-btn');
    if (closeBtn) closeBtn.focus();

    if (!readmeLoaded) {
      if (typeof marked === 'undefined') {
        let script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
        script.onload = function() {
          loadAndRenderReadme();
        };
        script.onerror = function() {
          let content = document.getElementById('readme-content');
          if (content) content.innerHTML = '<p class="text-red-500 text-center font-semibold">Failed to load markdown parser library.</p>';
        };
        document.head.appendChild(script);
      } else {
        loadAndRenderReadme();
      }
    }
  }

  function loadAndRenderReadme() {
    fetch('README.md')
      .then(function(res) {
        if (!res.ok) throw new Error('Failed to load README.md');
        return res.text();
      })
      .then(function(text) {
        let html = marked.parse(text);
        let content = document.getElementById('readme-content');
        if (content) {
          content.innerHTML = html;
          // Apply custom styles matching the rich aesthetic
          content.querySelectorAll('h1, h2, h3, h4').forEach(function(h) {
            h.classList.add('font-bold', 'text-slate-900', 'dark:text-white', 'mt-6', 'mb-3', 'tracking-tight');
            if (h.tagName === 'H1') h.classList.add('text-2xl', 'border-b', 'border-slate-200', 'dark:border-slate-800', 'pb-2');
            if (h.tagName === 'H2') h.classList.add('text-xl', 'border-b', 'border-slate-200', 'dark:border-slate-800', 'pb-1.5');
            if (h.tagName === 'H3') h.classList.add('text-base');
            if (h.tagName === 'H4') h.classList.add('text-sm');
          });
          content.querySelectorAll('table').forEach(function(t) {
            t.className = 'w-full text-left border-collapse border border-slate-200 dark:border-slate-800 my-4 text-xs';
          });
          content.querySelectorAll('th').forEach(function(th) {
            th.className = 'bg-slate-50 dark:bg-slate-800/40 p-2.5 font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800';
          });
          content.querySelectorAll('td').forEach(function(td) {
            td.className = 'p-2.5 border-b border-slate-200 dark:border-slate-800';
          });
          content.querySelectorAll('a').forEach(function(a) {
            a.className = 'text-brand-500 hover:text-brand-600 transition-colors font-semibold underline';
          });
          content.querySelectorAll('code').forEach(function(c) {
            if (!c.parentNode || c.parentNode.tagName !== 'PRE') {
              c.className = 'bg-slate-100 dark:bg-slate-800 text-brand-500 dark:text-orange-400 px-1 py-0.5 rounded font-mono text-xs';
            }
          });
          content.querySelectorAll('pre').forEach(function(pre) {
            pre.className = 'bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 p-4 rounded-xl font-mono text-xs overflow-x-auto my-4 text-slate-800 dark:text-slate-200';
          });
          readmeLoaded = true;
        }
      })
      .catch(function(err) {
        console.error(err);
        let content = document.getElementById('readme-content');
        if (content) {
          content.innerHTML = '<p class="text-red-500 text-center font-semibold">Failed to load documentation content.</p>';
        }
      });
  }

  function closeReadmeModal() {
    let modal = document.getElementById('readme-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
    if (_lastFocusedEl) { _lastFocusedEl.focus(); _lastFocusedEl = null; }
  }

  document.addEventListener('click', function(e) {
    if (e.target.id === 'close-readme-btn' || e.target.closest('#close-readme-btn')) {
      closeReadmeModal();
    }
  });

  document.addEventListener('click', function(e) {
    let modal = document.getElementById('readme-modal');
    if (!modal || modal.classList.contains('hidden')) return;
    if (e.target === modal) {
      closeReadmeModal();
    }
  });

  document.addEventListener('keydown', function(e) {
    let modal = document.getElementById('readme-modal');
    if (!modal || modal.classList.contains('hidden')) return;
    _trapFocus(e, 'readme-modal');
    if (e.key === 'Escape') closeReadmeModal();
  });
})();
