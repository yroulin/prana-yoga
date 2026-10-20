// Development helper: drive headless Chrome over the DevTools protocol.
//
// Run:  node tools/shoot.mjs <url> <out.png> [--width=1200] [--height=900] [--theme=light|dark]
//                               [--script=file.js] [--full] [--wait=ms] [--click=selector]
//
// Used to take screenshots at exact viewport sizes, force the colour scheme, and pull
// measurements out of the page while designing.

import { spawn, execSync } from 'node:child_process';
import { writeFile, readFile } from 'node:fs/promises';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const args = process.argv.slice(2);
const url = args[0];
const out = args[1];
const flag = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=').slice(1).join('=') : fallback;
};
const has = (name) => args.includes(`--${name}`);

const width = Number(flag('width', 1200));
const height = Number(flag('height', 900));
const theme = flag('theme', 'light');
const wait = Number(flag('wait', 900));
const click = flag('click', '');
const scriptFile = flag('script', '');
const injectFile = flag('inject', '');
const scale = Number(flag('scale', 2));

async function launch() {
  const profile = await mkdtemp(path.join(tmpdir(), 'prana-chrome-'));
  const child = spawn(
    CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      `--user-data-dir=${profile}`,
      '--remote-debugging-port=0',
      'about:blank',
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  );

  const wsUrl = await new Promise((resolve, reject) => {
    let buffer = '';
    const timer = setTimeout(() => reject(new Error('chrome did not start')), 20000);
    child.stderr.on('data', (chunk) => {
      buffer += chunk.toString();
      const match = buffer.match(/DevTools listening on (ws:\/\/\S+)/);
      if (match) {
        clearTimeout(timer);
        resolve(match[1]);
      }
    });
    child.on('exit', () => reject(new Error('chrome exited early')));
  });

  return { child, wsUrl };
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(wsUrl);
    let id = 0;
    const pending = new Map();
    const events = [];

    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id && pending.has(message.id)) {
        const { resolve: done, reject: fail } = pending.get(message.id);
        pending.delete(message.id);
        if (message.error) fail(new Error(JSON.stringify(message.error)));
        else done(message.result);
      } else if (message.method) {
        events.push(message);
      }
    });
    socket.addEventListener('error', reject);
    socket.addEventListener('open', () => {
      resolve({
        socket,
        events,
        send(method, params = {}, sessionId) {
          const messageId = ++id;
          const payload = { id: messageId, method, params };
          if (sessionId) payload.sessionId = sessionId;
          socket.send(JSON.stringify(payload));
          return new Promise((done, fail) => {
            pending.set(messageId, { resolve: done, reject: fail });
            setTimeout(() => {
              if (pending.has(messageId)) {
                pending.delete(messageId);
                fail(new Error(`${method} timed out`));
              }
            }, 30000);
          });
        },
        close() {
          socket.close();
        },
      });
    });
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const { child, wsUrl } = await launch();
  const client = await connect(wsUrl);

  const { targetId } = await client.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await client.send('Target.attachToTarget', { targetId, flatten: true });

  const send = (method, params) => client.send(method, params, sessionId);

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Log.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: scale,
    mobile: width < 600,
  });
  await send('Emulation.setEmulatedMedia', {
    media: flag('media', ''),
    features: [
      { name: 'prefers-color-scheme', value: theme },
      { name: 'prefers-reduced-motion', value: flag('motion', 'no-preference') },
    ],
  });

  const errors = [];
  client.socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
      errors.push(message.params.entry.text);
    }
    if (message.method === 'Runtime.exceptionThrown') {
      errors.push(
        message.params.exceptionDetails.exception?.description ||
          message.params.exceptionDetails.text
      );
    }
  });

  if (injectFile) {
    const source = await readFile(injectFile, 'utf8');
    await send('Page.addScriptToEvaluateOnNewDocument', { source });
  }

  await send('Page.navigate', { url });
  await sleep(wait);

  if (has('offline')) {
    // Wait until the service worker really has the app in its cache, then cut the
    // network and reload. If the cache is not ready the test proves nothing.
    let ready = false;
    for (let i = 0; i < 40 && !ready; i++) {
      const probe = await send('Runtime.evaluate', {
        expression: `(async () => {
          const names = await caches.keys();
          if (!names.length) return 0;
          const keys = await (await caches.open(names[0])).keys();
          return keys.length;
        })()`,
        returnByValue: true,
        awaitPromise: true,
      });
      ready = (probe.result.value || 0) > 100;
      if (!ready) await sleep(500);
    }
    if (!ready) {
      console.error('the service worker never finished precaching');
      process.exitCode = 1;
    } else {
      console.log('service worker cache is warm');
    }
    // Stopping the server is the honest way to be offline. Blocking URLs inside the
    // browser does not always reach the service worker's own fetches.
    const kill = flag('kill', '');
    if (kill) {
      execSync(kill, { stdio: 'inherit' });
      console.log(`ran: ${kill}`);
    }
    await send('Page.reload', { ignoreCache: false });
    await sleep(wait);
  }


  if (click) {
    await send('Runtime.evaluate', {
      expression: `document.querySelector(${JSON.stringify(click)})?.click()`,
    });
    await sleep(600);
  }

  if (scriptFile) {
    const source = await readFile(scriptFile, 'utf8');
    const result = await send('Runtime.evaluate', {
      expression: source,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result.exceptionDetails) {
      console.error('script error:', JSON.stringify(result.exceptionDetails));
    } else {
      console.log(
        typeof result.result.value === 'string'
          ? result.result.value
          : JSON.stringify(result.result.value, null, 2)
      );
    }
  }

  if (has('pdf')) {
    const pdf = await send('Page.printToPDF', {
      printBackground: true,
      paperWidth: 8.27,
      paperHeight: 11.69,
      marginTop: 0.55,
      marginBottom: 0.55,
      marginLeft: 0.55,
      marginRight: 0.55,
    });
    await writeFile(flag('pdf'), Buffer.from(pdf.data, 'base64'));
    console.log(`wrote ${flag('pdf')}`);
  }

  if (out) {
    const shot = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: has('full'),
    });
    await writeFile(out, Buffer.from(shot.data, 'base64'));
    console.log(`wrote ${out}`);
  }

  if (errors.length) {
    console.error('\npage errors:');
    for (const error of errors) console.error(`  ${error}`);
  }

  client.close();
  child.kill();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
