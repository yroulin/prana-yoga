// Drives the app the way a person would, and checks that the things work.
//
// Run:  node tools/drive.mjs [baseUrl]
//
// The driver selects by structure (data attributes, classes, ids), never by visible text,
// so it keeps working whichever language is the default.
//
// Order matters in one place: under headless Chrome, dispatching Escape marks the document
// hidden, which pauses requestAnimationFrame. The player checks therefore run before the
// Escape check.

const BASE = process.argv[2] || 'http://localhost:8765';

let failures = 0;
let checks = 0;

function ok(condition, message) {
  checks += 1;
  if (!condition) {
    failures += 1;
    console.error(`  FAIL  ${message}`);
  }
}

async function main() {
  const { spawn } = await import('node:child_process');
  const { mkdtemp } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const path = (await import('node:path')).default;

  const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const profile = await mkdtemp(path.join(tmpdir(), 'prana-drive-'));
  const child = spawn(
    CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      `--user-data-dir=${profile}`,
      '--remote-debugging-port=0',
      'about:blank',
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  );

  const wsUrl = await new Promise((resolve, reject) => {
    let buffer = '';
    child.stderr.on('data', (chunk) => {
      buffer += chunk.toString();
      const match = buffer.match(/DevTools listening on (ws:\/\/\S+)/);
      if (match) resolve(match[1]);
    });
    setTimeout(() => reject(new Error('chrome did not start')), 20000);
  });

  const socket = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  await new Promise((resolve) => socket.addEventListener('open', resolve));
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve: done, reject: fail } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) fail(new Error(JSON.stringify(message.error)));
      else done(message.result);
    }
  });
  const raw = (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
      const messageId = ++id;
      pending.set(messageId, { resolve, reject });
      socket.send(JSON.stringify({ id: messageId, method, params, ...(sessionId ? { sessionId } : {}) }));
      setTimeout(() => {
        if (pending.has(messageId)) {
          pending.delete(messageId);
          reject(new Error(`${method} timed out`));
        }
      }, 30000);
    });

  const { targetId } = await raw('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await raw('Target.attachToTarget', { targetId, flatten: true });
  const send = (method, params) => raw(method, params, sessionId);

  const pageErrors = [];
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Log.enable');
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
      pageErrors.push(message.params.entry.text);
    }
    if (message.method === 'Runtime.exceptionThrown') {
      pageErrors.push(
        message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text
      );
    }
  });

  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', {
      expression: `(async () => { ${expression} })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description || 'evaluation failed');
    }
    return result.result.value;
  };

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const click = async (selector, settle = 400) => {
    await evaluate(`
      const node = document.querySelector(${JSON.stringify(selector)});
      if (!node) throw new Error('no element for ${selector}');
      node.click();
      await new Promise(r => setTimeout(r, ${settle}));
      return true;
    `);
  };
  const setLang = (code) => click(`.segment-lang [data-lang="${code}"]`, 500);
  const go = (hash) => evaluate(`location.hash = ${JSON.stringify(hash)}; await new Promise(r => setTimeout(r, 500)); return true;`);

  await send('Page.navigate', { url: `${BASE}/index.html` });
  await wait(1400);

  console.log('spanish is the default');
  {
    const info = await evaluate(`
      return {
        lang: document.documentElement.lang,
        h1: document.querySelector('h1')?.textContent,
        order: [...document.querySelectorAll('.segment-lang button')].map(b => b.dataset.lang),
        active: document.querySelector('.segment-lang [aria-pressed="true"]')?.dataset.lang,
        build: document.querySelector('.btn.primary')?.textContent,
        title: document.title,
      };
    `);
    ok(info.lang === 'es', `the document language is Spanish, found ${info.lang}`);
    ok(/Vuelve/.test(info.h1 || ''), `the heading is Spanish, found ${info.h1}`);
    ok(info.order[0] === 'es', 'Spanish is listed first in the toggle');
    ok(info.active === 'es', 'Spanish is the active language');
    ok(/Crear|secuencia/i.test(info.build || ''), 'the primary action is in Spanish');
  }

  console.log('switching to English');
  await setLang('en');
  {
    const info = await evaluate(`
      return {
        lang: document.documentElement.lang,
        h1: document.querySelector('h1')?.textContent,
        build: document.querySelector('.btn.primary')?.textContent,
        title: document.title,
      };
    `);
    ok(info.lang === 'en', 'the html language changed to English');
    ok(/Come back/.test(info.h1 || ''), 'the heading is in English');
    ok(/Build/.test(info.build || ''), 'the primary action is in English');
  }

  console.log('the setup screen');
  {
    const info = await evaluate(`
      return {
        choices: document.querySelectorAll('.choice-input').length,
        chips: document.querySelectorAll('.chip[data-area]').length,
        segments: document.querySelectorAll('.segment-label').length,
        primary: document.querySelectorAll('.btn.primary').length,
      };
    `);
    ok(info.choices === 5, `five session types, found ${info.choices}`);
    ok(info.chips === 11, `eleven focus areas, found ${info.chips}`);
    ok(info.segments >= 2, `the segmented groups are there, found ${info.segments}`);
    ok(info.primary === 1, `one primary action on the screen, found ${info.primary}`);
  }

  console.log('building a session');
  await click('.choice-input[value="desk-reset"]', 100);
  await click('.btn.primary', 600);
  {
    const info = await evaluate(`
      const cards = [...document.querySelectorAll('.pose')];
      return {
        hash: location.hash,
        count: cards.length,
        holds: cards.map(c => c.querySelector('.pose-hold')?.textContent),
        reasons: cards.map(c => c.querySelector('.pose-reason')?.textContent),
        names: cards.map(c => c.querySelector('.pose-name')?.textContent),
        actions: [...document.querySelectorAll('.actions .btn')].map(b => b.dataset.action),
      };
    `);
    ok(info.hash === '#/session', 'the session route is open');
    ok(info.count >= 6, `the session has poses, found ${info.count}`);
    ok(/Corpse/.test(info.names.at(-1) || ''), 'the session ends in Corpse Pose');
    ok(info.holds.every((h) => /\d+s$/.test(h)), 'every hold is a number of seconds');
    ok(info.reasons.every((r) => r && r.length > 10), 'every pose explains itself');
    ok(info.actions.join(',') === 'begin,shuffle,print,change', `the four actions are present, found ${info.actions}`);
  }

  console.log('the shuffle');
  {
    const before = await evaluate(`return [...document.querySelectorAll('.pose-name')].map(n => n.textContent).join('|');`);
    await click('[data-action="shuffle"]', 600);
    const after = await evaluate(`return [...document.querySelectorAll('.pose-name')].map(n => n.textContent).join('|');`);
    ok(before !== after, 'shuffling changes the sequence');
  }

  console.log('the focus areas are honoured');
  {
    await go('#/');
    await click('.chip[data-area="wrists"]', 150);
    await click('.btn.primary', 600);
    const names = await evaluate(`return [...document.querySelectorAll('.pose-name')].map(n => n.textContent);`);
    ok(names.length > 0, 'a session is still built for wrists');
    ok(
      !/Downward|Plank|Cobra|Upward|Table Top|Cat-Cow|Dolphin|Puppy/i.test(names.join(' ')),
      'wrist-loading poses are excluded'
    );
  }

  console.log('the theme switch');
  {
    const info = await evaluate(`
      const before = document.documentElement.dataset.theme;
      document.querySelector('#themeBtn').click();
      await new Promise(r => setTimeout(r, 250));
      return { before, after: document.documentElement.dataset.theme, stored: localStorage.getItem('prana-theme') };
    `);
    ok(info.before !== info.after, 'the theme toggle switches the theme');
    ok(info.stored === info.after, 'the theme is remembered');
  }

  console.log('the library');
  {
    await go('#/library');
    const info = await evaluate(`
      const before = document.querySelectorAll('.lib-card').length;
      const search = document.querySelector('.search');
      search.value = 'tree';
      search.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(r => setTimeout(r, 250));
      const after = document.querySelectorAll('.lib-card').length;
      search.value = '';
      search.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(r => setTimeout(r, 250));
      return { before, after };
    `);
    ok(info.before === 45, `all 45 poses are listed, found ${info.before}`);
    ok(info.after === 1, `the search narrows the list, found ${info.after}`);
  }

  console.log('the pose dialog');
  {
    const info = await evaluate(`
      document.querySelector('.lib-card').click();
      await new Promise(r => setTimeout(r, 350));
      const dialog = document.querySelector('dialog[open]');
      const steps = dialog?.querySelectorAll('.pose-steps-list li').length ?? 0;
      const credit = dialog?.querySelector('.pose-credit a')?.getAttribute('href') ?? '';
      const d = dialog?.getBoundingClientRect();
      const rect = d && { top: Math.round(d.top), bottom: Math.round(d.bottom), left: Math.round(d.left), right: Math.round(d.right) };
      const fits = d ? d.top >= 0 && d.left >= 0 && d.bottom <= innerHeight && d.right <= innerWidth : false;
      return { open: !!dialog, steps, credit, rect, fits };
    `);
    ok(info.open, 'the pose dialog opens');
    ok(info.steps >= 3, 'the dialog shows the steps');
    ok(/yogaphilippines\.com\/poses\//.test(info.credit), 'the dialog links to the source page');
    ok(info.fits, `the pose dialog fits the viewport (${JSON.stringify(info.rect)})`);
  }

  console.log('the close button');
  {
    const closed = await evaluate(`
      document.querySelector('dialog[open] .sheet-close')?.click();
      await new Promise(r => setTimeout(r, 250));
      return !document.querySelector('dialog[open]');
    `);
    ok(closed, 'the close button closes the dialog');
  }

  console.log('the about dialog');
  {
    await go('#/');
    await click('#aboutBtn', 350);
    const info = await evaluate(`
      const d = document.querySelector('dialog[open]');
      const r = d.getBoundingClientRect();
      const text = d.textContent;
      return {
        open: !!d,
        top: Math.round(r.top), bottom: Math.round(r.bottom),
        left: Math.round(r.left), right: Math.round(r.right),
        vw: innerWidth, vh: innerHeight,
        fits: r.top >= 0 && r.left >= 0 && r.bottom <= innerHeight && r.right <= innerWidth,
        centred: Math.abs(r.top - (innerHeight - r.height) / 2) < 2,
        mentionsBrand: /Prāṇa|prāṇa/i.test(text),
        mentionsLicence: /CC BY 4\.0/.test(text),
      };
    `);
    ok(info.open, 'the about dialog opens');
    ok(info.mentionsBrand, 'the about text is there');
    ok(info.mentionsLicence, 'the licence is credited');
    ok(info.fits, `the about dialog fits the viewport (${info.top}-${info.bottom} of ${info.vh})`);
    ok(info.centred, 'the about dialog is vertically centred');
    await evaluate(`document.querySelector('dialog[open]').close(); return true;`);
  }

  console.log('the player');
  {
    await go('#/play');
    await wait(400);
    const info = await evaluate(`
      const ring = document.querySelector('.ring-arc');
      const fill = document.querySelector('.progress-fill');
      const before = ring.style.strokeDashoffset;
      await new Promise(r => setTimeout(r, 900));
      const after = ring.style.strokeDashoffset;
      const live = document.querySelector('[role="status"][aria-live="polite"]');
      return {
        visibility: document.visibilityState,
        hasCard: !!document.querySelector('.player-card'),
        steps: document.querySelectorAll('.player-steps li').length,
        before,
        after,
        fill: fill?.style.transform,
        live: live?.textContent,
        topbarHidden: getComputedStyle(document.querySelector('.topbar')).display,
      };
    `);
    ok(info.visibility === 'visible', `the page is visible for the timing check, found ${info.visibility}`);
    ok(info.hasCard, 'the player card is there');
    ok(info.steps === 3, 'the player shows three steps');
    ok(info.before !== info.after, 'the hold ring is moving');
    ok(/scaleX/.test(info.fill || ''), 'the hold bar is moving');
    ok((info.live || '').length > 5, 'the player announces the pose');
    ok(info.topbarHidden === 'none', 'the app chrome is hidden during a practice');
  }

  console.log('pause holds the clock still');
  {
    const info = await evaluate(`
      document.querySelector('.round-btn-main').click();
      await new Promise(r => setTimeout(r, 150));
      const ring = document.querySelector('.ring-arc');
      const a = ring.style.strokeDashoffset;
      await new Promise(r => setTimeout(r, 700));
      const b = ring.style.strokeDashoffset;
      const pausedLabel = document.querySelector('.round-btn-main').getAttribute('aria-label');
      document.querySelector('.round-btn-main').click();
      await new Promise(r => setTimeout(r, 500));
      const c = ring.style.strokeDashoffset;
      return { a, b, c, pausedLabel, isPaused: document.documentElement.classList.contains('is-paused') };
    `);
    ok(info.a === info.b, 'the ring does not advance while paused');
    ok(info.a !== info.c, 'the ring advances again after resuming');
    ok(info.isPaused === false, 'the paused state is cleared on resume');
  }

  console.log('escape and the backdrop close the dialog');
  {
    await go('#/');
    await click('#aboutBtn', 350);
    ok(await evaluate(`return !!document.querySelector('dialog[open]');`), 'the about dialog opens');

    await send('Input.dispatchKeyEvent', {
      type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27,
    });
    await send('Input.dispatchKeyEvent', {
      type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27,
    });
    await wait(350);
    ok(!(await evaluate(`return !!document.querySelector('dialog[open]');`)), 'escape closes the dialog');

    await click('#aboutBtn', 350);
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 12, y: 12, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 12, y: 12, button: 'left', clickCount: 1 });
    await wait(350);
    ok(!(await evaluate(`return !!document.querySelector('dialog[open]');`)), 'clicking the backdrop closes the dialog');
  }

  console.log('back to Spanish');
  {
    await evaluate(`document.querySelectorAll('dialog[open]').forEach(d => d.close()); return true;`);
    await go('#/');
    await setLang('es');
    const info = await evaluate(`
      return {
        lang: document.documentElement.lang,
        h1: document.querySelector('h1')?.textContent,
        title: document.title,
        stored: localStorage.getItem('prana-lang'),
      };
    `);
    ok(info.lang === 'es', 'the language switched back');
    ok(/Vuelve/.test(info.h1 || ''), 'the heading is Spanish again');
    ok(info.stored === 'es', 'the choice is remembered');
  }

  console.log('no runtime errors');
  ok(pageErrors.length === 0, `the page reported errors: ${pageErrors.join(' | ')}`);

  socket.close();
  child.kill();

  console.log('');
  if (failures) {
    console.error(`${failures} of ${checks} checks failed`);
    process.exit(1);
  }
  console.log(`all ${checks} interaction checks passed`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
