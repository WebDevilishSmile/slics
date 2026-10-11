// Generates every app icon from public/slics-icon.svg. The master is
// full-bleed (the blue fills the whole square, the glyph sits inside the 80%
// maskable safe circle), so each output is the whole artwork at 100%: no
// white tile, no inset. Uses the `sharp` that Next.js already installs — no
// extra dependency.
//
//   npm run icons:generate
//
// Outputs are committed; regenerate rather than hand-editing them:
//   app/apple-icon.png                180x180 square (iOS rounds the corners itself)
//   public/maskable-icon-192x192.png  192x192 square (the launcher applies its mask)
//   public/maskable-icon-512x512.png  512x512 square
//   public/android-chrome-*.png       192/512, rounded corners on transparent: the
//                                     `purpose: 'any'` icons in app/manifest.js,
//                                     shown as-is (desktop installs, notifications)
//   app/favicon.ico                   16/32/48, rounded, PNG-compressed entries
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(root, 'public', 'slics-icon.svg');
// Corner radius of the rounded outputs, as a share of the side. iOS's own
// icon radius, so the rounded files match the home-screen ones.
const RADIUS = 0.2237;

const svg = await readFile(SOURCE);

// The master rasterized at `size`, optionally clipped to a rounded square.
async function render(size, rounded) {
  // Rasterize at 4x the target (at least 512px) and scale down, so small
  // sizes keep clean anti-aliased edges.
  const density = (72 * Math.max(size * 4, 512)) / 512;
  const image = sharp(svg, { density }).resize(size, size);
  if (!rounded) return image.png().toBuffer();

  const r = (size * RADIUS).toFixed(2);
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}"/></svg>`,
  );
  return image
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

const pngs = [
  { file: 'app/apple-icon.png', size: 180 },
  { file: 'public/maskable-icon-192x192.png', size: 192 },
  { file: 'public/maskable-icon-512x512.png', size: 512 },
  { file: 'public/android-chrome-192x192.png', size: 192, rounded: true },
  { file: 'public/android-chrome-512x512.png', size: 512, rounded: true },
];

for (const { file, size, rounded = false } of pngs) {
  await writeFile(path.join(root, file), await render(size, rounded));
  console.log(`wrote ${file} (${size}px${rounded ? ', rounded' : ''})`);
}

// An .ico is a 6-byte header, a 16-byte directory entry per image, then the
// images; every browser that reads .ico accepts PNG data for them.
const icoSizes = [16, 32, 48];
const images = await Promise.all(icoSizes.map((size) => render(size, true)));
const header = Buffer.alloc(6 + 16 * images.length);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(images.length, 4);
let offset = header.length;
images.forEach((data, i) => {
  const entry = 6 + 16 * i;
  header.writeUInt8(icoSizes[i], entry); // width
  header.writeUInt8(icoSizes[i], entry + 1); // height
  header.writeUInt8(0, entry + 2); // palette size (none)
  header.writeUInt8(0, entry + 3); // reserved
  header.writeUInt16LE(1, entry + 4); // color planes
  header.writeUInt16LE(32, entry + 6); // bits per pixel
  header.writeUInt32LE(data.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += data.length;
});
await writeFile(path.join(root, 'app/favicon.ico'), Buffer.concat([header, ...images]));
console.log(`wrote app/favicon.ico (${icoSizes.join('/')}px)`);
