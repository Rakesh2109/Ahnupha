/**
 * Production server for Hostinger Node.js Web App (and similar).
 * Serves Vite's dist/ folder and falls back to index.html for client-side routes.
 */
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(__dirname, 'dist');
const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.static(dist, { index: false }));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(dist, 'index.html'), (err) => {
    if (err) next(err);
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Ahnupha app serving dist/ on http://0.0.0.0:${PORT}`);
});
