// One-off: render the social share card (1200x630) from the app's own palette and fonts.
//
// Run:  node tools/build-og.mjs
// Out:  og.png
//
// Uses a throwaway local server so Chrome can load the self-hosted fonts and drawings.

import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'og.png');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.woff2': 'font/woff2',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

const card = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<style>
  @font-face { font-family: 'Cormorant Garamond'; src: url('/fonts/cormorant-garamond-latin.woff2') format('woff2'); font-weight: 300 700; font-display: block; }
  @font-face { font-family: 'Raleway'; src: url('/fonts/raleway-latin.woff2') format('woff2'); font-weight: 300 700; font-display: block; }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    width: 1200px;
    height: 630px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    padding: 56px 72px 44px;
    color: #1f2a28;
    font-family: 'Raleway', system-ui, sans-serif;
    background:
      radial-gradient(72% 52% at 14% 6%, rgba(122,158,144,.40) 0%, transparent 62%),
      radial-gradient(78% 58% at 88% 94%, rgba(126,120,166,.38) 0%, transparent 60%),
      linear-gradient(176deg, #E1E4E1 0%, #CBD6D2 52%, #C4CFDC 100%);
  }

  .top { display: flex; align-items: center; gap: 14px; }
  .mark { width: 40px; height: 40px; color: #6e5a86; flex: none; }
  .word {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 40px; font-weight: 600; letter-spacing: .01em; line-height: 1;
  }

  .mid { margin-top: auto; margin-bottom: auto; max-width: 780px; }

  h1 {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 104px; font-weight: 500; line-height: .98; letter-spacing: -.015em;
  }

  p.tag {
    margin-top: 22px;
    font-size: 25px; font-weight: 300; line-height: 1.4; color: #4e5c59;
  }

  .bottom { display: flex; align-items: flex-end; gap: 26px; }
  .tiles { display: flex; gap: 12px; }
  .tile {
    width: 104px; height: 78px; border-radius: 10px; overflow: hidden;
    background: #f0eee7; box-shadow: 0 10px 26px rgba(31,42,40,.10);
  }
  .tile img { width: 100%; height: 100%; object-fit: cover; }

  .facts { margin-left: auto; text-align: right; font-size: 15px; line-height: 1.7; color: #4e5c59; }
  .facts b { font-weight: 600; color: #1f2a28; }
  .credit { font-size: 12px; color: #7e8b86; margin-top: 6px; }
</style>
</head>
<body>
  <div class="top">
    <svg class="mark" viewBox="0 0 512 512" fill="none" stroke="currentColor" aria-hidden="true">
      <circle cx="256" cy="256" r="196" stroke-opacity=".3" stroke-width="12"/>
      <path d="M 370.9 159.6 A 150 150 0 1 1 282 108.3" stroke-width="34" stroke-linecap="round"/>
      <circle cx="256" cy="256" r="30" fill="currentColor" stroke="none"/>
    </svg>
    <span class="word">Prāṇa</span>
  </div>

  <div class="mid">
    <h1>Vuelve a<br />tu cuerpo.</h1>
    <p class="tag">Una práctica de yoga corta, armada para el cuerpo que tienes hoy.</p>
  </div>

  <div class="bottom">
    <div class="tiles">
      <div class="tile"><img src="/images/poses/mountain-pose.webp" alt="" /></div>
      <div class="tile"><img src="/images/poses/cat-cow.webp" alt="" /></div>
      <div class="tile"><img src="/images/poses/childs-pose.webp" alt="" /></div>
      <div class="tile"><img src="/images/poses/butterfly-pose.webp" alt="" /></div>
    </div>
    <div class="facts">
      <div><b>45 posturas</b> · secuencias de 10, 20 o 30 min</div>
      <div>funciona sin conexión · sin cuenta · sin rastreo</div>
      <div class="credit">Dibujos de YogaPhilippines.com, CC BY 4.0</div>
    </div>
  </div>
</body>
</html>`;

async function serve() {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const file = url.pathname === '/__og' ? null : path.join(ROOT, decodeURIComponent(url.pathname));
    try {
      if (!file) {
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        res.end(card);
        return;
      }
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end('not found');
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { server, port: server.address().port };
}

async function main() {
  await mkdir(path.dirname(OUT), { recursive: true });
  const { server, port } = await serve();

  const profile = await mkdtemp(path.join(tmpdir(), 'prana-og-'));
  const chrome = spawn(
    CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      '--window-size=1200,630',
      `--user-data-dir=${profile}`,
      '--remote-debugging-port=0',
      'about:blank',
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  );

  const wsUrl = await new Promise((resolve, reject) => {
    let buffer = '';
    chrome.stderr.on('data', (chunk) => {
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

  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1200,
    height: 630,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send('Page.navigate', { url: `http://127.0.0.1:${port}/__og` });
  await new Promise((r) => setTimeout(r, 2200));

  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(OUT, Buffer.from(shot.data, 'base64'));

  socket.close();
  chrome.kill();
  server.close();
  console.log(`wrote ${path.relative(ROOT, OUT)} (1200x630)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
