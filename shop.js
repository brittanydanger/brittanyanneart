/* ============================================
   BrittanyAnne Print Shop
   shop.js
   ============================================ */

/* ----- SHOP CONFIG -----
   All configurable values live in config.js (SITE_CONFIG).
   This alias keeps existing references working.
   ============================================ */
const SHOP_CONFIG = {
  stripePublishableKey: SITE_CONFIG.stripePublishableKey,
  shippingFlat: SITE_CONFIG.shippingFlat,
  freeShippingThreshold: SITE_CONFIG.freeShippingThreshold,
  shippingNote: SITE_CONFIG.shippingNote,
  prints: SITE_CONFIG.prints
};


/* ============================================
   STATE
   ============================================ */
let cart = [];
let currentProduct = null;
let selectedSize = null;
let quantity = 1;
let activeCategory = 'all';
let activeSort = 'newest';


/* ============================================
   DOM REFS
   ============================================ */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const printGrid       = $('#printGrid');
const productOverlay  = $('#productOverlay');
const productMainImg  = $('#productMainImg');
const productThumbs   = $('#productThumbs');
const productTitle    = $('#productTitle');
const productStory    = $('#productStory');
const productSizes    = $('#productSizes');
const productPrice    = $('#productPrice');
const qtyValue        = $('#qtyValue');
const addToCartBtn    = $('#addToCartBtn');
const buyNowBtn       = $('#buyNowBtn');
const cartOverlay     = $('#cartOverlay');
const cartDrawer      = $('#cartDrawer');
const cartItems       = $('#cartItems');
const cartEmpty       = $('#cartEmpty');
const cartFooter      = $('#cartFooter');
const cartSubtotal    = $('#cartSubtotal');
const cartShipping    = $('#cartShipping');
const cartCount       = $('#cartCount');
const mobileCartBar   = $('#mobileCartBar');
const mobileCartCount = $('#mobileCartCount');
const toast           = $('#toast');
const comingSoon      = $('#comingSoon');
const emptyState      = $('#emptyState');
const shippingNote    = $('#shippingNote');


/* ============================================
   INIT
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
  loadCart();
  renderGrid();
  bindEvents();
  updateCartUI();
  if (shippingNote) {
    shippingNote.textContent = SHOP_CONFIG.shippingNote;
  }
});


/* ============================================
   RENDER PRINT GRID
   ============================================ */
function renderGrid() {
  const prints = getFilteredSorted();

  if (SHOP_CONFIG.prints.length === 0) {
    printGrid.style.display = 'none';
    emptyState.style.display = 'block';
    comingSoon.style.display = 'none';
    return;
  }

  printGrid.innerHTML = '';
  emptyState.style.display = 'none';

  if (prints.length === 0) {
    printGrid.innerHTML = '<p style="grid-column:1/-1; text-align:center; font-style:italic; opacity:0.6; padding: 3rem 0;">No prints in this category yet.</p>';
    comingSoon.style.display = 'none';
    return;
  }

  prints.forEach((print, i) => {
    const card = document.createElement('div');
    card.className = 'print-card';
    card.setAttribute('data-id', print.id);
    card.style.transitionDelay = `${i * 0.08}s`;

    const minPrice = getMinPrice(print);
    const tagHTML = print.tags.length > 0
      ? `<span class="print-tag">${capitalize(print.tags[0])}</span>`
      : '';

    const imageHTML = print.image
      ? `<img src="${print.image}" alt="${print.title}" loading="lazy">`
      : `<div class="print-card-placeholder" style="background:${print.placeholderColor}">${print.title}</div>`;

    const priceLabel = print.digital ? `$${minPrice}` : `From $${minPrice}`;
    const digitalBadge = print.digital ? '<span class="print-tag digital-tag">Digital</span>' : '';

    card.innerHTML = `
      <div class="print-card-image">
        ${imageHTML}
        ${tagHTML || digitalBadge}
      </div>
      <div class="print-card-info">
        <h3 class="print-card-title">${print.title}</h3>
        <p class="print-card-price">${priceLabel}</p>
      </div>
    `;

    card.addEventListener('click', () => openProduct(print));
    printGrid.appendChild(card);
  });

  // Show "more coming soon" if < 4 prints
  comingSoon.style.display = SHOP_CONFIG.prints.length < 4 ? 'block' : 'none';

  // Trigger staggered fade-in via IntersectionObserver
  observeCards();
}


/* ============================================
   FILTERING & SORTING
   ============================================ */
function getFilteredSorted() {
  let prints = [...SHOP_CONFIG.prints];

  // Filter
  if (activeCategory !== 'all') {
    prints = prints.filter(p => p.category === activeCategory);
  }

  // Sort
  switch (activeSort) {
    case 'price-low':
      prints.sort((a, b) => getMinPrice(a) - getMinPrice(b));
      break;
    case 'price-high':
      prints.sort((a, b) => getMinPrice(b) - getMinPrice(a));
      break;
    case 'newest':
    default:
      prints.sort((a, b) => a.sortOrder - b.sortOrder);
      break;
  }

  return prints;
}

function getMinPrice(print) {
  const prices = Object.values(print.sizes).map(s => s.price);
  return Math.min(...prices);
}


/* ============================================
   PRODUCT DETAIL MODAL
   ============================================ */
function openProduct(print) {
  currentProduct = print;
  const sizeKeys = Object.keys(print.sizes);
  selectedSize = sizeKeys[0];
  quantity = 1;

  // Title & story
  productTitle.textContent = print.title;
  productStory.textContent = print.description;

  // Main image
  if (print.image) {
    productMainImg.src = print.image;
    productMainImg.alt = print.title;
  } else {
    productMainImg.src = '';
    productMainImg.alt = print.title;
    productMainImg.style.display = 'none';
    const mainWrap = productMainImg.parentElement;
    mainWrap.style.background = print.placeholderColor;
  }

  // Thumbnails
  productThumbs.innerHTML = '';
  if (print.images && print.images.length > 1) {
    print.images.forEach((img, i) => {
      const thumb = document.createElement('div');
      thumb.className = `product-thumb${i === 0 ? ' active' : ''}`;
      thumb.innerHTML = `<img src="${img}" alt="${print.title} view ${i + 1}">`;
      thumb.addEventListener('click', () => {
        productMainImg.src = img;
        $$('.product-thumb').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
      });
      productThumbs.appendChild(thumb);
    });
  }

  // Sizes
  productSizes.innerHTML = '';
  sizeKeys.forEach(size => {
    const btn = document.createElement('button');
    btn.className = `size-btn${size === selectedSize ? ' active' : ''}`;
    btn.textContent = size;
    btn.addEventListener('click', () => {
      selectedSize = size;
      $$('.size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateProductPrice();
    });
    productSizes.appendChild(btn);
  });

  // Price & quantity
  updateProductPrice();
  qtyValue.textContent = quantity;

  // Reset add button
  addToCartBtn.textContent = 'Add to Cart';
  addToCartBtn.classList.remove('added');

  // Reset image display
  productMainImg.style.display = '';
  productMainImg.parentElement.style.background = '';

  if (!print.image) {
    productMainImg.style.display = 'none';
    productMainImg.parentElement.style.background = print.placeholderColor;
  }

  // Update specs for digital vs physical
  if (print.digital) {
    shippingNote.textContent = 'Instant digital download — PDF delivered to your email';
    document.querySelector('.product-specs').innerHTML = `
      <li>Digital download — 20 printable 8×10 cards</li>
      <li>High-resolution PDF, ready to print at home or a print shop</li>
      <li>Delivered instantly to your email after purchase</li>
    `;
  } else {
    shippingNote.textContent = SHOP_CONFIG.shippingNote;
    document.querySelector('.product-specs').innerHTML = `
      <li>Museum-quality print on archival paper</li>
      <li>Printed and shipped by the artist</li>
      <li id="shippingNote">${SHOP_CONFIG.shippingNote}</li>
    `;
  }

  // Open
  productOverlay.classList.add('open');
  productOverlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeProduct() {
  productOverlay.classList.remove('open');
  productOverlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  currentProduct = null;
}

function updateProductPrice() {
  if (!currentProduct || !selectedSize) return;
  const price = currentProduct.sizes[selectedSize].price;
  productPrice.textContent = `$${price}`;
}


/* ============================================
   CART LOGIC
   ============================================ */
function addToCart(product, size, qty) {
  const key = `${product.id}_${size}`;
  const existing = cart.find(item => item.key === key);

  if (existing) {
    existing.quantity += qty;
  } else {
    cart.push({
      key,
      productId: product.id,
      title: product.title,
      image: product.image,
      placeholderColor: product.placeholderColor,
      size,
      price: product.sizes[size].price,
      stripePriceId: product.sizes[size].stripePriceId,
      quantity: qty
    });
  }

  saveCart();
  updateCartUI();
  showToast(`${product.title} (${size}) added to cart`);
}

function removeFromCart(key) {
  cart = cart.filter(item => item.key !== key);
  saveCart();
  updateCartUI();
  renderCartItems();
}

function updateItemQty(key, delta) {
  const item = cart.find(i => i.key === key);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity < 1) {
    removeFromCart(key);
    return;
  }
  saveCart();
  updateCartUI();
  renderCartItems();
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function getCartCount() {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function getShipping() {
  const total = getCartTotal();
  if (SHOP_CONFIG.freeShippingThreshold > 0 && total >= SHOP_CONFIG.freeShippingThreshold) {
    return 0;
  }
  return SHOP_CONFIG.shippingFlat;
}


/* ============================================
   CART UI
   ============================================ */
function updateCartUI() {
  const count = getCartCount();

  // Nav cart count badge
  cartCount.textContent = count;
  cartCount.classList.toggle('show', count > 0);

  // Mobile cart bar
  if (window.innerWidth < 768) {
    mobileCartBar.style.display = count > 0 ? 'block' : 'none';
    mobileCartCount.textContent = count;
  } else {
    mobileCartBar.style.display = 'none';
  }
}

function renderCartItems() {
  const count = getCartCount();
  const total = getCartTotal();
  const shipping = getShipping();

  if (count === 0) {
    cartItems.innerHTML = '';
    cartEmpty.style.display = 'flex';
    cartFooter.style.display = 'none';
    return;
  }

  cartEmpty.style.display = 'none';
  cartFooter.style.display = 'block';

  cartItems.innerHTML = '';
  cart.forEach(item => {
    const el = document.createElement('div');
    el.className = 'cart-item';

    const imgHTML = item.image
      ? `<img src="${item.image}" alt="${item.title}">`
      : `<div style="width:100%;height:100%;background:${item.placeholderColor}"></div>`;

    el.innerHTML = `
      <div class="cart-item-thumb">${imgHTML}</div>
      <div class="cart-item-info">
        <div class="cart-item-title">${item.title}</div>
        <div class="cart-item-size">${item.size}</div>
        <div class="cart-item-qty">
          <button data-key="${item.key}" data-delta="-1" aria-label="Decrease">&minus;</button>
          <span>${item.quantity}</span>
          <button data-key="${item.key}" data-delta="1" aria-label="Increase">+</button>
        </div>
      </div>
      <div class="cart-item-right">
        <div class="cart-item-price">$${item.price * item.quantity}</div>
        <button class="cart-item-remove" data-key="${item.key}">Remove</button>
      </div>
    `;
    cartItems.appendChild(el);
  });

  // Bind cart item buttons
  cartItems.querySelectorAll('.cart-item-qty button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      updateItemQty(btn.dataset.key, parseInt(btn.dataset.delta));
    });
  });

  cartItems.querySelectorAll('.cart-item-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeFromCart(btn.dataset.key);
    });
  });

  // Subtotal & shipping
  cartSubtotal.textContent = `$${total}`;
  if (shipping === 0) {
    cartShipping.textContent = 'Free shipping';
  } else {
    const remaining = SHOP_CONFIG.freeShippingThreshold - total;
    if (SHOP_CONFIG.freeShippingThreshold > 0 && remaining > 0) {
      cartShipping.textContent = `Shipping: $${shipping} · Free shipping on orders over $${SHOP_CONFIG.freeShippingThreshold} ($${remaining} away)`;
    } else {
      cartShipping.textContent = `Shipping: $${shipping}`;
    }
  }
}

function openCart() {
  renderCartItems();
  cartDrawer.classList.add('open');
  cartDrawer.setAttribute('aria-hidden', 'false');
  cartOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  cartDrawer.classList.remove('open');
  cartDrawer.setAttribute('aria-hidden', 'true');
  cartOverlay.classList.remove('open');
  document.body.style.overflow = '';
}


/* ============================================
   CART PERSISTENCE (sessionStorage)
   ============================================ */
function saveCart() {
  try {
    sessionStorage.setItem('baa_cart', JSON.stringify(cart));
  } catch (e) {
    // sessionStorage unavailable
  }
}

function loadCart() {
  try {
    const saved = sessionStorage.getItem('baa_cart');
    if (saved) cart = JSON.parse(saved);
  } catch (e) {
    cart = [];
  }
}


/* ============================================
   STRIPE CHECKOUT (via server API)
   ============================================ */
async function handleCheckout() {
  if (cart.length === 0) return;

  const shipping = getShipping();
  const items = cart.map(item => ({
    title: item.title,
    size: item.size,
    price: item.price,
    quantity: item.quantity
  }));

  try {
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'print',
        items,
        metadata: { shipping }
      })
    });

    const result = await res.json();
    if (result.url) {
      window.location.href = result.url;
    } else {
      showToast(result.error || 'Unable to start checkout');
    }
  } catch (e) {
    showToast('Unable to connect to checkout. Please try again.');
  }
}

async function handleBuyNow() {
  if (!currentProduct || !selectedSize) return;

  const sizeData = currentProduct.sizes[selectedSize];
  const shipping = SHOP_CONFIG.shippingFlat;

  try {
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'print',
        items: [{
          title: currentProduct.title,
          size: selectedSize,
          price: sizeData.price,
          quantity: quantity
        }],
        metadata: {
          shipping: (sizeData.price * quantity) >= SHOP_CONFIG.freeShippingThreshold ? 0 : shipping
        }
      })
    });

    const result = await res.json();
    if (result.url) {
      window.location.href = result.url;
    } else {
      // Fallback: add to cart
      addToCart(currentProduct, selectedSize, quantity);
      closeProduct();
      openCart();
    }
  } catch (e) {
    // Fallback: add to cart
    addToCart(currentProduct, selectedSize, quantity);
    closeProduct();
    openCart();
  }
}


/* ============================================
   TOAST
   ============================================ */
let toastTimeout = null;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}


/* ============================================
   INTERSECTION OBSERVER — staggered fade-in
   ============================================ */
function observeCards() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  $$('.print-card').forEach(card => observer.observe(card));
}


/* ============================================
   EVENT BINDINGS
   ============================================ */
function bindEvents() {
  // Nav mobile toggle
  const navToggle = $('#navToggle');
  const navLinks  = $('#navLinks');
  navToggle.addEventListener('click', () => {
    const open = navToggle.classList.toggle('open');
    navLinks.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', open);
  });

  // Cart open/close
  $('#cartToggle').addEventListener('click', openCart);
  $('#cartClose').addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);
  $('#continueShopping').addEventListener('click', closeCart);
  $('#mobileCartBtn').addEventListener('click', openCart);

  // Product modal close
  $('#productClose').addEventListener('click', closeProduct);
  productOverlay.addEventListener('click', (e) => {
    if (e.target === productOverlay) closeProduct();
  });

  // Quantity
  $('#qtyMinus').addEventListener('click', () => {
    if (quantity > 1) {
      quantity--;
      qtyValue.textContent = quantity;
    }
  });
  $('#qtyPlus').addEventListener('click', () => {
    quantity++;
    qtyValue.textContent = quantity;
  });

  // Add to cart
  addToCartBtn.addEventListener('click', () => {
    if (!currentProduct || !selectedSize) return;
    addToCart(currentProduct, selectedSize, quantity);
    addToCartBtn.textContent = 'Added \u2713';
    addToCartBtn.classList.add('added');
    setTimeout(() => {
      addToCartBtn.textContent = 'Add to Cart';
      addToCartBtn.classList.remove('added');
    }, 1500);
  });

  // Buy now
  buyNowBtn.addEventListener('click', handleBuyNow);

  // Checkout
  $('#checkoutBtn').addEventListener('click', handleCheckout);

  // Filter pills
  $$('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      activeCategory = pill.dataset.category;
      $$('.filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      renderGrid();
    });
  });

  // Sort
  $('#sortSelect').addEventListener('change', (e) => {
    activeSort = e.target.value;
    renderGrid();
  });

  // Escape key closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (productOverlay.classList.contains('open')) closeProduct();
      else if (cartDrawer.classList.contains('open')) closeCart();
    }
  });

  // Handle resize for mobile cart bar
  window.addEventListener('resize', updateCartUI);

  // Check for cancel URL param (success now redirects to success.html)
  const params = new URLSearchParams(window.location.search);
  if (params.get('canceled') === 'true') {
    showToast('Checkout was canceled');
    window.history.replaceState({}, '', 'shop.html');
  }
}


/* ============================================
   HELPERS
   ============================================ */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
