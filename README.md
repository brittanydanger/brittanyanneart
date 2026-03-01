# BrittanyAnne Intuitive Fine Art — Website

## Quick Start
Open `index.html` in a browser. No build tools or server needed.

## What to Customize

### 1. Pricing (app.js, top of file)
Pricing is already configured as a full matrix (size × subjects) matching your pricing chart. To update prices, edit the `CONFIG.pricing` object in `app.js`. Each size maps to an object with subject counts 1–6. Use `null` for unavailable combos (e.g., 8×10 with 4+ subjects).

The `channeledPremium` value adds an extra charge for fully channeled portraits (currently 0).

### 2. Stripe Payment Links (app.js)
Replace the empty strings with your Stripe Payment Links:
```js
stripeLinks: {
  'full': 'https://buy.stripe.com/your-full-link',
  'deposit': 'https://buy.stripe.com/your-deposit-link',
  'plan': 'https://buy.stripe.com/your-plan-link'
}
```

### 3. Shop URL (app.js)
Add your Etsy or Shopify URL:
```js
shopUrl: 'https://www.etsy.com/shop/YourShopName'
```

### 4. Contact Form (index.html)
Update the Formspree action URL in the contact form:
```html
<form action="https://formspree.io/f/YOUR_ACTUAL_ID" method="POST">
```
Sign up free at [formspree.io](https://formspree.io).

### 5. Social Media Links (index.html)
Search for `social-link` in index.html and update the `href` attributes with your actual profile URLs.

### 6. Email Address (app.js)
```js
email: 'your-actual-email@domain.com'
```

### 7. Images
The site uses images from these existing folders:
- `images/art images/` — Portfolio images
- `images/Prints/` — Shop print previews
- `images/Images of Me/` — About section photo
- `Branding/Logo PNG/` — Logos

To swap images, either replace the files or update the `src` paths in `index.html`.

### 8. Copy / Text
All text content is directly in `index.html`. Search and update:
- Hero tagline
- Testimonial quotes and names
- About section bio
- Any placeholder text

### 9. Fonts
Fonts are set as CSS variables in `styles.css`:
```css
--font-display: 'LaLuxes Serif', 'Cormorant Garamond', serif;
--font-heading: 'Cormorant Garamond', serif;
--font-body: 'Josefin Sans', sans-serif;
--font-script: 'Great Vibes', cursive;
```

### 10. Colors
All colors are CSS custom properties at the top of `styles.css` — change them once and they update everywhere.

## File Structure
```
index.html     — Complete HTML
styles.css     — All styling
app.js         — All interactivity + config
Branding/      — Logo files and fonts
images/        — Art, prints, and photos
```

## Hosting
This is a static site — host it anywhere:
- Netlify (drag and drop the folder)
- Vercel
- GitHub Pages
- Squarespace (via code injection)
- Any web hosting with FTP
