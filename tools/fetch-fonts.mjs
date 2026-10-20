// One-off asset preparation: self-host Cormorant Garamond + Raleway so the typography
// survives offline and no request ever leaves the device.
//
// Run:  node tools/fetch-fonts.mjs
// Out: fonts/*.woff2, fonts/fonts.css
//
// Only the `latin` and `latin-ext` subsets are kept — English and Spanish need nothing more.

import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'fonts');

// A modern UA is required or Google serves ttf instead of woff2.
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

const FAMILIES = [
  { family: 'Cormorant+Garamond', axis: 'wght@300..700', slug: 'cormorant-garamond' },
  { family: 'Raleway', axis: 'wght@300..700', slug: 'raleway' },
];

const KEEP_SUBSETS = ['latin', 'latin-ext'];

async function fetchCss(url) {
  const res = await fetch(url, { headers: { 'user-agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

// Each @font-face block carries a comment naming its subset, e.g. /* latin */.
function parseFaces(css) {
  const faces = [];
  const re = /\/\*\s*([a-z0-9-]+)\s*\*\/\s*@font-face\s*\{([\s\S]*?)\}/g;
  for (const m of css.matchAll(re)) {
    const subset = m[1];
    const body = m[2];
    const url = (body.match(/url\(([^)]+)\)/) || [])[1];
    const range = (body.match(/unicode-range:\s*([^;]+);/) || [])[1];
    const weight = (body.match(/font-weight:\s*([^;]+);/) || [])[1];
    const style = (body.match(/font-style:\s*([^;]+);/) || [])[1] || 'normal';
    if (url && KEEP_SUBSETS.includes(subset)) faces.push({ subset, url, range: range?.trim(), weight, style });
  }
  return faces;
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const rules = [];
  for (const { family, axis, slug } of FAMILIES) {
    const css = await fetchCss(
      `https://fonts.googleapis.com/css2?family=${family}:${axis}&display=swap`
    );
    const faces = parseFaces(css);
    if (!faces.length) throw new Error(`no faces parsed for ${family}`);

    for (const face of faces) {
      const file = `${slug}-${face.subset}.woff2`;
      const res = await fetch(face.url, { headers: { 'user-agent': UA } });
      if (!res.ok) throw new Error(`${res.status} ${face.url}`);
      const buf = Buffer.from(await res.arrayBuffer());
      await writeFile(path.join(OUT, file), buf);
      console.log(`· ${file}  ${(buf.length / 1024).toFixed(1)} kB`);
      rules.push(
        `@font-face {\n  font-family: '${family.replace(/\+/g, ' ')}';\n  font-style: ${face.style};\n  font-weight: ${face.weight};\n  font-display: swap;\n  src: url('./${file}') format('woff2');\n  unicode-range: ${face.range};\n}`
      );
    }
  }

  const header = `/* Self-hosted subsets of Cormorant Garamond and Raleway.\n   Fetched once with tools/fetch-fonts.mjs; served locally so the app works offline\n   and never contacts a third party at runtime. */\n\n`;
  await writeFile(path.join(OUT, 'fonts.css'), header + rules.join('\n\n') + '\n');
  console.log('\nwrote fonts/fonts.css');
}

main();
