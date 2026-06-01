# EMPID Landing Page

Static bilingual landing page for **EMPID.com - Workforce Operating System**.

## Files

- `index.html` - Arabic-first semantic landing page with English support.
- `styles.css` - Responsive styling, RTL/LTR support, sticky navigation, dashboard mockup, and simple reveal animations.
- `script.js` - Language switcher, localStorage preference, smooth scrolling, mobile menu, and form validation.
- `README.md` - Project notes.
- `assets/EMPID_Arabic_Transparent.png` - EMPID logo used across the page.
- `assets/EMPID_Icon.png` - Cropped EMPID icon used in the header and footer.

## Hosting On GitHub Pages

1. Push these files to a GitHub repository.
2. Open the repository settings.
3. Go to **Pages**.
4. Select the main branch and root folder.
5. Save and open the generated GitHub Pages URL.

No build step is required. The page uses only HTML, CSS, and vanilla JavaScript.

## Contact Form

The form submits to Formspree using:

`https://formspree.io/f/xojbopbz`

The `subject` field changes based on the active language:

- Arabic: `طلب عرض تجريبي لمنصة EMPID`
- English: `EMPID Demo Request`

## Language Behavior

Arabic is the default language with `lang="ar"` and `dir="rtl"`. Visitors can switch to English, which updates the page to `lang="en"` and `dir="ltr"`. The selected language is stored in `localStorage`.
