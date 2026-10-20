// Validates the app before it ships.
//
// Run:  node tools/check.mjs
//
// This is the whole test suite: there is no framework and no build step, so the checks
// live here. It verifies the pose library, the two dictionaries, the generator across
// every possible combination of inputs, and that the service worker precaches exactly
// the files that are on disk.

import { readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';

import { POSES, CREDIT } from '../js/data/poses.js';
import { STR, SESSION_TYPES, FOCUS_AREAS, EFFORTS, LENGTHS } from '../js/data/strings.js';
import { generateSequence, sessionLengthSec, scorePose } from '../js/generator.js';

const ROOT = path.resolve(import.meta.dirname, '..');

let failures = 0;
let checks = 0;

function ok(condition, message) {
  checks += 1;
  if (!condition) {
    failures += 1;
    console.error(`  FAIL  ${message}`);
  }
}

const exists = async (rel) => {
  try {
    await access(path.join(ROOT, rel), constants.R_OK);
    return true;
  } catch {
    return false;
  }
};

// ---- 1. the pose library ---------------------------------------------------
console.log('pose library');
{
  const ids = new Set();
  for (const pose of POSES) {
    ok(!ids.has(pose.id), `duplicate pose id ${pose.id}`);
    ids.add(pose.id);

    ok(pose.name.en?.length > 1, `${pose.id}: missing English name`);
    ok(pose.name.es?.length > 1, `${pose.id}: missing Spanish name`);
    ok(pose.sanskrit?.length > 1, `${pose.id}: missing sanskrit name`);
    ok(['gentle', 'steady', 'strong'].includes(pose.level), `${pose.id}: bad level ${pose.level}`);
    ok(['open', 'main', 'rest'].includes(pose.phase), `${pose.id}: bad phase ${pose.phase}`);
    ok(pose.baseSec >= 30 && pose.baseSec <= 180, `${pose.id}: odd base hold ${pose.baseSec}`);

    ok(pose.steps.en.length >= 3, `${pose.id}: needs at least three English steps`);
    ok(pose.steps.es.length >= 3, `${pose.id}: needs at least three Spanish steps`);
    ok(pose.steps.en.length === pose.steps.es.length, `${pose.id}: step counts differ`);
    for (const step of [...pose.steps.en, ...pose.steps.es]) {
      ok(step.trim().length > 10, `${pose.id}: empty step`);
    }
    ok(pose.cue.en?.trim().length > 5, `${pose.id}: missing English cue`);
    ok(pose.cue.es?.trim().length > 5, `${pose.id}: missing Spanish cue`);
    ok(pose.care.en?.trim().length > 10, `${pose.id}: missing English care note`);
    ok(pose.care.es?.trim().length > 10, `${pose.id}: missing Spanish care note`);

    ok(pose.source.startsWith('https://yogaphilippines.com/'), `${pose.id}: bad source link`);
    ok(await exists(pose.img), `${pose.id}: missing ${pose.img}`);
    ok(await exists(pose.stepsImg), `${pose.id}: missing ${pose.stepsImg}`);

    for (const area of [...pose.helps, ...pose.loads]) {
      ok(FOCUS_AREAS.some((f) => f.id === area), `${pose.id}: unknown area ${area}`);
    }
    for (const session of pose.sessions) {
      ok(SESSION_TYPES.some((s) => s.id === session), `${pose.id}: unknown session ${session}`);
    }
  }
  ok(POSES.length === 45, `expected 45 poses, found ${POSES.length}`);
  ok(CREDIT.includes('CC BY 4.0'), 'the credit line must name the licence');
  console.log(`  ${POSES.length} poses checked`);
}

// ---- 2. the two dictionaries -----------------------------------------------
console.log('dictionaries');
{
  const en = Object.keys(STR.en).sort();
  const es = Object.keys(STR.es).sort();
  for (const key of en) ok(es.includes(key), `STR.es is missing "${key}"`);
  for (const key of es) ok(en.includes(key), `STR.en is missing "${key}"`);
  ok(en.length === es.length, `dictionary sizes differ: ${en.length} vs ${es.length}`);
  for (const key of en) {
    ok(STR.en[key].trim().length > 0, `STR.en["${key}"] is empty`);
    ok(STR.es[key].trim().length > 0, `STR.es["${key}"] is empty`);
    ok(!/^lorem|^placeholder|feature (one|two|three)/i.test(STR.en[key]), `STR.en["${key}"] is filler`);
  }
  for (const list of [SESSION_TYPES, FOCUS_AREAS, EFFORTS]) {
    for (const item of list) {
      ok(item.label.en && item.label.es, `missing label for ${item.id}`);
      if (item.hint) ok(item.hint.en && item.hint.es, `missing hint for ${item.id}`);
    }
  }
  console.log(`  ${en.length} strings in each language`);
}

// ---- 3. the generator --------------------------------------------------------
console.log('generator');
{
  const areas = FOCUS_AREAS.map((a) => a.id);
  const combos = [];
  for (const session of SESSION_TYPES) {
    for (const effort of EFFORTS) {
      for (const minutes of LENGTHS) {
        for (const focus of focusSets(areas, 3)) combos.push({ session, effort, minutes, focus });
      }
    }
  }

  let worstDrift = 0;
  for (const combo of combos) {
    for (const seed of [1, 2, 3, 17, 99]) {
      const state = { ...combo, seed };
      const result = generateSequence(state);

      ok(result.items.length > 0, `no sequence for ${JSON.stringify(combo)}`);
      if (!result.items.length) continue;

      const ids = result.items.map((i) => i.pose.id);
      ok(new Set(ids).size === ids.length, `duplicate pose in ${JSON.stringify(combo)}`);
      ok(
        ids[ids.length - 1] === 'savasana-corpse-pose',
        `session does not end in Corpse Pose for ${JSON.stringify(combo)}`
      );

      for (const item of result.items) {
        for (const area of combo.focus) {
          ok(
            !item.pose.loads.includes(area),
            `${item.pose.id} loads ${area} but the focus asked for it`
          );
        }
        ok(item.seconds >= 45 && item.seconds <= 210, `${item.pose.id}: hold out of range`);
        ok(item.seconds % 15 === 0, `${item.pose.id}: hold is not a round number`);
      }

      const total = sessionLengthSec(result.items);
      const drift = Math.abs(total - combo.minutes * 60);
      worstDrift = Math.max(worstDrift, drift);
      ok(drift <= 75, `length drifted ${drift}s for ${JSON.stringify(combo)} seed ${seed}`);
    }
  }
  console.log(`  ${combos.length * 5} sequences built, worst length drift ${worstDrift}s`);

  // The shuffle has to actually change something.
  const base = { session: 'desk-reset', focus: ['shoulders'], minutes: 20, effort: 'steady' };
  const orders = new Set();
  for (let seed = 1; seed <= 12; seed++) {
    orders.add(generateSequence({ ...base, seed }).items.map((i) => i.pose.id).join(','));
  }
  ok(orders.size > 1, 'the shuffle never changes the sequence');

  // Scoring has to react to what was asked for.
  const gentle = scorePose(POSES.find((p) => p.id === 'downward-dog'), {
    session: 'desk-reset',
    focus: [],
    effort: 'gentle',
  });
  const steady = scorePose(POSES.find((p) => p.id === 'downward-dog'), {
    session: 'desk-reset',
    focus: [],
    effort: 'steady',
  });
  ok(gentle < steady, 'effort does not affect the score');
}

function* focusSets(areas, max) {
  yield [];
  for (let i = 0; i < areas.length; i++) {
    yield [areas[i]];
    for (let j = i + 1; j < areas.length; j++) {
      yield [areas[i], areas[j]];
      if (max < 3) continue;
      for (let k = j + 1; k < areas.length; k++) {
        yield [areas[i], areas[j], areas[k]];
      }
    }
  }
}

// ---- 4. the service worker ----------------------------------------------------
console.log('service worker');
{
  const sw = await readFile(path.join(ROOT, 'sw.js'), 'utf8');
  const listed = [...sw.matchAll(/'\.\/([^']*)'/g)].map((m) => m[1]).filter(Boolean);
  ok(listed.length > 100, `the precache list looks short: ${listed.length}`);
  for (const entry of listed) {
    ok(await exists(entry), `precached file is missing: ${entry}`);
  }

  const onDisk = [];
  for (const dir of ['styles', 'fonts', 'js', 'images', 'icons']) {
    const full = path.join(ROOT, dir);
    try {
      await access(full);
    } catch {
      continue;
    }
    onDisk.push(...(await walkFiles(full)));
  }
  for (const file of onDisk) {
    ok(listed.includes(file), `file on disk is not precached: ${file}`);
  }
  console.log(`  ${listed.length} files precached`);
}

async function walkFiles(dir, out = []) {
  const { readdir } = await import('node:fs/promises');
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walkFiles(full, out);
    else out.push(path.relative(ROOT, full).split(path.sep).join('/'));
  }
  return out;
}

// ---- 5. the manifest -----------------------------------------------------------
console.log('manifest');
{
  const manifest = JSON.parse(await readFile(path.join(ROOT, 'manifest.webmanifest'), 'utf8'));
  ok(manifest.name && manifest.short_name, 'the manifest needs a name');
  ok(manifest.display === 'standalone', 'the manifest should be standalone');
  for (const icon of manifest.icons) {
    ok(await exists(icon.src), `manifest icon is missing: ${icon.src}`);
  }
  ok(manifest.icons.some((i) => i.purpose === 'maskable'), 'a maskable icon is required');
  console.log(`  ${manifest.icons.length} icons`);
}

// ---- 6. the anti-slop rules -------------------------------------------------------
console.log('anti-slop');
{
  const css = (
    await Promise.all(
      ['styles/base.css', 'styles/layout.css', 'styles/components.css'].map((f) =>
        readFile(path.join(ROOT, f), 'utf8')
      )
    )
  ).join('\n');

  const banned = ['#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#8b5cf6', '#7c3aed', '#a855f7'];
  for (const colour of banned) {
    ok(!css.toLowerCase().includes(colour), `banned default accent ${colour} appears in the styles`);
  }

  const emoji = ['✨', '🚀', '🎯', '⚡', '🔥', '💡', '🧘', '🌿'];
  const html = await readFile(path.join(ROOT, 'index.html'), 'utf8');
  for (const mark of emoji) {
    ok(!html.includes(mark), `emoji ${mark} appears in the markup`);
  }

  const jsFiles = await walkFiles(path.join(ROOT, 'js'));
  for (const file of jsFiles) {
    const source = await readFile(path.join(ROOT, file), 'utf8');
    ok(!/lorem ipsum/i.test(source), `filler copy in ${file}`);
  }

  // Raw hex outside the token blocks.
  const outsideTokens = css
    .replace(/:root\s*\{[\s\S]*?\}/g, '')
    .replace(/\[data-theme='dark'\]\s*\{[\s\S]*?\}/g, '');
  const rawHex = [...outsideTokens.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => m[0]);
  ok(rawHex.length === 0, `raw hex outside :root — ${rawHex.join(', ')}`);
  console.log('  no banned accent, no emoji icons, no raw hex outside the tokens');
}

// ---- result ------------------------------------------------------------------------
console.log('');
if (failures) {
  console.error(`${failures} of ${checks} checks failed`);
  process.exit(1);
}
console.log(`all ${checks} checks passed`);
