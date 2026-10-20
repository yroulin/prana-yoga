// The practice itself.
//
// One pose at a time: the drawing, the name, the three steps, a bar for the hold and the
// breath ring underneath. The ring is the app's one idea — it is the countdown, the
// breath, and the icon all at once.

import { el, clear } from '../ui.js';
import { t, tl, fill } from '../i18n.js';
import { state, set } from '../store.js';
import { generateSequence, sessionLengthSec } from '../generator.js';
import { chime, unlock } from '../audio.js';

const RING_R = 52;
const RING_C = 2 * Math.PI * RING_R;
const BREATH_CYCLE = 10_000; // four seconds in, six seconds out
const BREATH_IN = 4_000;

export function renderPlayer(root, { onExit }) {
  const result = generateSequence(state);
  const items = result.items;

  if (!items.length) {
    clear(root).append(el('p', { class: 'empty-note' }, t('emptyBody')));
    return { destroy() {} };
  }

  let index = 0;
  // Time is kept as "time banked while paused" plus "time since the clock last started".
  // Adding to a running total on pause and resetting on resume is what makes a timer drift;
  // this model cannot.
  let banked = 0;
  let runStartedAt = performance.now();
  let paused = false;
  let autoPaused = false;

  const elapsedNow = (now = performance.now()) => banked + (paused ? 0 : now - runStartedAt);

  function pauseClock(auto = false) {
    if (paused) return;
    banked = elapsedNow();
    paused = true;
    autoPaused = auto;
    syncPauseButton();
  }

  function resumeClock() {
    if (!paused) return;
    runStartedAt = performance.now();
    paused = false;
    autoPaused = false;
    syncPauseButton();
  }

  function syncPauseButton() {
    pause.setAttribute('aria-label', paused ? t('resume') : t('pause'));
    if (pause.firstElementChild) pause.firstElementChild.textContent = paused ? '▶' : '❙❙';
    root.classList.toggle('is-paused', paused);
  }
  let frame = 0;
  let wakeLock = null;

  const total = sessionLengthSec(items);

  // ---- chrome ------------------------------------------------------------
  const exit = el('button', { class: 'icon-btn', type: 'button', 'aria-label': t('exit') }, [
    el('span', { 'aria-hidden': 'true' }, '×'),
  ]);
  exit.addEventListener('click', onExit);

  const sound = el('button', {
    class: 'icon-btn',
    type: 'button',
    'aria-label': t('soundOff'),
    'aria-pressed': state.sound ? 'true' : 'false',
  }, [
    (() => {
      const node = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      node.setAttribute('viewBox', '0 0 24 24');
      node.setAttribute('width', '17');
      node.setAttribute('height', '17');
      node.setAttribute('fill', 'none');
      node.setAttribute('stroke', 'currentColor');
      node.setAttribute('stroke-width', '1.7');
      node.setAttribute('stroke-linecap', 'round');
      node.setAttribute('stroke-linejoin', 'round');
      node.setAttribute('aria-hidden', 'true');
      node.innerHTML =
        '<path class="sound-on" d="M11 5 6.5 9H3v6h3.5L11 19z"/><path class="sound-on" d="M15 9.5a3.5 3.5 0 0 1 0 5"/><path class="sound-on" d="M17.5 7a7 7 0 0 1 0 10"/><path class="sound-off" d="M16 9.5l5 5M21 9.5l-5 5"/>';
      return node;
    })(),
  ]);
  sound.addEventListener('click', () => {
    const next = !state.sound;
    set({ sound: next });
    sound.setAttribute('aria-pressed', next ? 'true' : 'false');
    sound.setAttribute('aria-label', next ? t('soundOn') : t('soundOff'));
    if (next) chime();
  });

  const counter = el('p', { class: 'player-count' });
  const remaining = el('p', { class: 'player-remaining' });
  const dots = el('div', { class: 'player-dots', 'aria-hidden': 'true' });
  for (const item of items) dots.append(el('span', { class: 'dot' }));

  const bar = el('div', { class: 'player-bar' }, [exit, counter, dots, remaining, sound]);

  // ---- the card ----------------------------------------------------------
  const figure = el('figure', { class: 'player-fig' }, [
    el('img', { class: 'player-img', alt: '', width: 1200, height: 900 }),
  ]);
  const poseName = el('h2', { class: 'display-sm player-name' });
  const sanskrit = el('p', { class: 'player-sanskrit' });
  const hold = el('p', { class: 'player-hold' });
  const steps = el('ol', { class: 'pose-steps-list player-steps' });
  const progressFill = el('span', { class: 'progress-fill' });

  const card = el('section', { class: 'player-card glass' }, [
    el('div', { class: 'player-card-top' }, [figure, el('div', { class: 'player-card-text' }, [poseName, sanskrit, hold])]),
    steps,
    el('div', { class: 'progress' }, [progressFill]),
  ]);

  // ---- the breath ring ----------------------------------------------------
  const ringLabel = el('span', { class: 'ring-label' });
  const ring = el('div', { class: 'ring' }, [
    el('span', { class: 'ring-halo', 'aria-hidden': 'true' }),
    (() => {
      const node = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      node.setAttribute('viewBox', '0 0 120 120');
      node.setAttribute('aria-hidden', 'true');
      node.innerHTML = `<circle class="ring-track" cx="60" cy="60" r="${RING_R}" fill="none"/><circle class="ring-arc" cx="60" cy="60" r="${RING_R}" fill="none" stroke-dasharray="${RING_C}" stroke-dashoffset="${RING_C}" transform="rotate(-90 60 60)"/>`;
      return node;
    })(),
    ringLabel,
  ]);

  ring.setAttribute('aria-label', t('breathe'));
  const breathCue = el('p', { class: 'breath-cue' }, 'in 4 · out 6');

  // ---- controls -----------------------------------------------------------
  const prev = el('button', { class: 'round-btn', type: 'button', 'aria-label': t('previous') }, [
    el('span', { 'aria-hidden': 'true' }, '‹'),
  ]);
  const pause = el('button', { class: 'round-btn round-btn-main', type: 'button', 'aria-label': t('pause') }, [
    el('span', { 'aria-hidden': 'true' }, '❙❙'),
  ]);
  const next = el('button', { class: 'round-btn', type: 'button', 'aria-label': t('next') }, [
    el('span', { 'aria-hidden': 'true' }, '›'),
  ]);

  prev.addEventListener('click', () => go(index - 1));
  next.addEventListener('click', () => go(index + 1));
  pause.addEventListener('click', togglePause);

  const controls = el('div', { class: 'player-controls' }, [prev, pause, next]);

  const live = el('p', { class: 'visually-hidden', role: 'status', 'aria-live': 'polite' });

  const hint = el('p', { class: 'player-hint' });

  clear(root).append(
    el('div', { class: 'player' }, [bar, card, el('div', { class: 'player-breath' }, [ring, breathCue]), controls, hint, live])
  );

  // ---- behaviour ----------------------------------------------------------
  function go(nextIndex) {
    if (nextIndex < 0) return;
    if (nextIndex >= items.length) {
      onExit();
      return;
    }
    index = nextIndex;
    banked = 0;
    runStartedAt = performance.now();
    if (paused) resumeClock();
    paint();
    announce();
    if (state.sound) chime();
  }

  function togglePause() {
    if (paused) resumeClock();
    else pauseClock(false);
  }

  function announce() {
    const item = items[index];
    const upcoming = items[index + 1];
    const nextLine = upcoming ? ` ${t('upNext')}: ${tl(upcoming.pose.name)}.` : '';
    live.textContent = `${tl(item.pose.name)}, ${item.seconds} seconds.${nextLine}`;
  }

  function paint() {
    const item = items[index];
    const pose = item.pose;

    figure.querySelector('img').src = pose.img;
    figure.querySelector('img').alt = tl(pose.name);
    poseName.textContent = tl(pose.name);
    sanskrit.textContent = pose.sanskrit;
    hold.textContent = `${t('holdFor')} ${item.seconds}s`;
    steps.replaceChildren(...tl(pose.steps).map((s) => el('li', {}, s)));

    counter.textContent = `${index + 1} ${t('playerOf')} ${items.length}`;
    const left = Math.max(0, total - sessionLengthSec(items.slice(0, index)) - elapsedNow() / 1000);
    remaining.textContent = `${Math.max(0, Math.round(left / 60))} min ${t('playerLeft')}`;

    const upcoming = items[index + 1];
    hint.textContent = upcoming
      ? `${t('upNext')}: ${tl(upcoming.pose.name)}`
      : t('playerHint');

    [...dots.children].forEach((dot, i) => {
      dot.classList.toggle('is-done', i < index);
      dot.classList.toggle('is-current', i === index);
    });

    prev.disabled = index === 0;
    next.disabled = index === items.length - 1;
  }

  function tick(now) {
    const elapsed = elapsedNow(now);
    const item = items[index];
    const progress = Math.min(1, elapsed / (item.seconds * 1000));

    progressFill.style.transform = `scaleX(${progress})`;
    const arc = ring.querySelector('.ring-arc');
    arc.style.strokeDashoffset = String(RING_C * (1 - progress));

    // The breath runs on its own clock, four seconds in and six seconds out.
    const cycle = now % BREATH_CYCLE;
    const inhaling = cycle < BREATH_IN;
    ring.classList.toggle('is-inhale', inhaling);
    ring.classList.toggle('is-exhale', !inhaling);
    ringLabel.textContent = inhaling ? t('breathIn') : t('breathOut');

    if (!paused && elapsed >= item.seconds * 1000) {
      if (index >= items.length - 1) {
        onExit();
        return;
      }
      go(index + 1);
    }

    frame = requestAnimationFrame(tick);
  }

  function onKey(event) {
    if (event.key === 'ArrowRight') go(index + 1);
    else if (event.key === 'ArrowLeft') go(index - 1);
    else if (event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      togglePause();
    } else if (event.key === 'Escape') onExit();
  }

  async function requestWakeLock() {
    try {
      if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen');
    } catch {
      // Not available, or the browser refused. The practice still works.
    }
  }

  function releaseWakeLock() {
    try {
      wakeLock?.release();
    } catch {
      /* already released */
    }
    wakeLock = null;
  }

  // Switching tabs or locking the phone should hold the pose, not run it down silently.
  function onVisibility() {
    if (document.hidden) pauseClock(true);
    else if (autoPaused) resumeClock();
  }

  document.addEventListener('keydown', onKey);
  document.addEventListener('visibilitychange', onVisibility);
  document.documentElement.classList.add('is-playing');
  unlock();
  requestWakeLock();
  paint();
  announce();
  frame = requestAnimationFrame(tick);

  return {
    destroy() {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onVisibility);
      document.documentElement.classList.remove('is-playing');
      releaseWakeLock();
    },
  };
}
