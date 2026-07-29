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

  const isDark = document.documentElement.classList.contains('dark');
  const flashColor = isDark ? '#0284c7' : '#38bdf8';

  for (const [key, val] of Object.entries(data)) {
    const input = document.getElementById(`id_${key}`);
    if (input) {
      input.value = val;
      if (typeof gsap !== 'undefined') {
        gsap.killTweensOf(input);
        gsap.fromTo(input,
          { backgroundColor: flashColor },
          { duration: 0.8, clearProps: "backgroundColor" }
        );
      }
    }
  }
}

/**
 * Updates the Theme Toggle Button UI (icon and label text)
 */
function updateThemeUI(theme) {
  const isDark = theme === 'dark';
  const sunIcon = document.getElementById('theme-sun-icon');
  const moonIcon = document.getElementById('theme-moon-icon');
  const toggleText = document.getElementById('theme-toggle-text');

  if (sunIcon && moonIcon) {
    if (isDark) {
      sunIcon.classList.remove('hidden');
      moonIcon.classList.add('hidden');
      if (typeof gsap !== 'undefined') {
        gsap.fromTo(sunIcon, { rotation: -90, scale: 0.5 }, { rotation: 0, scale: 1, duration: 0.35, ease: 'back.out(1.8)' });
      }
    } else {
      moonIcon.classList.remove('hidden');
      sunIcon.classList.add('hidden');
      if (typeof gsap !== 'undefined') {
        gsap.fromTo(moonIcon, { rotation: 90, scale: 0.5 }, { rotation: 0, scale: 1, duration: 0.35, ease: 'back.out(1.8)' });
      }
    }
  }

  if (toggleText) {
    toggleText.innerText = isDark ? 'Light' : 'Dark';
  }
}

/**
 * Toggles between Light and Dark mode
 */
function toggleTheme() {
  const currentTheme = localStorage.getItem('theme') || (document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme, true);
}

/**
 * Sets the active theme ('light' or 'dark')
 * @param {string} theme - 'light' or 'dark'
 * @param {boolean} triggerToast - whether to trigger toast notification
 */
function setTheme(theme, triggerToast = false) {
  const pageBody = document.getElementById('page-body');

  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }

  // Update Button Icon & Text
  updateThemeUI(theme);

  // Clear any residual inline styles on custom inputs so CSS dark mode rules apply cleanly
  document.querySelectorAll('.custom-input').forEach(input => {
    if (typeof gsap !== 'undefined') {
      gsap.killTweensOf(input);
    }
    input.style.removeProperty('background-color');
    input.style.removeProperty('color');
  });

  // Re-render chart to match new light/dark theme grid & text colors
  if (typeof meteorologyChart !== 'undefined' && meteorologyChart) {
    setTimeout(() => {
      meteorologyChart.destroy();
      initAreaChart();
    }, 80);
  }

  // Update background color inline if GSAP previously set inline style
  if (pageBody) {
    const isDark = theme === 'dark';
    const targetBg = isDark ? '#0b0f19' : '#f8fafc';
    if (typeof gsap !== 'undefined') {
      gsap.to(pageBody, { backgroundColor: targetBg, duration: 0.5 });
    } else {
      pageBody.style.backgroundColor = targetBg;
    }
  }

  // Update ambient glow gradient colors for bg-glow-1, bg-glow-2, bg-glow-3
  if (lastPredictionResult) {
    updateAmbientGlowColors(lastPredictionResult.will_rain, theme === 'dark');
  }

  if (triggerToast && typeof window.showToastNotification === 'function') {
    window.showToastNotification(
      theme === 'dark' ? 'Dark Mode Activated' : 'Light Mode Activated',
      theme === 'dark' ? 'Switched to elegant dark theme' : 'Switched to crisp light theme',
      theme === 'dark' ? '🌙' : '☀️',
      theme === 'dark' ? 'rain' : 'norain'
    );
  }
}

let lastPredictionResult = null;

/**
 * Dynamically morphs ambient background radial glow colors (bg-glow-1, bg-glow-2, bg-glow-3)
 * based on prediction outcome (willRain) and theme (isDark) using GSAP.
 */
function updateAmbientGlowColors(willRain, isDark) {
  const glow1 = document.getElementById('bg-glow-1');
  const glow2 = document.getElementById('bg-glow-2');
  const glow3 = document.getElementById('bg-glow-3');

  if (!glow1 && !glow2 && !glow3) return;

  let color1, color2, color3;
  let op1, op2, op3;

  if (willRain) {
    // Rainy Atmosphere: Ocean Sapphire, Electric Indigo, Atmospheric Teal
    color1 = isDark ? '#38bdf8' : '#0284c7';
    color2 = isDark ? '#6366f1' : '#2563eb';
    color3 = isDark ? '#2dd4bf' : '#0d9488';
    op1 = isDark ? 0.55 : 0.70;
    op2 = isDark ? 0.50 : 0.65;
    op3 = isDark ? 0.45 : 0.60;
  } else {
    // Dry / Sunny Atmosphere: Golden Amber, Sunburst Orange, Emerald Meadow
    color1 = isDark ? '#fbbf24' : '#f59e0b';
    color2 = isDark ? '#fb923c' : '#ea580c';
    color3 = isDark ? '#34d399' : '#10b981';
    op1 = isDark ? 0.50 : 0.65;
    op2 = isDark ? 0.45 : 0.60;
    op3 = isDark ? 0.40 : 0.55;
  }

  if (typeof gsap !== 'undefined') {
    if (glow1) {
      gsap.to(glow1, {
        background: `radial-gradient(circle, ${color1} 0%, rgba(0, 0, 0, 0) 70%)`,
        opacity: op1,
        duration: 1.2,
        ease: 'power2.out'
      });
    }
    if (glow2) {
      gsap.to(glow2, {
        background: `radial-gradient(circle, ${color2} 0%, rgba(0, 0, 0, 0) 70%)`,
        opacity: op2,
        duration: 1.2,
        ease: 'power2.out'
      });
    }
    if (glow3) {
      gsap.to(glow3, {
        background: `radial-gradient(circle, ${color3} 0%, rgba(0, 0, 0, 0) 70%)`,
        opacity: op3,
        duration: 1.2,
        ease: 'power2.out'
      });
    }
  } else {
    if (glow1) {
      glow1.style.background = `radial-gradient(circle, ${color1} 0%, rgba(0, 0, 0, 0) 70%)`;
      glow1.style.opacity = op1;
    }
    if (glow2) {
      glow2.style.background = `radial-gradient(circle, ${color2} 0%, rgba(0, 0, 0, 0) 70%)`;
      glow2.style.opacity = op2;
    }
    if (glow3) {
      glow3.style.background = `radial-gradient(circle, ${color3} 0%, rgba(0, 0, 0, 0) 70%)`;
      glow3.style.opacity = op3;
    }
  }
}

window.toggleTheme = toggleTheme;
window.setTheme = setTheme;
window.updateThemeUI = updateThemeUI;

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
    const isDark = document.documentElement.classList.contains('dark');
    const targetBg = isDark ? '#0b0f19' : '#f8fafc';
    if (typeof gsap !== 'undefined') {
      gsap.to(pageBody, { backgroundColor: targetBg, duration: 0.6 });
    } else {
      pageBody.style.backgroundColor = targetBg;
    }
  }
  if (heroBanner) heroBanner.style.borderColor = '';
  if (typeof gsap !== 'undefined') {
    if (bgGlow1) gsap.to(bgGlow1, { opacity: document.documentElement.classList.contains('dark') ? 0.4 : 0.6, duration: 0.8 });
    if (bgGlow2) gsap.to(bgGlow2, { opacity: document.documentElement.classList.contains('dark') ? 0.35 : 0.55, duration: 0.8 });
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
  const isDark = document.documentElement.classList.contains('dark');

  // Cache prediction result and morph ambient glow colors (bg-glow-1, bg-glow-2, bg-glow-3)
  lastPredictionResult = result;
  updateAmbientGlowColors(willRain, isDark);

  const heroImg = document.getElementById('verdict-hero-img');
  const bgText = document.getElementById('verdict-bg-text');
  const pillBadge = document.getElementById('verdict-pill-badge');
  const staticImgPrefix = '/static/images/';

  if (willRain) {
    // --- Rainy Atmosphere Theme ---
    if (dotPing) dotPing.className = 'absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75 transition-colors duration-500';
    if (dotSolid) dotSolid.className = 'relative inline-flex size-3 rounded-full bg-blue-600 transition-colors duration-500';
    if (verdictBanner) verdictBanner.className = 'relative p-6 rounded-3xl text-center border transition-all duration-500 overflow-hidden shadow-lg badge-rain';
    
    if (heroImg) {
      heroImg.src = `${staticImgPrefix}Cloud With Rain.webp`;
      heroImg.alt = 'Rainfall Expected';
    }
    if (bgText) {
      bgText.innerText = 'PRECIPITATION';
      bgText.className = 'absolute inset-0 flex items-center justify-center font-outfit font-black text-6xl md:text-7xl uppercase tracking-tighter opacity-15 dark:opacity-20 pointer-events-none select-none transition-colors duration-500 text-blue-900 dark:text-blue-300';
    }
    if (pillBadge) {
      pillBadge.innerText = '🌧️ Rain Forecast';
      pillBadge.className = 'text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border shadow-2xs transition-colors bg-blue-500/10 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700';
    }
    if (verdictTitle) {
      verdictTitle.innerText = 'Rainfall Expected';
      verdictTitle.className = 'font-outfit text-2xl md:text-3xl font-black tracking-tight text-blue-950 dark:text-blue-100';
    }
    if (verdictSubtitle) {
      verdictSubtitle.innerText = `High confidence prediction (${rainProb}% likelihood of rain)`;
      verdictSubtitle.className = 'text-xs font-semibold max-w-xs mx-auto leading-relaxed text-blue-700 dark:text-blue-300';
    }

    if (pageBody) {
      const rainyBg = isDark ? '#091b34' : '#f0f9ff';
      if (typeof gsap !== 'undefined') {
        gsap.to(pageBody, { backgroundColor: rainyBg, duration: 0.8 });
      } else {
        pageBody.style.backgroundColor = rainyBg;
      }
    }
    if (heroBanner) heroBanner.style.borderColor = '';

  } else {
    // --- Sunny / Dry Atmosphere Theme ---
    if (dotPing) dotPing.className = 'absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75 transition-colors duration-500';
    if (dotSolid) dotSolid.className = 'relative inline-flex size-3 rounded-full bg-amber-500 transition-colors duration-500';
    if (verdictBanner) verdictBanner.className = 'relative p-6 rounded-3xl text-center border transition-all duration-500 overflow-hidden shadow-lg badge-norain';
    
    if (heroImg) {
      heroImg.src = `${staticImgPrefix}Sun Behind Small Cloud.webp`;
      heroImg.alt = 'No Rain Expected';
    }
    if (bgText) {
      bgText.innerText = 'CLEAR SKIES';
      bgText.className = 'absolute inset-0 flex items-center justify-center font-outfit font-black text-6xl md:text-7xl uppercase tracking-tighter opacity-15 dark:opacity-20 pointer-events-none select-none transition-colors duration-500 text-amber-900 dark:text-amber-300';
    }
    if (pillBadge) {
      pillBadge.innerText = '☀️ Dry Forecast';
      pillBadge.className = 'text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border shadow-2xs transition-colors bg-amber-500/10 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700';
    }
    if (verdictTitle) {
      verdictTitle.innerText = 'No Rain Expected';
      verdictTitle.className = 'font-outfit text-2xl md:text-3xl font-black tracking-tight text-amber-950 dark:text-amber-100';
    }
    if (verdictSubtitle) {
      verdictSubtitle.innerText = `Clear weather likely (${result.no_rain_probability}% chance of dry weather)`;
      verdictSubtitle.className = 'text-xs font-semibold max-w-xs mx-auto leading-relaxed text-amber-800 dark:text-amber-300';
    }

    if (pageBody) {
      const dryBg = isDark ? '#1c1917' : '#fffbeb';
      if (typeof gsap !== 'undefined') {
        gsap.to(pageBody, { backgroundColor: dryBg, duration: 0.8 });
      } else {
        pageBody.style.backgroundColor = dryBg;
      }
    }
    if (heroBanner) heroBanner.style.borderColor = '';
  }

  // GSAP 3D Floating Levitation & Scale Pop Animation for Weather Image
  if (typeof gsap !== 'undefined' && heroImg) {
    gsap.killTweensOf(heroImg);
    gsap.fromTo(heroImg,
      { scale: 0.55, rotation: -10, opacity: 0 },
      { 
        scale: 1, 
        rotation: 0, 
        opacity: 1, 
        duration: 0.75, 
        ease: 'back.out(1.8)',
        onComplete: () => {
          gsap.to(heroImg, {
            y: -7,
            rotation: 2,
            duration: 2.2,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
          });
        }
      }
    );
  }

  if (rainMetric) rainMetric.innerText = `${rainProb}%`;
  if (noRainMetric) noRainMetric.innerText = `${result.no_rain_probability}%`;

  // --- Probability Status Badge & Tip Dot elements ---
  const probBadge = document.getElementById('prob-status-badge');
  const tipDot = document.getElementById('progress-tip-dot');

  if (probBadge) {
    if (result.will_rain) {
      probBadge.innerText = 'High Likelihood';
      probBadge.className = 'text-[10px] px-2 py-0.5 rounded-full font-bold uppercase transition-colors text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800';
    } else {
      probBadge.innerText = 'Low Likelihood';
      probBadge.className = 'text-[10px] px-2 py-0.5 rounded-full font-bold uppercase transition-colors text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800';
    }
  }

  // --- GSAP Animated Number Counter for Percentage ---
  if (probText) {
    const currentVal = parseFloat(probText.innerText) || 0;
    const counterObj = { val: currentVal };

    if (typeof gsap !== 'undefined') {
      gsap.to(counterObj, {
        val: rainProb,
        duration: 1.0,
        ease: 'power2.out',
        onUpdate: () => {
          probText.innerText = `${counterObj.val.toFixed(1)}%`;
        }
      });
    } else {
      probText.innerText = `${rainProb}%`;
    }
  }

  const modelBadge = document.getElementById('model-badge');
  if (modelBadge && result.model_display_name) {
    modelBadge.innerText = result.model_display_name;
    if (result.model_used === 'neural_network') {
      modelBadge.className = 'text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 border-indigo-200 dark:border-indigo-800 px-2.5 py-0.5 rounded-full border uppercase tracking-wider transition-colors';
    } else {
      modelBadge.className = 'text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full border uppercase tracking-wider transition-colors';
    }
  }

  // Hide placeholder and reveal result panel on right side
  if (placeholder) placeholder.classList.add('hidden');
  if (resultsContent) resultsContent.classList.remove('hidden');

  // GSAP Right Side Results Entrance & Progress Bar Elastic Animation
  if (typeof gsap !== 'undefined' && resultsCard) {
    gsap.fromTo(resultsCard, 
      { opacity: 0, y: 25, scale: 0.95 }, 
      { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'back.out(1.4)', clearProps: 'transform,opacity' }
    );

    if (progressBar) {
      const isRain = result.will_rain;
      progressBar.className = isRain 
        ? 'bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 h-full rounded-full transition-colors duration-500 relative flex items-center justify-end pr-0.5 shadow-xs'
        : 'bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-500 h-full rounded-full transition-colors duration-500 relative flex items-center justify-end pr-0.5 shadow-xs';

      gsap.fromTo(progressBar, 
        { width: '0%' }, 
        { 
          width: `${rainProb}%`, 
          duration: 1.05, 
          ease: 'back.out(1.2)',
          onComplete: () => {
            if (tipDot) {
              gsap.fromTo(tipDot, 
                { scale: 1.5, opacity: 1 }, 
                { scale: 1, opacity: 0.9, duration: 0.35, ease: 'power2.out' }
              );
            }
          }
        }
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

  // Update Shadcn Area Chart with real-time prediction data point
  updateChartFromPrediction(result);
}

// --- Shadcn Style Interactive Area Chart Logic ---
let meteorologyChart = null;
let dbPredictionsList = [];

const chartDataPresets = {
  'db': {
    labels: ['Loading...'],
    rainProb: [0],
    humidity: [0],
    cloud: [0],
    total: '0 Records',
    avgRain: '0%',
    avgHumidity: '0%',
    latest: 'None'
  },
  '24h': {
    labels: ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'],
    rainProb: [15, 20, 35, 65, 82, 88, 75, 40],
    humidity: [68, 72, 78, 85, 80, 84, 79, 70],
    cloud: [25, 30, 45, 70, 85, 90, 80, 50],
    total: '24H Sample',
    avgRain: '62.5%',
    avgHumidity: '77.0%',
    latest: '15:00 (88% Rain)'
  },
  '7d': {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    rainProb: [25, 85, 90, 40, 15, 60, 75],
    humidity: [55, 88, 92, 65, 48, 74, 80],
    cloud: [35, 90, 95, 50, 20, 68, 78],
    total: '7D Sample',
    avgRain: '55.7%',
    avgHumidity: '71.7%',
    latest: 'Wed (90% Rain)'
  },
  '30d': {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    rainProb: [42, 78, 65, 28],
    humidity: [62, 84, 76, 52],
    cloud: [48, 82, 70, 38],
    total: '30D Sample',
    avgRain: '53.2%',
    avgHumidity: '68.5%',
    latest: 'Week 2 (78% Rain)'
  }
};

let currentHorizon = 'db';

function updateDbChartPreset(predictions) {
  if (!predictions || predictions.length === 0) {
    chartDataPresets['db'] = {
      labels: ['No DB Records Yet'],
      rainProb: [0],
      humidity: [0],
      cloud: [0],
      total: '0 Records',
      avgRain: '0%',
      avgHumidity: '0%',
      latest: 'None'
    };
  } else {
    const labels = predictions.map(p => p.label || `#${p.id}`);
    const rainProb = predictions.map(p => Math.round(p.rain_probability));
    const humidity = predictions.map(p => Math.round(p.humidity));
    const cloud = predictions.map(p => Math.round(p.cloud));

    const totalRecords = predictions.length;
    const avgRainVal = (rainProb.reduce((a, b) => a + b, 0) / totalRecords).toFixed(1);
    const avgHumVal = (humidity.reduce((a, b) => a + b, 0) / totalRecords).toFixed(1);
    const latestRec = predictions[predictions.length - 1];

    chartDataPresets['db'] = {
      labels: labels,
      rainProb: rainProb,
      humidity: humidity,
      cloud: cloud,
      total: `${totalRecords} Record${totalRecords > 1 ? 's' : ''}`,
      avgRain: `${avgRainVal}%`,
      avgHumidity: `${avgHumVal}%`,
      latest: `#${latestRec.id}: ${latestRec.rain_probability}% (${latestRec.will_rain ? 'Rain' : 'Dry'})`
    };
  }

  if (currentHorizon === 'db') {
    switchChartHorizon('db');
  }
}

async function loadDatabasePredictions() {
  try {
    const apiEndpoint = window.location.origin + '/api/predictions/';
    const response = await fetch(apiEndpoint);
    const json = await response.json();
    if (json.success && Array.isArray(json.predictions)) {
      dbPredictionsList = json.predictions;
      updateDbChartPreset(dbPredictionsList);
    }
  } catch (err) {
    console.warn("Could not load stored database predictions:", err);
  }
}

function initAreaChart() {
  const canvas = document.getElementById('meteorologicalAreaChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const ctx = canvas.getContext('2d');
  const isDark = document.documentElement.classList.contains('dark');

  // Gradient 1: Rainfall Probability (Sky Blue -> Indigo Glow)
  const gradRain = ctx.createLinearGradient(0, 0, 0, 300);
  gradRain.addColorStop(0, isDark ? 'rgba(56, 189, 248, 0.45)' : 'rgba(2, 132, 199, 0.35)');
  gradRain.addColorStop(1, isDark ? 'rgba(99, 102, 241, 0.02)' : 'rgba(37, 99, 235, 0.01)');

  // Gradient 2: Humidity (Cyan -> Teal)
  const gradHumidity = ctx.createLinearGradient(0, 0, 0, 300);
  gradHumidity.addColorStop(0, isDark ? 'rgba(45, 212, 191, 0.35)' : 'rgba(13, 148, 136, 0.25)');
  gradHumidity.addColorStop(1, isDark ? 'rgba(20, 184, 166, 0.02)' : 'rgba(20, 184, 166, 0.01)');

  // Gradient 3: Cloud Density (Violet -> Purple)
  const gradCloud = ctx.createLinearGradient(0, 0, 0, 300);
  gradCloud.addColorStop(0, isDark ? 'rgba(168, 85, 247, 0.25)' : 'rgba(147, 51, 234, 0.18)');
  gradCloud.addColorStop(1, isDark ? 'rgba(168, 85, 247, 0.01)' : 'rgba(147, 51, 234, 0.01)');

  const preset = chartDataPresets[currentHorizon] || chartDataPresets['db'];

  meteorologyChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: preset.labels,
      datasets: [
        {
          label: 'Rain Probability (%)',
          data: [...preset.rainProb],
          fill: true,
          backgroundColor: gradRain,
          borderColor: isDark ? '#38bdf8' : '#0284c7',
          borderWidth: 2.5,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 7,
          pointBackgroundColor: isDark ? '#38bdf8' : '#0284c7',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2
        },
        {
          label: 'Humidity (%)',
          data: [...preset.humidity],
          fill: true,
          backgroundColor: gradHumidity,
          borderColor: isDark ? '#2dd4bf' : '#0d9488',
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: isDark ? '#2dd4bf' : '#0d9488',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2
        },
        {
          label: 'Cloud Cover (%)',
          data: [...preset.cloud],
          fill: true,
          backgroundColor: gradCloud,
          borderColor: isDark ? '#c084fc' : '#9333ea',
          borderWidth: 1.8,
          borderDash: [4, 4],
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointBackgroundColor: isDark ? '#c084fc' : '#9333ea'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'end',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            boxWidth: 8,
            boxHeight: 8,
            padding: 18,
            color: isDark ? '#cbd5e1' : '#475569',
            font: {
              family: 'Nunito',
              size: 11,
              weight: '600'
            }
          }
        },
        tooltip: {
          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.95)',
          titleColor: isDark ? '#f8fafc' : '#0f172a',
          bodyColor: isDark ? '#cbd5e1' : '#334155',
          borderColor: isDark ? '#334155' : '#e2e8f0',
          borderWidth: 1,
          padding: 12,
          boxPadding: 6,
          usePointStyle: true,
          cornerRadius: 12,
          titleFont: { family: 'Outfit', size: 12, weight: '700' },
          bodyFont: { family: 'Nunito', size: 11, weight: '600' }
        }
      },
      scales: {
        x: {
          grid: {
            color: isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.6)',
            drawBorder: false
          },
          ticks: {
            color: isDark ? '#94a3b8' : '#64748b',
            font: { family: 'Nunito', size: 11, weight: '600' }
          }
        },
        y: {
          min: 0,
          max: 100,
          grid: {
            color: isDark ? 'rgba(51, 65, 85, 0.3)' : 'rgba(241, 245, 249, 0.8)',
            drawBorder: false
          },
          ticks: {
            color: isDark ? '#94a3b8' : '#64748b',
            font: { family: 'Nunito', size: 11, weight: '600' },
            callback: (val) => `${val}%`
          }
        }
      }
    }
  });

  // Automatically fetch DB predictions on initial load
  loadDatabasePredictions();
}

function switchChartHorizon(horizon) {
  if (!chartDataPresets[horizon]) return;
  currentHorizon = horizon;

  // Update button active styles
  ['db', '24h', '7d', '30d'].forEach(h => {
    const btn = document.getElementById(`chart-btn-${h}`);
    if (btn) {
      if (h === horizon) {
        btn.className = 'px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 border border-slate-200 dark:border-slate-700 cursor-pointer';
      } else {
        btn.className = 'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer';
      }
    }
  });

  const preset = chartDataPresets[horizon];

  // Update Chart Data & Stats
  if (meteorologyChart) {
    meteorologyChart.data.labels = preset.labels;
    meteorologyChart.data.datasets[0].data = [...preset.rainProb];
    meteorologyChart.data.datasets[1].data = [...preset.humidity];
    meteorologyChart.data.datasets[2].data = [...preset.cloud];
    meteorologyChart.update();
  }

  const tEl = document.getElementById('chart-stat-total');
  const pEl = document.getElementById('chart-stat-peak');
  const hEl = document.getElementById('chart-stat-humidity');
  const confEl = document.getElementById('chart-stat-confidence');

  if (tEl) tEl.innerText = preset.total || preset.peak || 'N/A';
  if (pEl) pEl.innerText = preset.avgRain || preset.peak || 'N/A';
  if (hEl) hEl.innerText = preset.avgHumidity || 'N/A';
  if (confEl) confEl.innerText = preset.latest || preset.confidence || 'N/A';
}

/**
 * Updates the chart with real-time prediction payload from form submission
 */
function updateChartFromPrediction(result) {
  if (!result) return;

  const rainProb = Math.round(result.rain_probability);
  const humidity = parseFloat(document.getElementById('id_humidity')?.value) || 80;
  const cloud = parseFloat(document.getElementById('id_cloud')?.value) || 65;

  // Add new prediction into DB list
  const newRecord = {
    id: result.id || (dbPredictionsList.length + 1),
    label: result.label || `#${result.id || (dbPredictionsList.length + 1)}`,
    rain_probability: rainProb,
    humidity: Math.min(100, Math.round(humidity)),
    cloud: Math.min(100, Math.round(cloud)),
    will_rain: result.will_rain
  };

  dbPredictionsList.push(newRecord);
  updateDbChartPreset(dbPredictionsList);
  switchChartHorizon('db');
}

/**
 * Smooth Back-To-Top button scroll
 */
function scrollToTop() {
  if (smootherInstance) {
    smootherInstance.scrollTo(0, true);
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

window.switchChartHorizon = switchChartHorizon;
window.scrollToTop = scrollToTop;

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

// --- Notification Center Functions ---
let notificationHistory = [];
let notifIdCounter = 0;

function getRelativeTime(timestamp) {
  const diff = Math.floor((Date.now() - timestamp) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}

function updateNotifBadge() {
  const badge = document.getElementById('notif-badge');
  const panelCount = document.getElementById('notif-center-count');
  const count = notificationHistory.length;
  
  if (badge) {
    if (count > 0) {
      badge.innerHTML = `<span class="t-badge-dot">${count}</span>`;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }
  
  if (panelCount) {
    panelCount.innerText = count;
  }
}

window.addNotification = function(title, desc, icon = 'highVoltage', type = 'info') {
  const id = 'notif-' + (++notifIdCounter);
  const timestamp = Date.now();
  
  notificationHistory.unshift({ id, title, desc, icon, type, timestamp });
  updateNotifBadge();
  
  const list = document.getElementById('notif-center-list');
  const emptyState = document.getElementById('notif-empty-state');
  
  if (emptyState && !emptyState.classList.contains('hidden')) {
    emptyState.classList.add('hidden');
  }
  
  const brainImg = window.STATIC_IMAGES?.brain || '';
  const hvImg = window.STATIC_IMAGES?.highVoltage || '';
  
  let iconHtml = '';
  if (type === 'nn' || icon === 'brain') iconHtml = `<img src="${brainImg}" alt="NN" class="w-4 h-4 object-contain">`;
  else if (type === 'info' || type === 'xgboost' || icon === 'highVoltage') iconHtml = `<img src="${hvImg}" alt="XGB" class="w-4 h-4 object-contain">`;
  else iconHtml = `<span class="text-sm">${icon}</span>`;
  
  let color = 'emerald';
  if (type === 'rain') color = 'sky';
  else if (type === 'norain') color = 'amber';
  else if (type === 'nn') color = 'indigo';
  
  const notifItem = document.createElement('div');
  notifItem.id = id;
  notifItem.className = `notif-item flex items-start space-x-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group`;
  notifItem.innerHTML = `
    <div class="w-8 h-8 rounded-full bg-${color}-500/20 border border-${color}-400/30 flex items-center justify-center shrink-0 mt-0.5">
      ${iconHtml}
    </div>
    <div class="flex-1 min-w-0">
      <div class="flex items-center justify-between">
        <span class="font-outfit font-bold text-xs text-slate-800 dark:text-white truncate">${title}</span>
        <span class="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 ml-2 notif-time" data-ts="${timestamp}">Just now</span>
      </div>
      <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5 truncate">${desc}</p>
    </div>
  `;
  
  if (list) {
    list.insertBefore(notifItem, list.firstChild);
    
    if (typeof gsap !== 'undefined') {
      gsap.fromTo(notifItem, 
        { y: 20, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.4, ease: 'back.out(1.5)' }
      );
    }
  }
};

window.toggleNotifCenter = function() {
  const panel = document.getElementById('notif-center-panel');
  if (!panel) return;
  
  const isHidden = panel.classList.contains('hidden');
  const bellIcon = document.getElementById('bell-icon');
  
  if (isHidden) {
    panel.classList.remove('hidden');
    document.querySelectorAll('.notif-time').forEach(el => {
      el.innerText = getRelativeTime(parseInt(el.getAttribute('data-ts')));
    });
    
    if (typeof gsap !== 'undefined') {
      gsap.fromTo(panel,
        { scale: 0.92, y: -15, autoAlpha: 0 },
        { scale: 1, y: 0, autoAlpha: 1, duration: 0.4, ease: 'back.out(1.7)' }
      );
      
      if (bellIcon) {
        gsap.fromTo(bellIcon,
          { rotation: -15 },
          { rotation: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' }
        );
      }
    }
  } else {
    if (typeof gsap !== 'undefined') {
      gsap.to(panel, {
        scale: 0.92, y: -10, autoAlpha: 0, duration: 0.25, ease: 'power2.in',
        onComplete: () => panel.classList.add('hidden')
      });
    } else {
      panel.classList.add('hidden');
    }
  }
};

window.clearAllNotifications = function() {
  notificationHistory = [];
  updateNotifBadge();
  
  const listItems = document.querySelectorAll('.notif-item');
  const emptyState = document.getElementById('notif-empty-state');
  
  if (listItems.length > 0 && typeof gsap !== 'undefined') {
    gsap.to(listItems, {
      autoAlpha: 0, x: 20, stagger: 0.05, duration: 0.3,
      onComplete: () => {
        listItems.forEach(el => el.remove());
        if (emptyState) emptyState.classList.remove('hidden');
      }
    });
  } else {
    listItems.forEach(el => el.remove());
    if (emptyState) emptyState.classList.remove('hidden');
  }
};

// --- Fixed GSAP Pill Toast Notification Functions (Bottom Right) ---
let toastTimeout = null;

window.showToastNotification = function(title, desc, icon = 'highVoltage', type = 'info') {
  window.addNotification(title, desc, icon, type);
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
  // Sync Theme Toggle Button state with current document theme
  const initialTheme = localStorage.getItem('theme') || (document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  updateThemeUI(initialTheme);

  // Initialize GSAP ScrollSmoother, Ambient Background, Rolling Title, Model Dropdown & Area Chart
  initScrollSmoother();
  initAmbientBackground();
  initRollingTitleAnimation();
  initModelDropdown();
  initAreaChart();

  // GSAP Initial Entrance Animations with clearProps to prevent residual style locks
  if (typeof gsap !== 'undefined') {
    const heroBannerEl = document.getElementById('hero-banner');
    const formCardEl = document.getElementById('form-card');
    const areaChartEl = document.getElementById('area-chart-section');
    const footerEl = document.getElementById('main-footer');
    
    // Continuous GSAP 3D levitation for Verdict WebP weather image
    const initHeroImg = document.getElementById('verdict-hero-img');
    if (initHeroImg) {
      gsap.to(initHeroImg, {
        y: -7,
        rotation: 2,
        duration: 2.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
    }

    // GSAP 3D Hero Weather Image Carousel (3 images with 3D cross-fade transitions)
    const heroWeatherSlides = document.querySelectorAll('.hero-weather-slide');
    if (heroWeatherSlides.length >= 2) {
      // Set initial state: all hidden except first
      gsap.set(heroWeatherSlides, { autoAlpha: 0, scale: 0.4, rotationY: -90 });
      gsap.set(heroWeatherSlides[0], { autoAlpha: 1, scale: 1, rotationY: 0 });

      let heroSlideIndex = 0;
      let heroLevitationTween = null;

      // Start levitation on the active slide
      function startHeroLevitation(slide) {
        if (heroLevitationTween) heroLevitationTween.kill();
        gsap.set(slide, { y: 0, rotation: 0 });
        heroLevitationTween = gsap.to(slide, {
          y: -10,
          rotation: 3,
          duration: 2.4,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut'
        });
      }

      // Entrance pop for the very first slide
      gsap.fromTo(heroWeatherSlides[0],
        { scale: 0.5, autoAlpha: 0, rotationY: -45 },
        {
          scale: 1, autoAlpha: 1, rotationY: 0,
          duration: 0.9, ease: 'back.out(1.8)', delay: 0.3,
          onComplete: () => startHeroLevitation(heroWeatherSlides[0])
        }
      );

      // 3D Cross-fade cycle function
      function cycleHeroWeatherSlide() {
        const nextIndex = (heroSlideIndex + 1) % heroWeatherSlides.length;
        const currentSlide = heroWeatherSlides[heroSlideIndex];
        const nextSlide = heroWeatherSlides[nextIndex];

        // Kill current levitation
        if (heroLevitationTween) heroLevitationTween.kill();

        const tl = gsap.timeline({
          onComplete: () => {
            heroSlideIndex = nextIndex;
            startHeroLevitation(nextSlide);
            gsap.delayedCall(3.5, cycleHeroWeatherSlide);
          }
        });

        // Exit: current image spins out with 3D perspective
        tl.to(currentSlide, {
          autoAlpha: 0,
          scale: 0.3,
          rotationY: 70,
          y: 15,
          duration: 0.55,
          ease: 'back.in(1.4)'
        }, 0);

        // Enter: next image pops in from opposite 3D perspective
        tl.fromTo(nextSlide,
          { autoAlpha: 0, scale: 1.3, rotationY: -60, y: -20 },
          {
            autoAlpha: 1, scale: 1, rotationY: 0, y: 0,
            duration: 0.7, ease: 'back.out(1.6)',
            immediateRender: false
          },
          0.3
        );
      }

      // Start cycling after initial entrance + levitation settle time
      gsap.delayedCall(3.8, cycleHeroWeatherSlide);
    }

    // GSAP Entrance for Hero Background Watermark Text
    const heroBgText = document.getElementById('hero-bg-text');
    if (heroBgText) {
      gsap.fromTo(heroBgText,
        { scale: 0.85, autoAlpha: 0 },
        { scale: 1, autoAlpha: parseFloat(getComputedStyle(heroBgText).opacity) || 0.07, duration: 1.2, ease: 'power2.out', delay: 0.1 }
      );
    }

    // Initial Progress Bar & Number Counter animation on load if result exists
    const initProbText = document.getElementById('prob-percentage-text');
    const initProgressBar = document.getElementById('prob-progress-bar');
    const initTipDot = document.getElementById('progress-tip-dot');

    if (initProbText && initProgressBar) {
      const targetVal = parseFloat(initProbText.innerText) || 0;
      if (targetVal > 0) {
        const counterObj = { val: 0 };
        gsap.to(counterObj, {
          val: targetVal,
          duration: 1.1,
          ease: 'power2.out',
          onUpdate: () => {
            initProbText.innerText = `${counterObj.val.toFixed(1)}%`;
          }
        });
        gsap.fromTo(initProgressBar,
          { width: '0%' },
          { 
            width: `${targetVal}%`, 
            duration: 1.15, 
            ease: 'back.out(1.2)',
            onComplete: () => {
              if (initTipDot) {
                gsap.fromTo(initTipDot, { scale: 1.5, opacity: 1 }, { scale: 1, opacity: 0.9, duration: 0.35 });
              }
            }
          }
        );
      }
    }
    
    if (heroBannerEl) {
      gsap.from(heroBannerEl, { duration: 0.7, y: -20, opacity: 0, ease: 'power2.out', clearProps: 'transform,opacity' });
    }
    if (formCardEl) {
      gsap.from(formCardEl, { duration: 0.7, y: 25, opacity: 0, delay: 0.15, ease: 'power2.out', clearProps: 'transform,opacity' });
    }
    if (areaChartEl && typeof ScrollTrigger !== 'undefined') {
      gsap.from(areaChartEl, {
        scrollTrigger: {
          trigger: areaChartEl,
          start: 'top 85%'
        },
        duration: 0.8,
        y: 35,
        opacity: 0,
        ease: 'power3.out',
        clearProps: 'transform,opacity'
      });
    }
    if (footerEl && typeof ScrollTrigger !== 'undefined') {
      gsap.from(footerEl.children, {
        scrollTrigger: {
          trigger: footerEl,
          start: 'top 92%'
        },
        duration: 0.8,
        y: 30,
        opacity: 0,
        stagger: 0.15,
        ease: 'power3.out',
        clearProps: 'transform,opacity'
      });
    }

    // Refresh ScrollSmoother layout height calculation
    window.addEventListener('load', () => {
      ScrollTrigger.refresh();
    });
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 400);
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
      window.toggleNotifCenter();
    });

    document.addEventListener('click', (e) => {
      const panel = document.getElementById('notif-center-inner');
      if (panel && !panel.contains(e.target) && !notifBtn.contains(e.target)) {
        const panelContainer = document.getElementById('notif-center-panel');
        if (panelContainer && !panelContainer.classList.contains('hidden')) {
          window.toggleNotifCenter();
        }
      }
    });
  }

  // Initial System Ready Notification
  window.addNotification('System Ready', 'All AI models loaded and operational', '🚀', 'info');

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
