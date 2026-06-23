function initAnimationPlayer(config) {
  let state = {
    currentScene: 0,
    currentStep: 0,
    steps: [],
    totalSteps: 0,
    isPlaying: false,
    autoPlayTimer: null,
    stepPlayTimer: null,
    config: config
  };

  let TOTAL = config.totalScenes;
  let data = config.sceneData;
  let stepInterval = config.stepIntervalMs || 1800;
  let scenePauseMs = config.scenePauseMs || 1200;

  // ========== SCENE MARKERS ==========
  function createSceneMarkers() {
    let track = document.querySelector('.timeline-track');
    if (!track || TOTAL < 2) return;
    let dots = track.querySelectorAll('.scene-marker');
    for (let d = 0; d < dots.length; d++) dots[d].remove();
    for (let i = 0; i < TOTAL; i++) {
      let dot = document.createElement('span');
      let pct = TOTAL > 1 ? (i / (TOTAL - 1)) * 100 : 50;
      dot.className = 'scene-marker';
      dot.style.left = pct + '%';
      track.appendChild(dot);
    }
  }

  let el = {
    progress: document.getElementById('timeline-progress'),
    subtitle: document.getElementById('scene-subtitle'),
    playBtn: document.getElementById('play-btn'),
    playIcon: document.getElementById('play-icon'),
    prevBtn: document.getElementById('prev-btn'),
    nextBtn: document.getElementById('next-btn'),
    fullscreenBtn: document.getElementById('fullscreen-btn'),
    canvas: document.getElementById('fullscreen-canvas'),
    timelineBar: document.getElementById('timeline-bar'),
    stepDots: null
  };

  // ========== STEP DOTS ==========
  function createStepDotsContainer() {
    let container = document.createElement('div');
    container.id = 'step-dots';
    container.className = 'flex items-center justify-center gap-[2px] mt-0.5 h-1.5';
    if (config.stepDotsParent) {
      config.stepDotsParent.appendChild(container);
    } else if (el.timelineBar && el.timelineBar.parentNode) {
      el.timelineBar.parentNode.insertBefore(container, el.timelineBar.nextSibling);
    }
    el.stepDots = container;
  }

  function renderStepDots() {
    if (!el.stepDots) return;
    let html = '';
    for (let i = 0; i < state.totalSteps; i++) {
      let cls = 'w-1 h-1 rounded-full transition-all duration-300 ';
      if (i <= state.currentStep) {
        cls += 'bg-orange-600 dark:bg-orange-400';
      } else {
        cls += 'bg-gray-300 dark:bg-gray-600';
      }
      html += '<span class="' + cls + '"></span>';
    }
    el.stepDots.innerHTML = html;
  }

  // ========== SCENE SWITCHING ==========
  function showScene(sceneIndex) {
    if (sceneIndex < 1 || sceneIndex > TOTAL) return;
    if (state.currentScene !== sceneIndex) {
      for (let i = 1; i <= TOTAL; i++) {
        let vis = document.getElementById('vis-scene-' + i);
        if (!vis) continue;
        vis.classList.add('opacity-0', 'pointer-events-none');
        if (i === 2 && config.scene2HideClass) vis.classList.add(config.scene2HideClass);
      }
      state.currentScene = sceneIndex;
    }

    let percent = ((sceneIndex - 1) / (TOTAL - 1)) * 100;
    el.progress.style.width = percent + '%';

    if (el.subtitle) {
      el.subtitle.style.transition = 'none';
      el.subtitle.style.opacity = '0';
      el.subtitle.style.transform = 'translateY(4px)';
      void el.subtitle.offsetHeight;
      el.subtitle.style.transition = '';
    }

    setTimeout(function () {
      if (el.subtitle && data && data[sceneIndex - 1]) {
        el.subtitle.textContent = data[sceneIndex - 1].subtitle;
        el.subtitle.style.opacity = '1';
        el.subtitle.style.transform = 'translateY(0)';
      }
    }, 300);

    let activeVis = document.getElementById('vis-scene-' + sceneIndex);
    if (activeVis) {
      activeVis.classList.remove('opacity-0', 'pointer-events-none');
      if (sceneIndex === 2 && config.scene2HideClass) activeVis.classList.remove(config.scene2HideClass);
    }

    // Reset step state and call scene animation
    state.currentStep = -1;
    state.steps = [];
    state.totalSteps = 0;
    renderStepDots();

    if (config.onSceneAnimation) {
      config.onSceneAnimation(sceneIndex, state);
    }

    // If scene defined steps, play from step 0
    if (state.totalSteps > 0 && state.currentStep < 0) {
      executeStep(0);
    }
  }

  // ========== STEP EXECUTION ==========
  function executeStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= state.totalSteps) return;
    if (stepIndex <= state.currentStep) return;
    // Execute all unplayed steps up to and including stepIndex
    for (let i = state.currentStep + 1; i <= stepIndex; i++) {
      if (state.steps[i]) state.steps[i]();
    }
    state.currentStep = stepIndex;
    renderStepDots();

    // Dynamically update subtitle if stepSubtitles exists
    if (el.subtitle && data && data[state.currentScene - 1] && data[state.currentScene - 1].stepSubtitles) {
      let subs = data[state.currentScene - 1].stepSubtitles;
      if (subs[stepIndex]) {
        el.subtitle.style.opacity = '0';
        setTimeout(function() {
          el.subtitle.textContent = subs[stepIndex];
          el.subtitle.style.opacity = '1';
        }, 150);
      }
    }
  }


  state.setSteps = function(steps) {
    state.steps = steps || [];
    state.totalSteps = state.steps.length;
    state.currentStep = -1;
    // Create dots container on first call
    if (!el.stepDots && state.totalSteps > 0) {
      createStepDotsContainer();
    }
    renderStepDots();
  };

  state.advanceStep = function() {
    if (state.totalSteps === 0) return false; // no steps defined
    let nextStep = state.currentStep + 1;
    if (nextStep < state.totalSteps) {
      executeStep(nextStep);
      return true;
    }
    return false; // at end of scene
  };

  state.goToStep = function(stepIndex) {
    if (stepIndex < -1) stepIndex = -1;
    if (stepIndex >= state.totalSteps) stepIndex = state.totalSteps - 1;
    // Re-enter scene to reset
    showScene(state.currentScene);
    // Then advance to requested step
    if (stepIndex >= 0) executeStep(stepIndex);
  };

  // ========== AUTO-PLAY ==========
  function startAutoPlay() {
    state.isPlaying = true;
    el.playIcon.textContent = 'pause';
    stepLoop();
  }

  function stepLoop() {
    if (!state.isPlaying) return;
    let advanced = state.advanceStep();
    if (!advanced) {
      // Scene complete — wait then go to next scene
      state.stepPlayTimer = setTimeout(function () {
        if (!state.isPlaying) return;
        if (state.currentScene < TOTAL) {
          showScene(state.currentScene + 1);
        } else {
          showScene(1);
        }
        if (state.isPlaying) stepLoop();
      }, scenePauseMs);
    } else {
      state.stepPlayTimer = setTimeout(stepLoop, stepInterval);
    }
  }

  function stopAutoPlay() {
    state.isPlaying = false;
    el.playIcon.textContent = 'play_arrow';
    clearTimeout(state.stepPlayTimer);
  }

  function toggleAutoPlay() {
    if (state.isPlaying) stopAutoPlay(); else startAutoPlay();
  }

  // ========== EVENT BINDING ==========
  el.playBtn.addEventListener('click', toggleAutoPlay);

  el.prevBtn.addEventListener('click', function () {
    stopAutoPlay();
    if (state.currentStep > 0) {
      // Go back one step — re-enter scene and play to previous step
      let target = state.currentStep - 1;
      showScene(state.currentScene);
      if (target >= 0) executeStep(target);
    } else if (state.currentScene > 1) {
      let prevScene = state.currentScene - 1;
      showScene(prevScene);
      // Go to last step of previous scene
      setTimeout(function () {
        if (state.totalSteps > 0 && state.currentScene === prevScene) {
          executeStep(state.totalSteps - 1);
        }
      }, 500);
    }
  });

  el.nextBtn.addEventListener('click', function () {
    stopAutoPlay();
    let advanced = state.advanceStep();
    if (!advanced && state.currentScene < TOTAL) {
      showScene(state.currentScene + 1);
    }
  });

  // Canvas click advances step
  if (el.canvas) {
    el.canvas.addEventListener('click', function () {
      stopAutoPlay();
      let advanced = state.advanceStep();
      if (!advanced && state.currentScene < TOTAL) {
        showScene(state.currentScene + 1);
      }
    });
  }

  el.timelineBar.addEventListener('click', function (e) {
    stopAutoPlay();
    let rect = e.currentTarget.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let pct = x / rect.width;
    let target = Math.min(TOTAL, Math.max(1, Math.round(pct * (TOTAL - 1)) + 1));
    showScene(target);
  });

  // ========== FULLSCREEN ==========
  if (el.canvas) {
    let stage = document.createElement('div');
    stage.className = 'fullscreen-stage';
    let canvChildren = el.canvas.querySelectorAll('[id^="vis-scene-"]');
    for (let ci = 0; ci < canvChildren.length; ci++) {
      stage.appendChild(canvChildren[ci]);
    }
    el.canvas.appendChild(stage);
  }

  function toggleFullscreen() {
    if (!el.canvas) return;
    if (!document.fullscreenElement) {
      el.canvas.requestFullscreen()['catch'](function (err) {
        console.error('Fullscreen error:', err);
      });
    } else {
      document.exitFullscreen();
    }
  }

  if (el.fullscreenBtn) {
    el.fullscreenBtn.addEventListener('click', toggleFullscreen);
  }

  document.addEventListener('fullscreenchange', function () {
    let icon = el.fullscreenBtn ? el.fullscreenBtn.querySelector('span') : null;
    if (icon) {
      icon.textContent = document.fullscreenElement ? 'fullscreen_exit' : 'fullscreen';
    }
  });

  // ========== KEYBOARD ==========
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      stopAutoPlay();
      if (state.currentStep > 0) {
        let target = state.currentStep - 1;
        showScene(state.currentScene);
        if (target >= 0) executeStep(target);
      } else if (state.currentScene > 1) {
        showScene(state.currentScene - 1);
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      stopAutoPlay();
      let advanced = state.advanceStep();
      if (!advanced && state.currentScene < TOTAL) {
        showScene(state.currentScene + 1);
      }
    } else if (e.key === ' ') {
      e.preventDefault();
      toggleAutoPlay();
    } else if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      toggleFullscreen();
    }
  });

  // ========== IFRAME EMBED HANDLING ==========
  if (window.self !== window.top) {
    let header = document.querySelector('header');
    let footer = document.querySelector('footer');
    if (header) header.classList.add('hidden');
    if (footer) footer.classList.add('hidden');
    document.body.classList.remove('justify-between');
    document.body.classList.add('justify-center', 'p-0', 'overflow-hidden');
    let main = document.querySelector('main');
    if (main) {
      main.classList.remove('md:py-16', 'py-8', 'px-6');
      main.classList.add('py-0', 'px-2', 'max-w-full');
    }
    let tl = document.querySelector('main > div:last-child');
    if (tl) {
      tl.classList.remove('mt-6', 'mt-8');
      tl.classList.add('mt-3');
    }
  }

  // ========== INIT ==========
  createSceneMarkers();
  showScene(1);

  return {
    showScene: showScene,
    startAutoPlay: startAutoPlay,
    stopAutoPlay: stopAutoPlay,
    get currentScene() { return state.currentScene; },
    get currentStep() { return state.currentStep; },
    get isPlaying() { return state.isPlaying; }
  };
}
