// Translation lookup and DOM application.
//
// Sanskrit names, timings, effort levels and focus-area ids are shared between languages;
// only words that a reader sees are translated. Every translatable node in the markup
// carries a data attribute so the whole page can be re-read in the other language
// without re-rendering it.

import { STR } from './data/strings.js';
import { state } from './store.js';

export function t(key) {
  return STR[state.lang]?.[key] ?? STR.en[key] ?? key;
}

// Picks the right language out of a { en, es } pair.
export function tl(value) {
  if (value && typeof value === 'object' && ('en' in value || 'es' in value)) {
    return value[state.lang] ?? value.en;
  }
  return value;
}

// Replaces {name} style holes in a string.
export function fill(template, values) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) =>
    values[key] === undefined ? `{${key}}` : String(values[key])
  );
}

const ATTRIBUTES = {
  'data-i18n': (el, text) => {
    el.textContent = text;
  },
  'data-i18n-html': (el, text) => {
    el.innerHTML = text;
  },
  'data-i18n-ph': (el, text) => {
    el.setAttribute('placeholder', text);
  },
  'data-i18n-aria': (el, text) => {
    el.setAttribute('aria-label', text);
  },
  'data-i18n-content': (el, text) => {
    el.setAttribute('content', text);
  },
  'data-i18n-title': (el, text) => {
    el.setAttribute('title', text);
  },
};

export function applyStaticStrings(root = document) {
  for (const [attribute, apply] of Object.entries(ATTRIBUTES)) {
    for (const el of root.querySelectorAll(`[${attribute}]`)) {
      const key = el.getAttribute(attribute);
      apply(el, t(key));
    }
  }
  document.documentElement.lang = state.lang;
  document.title = t('docTitle');
}

export function setLanguage(lang) {
  state.lang = lang;
  localStorage.setItem('prana-lang', lang);
  applyStaticStrings();
}
