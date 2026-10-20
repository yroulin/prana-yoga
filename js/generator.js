// Builds a sequence from the pose library.
//
// The rules are deliberately simple and inspectable: every pose is scored against what the
// person asked for, poses that load an area they flagged are excluded outright, and the
// holds are then fitted to the requested length. Nothing here invents a number it cannot
// justify — the total shown to the user is summed from the real holds.

import { POSES } from './data/poses.js';

// A vetoed pose is one that loads an area the person flagged as tight. It is removed
// rather than down-ranked, because a sequence that works against the body is not a
// gentler sequence, it is a wrong one.
const VETO_THRESHOLD = -50;

const SCORE = {
  sessionMatch: 3,
  areaHelp: 4,
  areaLoad: -60,
  effortMismatch: { gentle: -25, steady: -14 },
  effortMatch: { strong: 6, steady: 3 },
  restBonus: 2,
  restSession: 2,
};

// How many poses a session of a given length holds.
const LENGTH_COUNT = { 10: 6, 20: 9, 30: 13 };

const HOLD_MIN = 45;
const HOLD_MAX = 210;
const HOLD_STEP = 15;

// A pose that scores within this band of another can swap places with it. This is what
// makes a reshuffle produce a genuinely different sequence without letting an irrelevant
// pose jump to the top.
const JITTER = 1.6;

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function scorePose(pose, state) {
  let score = 0;
  const focus = state.focus || [];

  if (pose.sessions.includes(state.session)) score += SCORE.sessionMatch;
  for (const area of focus) {
    if (pose.helps.includes(area)) score += SCORE.areaHelp;
    if (pose.loads.includes(area)) score += SCORE.areaLoad;
  }

  if (state.effort === 'gentle' && pose.level !== 'gentle') score += SCORE.effortMismatch.gentle;
  if (state.effort === 'steady' && pose.level === 'strong') score += SCORE.effortMismatch.steady;
  if (state.effort === 'strong') score += SCORE.effortMatch[pose.level] || 0;

  if (pose.phase === 'rest') {
    score += SCORE.restBonus;
    if (state.session === 'sleep' || state.session === 'unwind') score += SCORE.restSession;
  }

  return score;
}

// Fits holds to the requested length. Holds are distributed in proportion to each pose's
// natural length, clamped to a sane range, then rounded to a step of fifteen seconds so the
// numbers stay easy to follow.
function distributeHolds(poses, target, rand) {
  const weights = poses.map((p) => p.baseSec);
  const weightSum = weights.reduce((a, b) => a + b, 0) || 1;

  const holds = weights.map((w) => {
    const raw = (target * w) / weightSum;
    const clamped = Math.min(HOLD_MAX, Math.max(HOLD_MIN, raw));
    return Math.round(clamped / HOLD_STEP) * HOLD_STEP;
  });

  let total = holds.reduce((a, b) => a + b, 0);
  let guard = 0;
  while (total !== target && guard < 400) {
    const diff = target - total;
    const delta = diff > 0 ? HOLD_STEP : -HOLD_STEP;
    // Give the extra seconds to whichever pose has the most room, so one pose does not
    // absorb the whole adjustment.
    const candidates = holds
      .map((h, i) => ({ h, i }))
      .filter(({ h }) => (delta > 0 ? h + delta <= HOLD_MAX : h + delta >= HOLD_MIN))
      .sort((a, b) => (delta > 0 ? a.h - b.h : b.h - a.h));
    if (!candidates.length) break;
    const pick = candidates[Math.floor(rand() * Math.min(3, candidates.length))];
    holds[pick.i] += delta;
    total += delta;
    guard += 1;
  }

  return holds;
}

/**
 * @param {object} state
 * @param {string} state.session   session type id
 * @param {string[]} state.focus   focus area ids, at most three
 * @param {number} state.minutes   10, 20 or 30
 * @param {string} state.effort    gentle, steady or strong
 * @param {number} state.seed      drives the shuffle; change it for a different pick
 * @returns {{items: Array, totalSec: number, requestedSec: number}}
 */
export function generateSequence(state) {
  const rand = mulberry32(((state.seed ?? 1) * 2654435761) >>> 0);
  const focus = state.focus || [];

  const scored = POSES.filter(
    (pose) => !(pose.loads || []).some((area) => focus.includes(area))
  ).map((pose) => {
    const base = scorePose(pose, state);
    return { pose, base, score: base + (rand() * 2 - 1) * JITTER };
  });

  const eligible = scored
    .filter(({ base }) => base > VETO_THRESHOLD)
    .sort((a, b) => b.score - a.score);

  const requestedSec = state.minutes * 60;
  if (!eligible.length) return { items: [], totalSec: 0, requestedSec };

  const total = LENGTH_COUNT[state.minutes] || 9;
  const openCount = state.minutes === 10 ? 1 : 2;
  const restCount = state.effort === 'strong' ? 1 : 2;

  const opens = eligible.filter((e) => e.pose.phase === 'open').slice(0, openCount);
  const restPool = eligible.filter((e) => e.pose.phase === 'rest').map((e) => e.pose);
  const rests = pickRest(restPool, restCount);
  const mainCount = Math.max(1, total - opens.length - rests.length);
  const mains = eligible.filter((e) => e.pose.phase === 'main').slice(0, mainCount);

  const chosen = [...opens.map((e) => e.pose), ...mains.map((e) => e.pose), ...rests];

  // No pose appears twice, and Corpse Pose always closes the practice.
  const seen = new Set();
  const ordered = [];
  for (const pose of chosen) {
    if (seen.has(pose.id)) continue;
    seen.add(pose.id);
    ordered.push(pose);
  }
  const savasana = POSES.find((p) => p.id === 'savasana-corpse-pose');
  const withoutSavasana = ordered.filter((p) => p.id !== 'savasana-corpse-pose');
  if (savasana) withoutSavasana.push(savasana);

  const holdTarget = Math.max(HOLD_MIN * withoutSavasana.length, requestedSec - 60);
  const holds = distributeHolds(withoutSavasana, holdTarget, rand);

  const items = withoutSavasana.map((pose, i) => ({
    pose,
    seconds: holds[i],
    matched: focus.filter((area) => pose.helps.includes(area)),
  }));

  const totalSec = items.reduce((a, item) => a + item.seconds, 0);
  return { items, totalSec, requestedSec };
}

function pickRest(poses, count) {
  // Corpse Pose always closes the practice.
  const savasana = poses.find((p) => p.id === 'savasana-corpse-pose');
  const others = poses.filter((p) => p.phase === 'rest' && p.id !== 'savasana-corpse-pose');
  const chosen = others.slice(0, Math.max(0, count - (savasana ? 1 : 0)));
  if (savasana) chosen.push(savasana);
  return chosen;
}

// The total the person will actually spend, including the breaths between shapes.
export function sessionLengthSec(items) {
  return items.reduce((a, item) => a + item.seconds, 0) + 60;
}

export { POSES };
