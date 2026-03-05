/* ============================================
   BrittanyAnne Intuitive Fine Art
   config.js — ALL configurable values

   Brittany: This is YOUR file. Edit prices, print
   listings, copy, and settings here. The developer
   handles everything else — you never need to touch
   app.js, shop.js, or any other file.
   ============================================ */

const SITE_CONFIG = {

  // ============================================
  // COMMISSION PRICING
  // ============================================

  // Pricing matrix: pricing[size][subjects] = dollar amount
  // Use null for sizes/subject combos you don't offer
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

  // Sizes where prices are "starting at" (shows "From $X")
  startingAtSizes: ['48x48'],

  // Extra cost for fully intuitive/channeled approach (0 = same price)
  channeledPremium: 0,

  // Medium premiums — percentage added to base price per medium
  mediumPremiums: {
    'colored-pencil': 0,
    'digital': 0,
    'watercolor': 0.15,
    'acrylic': 0.20,
    'mixed-media': 0.25,
    'brittanys-choice': 0.25
  },

  // Rush fee — flat rate added when client selects a rush delivery window
  rushFee: 150,


  // ============================================
  // PAYMENT OPTIONS
  // ============================================

  depositPercent: 50,
  depositSurchargePercent: 7,       // % increase for deposit option
  paymentPlanInstallments: 3,
  paymentPlanSurchargePercent: 10,  // % increase for payment plan


  // ============================================
  // PRINT ADD-ONS (in commission flow)
  // ============================================

  printAddOnPrices: { '5x7': 25, '8x10': 40, '11x14': 65 },
  imageCaptureFee: 75,  // One-time fee when any print add-on is selected


  // ============================================
  // LEAD TIMES & RUSH THRESHOLDS
  // ============================================

  // Shown to client when they pick a size
  leadTimes: {
    '8x10':  '2–3 weeks',
    '11x14': '4–6 weeks',
    '16x20': '6–8 weeks',
    '18x24': '6–8 weeks',
    '24x30': '2–3 months',
    '24x36': '2–3 months',
    '36x36': '2.5–3 months',
    '48x48': '3–4 months'
  },

  // Minimum lead time (in weeks) per size — anything under this is a rush
  rushWeeksBySize: {
    '8x10':  2,
    '11x14': 4,
    '16x20': 6,
    '18x24': 6,
    '24x30': 8,
    '24x36': 8,
    '36x36': 10,
    '48x48': 12
  },

  turnaroundTime: '4–8 weeks',  // General turnaround shown in copy


  // ============================================
  // WRITTEN MESSAGE COPY (per subject type)
  // ============================================

  messageCopy: {
    'loved-one': {
      heading: 'Would you like to include a personal note?',
      description: 'Write a heartfelt message to accompany the portrait — it will be handwritten and included with the gift.'
    },
    'passed': {
      heading: 'Would you like a written message with your portrait?',
      description: 'Brittany approaches each portrait with deep reverence and intentionality. If you\u2019d like, she can include a heartfelt written message inspired by the spirit of the artwork and the story behind it.'
    },
    'myself': {
      heading: 'Would you like a personal message with your portrait?',
      description: 'Brittany approaches each portrait with deep reverence and intentionality. If you\u2019d like, she can include a heartfelt written message — words of guidance, love, and truth — inspired by the spirit of the artwork.'
    },
    'family': {
      heading: 'Would you like a personal message for the family?',
      description: 'Brittany can include a heartfelt written message for your family — something meaningful to accompany the portrait. This is offered by donation.'
    },
    'default': {
      heading: 'Would you like a written message with your portrait?',
      description: 'Brittany approaches each portrait with deep reverence and intentionality. If you\u2019d like, she can include a heartfelt written message inspired by the spirit of the artwork and the story behind it.'
    }
  },


  // ============================================
  // CONTACT & SOCIAL
  // ============================================

  email: 'hello@brittanyanneart.com',
  social: {
    instagram: '',
    facebook: '',
    tiktok: 'https://www.tiktok.com/@brittanyanneart'
  },

  // External shop URL (Etsy, Shopify, etc.) — leave empty if not used
  shopUrl: '',


  // ============================================
  // STRIPE
  // ============================================

  stripePublishableKey: '',

  // Stripe Payment Links
  stripeLinks: {
    'full': '',
    'deposit': '',
    'plan': ''
  },


  // ============================================
  // SHOP — PRINT PRODUCTS
  // ============================================

  // Shipping
  shippingFlat: 8,
  freeShippingThreshold: 75,
  shippingNote: 'Ships within 5–7 business days',

  // Print listings — add, edit, or remove prints here
  prints: [
    {
      id: 'print-001',
      title: 'Heaven Sent',
      description: 'A child wrapped in the warmth of heaven — soft pink clouds parting as she steps forward in white. This piece carries the energy of innocence, divine purpose, and the sacred moment a soul arrives earthside.',
      image: 'images/Prints/Christ%20coming%20for%20Claire%20II.jpg',
      images: ['images/Prints/Christ%20coming%20for%20Claire%20II.jpg'],
      category: 'sacred',
      tags: ['new'],
      placeholderColor: '#F2C4B0',
      sizes: {
        '5x7':   { price: 25, stripePriceId: '' },
        '8x10':  { price: 40, stripePriceId: '' },
        '11x14': { price: 65, stripePriceId: '' }
      },
      sortOrder: 1
    },
    {
      id: 'print-002',
      title: 'Well Done',
      description: 'A sacred reunion — the moment of being welcomed home with open arms and radiant joy. This piece carries the energy of divine love, recognition, and the promise that you are known and celebrated beyond the veil.',
      image: 'images/Prints/IMG_9723.jpg',
      images: ['images/Prints/IMG_9723.jpg'],
      category: 'sacred',
      tags: [],
      placeholderColor: '#C9B48A',
      sizes: {
        '5x7':   { price: 25, stripePriceId: '' },
        '8x10':  { price: 40, stripePriceId: '' },
        '11x14': { price: 65, stripePriceId: '' }
      },
      sortOrder: 2
    },
    {
      id: 'print-003',
      title: 'Birth Affirmation Cards — Non-Religious',
      description: 'A set of 20 beautifully hand-drawn 8\u00d710 birth affirmation cards in earthy, soothing tones. Designed to ground and empower you through labor and delivery. Display them in your birth space as visual anchors of calm and strength.',
      image: 'images/Amazon%20Storefront%20Birth%20Cards/1%20Cover%20Image%20NR.jpg',
      images: [
        'images/Amazon%20Storefront%20Birth%20Cards/1%20Cover%20Image%20NR.jpg',
        'images/Amazon%20Storefront%20Birth%20Cards/2%20Visual%20Design%20-%20done.jpg',
        'images/Amazon%20Storefront%20Birth%20Cards/3%20Diverse%20Affirmations%20-%20done.jpg',
        'images/Amazon%20Storefront%20Birth%20Cards/5%20Group%20of%20Cards%20-%20done.jpg',
        'images/Amazon%20Storefront%20Birth%20Cards/6%20Quality%20-%20done.jpg'
      ],
      category: 'affirmations',
      tags: ['new', 'digital'],
      placeholderColor: '#C4A98A',
      digital: true,
      downloadFile: '',
      sizes: {
        'Digital Download': { price: 17.77, stripePriceId: '' }
      },
      sortOrder: 3
    },
    {
      id: 'print-004',
      title: 'Birth Affirmation Cards — Faith-Based',
      description: 'A set of 20 beautifully hand-drawn 8\u00d710 birth affirmation cards rooted in faith. Earthy tones and soothing imagery paired with scripture-inspired words to carry you through labor with peace and trust in God\u2019s plan.',
      image: 'images/Amazon%20Storefront%20Birth%20Cards/1%20Cover%20Image%20R.jpg',
      images: [
        'images/Amazon%20Storefront%20Birth%20Cards/1%20Cover%20Image%20R.jpg',
        'images/Amazon%20Storefront%20Birth%20Cards/2%20Visual%20Design%20-%20done%20(1).jpg',
        'images/Amazon%20Storefront%20Birth%20Cards/3%20Diverse%20Affirmations%20-%20done%20(1).jpg',
        'images/Amazon%20Storefront%20Birth%20Cards/5%20Group%20of%20Cards%20-%20done%20(1).jpg',
        'images/Amazon%20Storefront%20Birth%20Cards/6%20Quality%20-%20done%20(1).jpg'
      ],
      category: 'affirmations',
      tags: ['new', 'digital'],
      placeholderColor: '#C9A088',
      digital: true,
      downloadFile: 'images/Amazon%20Storefront%20Birth%20Cards/Christ-Birth-Cards-PDF.pdf',
      sizes: {
        'Digital Download': { price: 17.77, stripePriceId: '' }
      },
      sortOrder: 4
    }
  ]
};
