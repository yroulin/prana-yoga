// A browsable reference for the whole library, for the days when you want to look at
// shapes rather than be handed a sequence.

import { el, clear } from '../ui.js';
import { t, tl } from '../i18n.js';
import { POSES, CREDIT } from '../data/poses.js';
import { FOCUS_AREAS, EFFORTS } from '../data/strings.js';

const LEVEL_LABEL = { gentle: 'Gentle', steady: 'Steady', strong: 'Strong' };

function levelName(id) {
  const found = EFFORTS.find((e) => e.id === id);
  return found ? tl(found.label) : LEVEL_LABEL[id] || id;
}

function detailDialog(pose) {
  const dialog = el('dialog', { class: 'sheet', 'aria-label': tl(pose.name) });

  const close = el('button', { class: 'sheet-close', type: 'button', 'aria-label': t('close') }, [
    el('span', { 'aria-hidden': 'true' }, '×'),
  ]);
  close.addEventListener('click', () => dialog.close());

  dialog.append(
    close,
    el('div', { class: 'sheet-grid' }, [
      el('figure', { class: 'sheet-fig' }, [
        el('img', { src: pose.img, alt: tl(pose.name), width: 1200, height: 900 }),
        el('img', { class: 'sheet-strip', src: pose.stepsImg, alt: '', width: 1440, height: 413 }),
      ]),
      el('div', { class: 'sheet-body' }, [
        el('h2', { class: 'display-sm' }, [
          tl(pose.name),
          el('span', { class: 'pose-sanskrit' }, pose.sanskrit),
        ]),
        el('p', { class: 'sheet-cue' }, tl(pose.cue)),
        el('h3', { class: 'sheet-sub' }, t('stepsHow')),
        el('ol', { class: 'pose-steps-list' }, tl(pose.steps).map((s) => el('li', {}, s))),
        el('p', { class: 'pose-care' }, [
          el('span', { class: 'pose-care-label' }, t('care')),
          tl(pose.care),
        ]),
        el('p', { class: 'sheet-tags' }, [
          el('span', { class: 'tag' }, levelName(pose.level)),
          ...pose.helps.map((id) =>
            el('span', { class: 'tag' }, tl(FOCUS_AREAS.find((a) => a.id === id)?.label) || id)
          ),
        ]),
        el('p', { class: 'pose-credit' }, [
          el('a', { href: pose.source, target: '_blank', rel: 'noopener' }, CREDIT),
        ]),
      ]),
    ])
  );

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  return dialog;
}

export function renderLibrary(root) {
  const query = { text: '', level: 'all', area: 'all' };

  const head = el('header', { class: 'session-head' }, [
    el('h1', { class: 'display' }, t('libraryTitle')),
    el('p', { class: 'session-meta', id: 'libraryCount' }, ''),
  ]);

  const search = el('input', {
    type: 'search',
    class: 'search',
    placeholder: t('librarySearch'),
    'aria-label': t('librarySearch'),
    autocomplete: 'off',
  });
  search.addEventListener('input', () => {
    query.text = search.value.trim().toLowerCase();
    paint();
  });

  const levelChips = el('div', { class: 'chips chips-small', role: 'group', 'aria-label': t('level') });
  const levelOptions = [{ id: 'all', label: t('libraryAll') }, ...EFFORTS];
  for (const option of levelOptions) {
    const chip = el('button', {
      type: 'button',
      class: 'chip',
      'aria-pressed': option.id === 'all' ? 'true' : 'false',
    }, tl(option.label));
    chip.addEventListener('click', () => {
      query.level = option.id;
      for (const other of levelChips.querySelectorAll('.chip')) {
        other.setAttribute('aria-pressed', other === chip ? 'true' : 'false');
      }
      paint();
    });
    levelChips.append(chip);
  }

  const areaSelect = el('select', { class: 'select', 'aria-label': t('groupFocus') });
  areaSelect.append(el('option', { value: 'all' }, t('libraryAll')));
  for (const area of FOCUS_AREAS) {
    areaSelect.append(el('option', { value: area.id }, tl(area.label)));
  }
  areaSelect.addEventListener('change', () => {
    query.area = areaSelect.value;
    paint();
  });

  const filters = el('div', { class: 'filters' }, [
    el('div', { class: 'field' }, [search]),
    el('div', { class: 'field' }, [levelChips]),
    el('div', { class: 'field field-narrow' }, [areaSelect]),
  ]);

  const grid = el('div', { class: 'lib-grid' });
  const count = el('p', { class: 'note-inline', role: 'status' });
  const dialog = detailDialog;

  function matches(pose) {
    if (query.level !== 'all' && pose.level !== query.level) return false;
    if (query.area !== 'all' && !pose.helps.includes(query.area)) return false;
    if (!query.text) return true;
    const haystack = [
      pose.name.en,
      pose.name.es,
      pose.sanskrit,
      ...pose.helps,
      ...FOCUS_AREAS.map((a) => a.label.en),
      ...FOCUS_AREAS.map((a) => a.label.es),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(query.text);
  }

  function paint() {
    clear(grid);
    const found = POSES.filter(matches);
    count.textContent = `${found.length} ${t('libraryCount')}`;
    if (!found.length) {
      grid.append(el('p', { class: 'empty-note' }, t('libraryNoResult')));
      return;
    }
    for (const pose of found) {
      const card = el('button', { type: 'button', class: 'lib-card' }, [
        el('span', { class: 'lib-fig' }, [
          el('img', { src: pose.img, alt: '', loading: 'lazy', decoding: 'async', width: 1200, height: 900 }),
        ]),
        el('span', { class: 'lib-meta' }, [
          el('span', { class: 'lib-name' }, tl(pose.name)),
          el('span', { class: 'lib-sanskrit' }, pose.sanskrit),
        ]),
      ]);
      card.addEventListener('click', () => {
        const dlg = dialog(pose);
        document.body.append(dlg);
        dlg.showModal();
        dlg.addEventListener('close', () => dlg.remove());
      });
      grid.append(card);
    }
  }

  paint();
  clear(root).append(head, filters, count, grid);

  return { destroy() {} };
}
