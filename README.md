# Exea Labs Bay Area Workshop

Site for the Exea Labs research workshop at Los Gatos High School — Sunday, January 3, 2027.

Static multi-page site (Home, About, Sign Up) with a shared three.js background, GSAP/Lenis motion, and Firebase Hosting.

## Stack

- Vite (multi-page: `index.html`, `about.html`, `signup.html`)
- three.js
- GSAP + ScrollTrigger
- Lenis
- Self-hosted fonts via Fontsource

## Setup

```bash
npm install
```

## Scripts

```bash
npm run dev       # local Vite server
npm run build     # production output in dist/
npm run preview   # preview the production build
```

## Deploy

```bash
npm run build
firebase deploy
```

`firebase.json` publishes `dist/` with `cleanUrls` so routes are `/`, `/about`, and `/signup`.
