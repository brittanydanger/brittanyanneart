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
  depositSurchargePercent: 7,    // % increase for 50% deposit option
  paymentPlanInstallments: 3,
  paymentPlanSurchargePercent: 10, // % increase for payment plan option

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
  paymentOption: null,
  deliveryWindow: null,
  rushRequested: false,
  giftMessage: '',
  shippingMethod: null,
  shippingName: '',
  shippingStreet: '',
  shippingCity: '',
  shippingState: '',
  shippingZip: ''
};

// Step sequences based on path
const STEPS_VISION = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
const STEPS_CHANNELED = [0, 1, 2, 3, 7, 8, 9, 10, 11, 12, 13, 14];

// Print add-on quantities
const printAddOns = { '5x7': 0, '8x10': 0, '11x14': 0 };
const printAddOnPrices = { '5x7': 25, '8x10': 40, '11x14': 65 };
const IMAGE_CAPTURE_FEE = 75;

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
// Start at top on fresh page load (not anchor clicks)
if (history.scrollRestoration) history.scrollRestoration = 'manual';

document.addEventListener('DOMContentLoaded', () => {
  // Only scroll to top if there's no hash (user didn't click an anchor link)
  if (!window.location.hash) {
    window.scrollTo(0, 0);
  }
  initNav();
  initScrollAnimations();
  initCommissionFlow();
  initContactForm();
  initPortfolioCarousel();
  applyConfig();
  updatePriceDisplays();

  // Restore commission flow session if page was refreshed mid-flow
  if (restoreSession()) {
    commissionFlow.classList.add('active');
    commissionFlow.setAttribute('aria-hidden', 'false');
    siteNav.classList.add('hidden');
    document.body.classList.add('flow-open');

    // Restore selected option cards visually
    const fieldMap = {
      subject: state.subject,
      subjectCount: state.subjectCount ? String(state.subjectCount) : null,
      energy: state.energy,
      approach: state.approach,
      style: state.style,
      colorPalette: state.colorPalette,
      size: state.size,
      shippingMethod: state.shippingMethod
    };
    Object.entries(fieldMap).forEach(([field, val]) => {
      if (!val) return;
      const card = document.querySelector(`[data-field="${field}"] .option-card[data-value="${val}"]`);
      if (card) card.classList.add('selected');
    });

    // Restore text inputs
    const inputMap = {
      'energyNote': state.energyNote,
      'customColorInput': state.customColors,
      'contactName': state.name,
      'contactEmail': state.email,
      'contactPhone': state.phone,
      'additionalNotes': state.additionalNotes,
      'giftNote': state.giftMessage,
      'shippingName': state.shippingName,
      'shippingStreet': state.shippingStreet,
      'shippingCity': state.shippingCity,
      'shippingState': state.shippingState,
      'shippingZip': state.shippingZip
    };
    Object.entries(inputMap).forEach(([id, val]) => {
      if (!val) return;
      const el = document.getElementById(id);
      if (el) el.value = val;
    });

    // Restore print add-on quantities
    Object.entries(printAddOns).forEach(([size, qty]) => {
      const el = document.querySelector(`.addon-qty-value[data-size="${size}"]`);
      if (el) el.textContent = String(qty);
    });

    // Show custom color group if needed
    if (state.colorPalette === 'custom') {
      document.getElementById('customColorGroup').style.display = 'block';
    }

    // Show shipping address if shipped
    if (state.shippingMethod === 'shipped') {
      document.getElementById('shippingAddressGroup').style.display = 'block';
      document.getElementById('shippingContinueBtn').style.display = 'inline-block';
    } else if (state.shippingMethod === 'hand-delivered') {
      document.getElementById('handDeliveredNote').style.display = 'block';
      document.getElementById('shippingContinueBtn').style.display = 'inline-block';
    }

    goToStep(state.currentStep);
  }
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

// ---- PORTFOLIO CAROUSEL (infinite loop) ----
function initPortfolioCarousel() {
  const carousel = document.getElementById('portfolioCarousel');
  const track = carousel?.querySelector('.portfolio-track');
  const prevBtn = document.getElementById('portfolioPrev');
  const nextBtn = document.getElementById('portfolioNext');

  if (!carousel || !track) return;

  // Clone all slides and append to create seamless loop
  const originalSlides = Array.from(track.children);
  originalSlides.forEach(slide => {
    track.appendChild(slide.cloneNode(true));
  });

  let isDragging = false;
  let startX = 0;
  let currentTranslate = 0;
  let dragStartTranslate = 0;

  // Width of the original (non-cloned) set of slides
  function getOriginalWidth() {
    let w = 0;
    const gap = 8; // matches CSS gap
    for (let i = 0; i < originalSlides.length; i++) {
      w += track.children[i].offsetWidth + gap;
    }
    return w;
  }

  function setTranslate(val, animate) {
    if (animate) {
      track.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)';
    } else {
      track.style.transition = 'none';
    }
    currentTranslate = val;
    track.style.transform = `translateX(${currentTranslate}px)`;
  }

  // Wrap position so it loops seamlessly
  function wrapPosition() {
    const origW = getOriginalWidth();
    if (currentTranslate <= -origW) {
      // Scrolled past all originals — jump back
      setTranslate(currentTranslate + origW, false);
    } else if (currentTranslate > 0) {
      // Scrolled before start — jump to cloned end
      setTranslate(currentTranslate - origW, false);
    }
  }

  // Listen for transition end to silently wrap
  track.addEventListener('transitionend', wrapPosition);

  // Arrow buttons
  prevBtn?.addEventListener('click', () => {
    const step = carousel.offsetWidth * 0.8;
    setTranslate(currentTranslate + step, true);
  });

  nextBtn?.addEventListener('click', () => {
    const step = carousel.offsetWidth * 0.8;
    setTranslate(currentTranslate - step, true);
  });

  // Drag / touch to scroll
  function onDragStart(x) {
    isDragging = true;
    startX = x;
    dragStartTranslate = currentTranslate;
    track.style.transition = 'none';
    carousel.style.cursor = 'grabbing';
  }

  function onDragMove(x) {
    if (!isDragging) return;
    const diff = x - startX;
    currentTranslate = dragStartTranslate + diff;
    track.style.transform = `translateX(${currentTranslate}px)`;
  }

  function onDragEnd() {
    if (!isDragging) return;
    isDragging = false;
    carousel.style.cursor = 'grab';
    // Smooth settle then wrap
    track.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)';
    wrapPosition();
  }

  // Mouse events
  carousel.addEventListener('mousedown', (e) => {
    e.preventDefault();
    onDragStart(e.clientX);
  });
  window.addEventListener('mousemove', (e) => onDragMove(e.clientX));
  window.addEventListener('mouseup', onDragEnd);

  // Touch events
  carousel.addEventListener('touchstart', (e) => {
    onDragStart(e.touches[0].clientX);
  }, { passive: true });
  carousel.addEventListener('touchmove', (e) => {
    onDragMove(e.touches[0].clientX);
  }, { passive: true });
  carousel.addEventListener('touchend', onDragEnd);
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

  document.getElementById('testimonialsCommissionBtn').addEventListener('click', () => {
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

  // Written message / reading donation toggle
  document.querySelectorAll('[data-field="wantsReading"] .option-card').forEach(card => {
    card.addEventListener('click', () => {
      const donationGroup = document.getElementById('donationGroup');
      donationGroup.style.display = card.dataset.value === 'yes' ? 'block' : 'none';
    });
  });

  // Print add-on toggle
  document.querySelectorAll('[data-field="wantsPrints"] .option-card').forEach(card => {
    card.addEventListener('click', () => {
      const printGroup = document.getElementById('printAddOnGroup');
      printGroup.style.display = card.dataset.value === 'yes' ? 'block' : 'none';
    });
  });

  // Shipping method toggle
  document.querySelectorAll('[data-field="shippingMethod"] .option-card').forEach(card => {
    card.addEventListener('click', () => {
      const addressGroup = document.getElementById('shippingAddressGroup');
      const handNote = document.getElementById('handDeliveredNote');
      const continueBtn = document.getElementById('shippingContinueBtn');
      if (card.dataset.value === 'shipped') {
        addressGroup.style.display = 'block';
        handNote.style.display = 'none';
      } else {
        addressGroup.style.display = 'none';
        handNote.style.display = 'block';
      }
      continueBtn.style.display = 'inline-block';
    });
  });

  // Print add-on quantity buttons
  document.querySelectorAll('.addon-plus').forEach(btn => {
    btn.addEventListener('click', () => {
      const size = btn.dataset.size;
      printAddOns[size]++;
      document.querySelector(`.addon-qty-value[data-size="${size}"]`).textContent = printAddOns[size];
    });
  });
  document.querySelectorAll('.addon-minus').forEach(btn => {
    btn.addEventListener('click', () => {
      const size = btn.dataset.size;
      if (printAddOns[size] > 0) printAddOns[size]--;
      document.querySelector(`.addon-qty-value[data-size="${size}"]`).textContent = printAddOns[size];
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
  clearSession();
}

function goToStep(stepNum) {
  state.currentStep = stepNum;
  saveSession();

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

  // Written message step — customize wording based on who the portrait is for
  if (stepNum === 11) {
    const subject = state.subject;
    const msgStep = document.querySelector('[data-step="11"]');
    const msgH2 = msgStep.querySelector('h2');
    const msgP = msgStep.querySelector('p');
    const giftNoteGroup = document.getElementById('giftNoteGroup');
    const channeledGroup = document.getElementById('channeledMessageGroup');

    if (subject === 'loved-one') {
      // Gift path — personal note replaces channeled message
      msgH2.textContent = 'Would you like to include a personal note?';
      msgP.textContent = 'Write a heartfelt message to accompany the portrait — it will be handwritten and included with the gift.';
      giftNoteGroup.style.display = 'block';
      channeledGroup.style.display = 'none';
    } else {
      // All other paths — channeled message
      giftNoteGroup.style.display = 'none';
      channeledGroup.style.display = 'block';

      if (subject === 'passed') {
        msgH2.textContent = 'Would you like a written message from your loved one?';
        msgP.textContent = 'During the creation of your portrait, Brittany can tune in and receive a personal written message from your loved one who has passed. This is offered by donation.';
      } else if (subject === 'myself') {
        msgH2.textContent = 'Would you like a message from your higher self?';
        msgP.textContent = 'During the creation of your portrait, Brittany can tune in and receive a personal written message from your higher self — words of guidance, love, and truth. This is offered by donation.';
      } else if (subject === 'family') {
        msgH2.textContent = 'Would you like a personal message for the family?';
        msgP.textContent = 'Brittany can tune in and receive a written message for your family — something meaningful to accompany the portrait. This is offered by donation.';
      } else {
        msgH2.textContent = 'Would you like a personal written message included?';
        msgP.textContent = 'Brittany can tune in and receive a personal written message to accompany your portrait. This is offered by donation.';
      }
    }
  }

  // If we're on the timeline step, build the delivery window grid
  if (stepNum === 9) {
    buildTimelineGrid();
  }

  // If we're on the shipping step, capture shipping fields
  if (stepNum === 13) {
    // Restore shipping UI state if revisiting
    if (state.shippingMethod) {
      const addressGroup = document.getElementById('shippingAddressGroup');
      const handNote = document.getElementById('handDeliveredNote');
      const continueBtn = document.getElementById('shippingContinueBtn');
      if (state.shippingMethod === 'shipped') {
        addressGroup.style.display = 'block';
        handNote.style.display = 'none';
      } else {
        addressGroup.style.display = 'none';
        handNote.style.display = 'block';
      }
      continueBtn.style.display = 'inline-block';
    }
  }

  // If we're on the summary step, capture add-ons + shipping then populate
  if (stepNum === 14) {
    // Capture rush checkbox
    state.rushRequested = document.getElementById('rushCheckbox').checked;

    // Capture gift message if on gift path
    if (state.subject === 'loved-one') {
      state.giftMessage = document.getElementById('giftMessage').value.trim();
    }
    if (state.wantsReading === 'yes') {
      state.donationAmount = document.getElementById('donationAmount').value.trim();
    }
    state.printAddOns = { ...printAddOns };

    // Capture shipping info
    if (state.shippingMethod === 'shipped') {
      state.shippingName = document.getElementById('shippingName').value.trim();
      state.shippingStreet = document.getElementById('shippingStreet').value.trim();
      state.shippingCity = document.getElementById('shippingCity').value.trim();
      state.shippingState = document.getElementById('shippingState').value.trim();
      state.shippingZip = document.getElementById('shippingZip').value.trim();
    }

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
    // Channeled skips steps 4,5,6 — renumber from 7 onward
    const mapping = { 7: '04', 8: '05', 9: '06', 10: '07', 11: '08', 12: '09', 13: '10', 14: '11' };
    document.querySelectorAll('.dynamic-step-num').forEach(el => {
      const step = el.closest('.flow-step');
      if (step && mapping[step.dataset.step]) {
        el.textContent = mapping[step.dataset.step];
      }
    });
  } else {
    // Reset to normal
    const mapping = { 7: '07', 8: '08', 9: '09', 10: '10', 11: '11', 12: '12', 13: '13', 14: '14' };
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
    // Fork: go to step 4 (energy/vision) or step 7 (channeled)
    setTimeout(() => {
      if (value === 'channeled') {
        goToStep(7);
      } else {
        goToStep(4);
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
  // colorPalette auto-advances unless "custom" is selected (needs textarea)
  if (field === 'colorPalette' && value !== 'custom') {
    setTimeout(() => {
      const sequence = getStepSequence();
      const currentIndex = getCurrentStepIndex();
      if (currentIndex < sequence.length - 1) {
        goToStep(sequence[currentIndex + 1]);
      }
    }, 300);
  }
  // For energy, user must click "Continue" (not auto-advance)
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

  // Print add-on total
  let printTotal = 0;
  for (const [size, qty] of Object.entries(printAddOns)) {
    printTotal += qty * (printAddOnPrices[size] || 0);
  }

  // Image capture fee — added when any print add-on is selected
  const hasAnyPrints = Object.values(printAddOns).some(qty => qty > 0);
  const imageCaptureFee = hasAnyPrints ? IMAGE_CAPTURE_FEE : 0;

  // Donation amount
  const donation = state.donationAmount ? parseFloat(state.donationAmount) || 0 : 0;

  return basePrice + channeledExtra + printTotal + imageCaptureFee + donation;
}

// ---- TIMELINE / DELIVERY WINDOW ----
function buildTimelineGrid() {
  const grid = document.getElementById('timelineGrid');
  const continueBtn = document.getElementById('timelineContinueBtn');
  const rushNotice = document.getElementById('rushNotice');

  // Update subtitle with size-specific lead time
  const subtitle = document.getElementById('timelineSubtitle');
  const rushWeeks = RUSH_WEEKS_BY_SIZE[state.size] || 6;
  const leadTimes = { '8x10': '4–6', '11x14': '6–8', '16x20': '8–12', '18x24': '8–12', '24x30': '10–14', '24x36': '10–14', '36x36': '12–16', '48x48': '14–20' };
  const timeRange = leadTimes[state.size] || '4–8';
  subtitle.textContent = `A ${state.size}" portrait typically takes ${timeRange} weeks. Select your preferred delivery window below.`;

  // Render the grid synchronously first, then apply blocked windows from server
  renderTimelineWindows(grid, continueBtn, rushNotice, []);

  // Try to fetch blocked windows (won't work on file://, that's fine)
  fetch('/api/availability')
    .then(res => res.json())
    .then(data => {
      const blocked = data.blockedWindows || [];
      if (blocked.length > 0) {
        renderTimelineWindows(grid, continueBtn, rushNotice, blocked);
      }
    })
    .catch(() => { /* Server unavailable — all windows stay available */ });
}

// Minimum lead times (weeks) per size — anything under this is a rush
const RUSH_WEEKS_BY_SIZE = {
  '8x10':  4,
  '11x14': 6,
  '16x20': 8,
  '18x24': 8,
  '24x30': 10,
  '24x36': 10,
  '36x36': 12,
  '48x48': 14
};

function renderTimelineWindows(grid, continueBtn, rushNotice, blockedWindows) {
  grid.innerHTML = '';

  const now = new Date();
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const periods = ['early', 'mid', 'late'];
  const RUSH_WEEKS = RUSH_WEEKS_BY_SIZE[state.size] || 6;

  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthLabel = months[d.getMonth()] + ' ' + d.getFullYear();
    const yearMonth = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');

    const monthEl = document.createElement('div');
    monthEl.className = 'timeline-month';
    monthEl.innerHTML = `<div class="timeline-month-label">${monthLabel}</div>`;

    const windowsEl = document.createElement('div');
    windowsEl.className = 'timeline-windows';

    periods.forEach(p => {
      const key = yearMonth + '-' + p;
      const isBlocked = blockedWindows.includes(key);

      // Calculate approximate date for rush detection
      const approxDay = p === 'early' ? 5 : p === 'mid' ? 15 : 25;
      const windowDate = new Date(d.getFullYear(), d.getMonth(), approxDay);
      const weeksAway = (windowDate - now) / (1000 * 60 * 60 * 24 * 7);
      const isRush = weeksAway > 0 && weeksAway < RUSH_WEEKS;
      const isPast = weeksAway < 0;

      const btn = document.createElement('button');
      btn.className = 'timeline-window';
      btn.dataset.window = key;
      btn.innerHTML = `<span class="window-label">${p.charAt(0).toUpperCase() + p.slice(1)}</span>`;

      if (isBlocked || isPast) {
        btn.classList.add('blocked');
        btn.disabled = true;
      } else if (isRush) {
        btn.classList.add('rush');
        btn.innerHTML += `<span class="rush-badge">Rush</span>`;
      }

      btn.addEventListener('click', () => {
        grid.querySelectorAll('.timeline-window').forEach(w => w.classList.remove('selected'));
        btn.classList.add('selected');
        state.deliveryWindow = key;

        const isRushSelection = btn.classList.contains('rush');
        rushNotice.style.display = isRushSelection ? 'block' : 'none';

        // If rush, require acknowledgment before showing continue
        if (isRushSelection) {
          const checkbox = document.getElementById('rushCheckbox');
          checkbox.checked = false;
          continueBtn.style.display = 'none';
          checkbox.onchange = () => {
            continueBtn.style.display = checkbox.checked ? 'inline-block' : 'none';
          };
        } else {
          continueBtn.style.display = 'inline-block';
        }
      });

      windowsEl.appendChild(btn);
    });

    monthEl.appendChild(windowsEl);
    grid.appendChild(monthEl);
  }

  // Restore selection if revisiting
  if (state.deliveryWindow) {
    const selected = grid.querySelector(`[data-window="${state.deliveryWindow}"]`);
    if (selected && !selected.disabled) {
      selected.classList.add('selected');
      continueBtn.style.display = 'inline-block';
      rushNotice.style.display = selected.classList.contains('rush') ? 'block' : 'none';
    }
  }
}

function formatDeliveryWindow(key) {
  if (!key) return '—';
  const [year, month, period] = key.split('-');
  const months = ['','January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${period.charAt(0).toUpperCase() + period.slice(1)} ${months[parseInt(month)]} ${year}`;
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
  if (state.wantsReading === 'yes') {
    state.donationAmount = document.getElementById('donationAmount').value.trim();
  }
  state.printAddOns = { ...printAddOns };

  // Go to shipping
  goToStep(13);
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
    size: 'Size',
    wantsReading: 'Written Message',
    wantsPrints: 'Print Add-Ons'
  };

  const formatValue = (key, val) => {
    if (!val) return '—';
    const maps = {
      subject: { 'myself': 'Myself', 'loved-one': 'A Loved One (Gift)', 'family': 'A Family / Group', 'pet': 'A Pet', 'passed': 'Someone Who Has Passed', 'other': 'Other' },
      energy: { 'healing': 'Healing', 'celebration': 'Celebration', 'remembrance': 'Remembrance', 'love': 'Love', 'empowerment': 'Empowerment', 'transformation': 'Transformation', 'channel': 'Let Brittany Channel' },
      approach: { 'vision': 'I Have a Vision', 'channeled': 'Fully Channeled' },
      style: { 'colored-pencil': 'Colored Pencil', 'painted': 'Painted', 'mixed-media': 'Mixed Media', 'brittanys-choice': "Brittany's Choice" },
      colorPalette: { 'warm': 'Warm Tones', 'cool': 'Cool Tones', 'neutral': 'Neutral & Soft', 'bold': 'Bold & Vibrant', 'channel': 'Let Brittany Channel', 'custom': 'Custom' },
      size: { '8x10': '8 × 10', '11x14': '11 × 14', '16x20': '16 × 20', '18x24': '18 × 24', '24x30': '24 × 30', '24x36': '24 × 36', '36x36': '36 × 36', '48x48': '48 × 48', 'custom': 'Custom Size' },
      wantsReading: { 'yes': 'Yes (by donation)', 'no': 'No' },
      wantsPrints: { 'yes': 'Yes', 'no': 'No' }
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

  // Delivery window
  if (state.deliveryWindow) {
    let windowText = formatDeliveryWindow(state.deliveryWindow);
    if (state.rushRequested) windowText += ' (Rush Requested)';
    html += `<div class="summary-row">
      <span class="summary-label">Delivery Window</span>
      <span class="summary-value">${windowText}</span>
    </div>`;
  }

  // Gift message
  if (state.subject === 'loved-one' && state.giftMessage) {
    html += `<div class="summary-row">
      <span class="summary-label">Personal Note</span>
      <span class="summary-value">${state.giftMessage}</span>
    </div>`;
  }

  // Add photos count
  if (state.photos.length > 0) {
    html += `<div class="summary-row">
      <span class="summary-label">Reference Photos</span>
      <span class="summary-value">${state.photos.length} uploaded</span>
    </div>`;
  }

  // Add print add-on details
  const addOnEntries = Object.entries(printAddOns).filter(([, qty]) => qty > 0);
  if (addOnEntries.length > 0) {
    addOnEntries.forEach(([size, qty]) => {
      const price = qty * printAddOnPrices[size];
      html += `<div class="summary-row">
        <span class="summary-label">Print: ${size}</span>
        <span class="summary-value">${qty} × $${printAddOnPrices[size]} = $${price}</span>
      </div>`;
    });
  }

  // Add custom print request
  const customReq = document.getElementById('customPrintRequest');
  if (customReq && customReq.value.trim()) {
    html += `<div class="summary-row">
      <span class="summary-label">Custom Request</span>
      <span class="summary-value">${customReq.value.trim()}</span>
    </div>`;
  }

  // Image capture fee line (when prints are selected)
  const hasAnyPrints = Object.values(printAddOns).some(qty => qty > 0);
  if (hasAnyPrints) {
    html += `<div class="summary-row">
      <span class="summary-label">Image Capture Fee</span>
      <span class="summary-value">$${IMAGE_CAPTURE_FEE}</span>
    </div>`;
  }

  // Add donation amount
  if (state.wantsReading === 'yes' && state.donationAmount) {
    html += `<div class="summary-row">
      <span class="summary-label">Written Message Donation</span>
      <span class="summary-value">$${state.donationAmount}</span>
    </div>`;
  }

  // Shipping info
  if (state.shippingMethod) {
    const shippingLabel = state.shippingMethod === 'shipped' ? 'Shipped' : 'Hand Delivered';
    html += `<div class="summary-row">
      <span class="summary-label">Delivery</span>
      <span class="summary-value">${shippingLabel}</span>
    </div>`;
    if (state.shippingMethod === 'shipped' && state.shippingStreet) {
      html += `<div class="summary-row">
        <span class="summary-label">Ship To</span>
        <span class="summary-value">${state.shippingName}<br>${state.shippingStreet}<br>${state.shippingCity}, ${state.shippingState} ${state.shippingZip}</span>
      </div>`;
    }
  }

  card.innerHTML = html;

  // Total
  const total = calculateTotal();
  if (total > 0) {
    totalEl.textContent = 'Total: $' + total;
  } else {
    totalEl.textContent = 'Pricing to be determined';
  }

  // Payment options (with surcharges for non-full-pay options)
  const depositTotal = Math.round(total * (1 + CONFIG.depositSurchargePercent / 100));
  const depositNow = Math.round(depositTotal * (CONFIG.depositPercent / 100));
  const planTotal = Math.round(total * (1 + CONFIG.paymentPlanSurchargePercent / 100));
  const planAmount = Math.round(planTotal / CONFIG.paymentPlanInstallments);

  let paymentHtml = '';

  if (total > 0) {
    paymentHtml += `
      <a href="${CONFIG.stripeLinks.full || '#'}" class="payment-card" target="_blank" rel="noopener" data-payment="full">
        <div class="payment-card-title">Pay in Full</div>
        <div class="payment-card-amount">$${total}</div>
        <div class="payment-card-note">Best price — one-time payment</div>
      </a>
      <a href="${CONFIG.stripeLinks.deposit || '#'}" class="payment-card" target="_blank" rel="noopener" data-payment="deposit">
        <div class="payment-card-title">${CONFIG.depositPercent}% Deposit</div>
        <div class="payment-card-amount">$${depositNow} now</div>
        <div class="payment-card-note">$${depositTotal} total (+${CONFIG.depositSurchargePercent}%)</div>
      </a>
      <a href="${CONFIG.stripeLinks.plan || '#'}" class="payment-card" target="_blank" rel="noopener" data-payment="plan">
        <div class="payment-card-title">Payment Plan</div>
        <div class="payment-card-amount">${CONFIG.paymentPlanInstallments} × $${planAmount}</div>
        <div class="payment-card-note">$${planTotal} total (+${CONFIG.paymentPlanSurchargePercent}%)</div>
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

  // Calculate actual charge amount based on payment type (with surcharges)
  let chargeAmount = total;
  if (paymentType === 'deposit') {
    const depositTotal = Math.round(total * (1 + CONFIG.depositSurchargePercent / 100));
    chargeAmount = Math.round(depositTotal * (CONFIG.depositPercent / 100));
  } else if (paymentType === 'plan') {
    const planTotal = Math.round(total * (1 + CONFIG.paymentPlanSurchargePercent / 100));
    chargeAmount = Math.round(planTotal / CONFIG.paymentPlanInstallments);
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
    deliveryWindow: state.deliveryWindow,
    rushRequested: state.rushRequested,
    giftMessage: state.giftMessage,
    shippingMethod: state.shippingMethod,
    shippingName: state.shippingName,
    shippingStreet: state.shippingStreet,
    shippingCity: state.shippingCity,
    shippingState: state.shippingState,
    shippingZip: state.shippingZip,
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
// ---- SESSION PERSISTENCE ----
function saveSession() {
  try {
    sessionStorage.setItem('ba_flow_state', JSON.stringify(state));
    sessionStorage.setItem('ba_flow_prints', JSON.stringify(printAddOns));
    sessionStorage.setItem('ba_flow_active', 'true');
  } catch (e) { /* ignore */ }
}

function clearSession() {
  try {
    sessionStorage.removeItem('ba_flow_state');
    sessionStorage.removeItem('ba_flow_prints');
    sessionStorage.removeItem('ba_flow_active');
  } catch (e) { /* ignore */ }
}

function restoreSession() {
  try {
    if (sessionStorage.getItem('ba_flow_active') !== 'true') return false;
    const saved = sessionStorage.getItem('ba_flow_state');
    if (!saved) return false;

    const parsed = JSON.parse(saved);
    Object.assign(state, parsed);

    // Restore print add-on quantities
    const savedPrints = sessionStorage.getItem('ba_flow_prints');
    if (savedPrints) {
      const parsedPrints = JSON.parse(savedPrints);
      Object.assign(printAddOns, parsedPrints);
    }

    return true;
  } catch (e) {
    return false;
  }
}

function resetState() {
  clearSession();
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
    paymentOption: null,
    deliveryWindow: null,
    rushRequested: false,
    giftMessage: '',
    shippingMethod: null,
    shippingName: '',
    shippingStreet: '',
    shippingCity: '',
    shippingState: '',
    shippingZip: ''
  });

  // Reset form inputs
  document.querySelectorAll('.option-card.selected').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('.flow-step textarea').forEach(t => { t.value = ''; });
  document.querySelectorAll('.flow-step input').forEach(i => { i.value = ''; });
  document.getElementById('uploadPreviews').innerHTML = '';
  document.getElementById('customColorGroup').style.display = 'none';
  document.getElementById('donationGroup').style.display = 'none';
  document.getElementById('printAddOnGroup').style.display = 'none';
  document.getElementById('shippingAddressGroup').style.display = 'none';
  document.getElementById('handDeliveredNote').style.display = 'none';
  document.getElementById('shippingContinueBtn').style.display = 'none';
  document.getElementById('timelineContinueBtn').style.display = 'none';
  document.getElementById('rushNotice').style.display = 'none';
  document.getElementById('rushCheckbox').checked = false;
  // Reset print add-on quantities
  Object.keys(printAddOns).forEach(size => {
    printAddOns[size] = 0;
    const el = document.querySelector(`.addon-qty-value[data-size="${size}"]`);
    if (el) el.textContent = '0';
  });
  clearFormErrors();
}
