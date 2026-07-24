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
 * Restores the Meteorological Form section and hides the Results section
 */
function showForm() {
  const formSection = document.getElementById('form-section');
  const resultsSection = document.getElementById('results-section');
  const pageBody = document.getElementById('page-body');
  const heroBanner = document.getElementById('hero-banner');
  const bgGlow1 = document.getElementById('bg-glow-1');
  const bgGlow2 = document.getElementById('bg-glow-2');

  // Reset page background color to standard slate light
  if (pageBody) {
    if (typeof gsap !== 'undefined') {
      gsap.to(pageBody, { backgroundColor: '#f8fafc', duration: 0.6 });
    } else {
      pageBody.style.backgroundColor = '#f8fafc';
    }
  }
  if (heroBanner) heroBanner.style.borderColor = '#e2e8f0';
  if (bgGlow1) bgGlow1.className = 'pointer-events-none absolute -top-40 -left-40 w-96 h-96 bg-sky-200/40 rounded-full blur-3xl transition-all duration-1000';
  if (bgGlow2) bgGlow2.className = 'pointer-events-none absolute top-1/3 -right-40 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl transition-all duration-1000';

  if (typeof gsap !== 'undefined' && resultsSection && formSection) {
    gsap.to(resultsSection, {
      opacity: 0,
      y: 20,
      duration: 0.3,
      onComplete: () => {
        resultsSection.classList.add('hidden');
        formSection.classList.remove('hidden');
        gsap.fromTo(formSection, 
          { opacity: 0, y: -20, scale: 0.96 }, 
          { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'power2.out', clearProps: 'transform,opacity' }
        );
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  } else if (resultsSection && formSection) {
    resultsSection.classList.add('hidden');
    formSection.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

/**
 * Hides the form, reveals centered prediction results, and updates theme color
 * @param {Object} result - Prediction result payload from backend
 */
function displayResult(result) {
  const formSection = document.getElementById('form-section');
  const resultsSection = document.getElementById('results-section');
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

  const rainProb = result.rain_probability;
  const willRain = result.will_rain;

  if (willRain) {
    // --- Rainy Atmosphere Theme ---
    if (verdictBanner) verdictBanner.className = 'p-6 rounded-2xl text-center border badge-rain shadow-sm';
    if (verdictIcon) verdictIcon.innerText = '🌧️';
    if (verdictTitle) {
      verdictTitle.innerText = 'Rainfall Expected';
      verdictTitle.className = 'font-outfit text-2xl md:text-3xl font-extrabold mb-1 text-blue-900';
    }
    if (verdictSubtitle) {
      verdictSubtitle.innerText = `High confidence prediction (${rainProb}% likelihood of rain)`;
      verdictSubtitle.className = 'text-xs md:text-sm font-semibold text-blue-700';
    }

    if (progressBar) progressBar.className = 'bg-gradient-to-r from-sky-500 to-blue-600 h-full rounded-full w-0 transition-all duration-700';

    if (pageBody) {
      if (typeof gsap !== 'undefined') {
        gsap.to(pageBody, { backgroundColor: '#f0f9ff', duration: 0.8 });
      } else {
        pageBody.style.backgroundColor = '#f0f9ff';
      }
    }
    if (heroBanner) heroBanner.style.borderColor = '#bfdbfe';
    if (bgGlow1) bgGlow1.className = 'pointer-events-none absolute -top-40 -left-40 w-96 h-96 bg-sky-300/50 rounded-full blur-3xl transition-all duration-1000';
    if (bgGlow2) bgGlow2.className = 'pointer-events-none absolute top-1/3 -right-40 w-96 h-96 bg-blue-400/40 rounded-full blur-3xl transition-all duration-1000';

  } else {
    // --- Sunny / Dry Atmosphere Theme ---
    if (verdictBanner) verdictBanner.className = 'p-6 rounded-2xl text-center border badge-norain shadow-sm';
    if (verdictIcon) verdictIcon.innerText = '☀️';
    if (verdictTitle) {
      verdictTitle.innerText = 'No Rain Expected';
      verdictTitle.className = 'font-outfit text-2xl md:text-3xl font-extrabold mb-1 text-amber-900';
    }
    if (verdictSubtitle) {
      verdictSubtitle.innerText = `Clear weather likely (${result.no_rain_probability}% chance of dry weather)`;
      verdictSubtitle.className = 'text-xs md:text-sm font-semibold text-amber-700';
    }

    if (progressBar) progressBar.className = 'bg-gradient-to-r from-amber-400 to-emerald-500 h-full rounded-full w-0 transition-all duration-700';

    if (pageBody) {
      if (typeof gsap !== 'undefined') {
        gsap.to(pageBody, { backgroundColor: '#fffbeb', duration: 0.8 });
      } else {
        pageBody.style.backgroundColor = '#fffbeb';
      }
    }
    if (heroBanner) heroBanner.style.borderColor = '#fde68a';
    if (bgGlow1) bgGlow1.className = 'pointer-events-none absolute -top-40 -left-40 w-96 h-96 bg-amber-300/50 rounded-full blur-3xl transition-all duration-1000';
    if (bgGlow2) bgGlow2.className = 'pointer-events-none absolute top-1/3 -right-40 w-96 h-96 bg-yellow-400/40 rounded-full blur-3xl transition-all duration-1000';
  }

  if (probText) probText.innerText = `${rainProb}%`;
  if (rainMetric) rainMetric.innerText = `${rainProb}%`;
  if (noRainMetric) noRainMetric.innerText = `${result.no_rain_probability}%`;

  // Hide form section & reveal centered results section
  if (typeof gsap !== 'undefined' && formSection && resultsSection) {
    gsap.to(formSection, {
      opacity: 0,
      y: -20,
      duration: 0.35,
      onComplete: () => {
        formSection.classList.add('hidden');
        resultsSection.classList.remove('hidden');

        // Animate progress bar & results card entrance
        gsap.fromTo(resultsSection, 
          { opacity: 0, y: 30, scale: 0.94 }, 
          { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'back.out(1.4)', clearProps: 'transform,opacity' }
        );

        if (progressBar) {
          gsap.to(progressBar, {
            width: `${rainProb}%`,
            duration: 0.9,
            ease: 'power2.out'
          });
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  } else if (formSection && resultsSection) {
    formSection.classList.add('hidden');
    resultsSection.classList.remove('hidden');
    if (progressBar) progressBar.style.width = `${rainProb}%`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

document.addEventListener('DOMContentLoaded', () => {
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
