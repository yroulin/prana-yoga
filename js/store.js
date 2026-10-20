// Application state. Everything the person chose is kept here and mirrored into
// localStorage so the app comes back exactly as they left it.

const KEY = 'prana-state-v1';

const DEFAULTS = {
  lang: null, // resolved on boot from the browser, then stored
  theme: null, // resolved on boot from the browser, then stored
  session: 'desk-reset',
  focus: [],
  minutes: 20,
  effort: 'gentle',
  seed: 1,
  sound: true,
  sequence: null,
};

export const state = { ...DEFAULTS };

const listeners = new Set();

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function notify() {
  for (const fn of listeners) fn(state);
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    for (const key of Object.keys(DEFAULTS)) {
      if (saved[key] !== undefined && saved[key] !== null) state[key] = saved[key];
    }
    if (!Array.isArray(state.focus)) state.focus = [];
  } catch {
    // A broken blob should never stop the app from opening.
  }
}

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Private mode or a full quota: the app still works, it just forgets.
  }
}

export function set(patch) {
  Object.assign(state, patch);
  save();
  notify();
}

export function reset() {
  Object.assign(state, DEFAULTS);
  save();
  notify();
}

// The initial language and theme are only guessed once, then remembered.
export function resolveInitial() {
  if (!state.lang) {
    const stored = localStorage.getItem('prana-lang');
    // Spanish is the first language of this app. A returning visitor keeps whatever they
    // picked; everyone else arrives in Spanish.
    state.lang = stored === 'en' || stored === 'es' ? stored : 'es';
  }
  if (!state.theme) {
    const stored = localStorage.getItem('prana-theme');
    if (stored === 'light' || stored === 'dark') {
      state.theme = stored;
    } else {
      state.theme = window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
  }
  save();
}
