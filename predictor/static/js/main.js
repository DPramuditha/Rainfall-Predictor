// Register GSAP Plugins (ScrollTrigger & ScrollSmoother)
if (typeof gsap !== 'undefined') {
  if (typeof ScrollTrigger !== 'undefined') gsap.registerPlugin(ScrollTrigger);
  if (typeof ScrollTrigger !== 'undefined' && typeof ScrollSmoother !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
  }
}

let smootherInstance = null;

/**
 * Initializes GSAP ScrollSmoother for momentum-based smooth scrolling
 */
function initScrollSmoother() {
  if (typeof gsap === 'undefined' || typeof ScrollSmoother === 'undefined') return;

  const wrapper = document.getElementById('smooth-wrapper');
  const content = document.getElementById('smooth-content');

  if (wrapper && content && !smootherInstance) {
    smootherInstance = ScrollSmoother.create({
      wrapper: '#smooth-wrapper',
      content: '#smooth-content',
      smooth: 1.4,
      effects: true,
      smoothTouch: 0.1
    });
  }
}

// Preset data for quick testing scenarios
const presets = {
  rainy: {
    day: 210,
    pressure: 998.4,
    temparature: 22.0,
    maxtemp: 25.0,
    mintemp: 20.0,
    dewpoint: 21.5,
    humidity: 95.0,
    cloud: 90.0,
    sunshine: 0.5,
    winddirection: 210.0,
    windspeed: 28.5
  },
  dry: {
    day: 45,
    pressure: 1022.0,
    temparature: 28.5,
    maxtemp: 33.0,
    mintemp: 19.0,
    dewpoint: 12.0,
    humidity: 35.0,
    cloud: 10.0,
    sunshine: 10.5,
    winddirection: 90.0,
    windspeed: 8.0
  }
};

/**
 * Loads preset values into the input form fields
 * @param {string} type - 'rainy' or 'dry'
 */
function loadPreset(type) {
  const data = presets[type];
  if (!data) return;

  for (const [key, val] of Object.entries(data)) {
    const input = document.getElementById(`id_${key}`);
    if (input) {
      input.value = val;
      if (typeof gsap !== 'undefined') {
        gsap.fromTo(input, { backgroundColor: '#e0f2fe' }, { backgroundColor: '#f8fafc', duration: 0.8 });
      }
    }
  }
}

/**
 * Restores the Meteorological Form view focus
 */
function showForm() {
  const formCard = document.getElementById('form-card');
  const pageBody = document.getElementById('page-body');
  const heroBanner = document.getElementById('hero-banner');
  const bgGlow1 = document.getElementById('bg-glow-1');
  const bgGlow2 = document.getElementById('bg-glow-2');
  const dotPing = document.getElementById('output-dot-ping');
  const dotSolid = document.getElementById('output-dot-solid');

  if (dotPing) dotPing.className = 'absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75 transition-colors duration-500';
  if (dotSolid) dotSolid.className = 'relative inline-flex size-3 rounded-full bg-sky-500 transition-colors duration-500';

  // Reset page theme accent
  if (pageBody) {
    if (typeof gsap !== 'undefined') {
      gsap.to(pageBody, { backgroundColor: '#f8fafc', duration: 0.6 });
    } else {
      pageBody.style.backgroundColor = '#f8fafc';
    }
  }
  if (heroBanner) heroBanner.style.borderColor = '#e2e8f0';
  if (typeof gsap !== 'undefined') {
    if (bgGlow1) gsap.to(bgGlow1, { opacity: 0.6, duration: 0.8 });
    if (bgGlow2) gsap.to(bgGlow2, { opacity: 0.55, duration: 0.8 });
    if (formCard) {
      gsap.fromTo(formCard, 
        { scale: 0.98 }, 
        { scale: 1, duration: 0.4, ease: 'power2.out', clearProps: 'transform' }
      );
    }
  }
  if (smootherInstance) {
    smootherInstance.scrollTo(0, true);
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

/**
 * Updates the right-side Prediction Results panel and triggers GSAP entrance animations
 * @param {Object} result - Prediction result payload from backend
 */
function displayResult(result) {
  const placeholder = document.getElementById('results-placeholder');
  const resultsContent = document.getElementById('results-card-content');
  const resultsCard = document.getElementById('results-card');
  const verdictBanner = document.getElementById('verdict-banner');
  const verdictIcon = document.getElementById('verdict-icon');
  const verdictTitle = document.getElementById('verdict-title');
  const verdictSubtitle = document.getElementById('verdict-subtitle');
  const progressBar = document.getElementById('prob-progress-bar');
  const probText = document.getElementById('prob-percentage-text');
  const rainMetric = document.getElementById('metric-rain-prob');
  const noRainMetric = document.getElementById('metric-norain-prob');
  const pageBody = document.getElementById('page-body');
  const heroBanner = document.getElementById('hero-banner');
  const bgGlow1 = document.getElementById('bg-glow-1');
  const bgGlow2 = document.getElementById('bg-glow-2');
  const dotPing = document.getElementById('output-dot-ping');
  const dotSolid = document.getElementById('output-dot-solid');

  const rainProb = result.rain_probability;
  const willRain = result.will_rain;

  if (willRain) {
    // --- Rainy Atmosphere Theme ---
    if (dotPing) dotPing.className = 'absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75 transition-colors duration-500';
    if (dotSolid) dotSolid.className = 'relative inline-flex size-3 rounded-full bg-blue-600 transition-colors duration-500';
    if (verdictBanner) verdictBanner.className = 'p-5 rounded-2xl text-center border badge-rain shadow-sm';
    if (verdictIcon) verdictIcon.innerText = '🌧️';
    if (verdictTitle) {
      verdictTitle.innerText = 'Rainfall Expected';
      verdictTitle.className = 'font-outfit text-2xl font-extrabold mb-1 text-blue-900';
    }
    if (verdictSubtitle) {
      verdictSubtitle.innerText = `High confidence prediction (${rainProb}% likelihood of rain)`;
      verdictSubtitle.className = 'text-xs font-semibold text-blue-700';
    }

    if (progressBar) progressBar.className = 'bg-gradient-to-r from-sky-500 to-blue-600 h-full rounded-full transition-all duration-700';

    if (pageBody) {
      if (typeof gsap !== 'undefined') {
        gsap.to(pageBody, { backgroundColor: '#f0f9ff', duration: 0.8 });
      } else {
        pageBody.style.backgroundColor = '#f0f9ff';
      }
    }
    if (heroBanner) heroBanner.style.borderColor = '#bfdbfe';
    if (typeof gsap !== 'undefined') {
      if (bgGlow1) gsap.to(bgGlow1, { opacity: 0.75, duration: 0.8 });
      if (bgGlow2) gsap.to(bgGlow2, { opacity: 0.7, duration: 0.8 });
    }

  } else {
    // --- Sunny / Dry Atmosphere Theme ---
    if (dotPing) dotPing.className = 'absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75 transition-colors duration-500';
    if (dotSolid) dotSolid.className = 'relative inline-flex size-3 rounded-full bg-amber-500 transition-colors duration-500';
    if (verdictBanner) verdictBanner.className = 'p-5 rounded-2xl text-center border badge-norain shadow-sm';
    if (verdictIcon) verdictIcon.innerText = '☀️';
    if (verdictTitle) {
      verdictTitle.innerText = 'No Rain Expected';
      verdictTitle.className = 'font-outfit text-2xl font-extrabold mb-1 text-amber-900';
    }
    if (verdictSubtitle) {
      verdictSubtitle.innerText = `Clear weather likely (${result.no_rain_probability}% chance of dry weather)`;
      verdictSubtitle.className = 'text-xs font-semibold text-amber-700';
    }

    if (progressBar) progressBar.className = 'bg-gradient-to-r from-amber-400 to-emerald-500 h-full rounded-full transition-all duration-700';

    if (pageBody) {
      if (typeof gsap !== 'undefined') {
        gsap.to(pageBody, { backgroundColor: '#fffbeb', duration: 0.8 });
      } else {
        pageBody.style.backgroundColor = '#fffbeb';
      }
    }
    if (heroBanner) heroBanner.style.borderColor = '#fde68a';
    if (typeof gsap !== 'undefined') {
      if (bgGlow1) gsap.to(bgGlow1, { opacity: 0.7, duration: 0.8 });
      if (bgGlow2) gsap.to(bgGlow2, { opacity: 0.65, duration: 0.8 });
    }
  }

  if (probText) probText.innerText = `${rainProb}%`;
  if (rainMetric) rainMetric.innerText = `${rainProb}%`;
  if (noRainMetric) noRainMetric.innerText = `${result.no_rain_probability}%`;

  const modelBadge = document.getElementById('model-badge');
  if (modelBadge && result.model_display_name) {
    modelBadge.innerText = result.model_display_name;
    if (result.model_used === 'neural_network') {
      modelBadge.className = 'text-[11px] font-semibold text-indigo-700 bg-indigo-50 border-indigo-200 px-2.5 py-0.5 rounded-full border uppercase tracking-wider transition-colors';
    } else {
      modelBadge.className = 'text-[11px] font-semibold text-emerald-700 bg-emerald-50 border-emerald-200 px-2.5 py-0.5 rounded-full border uppercase tracking-wider transition-colors';
    }
  }

  // Hide placeholder and reveal result panel on right side
  if (placeholder) placeholder.classList.add('hidden');
  if (resultsContent) resultsContent.classList.remove('hidden');

  // GSAP Right Side Results Entrance Animation
  if (typeof gsap !== 'undefined' && resultsCard) {
    gsap.fromTo(resultsCard, 
      { opacity: 0, y: 25, scale: 0.95 }, 
      { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'back.out(1.4)', clearProps: 'transform,opacity' }
    );

    if (progressBar) {
      gsap.fromTo(progressBar, 
        { width: '0%' }, 
        { width: `${rainProb}%`, duration: 0.85, ease: 'power2.out' }
      );
    }
  } else if (progressBar) {
    progressBar.style.width = `${rainProb}%`;
  }

  // Trigger GSAP Pill Toast Notification (Bottom Right)
  if (typeof window.showToastNotification === 'function') {
    window.showToastNotification(
      'Prediction Complete',
      result.will_rain ? `Rainfall Expected (${result.rain_probability}%)` : `No Rain Expected (${result.no_rain_probability}%)`,
      result.will_rain ? '🌧️' : '☀️',
      result.will_rain ? 'rain' : 'norain'
    );
  }
}

/**
 * Updates UI styling when user switches between XGBoost and Neural Network models
 * @param {string} selected - 'xgboost' or 'neural_network'
 */
function updateModelSelection(selected) {
  const labelXgb = document.getElementById('label-model-xgboost');
  const labelNn = document.getElementById('label-model-nn');

  if (selected === 'neural_network') {
    if (labelNn) labelNn.className = 'relative flex flex-col p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 border-sky-500 bg-white shadow-xs';
    if (labelXgb) labelXgb.className = 'relative flex flex-col p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 border-slate-200 bg-slate-100/60 hover:bg-white';
  } else {
    if (labelXgb) labelXgb.className = 'relative flex flex-col p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 border-sky-500 bg-white shadow-xs';
    if (labelNn) labelNn.className = 'relative flex flex-col p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 border-slate-200 bg-slate-100/60 hover:bg-white';
  }
}

/**
 * Initializes continuous GSAP floating animations for dynamic ambient background highlights
 * Colors: #7b7fec, #731ae8, #2f5cff
 */
function initAmbientBackground() {
  if (typeof gsap === 'undefined') return;

  const glow1 = document.getElementById('bg-glow-1');
  const glow2 = document.getElementById('bg-glow-2');
  const glow3 = document.getElementById('bg-glow-3');

  if (glow1) {
    gsap.to(glow1, {
      x: '35vw',
      y: '28vh',
      scale: 1.25,
      duration: 14,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }

  if (glow2) {
    gsap.to(glow2, {
      x: '-30vw',
      y: '-22vh',
      scale: 1.35,
      duration: 17,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: 1
    });
  }

  if (glow3) {
    gsap.to(glow3, {
      x: '25vw',
      y: '-32vh',
      scale: 1.2,
      duration: 15,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: 2
    });
  }
}

/**
 * GSAP 3D Rolling Text Animation for the main title "Rainfall Prediction Tool"
 */
function initRollingTitleAnimation() {
  if (typeof gsap === 'undefined') return;

  const chars = document.querySelectorAll('.roll-char');
  const title = document.getElementById('rolling-title');

  if (chars.length > 0) {
    if (title) {
      gsap.set(title, { perspective: 400 });
    }

    // Entrance 3D Slot-Machine character roll
    gsap.fromTo(chars,
      { yPercent: 120, rotationX: -90, opacity: 0 },
      {
        yPercent: 0,
        rotationX: 0,
        opacity: 1,
        duration: 0.85,
        stagger: 0.035,
        ease: 'back.out(1.6)',
        clearProps: 'transform,opacity'
      }
    );

    // Interactive Hover Re-roll animation
    if (title) {
      let isHovering = false;
      title.addEventListener('mouseenter', () => {
        if (isHovering) return;
        isHovering = true;
        gsap.fromTo(chars,
          { yPercent: -100, rotationX: 90, opacity: 0 },
          {
            yPercent: 0,
            rotationX: 0,
            opacity: 1,
            duration: 0.55,
            stagger: 0.025,
            ease: 'power2.out',
            onComplete: () => { isHovering = false; }
          }
        );
      });
    }
  }
}

/**
 * GSAP Weather Icon Slider: Cycles smoothly through the 4 weather icons one by one
 * (cloud-sun-rain, cloud-sun, cloud-rain-wind, cloud-moon-rain)
 */
function initWeatherIconSlider() {
  if (typeof gsap === 'undefined') return;

  const slides = document.querySelectorAll('.hero-icon-slide');
  const bgSlides = document.querySelectorAll('.hero-bg-icon-slide');

  if (slides.length < 2) return;

  // Set initial state: first slide visible, others hidden and scaled down
  gsap.set(slides, { opacity: 0, scale: 0.4, rotation: -20 });
  gsap.set(slides[0], { opacity: 1, scale: 1, rotation: 0 });

  if (bgSlides.length > 0) {
    gsap.set(bgSlides, { opacity: 0, scale: 0.7 });
    gsap.set(bgSlides[0], { opacity: 1, scale: 1 });
  }

  let currentIndex = 0;

  function cycleNextIcon() {
    const nextIndex = (currentIndex + 1) % slides.length;
    const currentSlide = slides[currentIndex];
    const nextSlide = slides[nextIndex];

    const currentBg = bgSlides[currentIndex];
    const nextBg = bgSlides[nextIndex];

    const tl = gsap.timeline({
      onComplete: () => {
        currentIndex = nextIndex;
        gsap.delayedCall(2.6, cycleNextIcon);
      }
    });

    // Cross-fade badge icon with 3D scale and rotation
    tl.to(currentSlide, {
      opacity: 0,
      scale: 0.4,
      rotation: 20,
      duration: 0.45,
      ease: 'back.in(1.4)'
    }, 0);

    tl.fromTo(nextSlide,
      { opacity: 0, scale: 1.4, rotation: -25 },
      { opacity: 1, scale: 1, rotation: 0, duration: 0.55, ease: 'back.out(1.5)' },
      0.25
    );

    // Synchronized background watermark icon transition
    if (currentBg && nextBg) {
      tl.to(currentBg, { opacity: 0, scale: 0.7, duration: 0.45 }, 0);
      tl.fromTo(nextBg, { opacity: 0, scale: 1.2 }, { opacity: 1, scale: 1, duration: 0.55 }, 0.2);
    }
  }

  gsap.delayedCall(2.6, cycleNextIcon);
}

// --- Transitions.dev Model Selector Dropdown Handler ---
function initModelDropdown() {
  const modelBtn = document.getElementById('model-dropdown-btn');
  const dropdownMenu = document.getElementById('model-t-dropdown');
  if (!modelBtn || !dropdownMenu) return;

  let closeTimer = null;

  function openDropdown() {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    dropdownMenu.classList.remove('is-closing');
    dropdownMenu.classList.add('is-open');
  }

  function closeDropdown() {
    if (!dropdownMenu.classList.contains('is-open')) return;
    dropdownMenu.classList.remove('is-open');
    dropdownMenu.classList.add('is-closing');

    closeTimer = setTimeout(() => {
      dropdownMenu.classList.remove('is-closing');
      closeTimer = null;
    }, 150); // Matches --dropdown-close-dur (150ms)
  }

  function toggleDropdown() {
    if (dropdownMenu.classList.contains('is-open')) {
      closeDropdown();
    } else {
      openDropdown();
    }
  }

  modelBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown();
  });

  document.addEventListener('click', (e) => {
    if (!dropdownMenu.contains(e.target) && !modelBtn.contains(e.target)) {
      closeDropdown();
    }
  });

  window.selectModelOption = function(modelKey) {
    const hiddenInput = document.getElementById('id_model_choice');
    const navText = document.getElementById('nav-selected-model-text');
    const checkXgb = document.getElementById('check-xgboost');
    const checkNn = document.getElementById('check-neural_network');
    const modelBtn = document.getElementById('model-dropdown-btn');
    const pingRing = document.getElementById('model-ping-ring');
    const pingDot = document.getElementById('model-ping-dot');

    if (hiddenInput) {
      hiddenInput.value = modelKey;
    }

    if (navText) {
      const brainImg = window.STATIC_IMAGES?.brain || '';
      const hvImg = window.STATIC_IMAGES?.highVoltage || '';
      if (modelKey === 'neural_network') {
        navText.innerHTML = `<img src="${brainImg}" alt="Neural Network" class="w-5 h-5 mr-1 inline-block object-contain"><span>Neural Network</span>`;
      } else {
        navText.innerHTML = `<img src="${hvImg}" alt="XGBoost" class="w-5 h-5 mr-1 inline-block object-contain"><span>XGBoost ML</span>`;
      }
    }

    const modelBadge = document.getElementById('model-badge');
    if (modelBadge) {
      if (modelKey === 'neural_network') {
        modelBadge.innerText = 'Neural Network (Keras DL)';
        modelBadge.className = 'text-[11px] font-semibold text-indigo-700 bg-indigo-50 border-indigo-200 px-2.5 py-0.5 rounded-full border uppercase tracking-wider transition-colors';
      } else {
        modelBadge.innerText = 'XGBoost ML Model';
        modelBadge.className = 'text-[11px] font-semibold text-emerald-700 bg-emerald-50 border-emerald-200 px-2.5 py-0.5 rounded-full border uppercase tracking-wider transition-colors';
      }
    }

    if (checkXgb && checkNn) {
      if (modelKey === 'neural_network') {
        checkXgb.classList.add('hidden');
        checkNn.classList.remove('hidden');
      } else {
        checkXgb.classList.remove('hidden');
        checkNn.classList.add('hidden');
      }
    }

    // Dynamic border, background, and ping ring/dot color switching
    if (modelBtn) {
      if (modelKey === 'neural_network') {
        modelBtn.className = 'inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer shadow-2xs bg-indigo-50/90 text-indigo-900 border border-indigo-300 hover:bg-indigo-100/90';
      } else {
        modelBtn.className = 'inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer shadow-2xs bg-emerald-50/90 text-emerald-900 border border-emerald-300 hover:bg-emerald-100/90';
      }
    }

    if (pingRing && pingDot) {
      if (modelKey === 'neural_network') {
        pingRing.className = 'absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75';
        pingDot.className = 'relative inline-flex size-3 rounded-full bg-indigo-500';
      } else {
        pingRing.className = 'absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75';
        pingDot.className = 'relative inline-flex size-3 rounded-full bg-green-500';
      }
    }

    // Trigger Pill Toast Notification (Bottom Right)
    if (typeof window.showToastNotification === 'function') {
      if (modelKey === 'neural_network') {
        window.showToastNotification('Model Switched', 'Neural Network (Keras DL) model active', 'brain', 'nn');
      } else {
        window.showToastNotification('Model Switched', 'XGBoost ML model active', 'highVoltage', 'info');
      }
    }

    closeDropdown();
  };
}

// --- Fixed GSAP Pill Toast Notification Functions (Bottom Right) ---
let toastTimeout = null;

window.showToastNotification = function(title, desc, icon = 'highVoltage', type = 'info') {
  const toastPill = document.getElementById('toast-pill');
  const toastTitle = document.getElementById('toast-title');
  const toastDesc = document.getElementById('toast-desc');
  const toastIcon = document.getElementById('toast-icon');
  const toastIconBg = document.getElementById('toast-icon-bg');

  if (!toastPill || !toastTitle || !toastDesc) return;

  if (toastTimeout) {
    clearTimeout(toastTimeout);
    toastTimeout = null;
  }

  toastTitle.innerText = title;
  toastDesc.innerText = desc;

  const brainImg = window.STATIC_IMAGES?.brain || '';
  const hvImg = window.STATIC_IMAGES?.highVoltage || '';

  if (toastIcon) {
    if (type === 'nn' || icon === 'brain') {
      toastIcon.innerHTML = `<img src="${brainImg}" alt="Neural Network" class="w-5 h-5 object-contain">`;
    } else if (type === 'info' || type === 'xgboost' || icon === 'highVoltage') {
      toastIcon.innerHTML = `<img src="${hvImg}" alt="XGBoost" class="w-5 h-5 object-contain">`;
    } else {
      toastIcon.innerHTML = `<span class="text-sm">${icon}</span>`;
    }
  }

  if (toastIconBg) {
    if (type === 'rain') {
      toastIconBg.className = 'w-8 h-8 rounded-full bg-sky-500/20 border border-sky-400/40 flex items-center justify-center shrink-0';
    } else if (type === 'norain') {
      toastIconBg.className = 'w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0';
    } else if (type === 'nn') {
      toastIconBg.className = 'w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center shrink-0';
    } else {
      toastIconBg.className = 'w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0';
    }
  }

  toastPill.classList.remove('hidden');

  if (typeof gsap !== 'undefined') {
    gsap.killTweensOf(toastPill);
    gsap.fromTo(toastPill,
      { y: 50, opacity: 0, scale: 0.88 },
      { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.7)' }
    );
  }

  toastTimeout = setTimeout(() => {
    window.hideToastNotification();
  }, 4200);
};

window.hideToastNotification = function() {
  const toastPill = document.getElementById('toast-pill');
  if (!toastPill || toastPill.classList.contains('hidden')) return;

  if (typeof gsap !== 'undefined') {
    gsap.to(toastPill, {
      y: 35,
      opacity: 0,
      scale: 0.9,
      duration: 0.35,
      ease: 'power2.in',
      onComplete: () => {
        toastPill.classList.add('hidden');
      }
    });
  } else {
    toastPill.classList.add('hidden');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // Initialize GSAP ScrollSmoother, Ambient Background, Rolling Title, Weather Slider & Model Dropdown
  initScrollSmoother();
  initAmbientBackground();
  initRollingTitleAnimation();
  initWeatherIconSlider();
  initModelDropdown();

  // GSAP Initial Entrance Animations with clearProps to prevent residual style locks
  if (typeof gsap !== 'undefined') {
    const heroBannerEl = document.getElementById('hero-banner');
    const formCardEl = document.getElementById('form-card');
    
    if (heroBannerEl) {
      gsap.from(heroBannerEl, { duration: 0.7, y: -20, opacity: 0, ease: 'power2.out', clearProps: 'transform,opacity' });
    }
    if (formCardEl) {
      gsap.from(formCardEl, { duration: 0.7, y: 25, opacity: 0, delay: 0.15, ease: 'power2.out', clearProps: 'transform,opacity' });
    }
  }

  // --- Notification Bell & Badge GSAP Animations ---
  const notifBtn = document.getElementById('notification-btn');
  const bellIcon = document.getElementById('bell-icon');
  const notifBadge = document.getElementById('notif-badge');
  const notifDropdown = document.getElementById('notif-dropdown');

  if (notifBtn && bellIcon) {
    let bellTimeline = null;
    
    notifBtn.addEventListener('mouseenter', () => {
      if (typeof gsap !== 'undefined') {
        if (bellTimeline) bellTimeline.kill();
        
        bellTimeline = gsap.timeline();
        bellTimeline
          .to(bellIcon, { rotation: -16, duration: 0.08, transformOrigin: 'top center', ease: 'power1.out' })
          .to(bellIcon, { rotation: 16, duration: 0.1, ease: 'power1.inOut' })
          .to(bellIcon, { rotation: -10, duration: 0.1, ease: 'power1.inOut' })
          .to(bellIcon, { rotation: 10, duration: 0.1, ease: 'power1.inOut' })
          .to(bellIcon, { rotation: -4, duration: 0.08, ease: 'power1.inOut' })
          .to(bellIcon, { rotation: 0, duration: 0.08, ease: 'power1.out' });

        const dot = notifBadge?.querySelector('.t-badge-dot');
        if (dot) {
          gsap.fromTo(dot, { scale: 1.25 }, { scale: 1, duration: 0.4, ease: 'back.out(2)' });
        }
      }
    });

    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = notifDropdown.classList.contains('hidden');

      if (isHidden) {
        notifDropdown.classList.remove('hidden');
        if (typeof gsap !== 'undefined') {
          gsap.fromTo(notifDropdown, 
            { opacity: 0, scale: 0.85, y: -10 }, 
            { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: 'back.out(1.7)' }
          );
        }
      } else {
        notifDropdown.classList.add('hidden');
      }
    });

    document.addEventListener('click', (e) => {
      if (notifDropdown && !notifDropdown.contains(e.target) && !notifBtn.contains(e.target)) {
        notifDropdown.classList.add('hidden');
      }
    });
  }

  // Handle AJAX Form Submission
  const form = document.getElementById('prediction-form');
  const submitBtn = document.getElementById('submit-btn');
  const btnText = document.getElementById('btn-text');
  const btnSpinner = document.getElementById('btn-spinner');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // UI Loading state
      btnText.innerText = 'Calculating...';
      btnSpinner.classList.remove('hidden');
      submitBtn.disabled = true;

      const formData = new FormData(form);

      try {
        const response = await fetch('.', {
          method: 'POST',
          body: formData,
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        });

        const data = await response.json();

        if (data.success && data.result) {
          displayResult(data.result);
        } else {
          alert('Error processing prediction: ' + (data.error || 'Unknown error'));
        }

      } catch (err) {
        alert('Network error while requesting prediction.');
        console.error(err);
      } finally {
        btnText.innerText = 'Predict Rainfall';
        btnSpinner.classList.add('hidden');
        submitBtn.disabled = false;
      }
    });
  }
});
