# KeyFlow — Learn Piano Visually

A futuristic virtual piano that teaches you songs with falling notes. Plug in a MIDI keyboard or use your computer keys.

## Setup

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The `dist/` folder contains the fully static output, ready for deployment.

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → Import your GitHub repo
3. Vercel auto-detects Vite. No extra config needed (`vercel.json` is included).

## Features

- 🎹 Interactive piano keyboard (3 octaves, C3–C6)
- 🎮 Computer keyboard input (Z–M row for white keys, S/D/G/H/J for black keys)
- 🎵 USB MIDI keyboard support via Web MIDI API
- 🎯 Falling notes visualization (Synthesia-style)
- 📚 8 built-in preset songs + custom song library
- 🏆 Watch / Practice / Play modes with scoring
- ⚡ Tone.js piano synthesis (Salamander Grand Piano samples)
- 💾 Songs persist in localStorage
- 🌙 Futuristic dark mode UI

## Tech Stack

- React 18 + TypeScript + Vite
- Tone.js (audio synthesis)
- Zustand (state management)
- Tailwind CSS v3 (styling)
- Web MIDI API (MIDI keyboard input)
- Lucide React (icons)
