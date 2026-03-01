/* ============================================
   BrittanyAnne Intuitive Fine Art
   app.js
   ============================================ */

// ---- CONFIGURATION ----
// Update these values to customize pricing, links, and contact info.
const CONFIG = {
  // Pricing matrix: pricing[size][subjects] = dollar amount
  // Use null for unavailable combos. Prices with + are starting prices.
  pricing: {
    '8x10':  { 1: 300, 2: 350, 3: 400, 4: null, 5: null, 6: null },
    '11x14': { 1: 350, 2: 400, 3: 450, 4: 500,  5: null, 6: null },
    '16x20': { 1: 450, 2: 500, 3: 550, 4: 600,  5: 650,  6: null },
    '18x24': { 1: 550, 2: 625, 3: 700, 4: 775,  5: 850,  6: 925 },
    '24x30': { 1: 700, 2: 800, 3: 900, 4: 1000, 5: 1100, 6: 1200 },
    '24x36': { 1: 850, 2: 950, 3: 1050, 4: 1150, 5: 1250, 6: 1350 },
    '36x36': { 1: 1050, 2: 1350, 3: 1650, 4: 1950, 5: 2250, 6: 2550 },
    '48x48': { 1: 2000, 2: 2500, 3: 3000, 4: 3500, 5: 4000, 6: 4500 }
  },
  // 48x48 prices are "starting at" — set to true to show "from $X"
  startingAtSizes: ['48x48'],
  channeledPremium: 0,         // Extra cost for fully channeled (0 if same price)
  depositPercent: 50,
  paymentPlanInstallments: 3,

  // Stripe Payment Links — map to your actual Stripe links
  // Format: 'description': 'https://buy.stripe.com/...'
  stripeLinks: {
    'full': '',
    'deposit': '',
    'plan': ''
  },

  turnaroundTime: '4-8 weeks',
  email: 'hello@brittanyanneart.com',

  // External shop URL (Etsy, Shopify, etc.)
  shopUrl: '',

  // Social media URLs
  social: {
    instagram: '',
    facebook: '',
    tiktok: ''
  }
};

// ---- STATE ----
const state = {
  currentStep: 0,
  subject: null,
  subjectCount: null,
  energy: null,
  energyNote: '',
  approach: null,       // 'vision' or 'channeled'
  style: null,
  colorPalette: null,
  customColors: '',
  size: null,
  photos: [],
  name: '',
  email: '',
  phone: '',
  additionalNotes: '',
  paymentOption: null
};

// Step sequences based on path
const STEPS_VISION = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const STEPS_CHANNELED = [0, 1, 2, 3, 4, 7, 8, 9, 10];

function getStepSequence() {
  if (state.approach === 'channeled') return STEPS_CHANNELED;
  return STEPS_VISION;
}

function getCurrentStepIndex() {
  return getStepSequence().indexOf(state.currentStep);
}

function getTotalSteps() {
  return getStepSequence().length;
}

// ---- DOM REFERENCES ----
const landingPage = document.getElementById('landingPage');
const commissionFlow = document.getElementById('commissionFlow');
const progressBar = document.getElementById('progressBar');
const flowSteps = document.getElementById('flowSteps');
const flowBack = document.getElementById('flowBack');
const flowClose = document.getElementById('flowClose');
const confirmationModal = document.getElementById('confirmationModal');
const siteNav = document.getElementById('siteNav');

// ---- INITIALIZATION ----
// Always start at top on page load/refresh
if (history.scrollRestoration) history.scrollRestoration = 'manual';
if (window.location.hash) window.location.hash = '';
window.scrollTo(0, 0);

document.addEventListener('DOMContentLoaded', () => {
  window.scrollTo(0, 0);
  requestAnimationFrame(() => window.scrollTo(0, 0));
  initNav();
  initScrollAnimations();
  initCommissionFlow();
  initContactForm();
  applyConfig();
  updatePriceDisplays();
});

// Catch the browser's late scroll restoration after all resources load
window.addEventListener('load', () => {
  window.scrollTo(0, 0);
});

// ---- APPLY CONFIG ----
function applyConfig() {
  // Set shop URL
  const shopLink = document.getElementById('shopLink');
  if (CONFIG.shopUrl) {
    shopLink.href = CONFIG.shopUrl;
  }

  // Set email
  const contactEmailLink = document.getElementById('contactEmailLink');
  if (CONFIG.email) {
    contactEmailLink.href = 'mailto:' + CONFIG.email;
    contactEmailLink.textContent = CONFIG.email;
  }

  // Set footer year
  document.getElementById('footerYear').textContent = new Date().getFullYear();
}

// ---- NAVIGATION ----
function initNav() {
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.classList.toggle('active');
    navToggle.setAttribute('aria-expanded', isOpen);
  });

  // Close mobile nav on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.classList.remove('active');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Commission buttons
  document.getElementById('navCommissionBtn').addEventListener('click', (e) => {
    e.preventDefault();
    openCommissionFlow();
  });

  document.getElementById('heroCommissionBtn').addEventListener('click', () => {
    openCommissionFlow();
  });

  document.getElementById('pathCommissionBtn').addEventListener('click', () => {
    openCommissionFlow();
  });

  // Nav scroll behavior — transparent over hero, solid when scrolled
  const handleNavScroll = () => {
    const scrolled = window.scrollY > 80;
    siteNav.classList.toggle('scrolled', scrolled);
  };
  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll(); // set initial state
}

// ---- SCROLL ANIMATIONS ----
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

// ---- CONTACT FORM ----
function initContactForm() {
  const form = document.getElementById('contactForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = form.querySelector('[name="name"]')?.value.trim();
    const email = form.querySelector('[name="email"]')?.value.trim();
    const message = form.querySelector('[name="message"]')?.value.trim();

    if (!name || !email || !message) return;

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message })
      });

      if (res.ok) {
        form.reset();
        const successMsg = document.createElement('p');
        successMsg.textContent = 'Thank you! Your message has been sent.';
        successMsg.style.cssText = 'color: var(--color-accent); margin-top: 1rem; font-style: italic;';
        form.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 5000);
      }
    } catch (err) {
      // Fallback: try Formspree if server unavailable
      if (!form.action.includes('YOUR_FORM_ID')) {
        form.submit();
      } else {
        alert('Unable to send message right now. Please try again later.');
      }
    }
  });
}

// ---- COMMISSION FLOW ----
function initCommissionFlow() {
  // Open/Close
  flowClose.addEventListener('click', closeCommissionFlow);

  // Back button
  flowBack.addEventListener('click', goBack);

  // Option card clicks
  document.querySelectorAll('.option-grid').forEach(grid => {
    grid.addEventListener('click', (e) => {
      const card = e.target.closest('.option-card');
      if (!card) return;
      handleOptionSelect(grid, card);
    });
  });

  // Continue buttons
  document.querySelectorAll('.flow-next').forEach(btn => {
    btn.addEventListener('click', () => {
      const nextStep = parseInt(btn.dataset.next);
      goToStep(nextStep);
    });
  });

  // Custom color palette toggle
  document.querySelectorAll('[data-field="colorPalette"] .option-card').forEach(card => {
    card.addEventListener('click', () => {
      const customGroup = document.getElementById('customColorGroup');
      customGroup.style.display = card.dataset.value === 'custom' ? 'block' : 'none';
    });
  });

  // File upload
  initFileUpload();

  // Review button
  document.getElementById('reviewBtn').addEventListener('click', handleReview);

  // Edit selections — go back to first real question, not welcome screen
  document.getElementById('editSelectionsBtn').addEventListener('click', () => {
    goToStep(1);
  });

  // Confirmation modal close
  document.getElementById('modalCloseBtn').addEventListener('click', () => {
    confirmationModal.classList.remove('active');
    confirmationModal.setAttribute('aria-hidden', 'true');
    closeCommissionFlow();
    resetState();
  });

  // Keyboard: Escape to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (confirmationModal.classList.contains('active')) {
        confirmationModal.classList.remove('active');
        confirmationModal.setAttribute('aria-hidden', 'true');
      } else if (commissionFlow.classList.contains('active')) {
        closeCommissionFlow();
      }
    }
  });
}

function openCommissionFlow() {
  commissionFlow.classList.add('active');
  commissionFlow.setAttribute('aria-hidden', 'false');
  siteNav.classList.add('hidden');
  document.body.classList.add('flow-open');
  goToStep(0);
  commissionFlow.scrollTo(0, 0);
}

function closeCommissionFlow() {
  commissionFlow.classList.remove('active');
  commissionFlow.setAttribute('aria-hidden', 'true');
  siteNav.classList.remove('hidden');
  document.body.classList.remove('flow-open');
}

function goToStep(stepNum) {
  state.currentStep = stepNum;

  // Hide all steps, show active
  document.querySelectorAll('.flow-step').forEach(el => {
    el.classList.remove('active');
  });
  const activeStep = document.querySelector(`[data-step="${stepNum}"]`);
  if (activeStep) {
    activeStep.classList.add('active');

    // Re-trigger animation
    activeStep.style.animation = 'none';
    activeStep.offsetHeight; // force reflow
    activeStep.style.animation = '';
  }

  // Update progress bar
  updateProgress();

  // Update dynamic step numbers
  updateDynamicStepNumbers();

  // Show/hide back button
  flowBack.style.display = stepNum === 0 ? 'none' : 'flex';

  // Scroll to top of flow
  commissionFlow.scrollTo({ top: 0, behavior: 'smooth' });

  // If we're on the size step, update prices based on subject count
  if (stepNum === 7) {
    updatePriceDisplays();
  }

  // If we're on the summary step, populate it
  if (stepNum === 10) {
    populateSummary();
  }

  // Restore selections on revisited steps
  restoreSelections(stepNum);
}

function goBack() {
  const sequence = getStepSequence();
  const currentIndex = getCurrentStepIndex();
  if (currentIndex <= 0) {
    // If current step isn't in the sequence (e.g. landed on skipped step), go to start
    goToStep(sequence[0]);
    return;
  }
  goToStep(sequence[currentIndex - 1]);
}

function updateProgress() {
  const index = getCurrentStepIndex();
  const total = getTotalSteps();
  const percent = total > 1 ? (index / (total - 1)) * 100 : 0;
  progressBar.style.width = percent + '%';
}

function updateDynamicStepNumbers() {
  if (state.approach === 'channeled') {
    // Steps 7, 8, 9 become 05, 06, 07
    const mapping = { 7: '05', 8: '06', 9: '07' };
    document.querySelectorAll('.dynamic-step-num').forEach(el => {
      const step = el.closest('.flow-step');
      if (step && mapping[step.dataset.step]) {
        el.textContent = mapping[step.dataset.step];
      }
    });
  } else {
    // Reset to normal
    const mapping = { 7: '07', 8: '08', 9: '09' };
    document.querySelectorAll('.dynamic-step-num').forEach(el => {
      const step = el.closest('.flow-step');
      if (step && mapping[step.dataset.step]) {
        el.textContent = mapping[step.dataset.step];
      }
    });
  }
}

function handleOptionSelect(grid, card) {
  const field = grid.dataset.field;
  const value = card.dataset.value;

  // Don't allow selecting unavailable options
  if (card.classList.contains('unavailable')) return;

  // Deselect siblings
  grid.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');

  // Update state
  state[field] = value;

  // Determine auto-advance behavior
  const autoAdvanceFields = ['subject', 'subjectCount', 'style', 'size'];
  const forkField = 'approach';

  if (field === forkField) {
    // Fork: go to step 5 (vision) or step 7 (channeled)
    setTimeout(() => {
      if (value === 'channeled') {
        goToStep(7);
      } else {
        goToStep(5);
      }
    }, 300);
  } else if (autoAdvanceFields.includes(field)) {
    // Auto-advance to next step in sequence
    setTimeout(() => {
      const sequence = getStepSequence();
      const currentIndex = getCurrentStepIndex();
      if (currentIndex < sequence.length - 1) {
        goToStep(sequence[currentIndex + 1]);
      }
    }, 300);
  }
  // For energy and colorPalette, user must click "Continue" (not auto-advance)
}

function restoreSelections(stepNum) {
  const step = document.querySelector(`[data-step="${stepNum}"]`);
  if (!step) return;

  const grid = step.querySelector('.option-grid');
  if (!grid) return;

  const field = grid.dataset.field;
  const value = state[field];

  if (value) {
    grid.querySelectorAll('.option-card').forEach(c => {
      c.classList.toggle('selected', c.dataset.value === value);
    });
  }
}

// ---- PRICE DISPLAY ----
function getSubjectKey() {
  // Convert state.subjectCount to the pricing key (1-6)
  const val = state.subjectCount;
  if (!val) return 1;
  if (val === '6+') return 6;
  return Math.min(parseInt(val) || 1, 6);
}

function updatePriceDisplays() {
  const subjects = getSubjectKey();

  document.querySelectorAll('.option-card.option-size[data-value]').forEach(card => {
    const size = card.dataset.value;
    if (size === 'custom') return;

    const priceEl = card.querySelector('.option-price');
    const sizeData = CONFIG.pricing[size];
    if (!sizeData) return;

    const price = sizeData[subjects];
    const isStartingAt = CONFIG.startingAtSizes.includes(size);

    if (price === null) {
      // Unavailable for this subject count
      priceEl.textContent = 'Not available';
      card.classList.add('unavailable');
      card.disabled = true;
    } else {
      priceEl.textContent = (isStartingAt ? 'From $' : '$') + price;
      card.classList.remove('unavailable');
      card.disabled = false;
    }
  });
}

function calculateTotal() {
  if (!state.size || state.size === 'custom') return 0;

  const subjects = getSubjectKey();
  const sizeData = CONFIG.pricing[state.size];
  if (!sizeData) return 0;

  const basePrice = sizeData[subjects] || 0;
  const channeledExtra = state.approach === 'channeled' ? CONFIG.channeledPremium : 0;
  return basePrice + channeledExtra;
}

// ---- FILE UPLOAD ----
function initFileUpload() {
  const uploadArea = document.getElementById('uploadArea');
  const fileInput = document.getElementById('fileInput');
  const previewsContainer = document.getElementById('uploadPreviews');
  const continueBtn = document.getElementById('continueWithPhotos');
  const skipBtn = uploadArea.closest('.flow-step').querySelector('.btn-ghost');

  // Drag and drop
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
  });

  // File input
  fileInput.addEventListener('change', () => {
    handleFiles(fileInput.files);
    fileInput.value = ''; // reset for re-selection
  });

  function handleFiles(files) {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;

      state.photos.push(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        const thumb = document.createElement('div');
        thumb.className = 'upload-thumb';
        thumb.innerHTML = `
          <img src="${e.target.result}" alt="Upload preview">
          <button class="upload-thumb-remove" aria-label="Remove photo">&times;</button>
        `;

        const removeBtn = thumb.querySelector('.upload-thumb-remove');
        removeBtn.addEventListener('click', () => {
          const index = Array.from(previewsContainer.children).indexOf(thumb);
          state.photos.splice(index, 1);
          thumb.remove();
          updateUploadUI();
        });

        previewsContainer.appendChild(thumb);
        updateUploadUI();
      };
      reader.readAsDataURL(file);
    });
  }

  function updateUploadUI() {
    const hasPhotos = state.photos.length > 0;
    continueBtn.style.display = hasPhotos ? 'inline-block' : 'none';
    if (hasPhotos) {
      skipBtn.textContent = 'Skip Photos';
    } else {
      skipBtn.textContent = 'Skip for Now';
    }
  }
}

// ---- REVIEW & SUMMARY ----
function handleReview() {
  // Collect form data
  const name = document.getElementById('clientName').value.trim();
  const email = document.getElementById('clientEmail').value.trim();
  const phone = document.getElementById('clientPhone').value.trim();
  const notes = document.getElementById('additionalNotes').value.trim();

  // Validate
  let valid = true;
  clearFormErrors();

  if (!name) {
    showFormError('clientName', 'Please enter your name');
    valid = false;
  }

  if (!email || !isValidEmail(email)) {
    showFormError('clientEmail', 'Please enter a valid email');
    valid = false;
  }

  if (!valid) return;

  // Save to state
  state.name = name;
  state.email = email;
  state.phone = phone;
  state.additionalNotes = notes;

  // Also capture textarea values from earlier steps
  state.energyNote = document.getElementById('energyNote').value.trim();
  if (state.colorPalette === 'custom') {
    state.customColors = document.getElementById('customColors').value.trim();
  }

  // Go to summary
  goToStep(10);
}

function populateSummary() {
  const card = document.getElementById('summaryCard');
  const totalEl = document.getElementById('summaryTotal');
  const paymentEl = document.getElementById('paymentOptions');

  // Build summary rows
  const labels = {
    subject: 'Portrait for',
    subjectCount: 'Subjects',
    energy: 'Energy / Intention',
    approach: 'Approach',
    style: 'Style',
    colorPalette: 'Color Palette',
    size: 'Size'
  };

  const formatValue = (key, val) => {
    if (!val) return '—';
    const maps = {
      subject: { 'myself': 'Myself', 'loved-one': 'A Loved One (Gift)', 'family': 'A Family / Group', 'pet': 'A Pet', 'passed': 'Someone Who Has Passed', 'other': 'Other' },
      energy: { 'healing': 'Healing', 'celebration': 'Celebration', 'remembrance': 'Remembrance', 'love': 'Love', 'empowerment': 'Empowerment', 'transformation': 'Transformation', 'channel': 'Let Brittany Channel' },
      approach: { 'vision': 'I Have a Vision', 'channeled': 'Fully Channeled ✦' },
      style: { 'colored-pencil': 'Colored Pencil', 'painted': 'Painted', 'mixed-media': 'Mixed Media', 'brittanys-choice': "Brittany's Choice" },
      colorPalette: { 'warm': 'Warm Tones', 'cool': 'Cool Tones', 'neutral': 'Neutral & Soft', 'bold': 'Bold & Vibrant', 'channel': 'Let Brittany Channel', 'custom': 'Custom' },
      size: { '8x10': '8 × 10', '11x14': '11 × 14', '16x20': '16 × 20', '18x24': '18 × 24', '24x30': '24 × 30', '24x36': '24 × 36', '36x36': '36 × 36', '48x48': '48 × 48', 'custom': 'Custom Size' }
    };
    return maps[key] ? (maps[key][val] || val) : val;
  };

  let html = '';
  for (const [key, label] of Object.entries(labels)) {
    // Skip style and color for channeled path
    if (state.approach === 'channeled' && (key === 'style' || key === 'colorPalette')) continue;

    const value = formatValue(key, state[key]);
    html += `<div class="summary-row">
      <span class="summary-label">${label}</span>
      <span class="summary-value">${value}</span>
    </div>`;
  }

  // Add photos count
  if (state.photos.length > 0) {
    html += `<div class="summary-row">
      <span class="summary-label">Reference Photos</span>
      <span class="summary-value">${state.photos.length} uploaded</span>
    </div>`;
  }

  card.innerHTML = html;

  // Total
  const total = calculateTotal();
  if (total > 0) {
    totalEl.textContent = 'Total: $' + total;
  } else {
    totalEl.textContent = 'Pricing to be determined';
  }

  // Payment options
  const deposit = Math.round(total * (CONFIG.depositPercent / 100));
  const planAmount = Math.round(total / CONFIG.paymentPlanInstallments);

  let paymentHtml = '';

  if (total > 0) {
    paymentHtml += `
      <a href="${CONFIG.stripeLinks.full || '#'}" class="payment-card" target="_blank" rel="noopener" data-payment="full">
        <div class="payment-card-title">Pay in Full</div>
        <div class="payment-card-amount">$${total}</div>
        <div class="payment-card-note">One-time payment</div>
      </a>
      <a href="${CONFIG.stripeLinks.deposit || '#'}" class="payment-card" target="_blank" rel="noopener" data-payment="deposit">
        <div class="payment-card-title">${CONFIG.depositPercent}% Deposit</div>
        <div class="payment-card-amount">$${deposit}</div>
        <div class="payment-card-note">Remaining before delivery</div>
      </a>
      <a href="${CONFIG.stripeLinks.plan || '#'}" class="payment-card" target="_blank" rel="noopener" data-payment="plan">
        <div class="payment-card-title">Payment Plan</div>
        <div class="payment-card-amount">${CONFIG.paymentPlanInstallments} × $${planAmount}</div>
        <div class="payment-card-note">${CONFIG.paymentPlanInstallments} installments</div>
      </a>`;
  } else {
    paymentHtml = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 1rem;">
        <p style="margin-bottom: 1rem;">Pricing hasn't been configured yet. Brittany will follow up with a personalized quote.</p>
        <button class="btn btn-primary" id="bookWithoutPayment">Submit Request</button>
      </div>`;
  }

  paymentEl.innerHTML = paymentHtml;

  // If no pricing, allow booking without payment
  const bookBtn = document.getElementById('bookWithoutPayment');
  if (bookBtn) {
    bookBtn.addEventListener('click', showConfirmation);
  }

  // Payment card click handlers — save order then create Stripe checkout
  paymentEl.querySelectorAll('.payment-card').forEach(card => {
    card.addEventListener('click', async (e) => {
      e.preventDefault();
      const paymentType = card.dataset.payment; // 'full', 'deposit', 'plan'
      await handleCommissionPayment(paymentType);
    });
  });
}

async function handleCommissionPayment(paymentType) {
  const total = calculateTotal();

  // Calculate actual charge amount based on payment type
  let chargeAmount = total;
  if (paymentType === 'deposit') {
    chargeAmount = Math.round(total * (CONFIG.depositPercent / 100));
  } else if (paymentType === 'plan') {
    chargeAmount = Math.round(total / CONFIG.paymentPlanInstallments);
  }

  // Step 1: Save order to server
  const orderData = {
    name: state.name,
    email: state.email,
    phone: state.phone,
    subject: state.subject,
    subjectCount: state.subjectCount,
    energy: state.energy,
    energyNote: state.energyNote,
    approach: state.approach,
    style: state.style,
    colorPalette: state.colorPalette,
    customColors: state.customColors,
    size: state.size,
    additionalNotes: state.additionalNotes,
    photoCount: state.photos.length,
    total,
    paymentType
  };

  let orderId = null;
  try {
    const orderRes = await fetch('/api/commission-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    const orderResult = await orderRes.json();
    orderId = orderResult.orderId;
  } catch (err) {
    console.error('Failed to save order:', err);
  }

  // Step 2: Create Stripe checkout session
  if (chargeAmount > 0) {
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'commission',
          amount: chargeAmount,
          paymentType,
          orderId,
          customerEmail: state.email,
          metadata: {
            size: state.size,
            subjects: state.subjectCount,
            approach: state.approach
          }
        })
      });

      const result = await res.json();
      if (result.url) {
        window.location.href = result.url;
        return;
      }
    } catch (err) {
      console.error('Stripe checkout error:', err);
    }
  }

  // Fallback: show confirmation if Stripe isn't set up or amount is 0
  showConfirmation();
}

function showConfirmation() {
  confirmationModal.classList.add('active');
  confirmationModal.setAttribute('aria-hidden', 'false');
  // Focus the modal
  confirmationModal.querySelector('.btn').focus();
}

// ---- FORM VALIDATION HELPERS ----
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showFormError(inputId, message) {
  const group = document.getElementById(inputId).closest('.form-group');
  group.classList.add('error');
  const existing = group.querySelector('.form-error-msg');
  if (existing) existing.remove();
  const msg = document.createElement('div');
  msg.className = 'form-error-msg';
  msg.textContent = message;
  group.appendChild(msg);
}

function clearFormErrors() {
  document.querySelectorAll('.form-group.error').forEach(g => {
    g.classList.remove('error');
    const msg = g.querySelector('.form-error-msg');
    if (msg) msg.remove();
  });
}

// ---- RESET STATE ----
function resetState() {
  Object.assign(state, {
    currentStep: 0,
    subject: null,
    subjectCount: null,
    energy: null,
    energyNote: '',
    approach: null,
    style: null,
    colorPalette: null,
    customColors: '',
    size: null,
    photos: [],
    name: '',
    email: '',
    phone: '',
    additionalNotes: '',
    paymentOption: null
  });

  // Reset form inputs
  document.querySelectorAll('.option-card.selected').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('.flow-step textarea').forEach(t => { t.value = ''; });
  document.querySelectorAll('.flow-step input').forEach(i => { i.value = ''; });
  document.getElementById('uploadPreviews').innerHTML = '';
  document.getElementById('customColorGroup').style.display = 'none';
  clearFormErrors();
}
