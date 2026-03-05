# Email Capture Popup — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a scroll-triggered email signup popup so Brittany can build a mailing list, with a Subscribers tab in the admin panel.

**Architecture:** Overlay modal triggered by scroll (50% of page), saves name + email to server via `POST /api/subscribe`, viewable in admin panel. Uses localStorage to show only once per visitor.

**Tech Stack:** Vanilla HTML/CSS/JS, Express backend, file-based JSON DB (same as existing site)

---

### Task 1: Backend — Subscribe endpoint + DB

**Files:**
- Modify: `server.js:69-74` (add `subscribers` to default DB)
- Modify: `server.js:~297` (add endpoint after waitlist endpoint)

**Step 1: Add `subscribers` array to default DB**

In `getDefaultDB()`, add `subscribers: []` after `waitlist: []`:

```js
    orders: [],
    contacts: [],
    waitlist: [],
    subscribers: []
```

**Step 2: Add `POST /api/subscribe` endpoint**

Insert after the `POST /api/waitlist` block (after line ~297):

```js
// ---- POST /api/subscribe (email popup) ----
app.post('/api/subscribe', (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  const db = readDB();

  // Reject duplicates
  if (db.subscribers.some(s => s.email.toLowerCase() === email.toLowerCase())) {
    return res.json({ success: true, message: 'Already subscribed' });
  }

  db.subscribers.push({
    id: 'SUB-' + Date.now(),
    name,
    email,
    createdAt: new Date().toISOString()
  });
  writeDB(db);

  res.json({ success: true });
});
```

**Step 3: Add `GET /api/subscribers` admin endpoint**

Insert after the `GET /api/waitlist-entries` block (after line ~320):

```js
// ---- GET /api/subscribers (admin) ----
app.get('/api/subscribers', requireAdmin, (req, res) => {
  const db = readDB();
  const subscribers = [...(db.subscribers || [])].reverse();
  res.json(subscribers);
});
```

**Step 4: Commit**

```
feat: add subscribe endpoint and subscribers DB
```

---

### Task 2: Frontend — Popup HTML

**Files:**
- Modify: `index.html:~908` (insert before closing `</body>` scripts)

**Step 1: Add popup HTML**

Insert after the confirmation modal closing `</div>` (line 908), before `<script src="config.js">`:

```html
  <!-- ============================================ -->
  <!-- EMAIL SIGNUP POPUP                            -->
  <!-- ============================================ -->
  <div class="modal-overlay" id="emailPopup" aria-hidden="true">
    <div class="modal email-popup" role="dialog" aria-labelledby="emailPopupTitle">
      <button class="email-popup-close" id="emailPopupClose" aria-label="Close">&times;</button>
      <span class="script-label">let's stay connected</span>
      <h2 id="emailPopupTitle">Join My Inner Circle</h2>
      <p class="modal-subtitle">I'd love to keep you in the loop &mdash; new artwork, behind-the-scenes peeks, and first access when commissions open.</p>
      <form id="emailPopupForm" class="email-popup-form">
        <input type="text" name="name" placeholder="First Name" required>
        <input type="email" name="email" placeholder="Email" required>
        <button type="submit" class="btn btn-primary">I'm In</button>
      </form>
      <p class="email-popup-note">No spam, ever. Just art and heart.</p>
      <div class="email-popup-success" id="emailPopupSuccess" style="display:none;">
        <p class="script-label" style="margin-bottom:0.5rem;">you're in!</p>
        <p>I can't wait to share what's next.</p>
      </div>
    </div>
  </div>
```

**Step 2: Commit**

```
feat: add email signup popup HTML
```

---

### Task 3: Frontend — Popup styles

**Files:**
- Modify: `styles.css` (add after existing modal styles, ~line 2260)

**Step 1: Add popup-specific styles**

```css
/* ----- Email Signup Popup ----- */

.email-popup {
  position: relative;
  max-width: 440px;
}

.email-popup-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.75rem;
  line-height: 1;
  color: var(--color-text);
  opacity: 0.5;
  cursor: pointer;
  transition: opacity 0.2s;
}

.email-popup-close:hover {
  opacity: 1;
}

.email-popup .script-label {
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  margin-bottom: -0.1em;
}

.email-popup h2 {
  font-size: clamp(1.75rem, 4vw, 2.5rem);
}

.email-popup-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: var(--space-md) 0 0.75rem;
}

.email-popup-form input {
  padding: 0.85rem 1rem;
  border: 1px solid var(--color-border, #ddd);
  border-radius: 2px;
  font-family: var(--font-body);
  font-size: 0.95rem;
  background: #fff;
}

.email-popup-form input:focus {
  outline: none;
  border-color: var(--rose-gold);
}

.email-popup-note {
  font-size: 0.8rem;
  opacity: 0.5;
  font-style: italic;
}

.email-popup-success {
  padding: var(--space-md) 0;
}

.email-popup-success .script-label {
  font-size: clamp(2rem, 5vw, 3rem);
  color: var(--rose-gold);
}
```

**Step 2: Commit**

```
feat: add email popup styles
```

---

### Task 4: Frontend — Popup JS logic

**Files:**
- Modify: `app.js` (add at end of file)

**Step 1: Add scroll listener + form logic**

Append to end of `app.js`:

```js
/* ============================================
   EMAIL SIGNUP POPUP
   ============================================ */
(function initEmailPopup() {
  const popup = document.getElementById('emailPopup');
  if (!popup) return;

  const STORAGE_KEY = 'ba_email_subscribed';

  // Don't show if already subscribed or dismissed
  if (localStorage.getItem(STORAGE_KEY)) return;

  let shown = false;

  function showPopup() {
    if (shown) return;
    shown = true;
    popup.classList.add('active');
    popup.setAttribute('aria-hidden', 'false');
    window.removeEventListener('scroll', onScroll);
  }

  function hidePopup() {
    popup.classList.remove('active');
    popup.setAttribute('aria-hidden', 'true');
    localStorage.setItem(STORAGE_KEY, 'dismissed');
  }

  // Show after 50% scroll
  function onScroll() {
    const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
    if (scrollPercent >= 0.5) showPopup();
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // Close button
  document.getElementById('emailPopupClose').addEventListener('click', hidePopup);

  // Close on backdrop click
  popup.addEventListener('click', (e) => {
    if (e.target === popup) hidePopup();
  });

  // Form submit
  document.getElementById('emailPopupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.name.value.trim();
    const email = form.email.value.trim();

    if (!name || !email) return;

    try {
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
      });

      // Show success
      form.style.display = 'none';
      popup.querySelector('.email-popup-note').style.display = 'none';
      document.getElementById('emailPopupSuccess').style.display = 'block';
      localStorage.setItem(STORAGE_KEY, 'subscribed');

      // Auto-close after 3 seconds
      setTimeout(hidePopup, 3000);
    } catch (err) {
      console.error('Subscribe error:', err);
    }
  });
})();
```

**Step 2: Commit**

```
feat: add email popup scroll trigger and form logic
```

---

### Task 5: Admin — Subscribers tab

**Files:**
- Modify: `admin.html:~457` (add tab button)
- Modify: `admin.html:~535` (add panel HTML)
- Modify: `admin.html:~605` (add loadSubscribers call)
- Modify: `admin.html:~813` (add loadSubscribers function)

**Step 1: Add "Subscribers" tab button**

After the Messages tab button (line 457):

```html
      <button class="admin-tab" data-panel="subscribers">Subscribers</button>
```

**Step 2: Add Subscribers panel HTML**

After the Messages panel closing `</div>` (line 535):

```html
      <!-- SUBSCRIBERS -->
      <div class="admin-panel" id="panel-subscribers">
        <h3 class="section-title">Email Subscribers</h3>
        <ul class="admin-list" id="subscribersList">
          <li class="empty-state">Loading...</li>
        </ul>
      </div>
```

**Step 3: Add `loadSubscribers()` call**

Add to the post-login load block (after `loadMessages()` around line 605):

```js
      loadSubscribers();
```

**Step 4: Add `loadSubscribers()` function**

After the `loadMessages()` function:

```js
    // ---- SUBSCRIBERS ----
    async function loadSubscribers() {
      const list = document.getElementById('subscribersList');
      try {
        const res = await fetch('/api/subscribers', {
          headers: { Authorization: adminPassword }
        });
        const subs = await res.json();

        if (subs.length === 0) {
          list.innerHTML = '<li class="empty-state">No subscribers yet</li>';
          return;
        }

        list.innerHTML = subs.map(s => `
          <li class="admin-list-item">
            <div class="admin-list-header">
              <span class="admin-list-title">${s.name}</span>
              <span class="admin-list-date">${formatDate(s.createdAt)}</span>
            </div>
            <div class="admin-list-detail">${s.email}</div>
          </li>
        `).join('');
      } catch (e) {
        list.innerHTML = '<li class="empty-state">Failed to load subscribers</li>';
      }
    }
```

**Step 5: Commit**

```
feat: add Subscribers tab to admin panel
```

---

### Task 6: Final verification

**Step 1:** Load the site, scroll past 50% → popup should appear

**Step 2:** Submit name + email → success message, auto-closes after 3s

**Step 3:** Refresh page → popup should NOT appear again

**Step 4:** Open admin panel → Subscribers tab shows the new entry

**Step 5:** Final commit and push

```
chore: email capture popup — complete feature
```
