// The setup screen: four questions, one narrow column.
//
// Single-choice groups use real radio inputs inside a fieldset so the arrow keys work and
// screen readers announce the group. The focus areas are multi-select, so they use
// buttons with aria-pressed.

import { el, clear } from '../ui.js';
import { t, tl } from '../i18n.js';
import { state, set } from '../store.js';
import { SESSION_TYPES, FOCUS_AREAS, EFFORTS, LENGTHS } from '../data/strings.js';

const MAX_FOCUS = 3;

export function renderHome(root, { onBuild }) {
  const form = el('form', { class: 'setup', novalidate: true });

  // ---- kind of session -------------------------------------------------
  const sessionFieldset = el('fieldset', { class: 'group' });
  sessionFieldset.append(el('legend', { class: 'group-label' }, [
    t('groupSession'),
  ]));
  const sessionList = el('div', { class: 'choices' });
  for (const type of SESSION_TYPES) {
    const id = `session-${type.id}`;
    const input = el('input', {
      type: 'radio',
      name: 'session',
      id,
      value: type.id,
      class: 'choice-input',
      checked: state.session === type.id,
    });
    input.addEventListener('change', () => set({ session: type.id }));
    sessionList.append(
      el('label', { class: 'choice', for: id }, [
        input,
        el('span', { class: 'choice-body' }, [
          el('span', { class: 'choice-name' }, tl(type.label)),
          el('span', { class: 'choice-hint' }, tl(type.hint)),
        ]),
      ])
    );
  }
  sessionFieldset.append(sessionList);

  // ---- where are you tight ---------------------------------------------
  const focusFieldset = el('fieldset', { class: 'group' });
  const focusLegend = el('legend', { class: 'group-label' }, [
    t('groupFocus'),
    el('span', { class: 'group-hint' }, t('groupFocusHint')),
  ]);
  focusFieldset.append(focusLegend);
  const focusChips = el('div', { class: 'chips' });
  const focusNote = el('p', { class: 'note-inline', role: 'status' });

  for (const area of FOCUS_AREAS) {
    const chip = el('button', {
      type: 'button',
      class: 'chip',
      'aria-pressed': state.focus.includes(area.id) ? 'true' : 'false',
      dataset: { area: area.id },
    }, tl(area.label));
    chip.addEventListener('click', () => {
      const focus = state.focus.includes(area.id)
        ? state.focus.filter((id) => id !== area.id)
        : [...state.focus, area.id];
      if (focus.length > MAX_FOCUS) {
        focusNote.textContent = t('focusLimit');
        focusNote.classList.add('is-shown');
        return;
      }
      focusNote.classList.remove('is-shown');
      set({ focus });
    });
    focusChips.append(chip);
  }
  focusFieldset.append(focusChips, focusNote);

  // ---- length and effort ------------------------------------------------
  function segmented(name, values, current, onPick, labelFor) {
    const fieldset = el('fieldset', { class: 'group group-tight' });
    fieldset.append(el('legend', { class: 'group-label' }, labelFor));
    const row = el('div', { class: 'segment' });
    for (const value of values) {
      const id = `${name}-${value.id ?? value}`;
      const input = el('input', {
        type: 'radio',
        name,
        id,
        value: value.id ?? value,
        class: 'segment-input',
        checked: current === (value.id ?? value),
      });
      input.addEventListener('change', () => onPick(value.id ?? value));
      row.append(
        el('label', { class: 'segment-label', for: id }, [
          input,
          el('span', {}, tl(value.label ?? `${value} min`)),
        ])
      );
    }
    fieldset.append(row);
    return fieldset;
  }

  const lengthFieldset = segmented(
    'minutes',
    LENGTHS.map((m) => ({ id: m, label: `${m} min` })),
    state.minutes,
    (minutes) => set({ minutes }),
    t('groupLength')
  );
  const effortFieldset = segmented(
    'effort',
    EFFORTS,
    state.effort,
    (effort) => set({ effort }),
    t('groupEffort')
  );

  const submit = el('button', { type: 'submit', class: 'btn primary btn-wide' }, t('build'));
  const safety = el('p', { class: 'safety' }, t('safety'));

  form.append(sessionFieldset, focusFieldset, lengthFieldset, effortFieldset, submit, safety);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    onBuild();
  });

  const heading = el('header', { class: 'home-head' }, [
    el('h1', { class: 'display' }, t('homeTitle')),
    el('p', { class: 'lede' }, t('homeLede')),
  ]);

  clear(root).append(heading, form);

  // Keep the controls in step when the language changes underneath them.
  return {
    refresh() {
      for (const chip of focusChips.querySelectorAll('.chip')) {
        chip.setAttribute('aria-pressed', state.focus.includes(chip.dataset.area) ? 'true' : 'false');
      }
    },
    destroy() {},
  };
}
