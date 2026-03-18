#!/usr/bin/env node
/**
 * Hostinger (and similar) sometimes runs `npm start` without a prior build,
 * so dist/ is missing. Build once if dist/index.html is absent.
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const indexHtml = path.join(root, 'dist', 'index.html');

if (fs.existsSync(indexHtml)) {
  process.exit(0);
}

console.log('dist/index.html not found — running npm run build…');

try {
  execSync('npm run build', {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' },
  });
} catch {
  console.error(`
Build failed. On Hostinger, set:
  Build command: npm run build
  Install: npm install   (not production-only, unless vite is in dependencies)

Or fix errors above and redeploy.
`);
  process.exit(1);
}

if (!fs.existsSync(indexHtml)) {
  console.error('dist/index.html still missing after build.');
  process.exit(1);
}
