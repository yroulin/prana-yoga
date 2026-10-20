// One-off asset preparation: build the PWA icons from the breath-ring mark.
//
// Run:  node tools/build-icons.mjs
// Out: icons/icon.svg, icon-192.png, icon-512.png, icon-maskable-512.png
//
// The mark is one idea used three times in the product: an open ring (the breath), a filled
// centre (the stillness), and a faint outer ring (the space around it).

import { writeFile, mkdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const run = promisify(execFile);
const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'icons');
const TMP = path.join(ROOT, 'tools', 'out');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const INK = '#1F2A28';
const ACCENT = '#6E5A86';

const mark = ({ scale = 1, opacity = 1 }) => `
  <g transform="translate(256 256) scale(${scale}) translate(-256 -256)" opacity="${opacity}">
    <circle cx="256" cy="256" r="196" fill="none" stroke="${ACCENT}" stroke-opacity="0.22" stroke-width="12"/>
    <path d="M 370.9 159.6 A 150 150 0 1 1 282 108.3" fill="none" stroke="${ACCENT}" stroke-width="34" stroke-linecap="round"/>
    <circle cx="256" cy="256" r="30" fill="${ACCENT}"/>
  </g>`;

const ground = `
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#E1E4E1"/>
      <stop offset="0.5" stop-color="#CBD6D2"/>
      <stop offset="1" stop-color="#C4CFDC"/>
    </linearGradient>
    <radialGradient id="e" cx="0.16" cy="0.12" r="0.7">
      <stop offset="0" stop-color="#7A9E90" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#7A9E90" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="v" cx="0.88" cy="0.9" r="0.7">
      <stop offset="0" stop-color="#7E78A6" stop-opacity="0.5"/>
      <stop offset="1" stop-color="#7E78A6" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" fill="url(#g)"/>
  <rect width="512" height="512" fill="url(#e)"/>
  <rect width="512" height="512" fill="url(#v)"/>`;

const files = {
  // The favicon stays transparent so it sits on any surface.
  'icon.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <g>
    <circle cx="256" cy="256" r="196" fill="none" stroke="${ACCENT}" stroke-opacity="0.3" stroke-width="12"/>
    <path d="M 370.9 159.6 A 150 150 0 1 1 282 108.3" fill="none" stroke="${ACCENT}" stroke-width="34" stroke-linecap="round"/>
    <circle cx="256" cy="256" r="30" fill="${ACCENT}"/>
  </g>
</svg>`,
};

// Raster sources live in tools/out so icons/ ships only what the app needs.
const rasterSources = {
  'icon-192.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">${ground}${mark({ scale: 0.78 })}</svg>`,
  'icon-512.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">${ground}${mark({ scale: 0.78 })}</svg>`,
  // Maskable icons must keep the mark inside the 80% safe zone, so it sits smaller.
  'icon-maskable.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">${ground}${mark({ scale: 0.56 })}</svg>`,
};

async function main() {
  await mkdir(OUT, { recursive: true });
  await mkdir(TMP, { recursive: true });

  await writeFile(path.join(OUT, 'icon.svg'), files['icon.svg']);
  console.log('· icon.svg');

  const raster = [
    ['icon-192.svg', 'icon-192.png', 192],
    ['icon-512.svg', 'icon-512.png', 512],
    ['icon-maskable.svg', 'icon-maskable-512.png', 512],
  ];

  for (const [src, dest, size] of raster) {
    const svgPath = path.join(TMP, src);
    await writeFile(svgPath, rasterSources[src]);
    // Chrome renders SVG properly; ImageMagick's built-in renderer drops gradients.
    await run(CHROME, [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      `--window-size=${size},${size}`,
      `--screenshot=${path.join(OUT, dest)}`,
      `file://${svgPath}`,
    ]);
    console.log(`· ${dest} (${size}px)`);
  }

  console.log('\nwrote icons/');
}

main();
