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
      // Subtle glow highlight animation using GSAP
      if (typeof gsap !== 'undefined') {
        gsap.fromTo(input, { backgroundColor: '#e0f2fe' }, { backgroundColor: '#f8fafc', duration: 0.8 });
      }
    }
  }
}

/**
 * Renders the model prediction results into the UI card
 * @param {Object} result - Prediction result payload from backend
 */
function displayResult(result) {
  const placeholder = document.getElementById('result-placeholder');
  const content = document.getElementById('result-content');
  const verdictBanner = document.getElementById('verdict-banner');
  const verdictIcon = document.getElementById('verdict-icon');
  const verdictTitle = document.getElementById('verdict-title');
  const verdictSubtitle = document.getElementById('verdict-subtitle');
  const progressBar = document.getElementById('prob-progress-bar');
  const probText = document.getElementById('prob-percentage-text');
  const rainMetric = document.getElementById('metric-rain-prob');
  const noRainMetric = document.getElementById('metric-norain-prob');

  placeholder.classList.add('hidden');
  content.classList.remove('hidden');

  const rainProb = result.rain_probability;
  const willRain = result.will_rain;

  if (willRain) {
    verdictBanner.className = 'p-5 rounded-xl text-center border badge-rain shadow-sm';
    verdictIcon.innerText = '🌧️';
    verdictTitle.innerText = 'Rainfall Expected';
    verdictTitle.className = 'font-Nunito text-2xl font-extrabold mb-1 text-blue-900';
    verdictSubtitle.innerText = `High confidence prediction (${rainProb}% likelihood of rain)`;
    verdictSubtitle.className = 'text-xs font-semibold text-blue-700';
  } else {
    verdictBanner.className = 'p-5 rounded-xl text-center border badge-norain shadow-sm';
    verdictIcon.innerText = '☀️';
    verdictTitle.innerText = 'No Rain Expected';
    verdictTitle.className = 'font-Nunito text-2xl font-extrabold mb-1 text-emerald-900';
    verdictSubtitle.innerText = `Clear weather likely (${result.no_rain_probability}% chance of dry weather)`;
    verdictSubtitle.className = 'text-xs font-semibold text-emerald-700';
  }

  probText.innerText = `${rainProb}%`;
  rainMetric.innerText = `${rainProb}%`;
  noRainMetric.innerText = `${result.no_rain_probability}%`;

  // Animate progress bar with GSAP
  if (typeof gsap !== 'undefined') {
    gsap.to(progressBar, {
      width: `${rainProb}%`,
      duration: 0.9,
      ease: 'power2.out'
    });

    // Animate content card entrance
    gsap.fromTo(content, { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' });
  } else {
    progressBar.style.width = `${rainProb}%`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // GSAP Entrance Animations
  if (typeof gsap !== 'undefined') {
    gsap.from('#hero-banner', { duration: 0.7, y: -20, opacity: 0, ease: 'power2.out' });
    gsap.from('#form-card', { duration: 0.7, x: -30, opacity: 0, delay: 0.15, ease: 'power2.out' });
    gsap.from('#results-card', { duration: 0.7, x: 30, opacity: 0, delay: 0.25, ease: 'power2.out' });
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
