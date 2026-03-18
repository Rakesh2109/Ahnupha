# Deploy on Hostinger **Node.js Web App**

Your app is a **Vite + React** SPA. Hostinger runs a **Node process** — this repo now includes a small **`server.js`** that serves the built `dist/` folder and fixes **direct URLs** like `/cart` or `/checkout` (SPA fallback).

## Will it work?

**Yes**, if you:

1. **Build** — set **Build** to `npm run build` in the panel (recommended). If Hostinger skips it, **`npm start` runs a build automatically** when `dist/` is missing (Vite is in `dependencies` so this works even with production-only install).
2. **Start** with `npm start` (ensures `dist/` then runs `node server.js`).
3. Set **environment variables for the build** (Vite bakes `VITE_*` into JS at build time — not at runtime).

## Hostinger panel — use these

| Field | Choose |
|--------|--------|
| **Framework preset** | **Express** (matches `server.js` + `npm start`) |
| **Branch** | **main** |
| **Node version** | **20.x** (or **18.x** if 20 isn’t listed — both work) |

Then set commands if the preset doesn’t fill them automatically:

| Setting | Value |
|--------|--------|
| **Install** | `npm ci` or `npm install` |
| **Build** | `npm run build` |
| **Start** | `npm start` |
| **Port** | Leave default — Hostinger sets `PORT`; the app reads it. |

## Environment variables (required on Hostinger)

If the panel shows **None**, add **all three** below. Vite only reads them when **`npm run build`** runs — set them **before** the first deploy (or redeploy after adding).

| Name | Example / where to get it |
|------|---------------------------|
| `VITE_SITE_URL` | `https://ahnupha.com` — your **real live site URL** (no `/` at end). SEO + auth redirects. |
| `VITE_SUPABASE_URL` | Supabase → **Project Settings → API → Project URL** |
| `VITE_SUPABASE_ANON_KEY` | Supabase → **Project Settings → API → anon public** key |

**If you leave them empty:** the app still runs using built-in defaults (your current Supabase project + ahnupha.com), but you should set them in Hostinger so **your domain** and **keys** are explicit and you can change projects later without editing code.

After any change to these vars → trigger a **new build** (redeploy).

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
