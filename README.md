Metro Sound (Next.js, JavaScript)

A lightweight, accurate metronome using the Web Audio API, built with Next.js (JavaScript-only) and ready for Vercel.

Scripts

- `npm run dev` – Start dev server
- `npm run build` – Build production bundle
- `npm start` – Start production server

Development

1. Install deps

```bash
npm install
```

2. Start

```bash
npm run dev
```

Open `http://localhost:3000`.

Deploy to Vercel

- Push to GitHub and import the repo in Vercel.
- Framework preset: Next.js
- Build command: `npm run build`
- Output: `.next`

No additional configuration required.

Notes

- Uses Web Audio with an interval scheduler for stable timing.
- First user interaction is required on some browsers to start audio.

