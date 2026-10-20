// One-off asset preparation: fetch the 45 selected pose pages from YogaPhilippines.com,
// download the CC BY 4.0 drawings + step strips, and extract the English source content.
//
// Run:  node tools/fetch-poses.mjs
// Out:  images/poses/*.webp, tools/out/poses.source.json
//
// The site licence (CC BY 4.0) allows reuse including commercially, provided the credit and
// a link back to the source page travel with every drawing. Both are stored per pose.

import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ORIGIN = 'https://yogaphilippines.com';
const ROOT = path.resolve(import.meta.dirname, '..');
const OUT_IMAGES = path.join(ROOT, 'images', 'poses');
const OUT_JSON = path.join(ROOT, 'tools', 'out', 'poses.source.json');

// The 45 poses selected for safe unsupervised home practice, in library order.
export const SELECTED = [
  'mountain-pose', 'easy-pose', 'cat-cow', 'table-top-pose', 'childs-pose',
  'supported-childs-pose', 'puppy-pose', 'standing-forward-bend', 'butterfly-pose',
  'seated-forward-bend', 'head-to-knee-pose', 'happy-baby-pose',
  'reclined-hand-to-big-toe', 'savasana-corpse-pose', 'legs-up-the-wall', 'sphinx-pose',
  'cobra-pose', 'locust-pose', 'bridge-pose', 'downward-dog', 'warrior-poses',
  'triangle-pose', 'extended-side-angle', 'chair-pose', 'low-lunge', 'pyramid-pose',
  'dolphin-pose', 'tree-pose', 'eagle-pose', 'boat-pose', 'hero-pose', 'saddle-pose',
  'staff-pose', 'garland-pose', 'camel-pose', 'fish-pose', 'wide-squat-pose',
  'upward-facing-dog', 'plank-pose', 'side-plank', 'reverse-plank', 'crescent-lunge',
  'half-moon-pose', 'dancer-pose', 'lizard-pose',
];

const strip = (html) =>
  html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/&hellip;/g, '…')
    .replace(/&rsquo;/g, '’')
    .replace(/&[a-z]+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();

function section(html, headingTest) {
  // Returns the HTML of the <section> whose <h2> matches headingTest (string prefix or regex).
  const headings = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)];
  for (let i = 0; i < headings.length; i++) {
    const text = strip(headings[i][1]);
    const hit = headingTest instanceof RegExp ? headingTest.test(text) : text.startsWith(headingTest);
    if (!hit) continue;
    const start = headings[i].index;
    const end = i + 1 < headings.length ? headings[i + 1].index : html.length;
    return html.slice(start, end);
  }
  return null;
}

function listFrom(html, headingTest) {
  const sec = section(html, headingTest);
  if (!sec) return [];
  const items = [...sec.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((m) => strip(m[1]));
  return items.filter(Boolean);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function request(url, attempts = 4) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'user-agent': 'Mozilla/5.0 (compatible; prana-asset-fetch)' },
      });
      if (res.status === 404) throw new Error(`404 ${url}`);
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      return res;
    } catch (err) {
      lastErr = err;
      if (String(err).startsWith('404')) break;
      await sleep(600 * (i + 1));
    }
  }
  throw lastErr;
}

async function get(url) {
  return (await request(url)).text();
}

async function download(url, dest) {
  const buf = Buffer.from(await (await request(url)).arrayBuffer());
  await writeFile(dest, buf);
  return buf.length;
}

async function main() {
  await mkdir(OUT_IMAGES, { recursive: true });
  await mkdir(path.dirname(OUT_JSON), { recursive: true });

  const results = [];
  const failures = [];

  for (const slug of SELECTED) {
    const url = `${ORIGIN}/poses/${slug}/`;
    let html;
    try {
      html = await get(url);
    } catch (err) {
      failures.push([slug, String(err)]);
      continue;
    }

    const h1 = strip((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '');
    const nameMatch = h1.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
    const name = nameMatch ? nameMatch[1].trim() : h1;
    const sanskrit = nameMatch ? nameMatch[2].trim() : '';

    const steps = listFrom(html, /^How to do/);
    const easier = listFrom(html, 'Make it easier');
    const mistakes = listFrom(html, 'Common mistakes');

    const imgs = [...new Set([...html.matchAll(/\/images\/poses\/([a-z0-9-]+)\.webp/gi)].map((m) => m[1]))];
    // The site also ships "-half" responsive variants; we want the full-size files.
    const full = imgs.filter((s) => !s.endsWith('-half'));
    const mainSlug = full.find((s) => !s.includes('-steps'));
    const stepsSlug = full.find((s) => s.includes('-steps'));
    if (!mainSlug) {
      failures.push([slug, 'no drawing found']);
      continue;
    }

    const files = {};
    for (const [key, remote] of [['img', mainSlug], ['stepsImg', stepsSlug]]) {
      if (!remote) continue;
      const local = key === 'img' ? `${slug}.webp` : `${slug}-steps.webp`;
      const dest = path.join(OUT_IMAGES, local);
      if (!existsSync(dest)) {
        const bytes = await download(`${ORIGIN}/images/poses/${remote}.webp`, dest);
        files[key] = { remote, local, bytes };
      } else {
        files[key] = { remote, local, bytes: 0 };
      }
    }

    results.push({
      id: slug,
      name,
      sanskrit,
      source: url,
      steps,
      easier,
      mistakes,
      ...files,
    });
    process.stdout.write(`· ${slug}\n`);
  }

  await writeFile(OUT_JSON, JSON.stringify(results, null, 2));
  console.log(`\nfetched ${results.length}/${SELECTED.length}`);
  if (failures.length) {
    console.log('failures:', failures);
    process.exitCode = 1;
  }
}

main();
