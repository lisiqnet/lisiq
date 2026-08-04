# Lisiq | Infrastructure & Consultancy

Marketing website for Lisiq, a boutique enterprise infrastructure consultancy.
Static site, no build step, deployed to GitHub Pages.

## Structure

```
index.html                 Single-page site (all sections)
assets/css/style.css        Design tokens + all component styles
assets/js/main.js           Nav, mobile menu, scroll-reveal, smooth scroll
assets/js/network-bg.js     Hero infrastructure-network canvas animation
assets/fonts/                Self-hosted Inter + JetBrains Mono (woff2)
Lisiq.svg                    Brand mark — source of truth, used everywhere
favicons/                    Generated from Lisiq.svg (see below)
og-image.png                 1200×630 social preview card, generated from the logo
site.webmanifest             PWA/home-screen manifest
robots.txt / sitemap.xml     SEO
.github/workflows/static.yml GitHub Pages deploy workflow (unchanged)
```

## Editing content

All copy lives directly in `index.html`, grouped by `<section id="…">`.
Section order matches the nav: `#services`, `#projects`, `#leadership`,
`#stack`, `#why`, `#contact`.

## Regenerating favicons / OG image

If `Lisiq.svg` changes, regenerate the derived assets:

```bash
rsvg-convert -w 16  -h 16  Lisiq.svg -o favicons/favicon-16x16.png
rsvg-convert -w 32  -h 32  Lisiq.svg -o favicons/favicon-32x32.png
rsvg-convert -w 180 -h 180 Lisiq.svg -o favicons/apple-touch-icon.png   # then flatten onto white
rsvg-convert -w 192 -h 192 Lisiq.svg -o favicons/android-chrome-192x192.png
rsvg-convert -w 512 -h 512 Lisiq.svg -o favicons/android-chrome-512x512.png
# favicon.ico: build from a 256×256 render via Pillow's multi-size ICO writer
```

The OG image is composed from the logo + Inter typeface — see the design
notes in the project history if you need to regenerate it.

## Notes on the hero background

The hero uses a small hand-written Canvas 2D animation (`network-bg.js`) —
infrastructure nodes, thin connecting lines, and travelling "packets" —
rather than a 3D library like Three.js. It renders the same visual idea the
brief asked for (a subtle, low-opacity network topology with mouse parallax)
at a few KB instead of ~650KB minified, which matters for the Lighthouse
performance target. It fully respects `prefers-reduced-motion` and pauses
itself via `IntersectionObserver` whenever the hero scrolls out of view.

Updated
