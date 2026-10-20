// Boot and routing.
//
// Four screens, one document, no framework. The router is a hash router so the service
// worker can fall back to index.html for any navigation while offline.

import { $, el, clear } from './ui.js';
import { t, tl, applyStaticStrings, setLanguage } from './i18n.js';
import { state, set, load, resolveInitial, save } from './store.js';
import { renderHome } from './views/home.js';
import { renderSession } from './views/session.js';
import { renderLibrary } from './views/library.js';
import { renderPlayer } from './views/player.js';

const view = $('#view');
let current = null;

const ROUTES = {
  '#/': 'home',
  '#/session': 'session',
  '#/library': 'library',
  '#/play': 'play',
};

function routeName() {
  return ROUTES[location.hash] || 'home';
}

function render() {
  current?.destroy?.();
  current = null;
  const name = routeName();

  if (name === 'session') {
    current = renderSession(view, {
      onBegin: () => navigate('#/play'),
      onChange: () => navigate('#/'),
      onShuffle: () => {
        set({ seed: state.seed + 1 });
        render();
      },
    });
  } else if (name === 'library') {
    current = renderLibrary(view);
  } else if (name === 'play') {
    current = renderPlayer(view, { onExit: () => navigate('#/session') });
  } else {
    current = renderHome(view, {
      onBuild: () => {
        set({ seed: state.seed + 1 });
        navigate('#/session');
      },
    });
  }

  document.body.dataset.view = name;
  if (name !== 'play') window.scrollTo({ top: 0, behavior: 'instant' });
}

function navigate(hash) {
  if (location.hash === hash) render();
  else location.hash = hash;
}

// ---- theme -----------------------------------------------------------------
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('prana-theme', theme);
  const meta = $('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0F1417' : '#E1E4E1');
  const button = $('#themeBtn');
  if (button) button.setAttribute('aria-label', theme === 'dark' ? t('themeToLight') : t('themeToDark'));
}

// ---- chrome ----------------------------------------------------------------
function buildTopbar() {
  const brand = el('a', { class: 'brand', href: '#/' }, [
    el('span', { class: 'brand-mark', 'aria-hidden': 'true' }, [
      (() => {
        const node = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        node.setAttribute('viewBox', '0 0 32 32');
        node.innerHTML =
          '<circle cx="16" cy="16" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M22.4 7.4A11 11 0 1 1 9.6 7.4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="16" cy="16" r="2.6" fill="currentColor"/>';
        return node;
      })(),
    ]),
    el('span', { class: 'brand-text' }, [el('strong', {}, 'Prāṇa')]),
  ]);

  const langSeg = el('div', { class: 'segment segment-lang', role: 'group', 'aria-label': t('langLabel') });
  for (const code of ['es', 'en']) {
    const button = el('button', {
      type: 'button',
      class: state.lang === code ? 'is-active' : '',
      'aria-pressed': state.lang === code ? 'true' : 'false',
      dataset: { lang: code },
    }, code.toUpperCase());
    button.addEventListener('click', () => {
      if (state.lang === code) return;
      setLanguage(code);
      set({ lang: code });
      for (const other of langSeg.querySelectorAll('button')) {
        const active = other === button;
        other.classList.toggle('is-active', active);
        other.setAttribute('aria-pressed', active ? 'true' : 'false');
      }
      render();
    });
    langSeg.append(button);
  }

  const themeBtn = el('button', { class: 'icon-btn', id: 'themeBtn', type: 'button', 'aria-label': t('themeToDark') }, [
    el('span', { 'aria-hidden': 'true', class: 'theme-glyph' }),
  ]);
  themeBtn.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    set({ theme: next });
    applyTheme(next);
  });

  const libraryBtn = el('a', { class: 'btn quiet', href: '#/library' }, [
    el('span', { class: 'label-long', 'data-i18n': 'library' }, t('library')),
    el('span', { class: 'label-short', 'data-i18n': 'libraryShort' }, t('libraryShort')),
  ]);

  const installBtn = el('button', { class: 'btn quiet', id: 'installBtn', type: 'button', hidden: true, 'data-i18n': 'install' }, t('install'));

  const aboutBtn = el('button', { class: 'btn quiet', id: 'aboutBtn', type: 'button', 'data-i18n': 'about' }, t('about'));

  const offline = el('span', { class: 'offline-pill', id: 'offlinePill', role: 'status' }, [
    el('span', { class: 'dot', 'aria-hidden': 'true' }),
    el('span', { id: 'offlineText' }, t('notSaved')),
  ]);

  return el('header', { class: 'topbar glass' }, [
    el('div', { class: 'topbar-inner' }, [
      brand,
      el('nav', { class: 'top-actions' }, [offline, langSeg, themeBtn]),
      el('nav', { class: 'top-links' }, [libraryBtn, installBtn, aboutBtn]),
    ]),
  ]);
}

function buildAbout() {
  const dialog = el('dialog', { class: 'sheet sheet-about', 'aria-label': t('aboutTitle') });
  const close = el('button', { class: 'sheet-close', type: 'button', 'aria-label': t('close') }, [
    el('span', { 'aria-hidden': 'true' }, '×'),
  ]);
  close.addEventListener('click', () => dialog.close());

  dialog.append(
    close,
    el('h2', { class: 'display-sm' }, t('aboutTitle')),
    el('p', {}, t('aboutP1')),
    el('p', {}, t('aboutP2')),
    el('p', {}, t('aboutP3')),
    el('p', { class: 'sheet-credit' }, [
      t('credit'),
      ' ',
      el('a', { href: 'https://yogaphilippines.com/image-license/', target: '_blank', rel: 'noopener' }, t('creditLink')),
    ])
  );
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  return dialog;
}

// ---- service worker --------------------------------------------------------
function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  const pill = $('#offlinePill');
  const text = $('#offlineText');

  // A controller that already existed means this is a repeat visit, so a change of
  // controller is a real update and worth reloading for. On a first visit it is not.
  const hadController = Boolean(navigator.serviceWorker.controller);
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return;
    // Never yank someone out of a practice halfway through.
    if (location.hash === '#/play') return;
    reloading = true;
    location.reload();
  });

  navigator.serviceWorker
    .register('./sw.js', { updateViaCache: 'none' })
    .then((registration) => {
      const markReady = () => {
        if (pill) pill.dataset.ready = 'true';
        if (text) text.textContent = t('savedOffline');
        document.querySelector('#offlinePill')?.classList.add('is-ready');
      };
      if (navigator.serviceWorker.controller) markReady();
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'activated' || worker.state === 'installed') markReady();
        });
      });
    })
    .catch(() => {
      // No service worker means no offline copy; the app still runs.
    });
}

function setupInstallPrompt() {
  const button = $('#installBtn');
  if (!button) return;
  let deferred = null;
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferred = event;
    button.hidden = false;
  });
  button.addEventListener('click', async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    deferred = null;
    button.hidden = true;
  });
}

// ---- boot ------------------------------------------------------------------
function boot() {
  load();
  resolveInitial();
  applyTheme(state.theme);
  applyStaticStrings();

  const header = $('#topbar');
  header.replaceWith(buildTopbar());
  applyStaticStrings();

  // The skip link must not change the hash, or the router would treat it as a route.
  document.querySelector('.skip')?.addEventListener('click', (event) => {
    event.preventDefault();
    const main = $('#main');
    main.focus();
    main.scrollIntoView({ block: 'start' });
  });


  const about = buildAbout();
  document.body.append(about);
  $('#aboutBtn').addEventListener('click', () => about.showModal());

  window.addEventListener('hashchange', render);
  render();

  registerServiceWorker();
  setupInstallPrompt();

  window.addEventListener('beforeunload', save);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
