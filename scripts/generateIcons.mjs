// Generates the install (home-screen) icons from public/slics-logo.png. The
// source mark is transparent and edge-to-edge: iOS paints that onto a black
// tile and Android's circular masks clip it, so every output here sits inset on
// a white tile. Uses the `sharp` that Next.js already installs — no extra
// dependency.
//
//   npm run icons:generate
//
// Outputs are committed; regenerate rather than hand-editing them:
//   app/apple-icon.png                180x180, mark at 86% (iOS rounds the corners itself)
//   public/maskable-icon-192x192.png  192x192, mark at 60% (inside the 80% safe zone)
//   public/maskable-icon-512x512.png  512x512, mark at 60%
// public/android-chrome-*.png are left alone — they stay the transparent
// `purpose: 'any'` icons in app/manifest.js.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(root, 'public', 'slics-logo.png');
const TILE = '#ffffff';

const targets = [
  { file: 'app/apple-icon.png', size: 180, scale: 0.86 },
  { file: 'public/maskable-icon-192x192.png', size: 192, scale: 0.6 },
  { file: 'public/maskable-icon-512x512.png', size: 512, scale: 0.6 },
];

async function render({ file, size, scale }) {
  const inner = Math.round(size * scale);
  const mark = await sharp(SOURCE)
    .resize(inner, inner, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  await sharp({
    create: { width: size, height: size, channels: 3, background: TILE },
  })
    .composite([{ input: mark, gravity: 'centre' }])
    .png()
    .toFile(path.join(root, file));

  console.log(`wrote ${file} (${size}px tile, ${inner}px mark)`);
}

for (const target of targets) {
  await render(target);
}
