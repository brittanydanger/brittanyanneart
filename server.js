/* ============================================
   BrittanyAnne Intuitive Fine Art
   server.js — Express backend
   ============================================

   Environment Variables (set in Replit Secrets):
   - STRIPE_SECRET_KEY       — sk_test_xxx or sk_live_xxx
   - STRIPE_PUBLISHABLE_KEY  — pk_test_xxx or pk_live_xxx
   - ADMIN_PASSWORD           — password for admin panel
   - STRIPE_WEBHOOK_SECRET    — (optional) whsec_xxx
   - PORT                     — (optional) defaults to 3000
   ============================================ */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ---- Stripe setup ----
const stripe = process.env.STRIPE_SECRET_KEY
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null;

// ---- Simple file-based DB (works on Replit and locally) ----
const DB_PATH = path.join(__dirname, 'db.json');

function readDB() {
  try {
    if (fs.existsSync(DB_PATH)) {
      return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading DB:', e.message);
  }
  return getDefaultDB();
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error writing DB:', e.message);
  }
}

function getDefaultDB() {
  return {
    availability: {
      accepting: true,
      slotsTotal: 5,
      slotsRemaining: 3,
      leadTimes: {
        '8x10':  { min: 4,  max: 6 },
        '11x14': { min: 6,  max: 8 },
        '16x20': { min: 8,  max: 12 },
        '18x24': { min: 8,  max: 12 },
        '24x30': { min: 10, max: 14 },
        '24x36': { min: 10, max: 14 },
        '36x36': { min: 12, max: 16 },
        '48x48': { min: 14, max: 20 },
        'custom': { min: 10, max: 16 }
      },
      additionalSubjectWeeks: 1,
      blackoutMessage: null,
      waitlistEnabled: false
    },
    orders: [],
    contacts: [],
    waitlist: []
  };
}

// Initialize DB if it doesn't exist
if (!fs.existsSync(DB_PATH)) {
  writeDB(getDefaultDB());
}

// ---- Middleware ----
// Stripe webhook needs raw body, so mount it before express.json()
app.post('/api/webhook', express.raw({ type: 'application/json' }), handleWebhook);

app.use(cors());
app.use(express.json());

// Serve static files from root directory (where index.html, styles.css, etc. live)
app.use(express.static(__dirname));

// ---- Admin auth middleware ----
function requireAdmin(req, res, next) {
  const password = req.headers.authorization;
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin';

  if (password !== adminPassword) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ---- Commission pricing config (shared with frontend via /api/config) ----
const COMMISSION_CONFIG = {
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
  channeledPremium: 0,
  depositPercent: 50,
  paymentPlanInstallments: 3
};

// ============================================
// API ROUTES
// ============================================

// ---- GET /api/config ----
// Returns public config (Stripe publishable key, pricing, etc.)
app.get('/api/config', (req, res) => {
  res.json({
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    pricing: COMMISSION_CONFIG.pricing,
    channeledPremium: COMMISSION_CONFIG.channeledPremium,
    depositPercent: COMMISSION_CONFIG.depositPercent,
    paymentPlanInstallments: COMMISSION_CONFIG.paymentPlanInstallments
  });
});

// ---- GET /api/availability ----
app.get('/api/availability', (req, res) => {
  const db = readDB();
  res.json(db.availability);
});

// ---- POST /api/availability (admin) ----
app.post('/api/availability', requireAdmin, (req, res) => {
  const db = readDB();
  db.availability = { ...db.availability, ...req.body };
  writeDB(db);
  res.json({ success: true, availability: db.availability });
});

// ---- POST /api/commission-order ----
// Saves commission details to DB before Stripe redirect
app.post('/api/commission-order', (req, res) => {
  const db = readDB();
  const orderId = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();

  const order = {
    orderId,
    createdAt: new Date().toISOString(),
    paid: false,
    paymentType: req.body.paymentType || null,
    stripeSessionId: null,
    ...req.body
  };

  db.orders.push(order);
  writeDB(db);

  res.json({ orderId, success: true });
});

// ---- POST /api/create-checkout-session ----
app.post('/api/create-checkout-session', async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe is not configured. Add STRIPE_SECRET_KEY to environment variables.' });
  }

  try {
    const { type, items, customerEmail, metadata, amount, paymentType, orderId } = req.body;
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    let sessionConfig = {
      payment_method_types: ['card'],
      mode: 'payment',
      success_url: `${baseUrl}/success.html?session_id={CHECKOUT_SESSION_ID}&type=${type}`,
      cancel_url: type === 'commission'
        ? `${baseUrl}/index.html`
        : `${baseUrl}/shop.html?canceled=true`
    };

    if (customerEmail) {
      sessionConfig.customer_email = customerEmail;
    }

    if (type === 'commission') {
      // Single line item for commission
      const amountCents = Math.round((amount || 0) * 100);
      const size = metadata?.size || 'Custom';
      const subjects = metadata?.subjects || '1';
      const approach = metadata?.approach || 'vision';

      sessionConfig.line_items = [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Portrait Commission — ${size}`,
            description: `${subjects} subject(s), ${approach} approach${paymentType === 'deposit' ? ' (50% deposit)' : paymentType === 'plan' ? ' (installment 1 of 3)' : ''}`
          },
          unit_amount: amountCents
        },
        quantity: 1
      }];

      sessionConfig.metadata = {
        orderId: orderId || '',
        type: 'commission',
        paymentType: paymentType || 'full',
        ...metadata
      };

    } else if (type === 'print') {
      // Multiple line items for prints
      const lineItems = items.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${item.title} — ${item.size}`
          },
          unit_amount: Math.round(item.price * 100)
        },
        quantity: item.quantity
      }));

      // Add shipping if needed
      if (metadata?.shipping && metadata.shipping > 0) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: { name: 'Shipping' },
            unit_amount: Math.round(metadata.shipping * 100)
          },
          quantity: 1
        });
      }

      sessionConfig.line_items = lineItems;
      sessionConfig.metadata = { type: 'print' };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    res.json({ url: session.url });

  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---- POST /api/contact ----
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  const db = readDB();
  db.contacts.push({
    id: 'MSG-' + Date.now(),
    name,
    email,
    message,
    createdAt: new Date().toISOString()
  });
  writeDB(db);

  res.json({ success: true });
});

// ---- POST /api/waitlist ----
app.post('/api/waitlist', (req, res) => {
  const { name, email, interest } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  const db = readDB();
  db.waitlist.push({
    id: 'WL-' + Date.now(),
    name,
    email,
    interest: interest || '',
    createdAt: new Date().toISOString()
  });
  writeDB(db);

  res.json({ success: true });
});

// ---- GET /api/orders (admin) ----
app.get('/api/orders', requireAdmin, (req, res) => {
  const db = readDB();
  // Return newest first
  const orders = [...db.orders].reverse();
  res.json(orders);
});

// ---- GET /api/contacts (admin) ----
app.get('/api/contacts', requireAdmin, (req, res) => {
  const db = readDB();
  const contacts = [...db.contacts].reverse();
  res.json(contacts);
});

// ---- GET /api/waitlist (admin) ----
app.get('/api/waitlist-entries', requireAdmin, (req, res) => {
  const db = readDB();
  const waitlist = [...db.waitlist].reverse();
  res.json(waitlist);
});

// ---- POST /api/webhook (Stripe) ----
function handleWebhook(req, res) {
  if (!stripe) return res.status(400).send('Stripe not configured');

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      event = JSON.parse(req.body);
    }
  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;

    if (orderId) {
      const db = readDB();
      const order = db.orders.find(o => o.orderId === orderId);
      if (order) {
        order.paid = true;
        order.stripeSessionId = session.id;
        order.paidAt = new Date().toISOString();
        writeDB(db);
        console.log(`Order ${orderId} marked as paid.`);
      }
    }
  }

  res.json({ received: true });
}

// ---- Catch-all: serve index.html for root ----
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ---- Start server ----
app.listen(PORT, '0.0.0.0', () => {
  console.log(`BrittanyAnne server running on http://localhost:${PORT}`);
  console.log(`Stripe: ${stripe ? 'Configured' : 'Not configured (add STRIPE_SECRET_KEY)'}`);
  console.log(`Admin password: ${process.env.ADMIN_PASSWORD ? 'Set' : 'Using default "admin"'}`);
});
