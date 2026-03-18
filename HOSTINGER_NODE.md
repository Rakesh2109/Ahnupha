# Deploy on Hostinger **Node.js Web App**

Your app is a **Vite + React** SPA. Hostinger runs a **Node process** — this repo now includes a small **`server.js`** that serves the built `dist/` folder and fixes **direct URLs** like `/cart` or `/checkout` (SPA fallback).

## Will it work?

**Yes**, if you:

1. **Build** before (or during) deploy so `dist/` exists.
2. **Start** with `npm start` (runs `node server.js`).
3. Set **environment variables for the build** (Vite bakes `VITE_*` into JS at build time — not at runtime).

## Hostinger settings (typical)

| Setting | Value |
|--------|--------|
| **Node version** | 18.x or 20.x |
| **Install command** | `npm ci` or `npm install` |
| **Build command** | `npm run build` |
| **Start command** | `npm start` |
| **Port** | Hostinger sets `PORT` automatically — the server uses it. |

## Environment variables (build time)

Add these in Hostinger **before/during build** (names must start with `VITE_`):

- `VITE_SITE_URL` — `https://yourdomain.com` (SEO canonicals / Open Graph)
- `VITE_SUPABASE_URL` — your Supabase project URL  
- `VITE_SUPABASE_ANON_KEY` — your anon key  
- Any other `VITE_*` your app uses

After changing env vars, **run a new build**.

## GitHub deploy

Connect the repo → Hostinger runs install → build → start. Ensure **root directory** is the project root (where `package.json` lives).

## Local test (same as production)

```bash
npm run build
npm start
# Open http://localhost:3000 — try /cart and refresh (should not 404)
```

## Alternative: static hosting only

If Hostinger offers **static website** hosting instead, you can upload **`dist/`** only and configure **SPA fallback** to `index.html` in the panel. Then you don’t need `npm start`.
