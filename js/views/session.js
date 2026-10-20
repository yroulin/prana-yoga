// The generated sequence: what you will actually do, and why each shape is in it.

import { el, clear, formatMinutes } from '../ui.js';
import { t, tl } from '../i18n.js';
import { state } from '../store.js';
import { generateSequence, sessionLengthSec } from '../generator.js';
import { FOCUS_AREAS, SESSION_TYPES } from '../data/strings.js';
import { CREDIT } from '../data/poses.js';

const areaName = (id) => tl(FOCUS_AREAS.find((a) => a.id === id)?.label) || id;
const sessionName = (id) => tl(SESSION_TYPES.find((s) => s.id === id)?.label) || id;

function reasonFor(item) {
  const cue = tl(item.pose.cue);
  if (item.matched.length) {
    const names = item.matched.map(areaName).join(', ');
    return `${t('whyFor')} ${names} — ${cue}`;
  }
  return `${t('whyBalanced')} ${sessionName(state.session).toLowerCase()}. ${cue}`;
}

function poseCard(item, index) {
  const pose = item.pose;

  const figure = el('figure', { class: 'pose-fig' }, [
    el('img', {
      src: pose.img,
      alt: `${tl(pose.name)} — ${tl(pose.name)}`,
      loading: 'lazy',
      decoding: 'async',
      width: 1200,
      height: 900,
    }),
  ]);

  const head = el('div', { class: 'pose-head' }, [
    el('h3', { class: 'pose-name' }, [
      tl(pose.name),
      el('span', { class: 'pose-sanskrit' }, pose.sanskrit),
    ]),
    el('span', { class: 'pose-hold' }, `${item.seconds}s`),
  ]);

  const reason = el('p', { class: 'pose-reason' }, reasonFor(item));

  const toggle = el(
    'button',
    { type: 'button', class: 'pose-more-toggle', 'aria-expanded': 'false' },
    t('stepsHow')
  );
  const more = el('div', { class: 'pose-more-body', hidden: true }, [
    el('ol', { class: 'pose-steps-list' }, tl(pose.steps).map((step) => el('li', {}, step))),
    el('img', {
      class: 'pose-strip',
      src: pose.stepsImg,
      alt: '',
      loading: 'lazy',
      decoding: 'async',
      width: 1440,
      height: 413,
    }),
    el('p', { class: 'pose-care' }, [
      el('span', { class: 'pose-care-label' }, t('care')),
      tl(pose.care),
    ]),
    el('p', { class: 'pose-credit' }, [
      el('a', { href: pose.source, target: '_blank', rel: 'noopener' }, CREDIT),
    ]),
  ]);
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    more.hidden = open;
  });
  const details = el('div', { class: 'pose-more' }, [toggle, more]);

  return el('article', { class: 'pose' }, [
    el('span', { class: 'pose-index' }, String(index + 1).padStart(2, '0')),
    figure,
    el('div', { class: 'pose-body' }, [head, reason, details]),
  ]);
}

export function renderSession(root, { onBegin, onChange, onShuffle }) {
  const result = generateSequence(state);

  if (!result.items.length) {
    clear(root).append(
      el('div', { class: 'empty glass' }, [
        el('h2', { class: 'display-sm' }, t('emptyTitle')),
        el('p', { class: 'lede' }, t('emptyBody')),
        el('button', { class: 'btn primary', onclick: onChange }, t('change')),
      ])
    );
    return { destroy() {} };
  }

  const total = sessionLengthSec(result.items);
  const count = result.items.length;

  const summary = `${count} ${t('libraryCount')} · ${formatMinutes(total)} min`;
  const head = el('header', { class: 'session-head' }, [
    el('h1', { class: 'display' }, t('sessionTitle')),
    el('p', { class: 'session-meta' }, summary),
  ]);
  // Printed sheets need a heading of their own; on screen the app chrome already has one.
  const printHead = el('div', { class: 'print-head' }, [
    el('h1', {}, `Prāṇa — ${t('sessionTitle')}`),
    el('p', {}, summary),
  ]);

  const actions = el('div', { class: 'actions' }, [
    el('button', { class: 'btn primary', type: 'button', dataset: { action: 'begin' }, onclick: onBegin }, t('begin')),
    el('button', { class: 'btn quiet', type: 'button', dataset: { action: 'shuffle' }, onclick: onShuffle }, t('shuffle')),
    el('button', { class: 'btn quiet', type: 'button', dataset: { action: 'print' }, onclick: () => window.print() }, t('print')),
    el('button', { class: 'btn quiet', type: 'button', dataset: { action: 'change' }, onclick: onChange }, t('change')),
  ]);

  const list = el('ol', { class: 'pose-list' });
  result.items.forEach((item, index) => list.append(poseCard(item, index)));

  const credit = el('p', { class: 'foot-credit' }, [
    el('a', { href: 'https://yogaphilippines.com/image-license/', target: '_blank', rel: 'noopener' }, t('credit')),
  ]);

  clear(root).append(printHead, head, actions, list, credit);

  return { destroy() {} };
}
