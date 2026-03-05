# Email Capture Popup — Design

## Goal
Add a scroll-triggered email signup popup so Brittany can build a mailing list from site visitors, regardless of whether commissions are open.

## Trigger
- Appears after visitor scrolls past 50% of the page
- Only shows once per visitor (stored in localStorage)
- Does not show if visitor has already subscribed

## Layout
- Centered overlay modal with semi-transparent dark backdrop
- Close via X button or clicking backdrop
- Matches existing site modal styling (off-white bg, dark-blue text, rose-gold accents)

## Content
- Script label: "let's stay connected"
- Heading: "Join My Inner Circle"
- Body: "I'd love to keep you in the loop — new artwork, behind-the-scenes peeks, and first access when commissions open."
- Fields: First Name, Email
- Button: "I'm In" (rose-gold)
- Note: "No spam, ever. Just art and heart."

## After Submit
- Fields replaced with: "You're in! I can't wait to share what's next."
- Auto-closes after 3 seconds
- Sets localStorage flag so popup never shows again

## Backend
- New `POST /api/subscribe` endpoint
- Saves to `subscribers` array in DB: `{ name, email, date }`
- Rejects duplicate emails
- New "Subscribers" tab in admin panel showing all signups

## Files to Modify
- index.html — add popup HTML
- styles.css — popup styles
- app.js — scroll listener, show/hide logic, form submit
- server.js — subscribe endpoint, subscribers in DB
- admin.html — new Subscribers tab
