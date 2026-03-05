# Your Website Editing Guide

Hey Brittany! This is your quick-reference guide for updating your website through Replit.

---

## The One File You Edit: `config.js`

Everything you'd want to change lives in **config.js** — prices, print listings, shipping, copy, etc. You never need to touch any other file.

Here's what you can update:

- **Commission prices** — the pricing grid at the top
- **Medium premiums** — percentage added for watercolor, acrylic, etc.
- **Rush fee** — flat rate for rush orders
- **Print add-on prices** — 5x7, 8x10, 11x14
- **Lead times** — how long each size takes
- **Written message copy** — the text shown for each subject type
- **Shop prints** — add, edit, or remove print listings (title, description, image, prices)
- **Shipping** — flat rate, free shipping threshold, shipping note
- **Contact & social links**
- **Stripe keys and payment links**

---

## How to Make Changes

1. Open your Replit project
2. Find **config.js** in the file list on the left
3. Make your edits (prices, copy, listings, etc.)
4. Click the green **Run** button to preview your changes
5. When you're happy, save the file (Cmd+S or Ctrl+S)

---

## How to Push Your Changes Live

After you've saved your edits:

1. Click the **branch icon** (version control) in the left sidebar
2. You'll see your changed files listed
3. Type a short note about what you changed (e.g., "updated print prices")
4. Click **Commit & Push**
5. Done! Your changes are now on GitHub and live.

---

## How to Pull McKenna's Updates

When McKenna pushes design or code updates, you'll want to grab them:

1. Click the **branch icon** in the left sidebar
2. Click **Pull**
3. That's it — you now have the latest version

**Important:** Always pull before you start editing, so you're working with the latest version. This prevents any conflicts.

---

## Adding a New Print to the Shop

In config.js, scroll down to the `prints` section. Copy an existing listing and update the fields:

```js
{
  id: 'print-005',              // unique ID (just increment the number)
  title: 'Your Print Title',
  description: 'A short description of the piece.',
  image: 'images/Prints/your-image.jpg',
  images: ['images/Prints/your-image.jpg'],
  category: 'sacred',           // or 'affirmations', etc.
  tags: ['new'],                // 'new' shows a badge, 'digital' for downloads
  placeholderColor: '#C9B48A',  // a color that matches the image vibe
  sizes: {
    '5x7':   { price: 25, stripePriceId: '' },
    '8x10':  { price: 40, stripePriceId: '' },
    '11x14': { price: 65, stripePriceId: '' }
  },
  sortOrder: 5                  // controls display order (lower = first)
}
```

For digital downloads, add `digital: true` and use `'Digital Download'` as the size.

---

## Quick Tips

- **Don't edit** app.js, shop.js, styles.css, or index.html — McKenna handles those
- **Always pull first** before making edits
- **Save often** — Replit autosaves but Cmd+S is a good habit
- If something looks broken, undo your last edit (Cmd+Z) and save again
- When in doubt, message McKenna!
