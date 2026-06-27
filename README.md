# Skyline Weather

Premium dark-glassmorphism weather app — React + Vite + OpenWeatherMap API.

## Run it locally

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).
On first load, paste your free OpenWeatherMap API key (get one at
https://openweathermap.org/api — takes a few minutes to activate after signup).

## Build for production

```bash
npm run build
npm run preview   # optional, to test the production build locally
```

## Deploy to Vercel

**Option A — via GitHub**
1. Push this folder to a GitHub repo.
2. Go to https://vercel.com/new and import the repo.
3. Vercel auto-detects Vite — just click **Deploy**. No env vars needed
   (the API key is entered by the user in the browser, not stored in code).

**Option B — via Vercel CLI**
```bash
npm install -g vercel
vercel
```
Follow the prompts (framework: Vite, build command: `npm run build`,
output directory: `dist`).

## Project structure

```
skyline-weather/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.jsx     # React entry point
│   ├── App.jsx       # The whole weather app (UI + API logic)
│   └── index.css     # Global reset
```
