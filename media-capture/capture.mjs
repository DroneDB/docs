#!/usr/bin/env node
// Captures the screenshots and clips of the documentation from a Hub, as the shot definitions in
// media-capture/shots/*.yaml describe them (format: media-capture/shots/README.md).
//
//   node media-capture/capture.mjs [options]
//
//   --only <prefix>     capture only the ids that start with it (repeat or comma-separate)
//   --base <url>        Hub of the `base: hub` shots (default DDB_DOCS_BASE_URL, else hub.dronedb.app)
//   --list              list the shots and exit
//   --dry-run           check the shots and print what would be captured, without a browser
//   --shots <dir>       folder of shot files (repeatable; default media-capture/shots)
//   --out <dir>         where the WebP images go (default static/media)
//   --video-out <dir>   where the clip MP4s go (default media-capture/out, not in git)
//   --headed            show the browser window (needs a display); default is Chromium's new
//                       headless mode, which is the full browser and uses the GPU
//   --retries <n>       attempts after a failed one (default 2)
//   --timeout <ms>      longest wait for a page, selector or idle network (default 60000)
//   --allow-software-gl capture even when WebGL has no GPU (frames of 3D viewers may differ)
//   --index             regenerate src/data/media.json afterwards (npm run media), also after a
//                       failed shot, so the captured ones are listed
//
// Credentials and the local Registry URL come from the environment or from credentials.env of
// the local Registry (lib/env.mjs). Sign-ins are cached per role and Hub in media-capture/.auth/.
// A shot is written only when every wait passed: a failed attempt never leaves an image behind.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {CAPTURE_DIR, REPO_ROOT, credentialsOf, demoResetTime, inputPath, loadCredentials, parseArgs, resolveBase} from './lib/env.mjs';
import {MEDIA_DIR, SHOTS_DIR, loadShots, matchesPrefix, mediaPath, shotUrl} from './lib/shots.mjs';

const run = promisify(execFile);
const ENCODE = path.join(CAPTURE_DIR, 'encode.sh');
const OVERLAY = path.join(CAPTURE_DIR, 'overlay.js');
const AUTH_DIR = path.join(CAPTURE_DIR, '.auth');
const DPR = 2;
const MAX_BYTES = 250 * 1024;
// The page clock of a page that is not a viewer starts this long after the last demo reset: the demo
// data (made during the reset) shows "1 hour ago" while a reset takes less than 30 minutes
const CLOCK_AFTER_RESET_MS = 90 * 60e3;

/**
 * Shown while the Hub loads something: a shot waits until none of them is visible. The panorama
 * viewer (Photo Sphere Viewer) shows its own loader while it downloads the photo.
 */
const BUSY = ['.loading-spinner', '.p-progressspinner', '.p-skeleton', '.viewer-loading', '.psv-loader-container'];
/** Error messages of the Hub: a shot that shows one has failed. */
const ERRORS = ['.p-toast-message-error', '.viewer-shell .p-message-error'];

/**
 * What each viewer shows once its data is loaded, used when a shot of that view has no
 * waitFor.selector. A bare canvas is not enough: the 3D viewers add theirs before anything is
 * loaded. The splat, model (bm3d and the legacy Nexus viewer) and 3D viewers (Giro3D) render their
 * buttons only once the first data is in; the point cloud viewer (Potree) adds its toolbar then;
 * the panorama viewer hides its loader (BUSY) when the photo is drawn.
 */
const VIEW_READY = {
  map: "[aria-label='Map'] canvas",
  pointcloud: "[aria-label='Units']",
  splat: "[aria-label='View settings']",
  model: "#model [aria-label='Lighting']",
  unified: "#unified-viewer [aria-label='Home']",
  panorama: '#panorama .psv-canvas',
  markdown: '.markdown .content'   // the rendered Markdown (no accessible name)
};

const SPLAT_QUALITY_KEY = 'ddb.splat.quality';
/** Whether an element (in the page) is a file input. */
const isFileInput = el => el.tagName === 'INPUT' && el.type === 'file';

class Transient extends Error {}

function usage() {
  const text = fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n');
  console.log(text.slice(1, text.findIndex(l => l.startsWith('import'))).map(l => l.replace(/^\/\/ ?/, '')).join('\n'));
}

const args = parseArgs(process.argv.slice(2), {
  booleans: ['list', 'dry-run', 'headed', 'help', 'allow-software-gl', 'index'],
  repeat: ['only', 'shots']
});
if (args.help) { usage(); process.exit(0); }

const RETRIES = Number(args.retries ?? 2);
const TIMEOUT = Number(args.timeout ?? 60000);
const OUT_DIR = path.resolve(args.out || MEDIA_DIR);
const VIDEO_DIR = path.resolve(args['video-out'] || path.join(CAPTURE_DIR, 'out'));
const SHOT_DIRS = (args.shots || [SHOTS_DIR]).map(d => path.resolve(d));

loadCredentials();
const {shots, errors, warnings} = loadShots(SHOT_DIRS);
for (const w of warnings) console.warn(`warning: ${w}`);
if (errors.length) {
  console.error(`The shot definitions have ${errors.length} error(s):`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}

const selected = shots.filter(s => matchesPrefix(s.id, args.only));
if (args.only && !selected.length) {
  console.error(`No shot id starts with ${args.only.join(' or ')}`);
  process.exit(1);
}
const blocked = selected.filter(s => s.blocked);
const manual = selected.filter(s => !s.blocked && s.desktop);
const todo = selected.filter(s => !s.blocked && !s.desktop);

if (args.list) {
  for (const s of selected) {
    console.log([s.id.padEnd(48), s.type.padEnd(10), `${s.base}/${s.auth}`.padEnd(11),
      s.blocked ? `blocked: ${s.blocked}` : (fs.existsSync(mediaPath(s.id, OUT_DIR)) ? 'captured' : 'missing'),
      s.desktop ? `(by hand: ${s.desktop})` : ''].join(' ').trimEnd());
  }
  console.log(`${selected.length} shot(s), ${blocked.length} blocked, ${manual.length} made by hand`);
  process.exit(0);
}

reportBlocked();

if (args['dry-run']) {
  for (const s of todo) {
    console.log(`${s.id} (${s.type}, auth ${s.auth}, ${s.viewport.width}x${s.viewport.height})`);
    console.log(`  open   ${shotUrl(s, resolveBase(s.base, args.base))}`);
    console.log(`  wait   ${s.waitFor.selector || VIEW_READY[s.open?.view] || '(page load)'}`);
    if (s.actions.length) console.log(`  do     ${s.actions.map(a => Object.keys(a)[0]).join(', ')}`);
    console.log(`  write  ${show(mediaPath(s.id, OUT_DIR))}` +
      (s.type === 'clip' ? `, ${show(path.join(VIDEO_DIR, `${s.id}.mp4`))} (max ${s.maxSeconds} s)` : ''));
  }
  console.log(`${todo.length} shot(s) to capture`);
  process.exit(0);
}

if (!todo.length) {
  console.log('Nothing to capture.');
  process.exit(0);
}

await main();

function reportBlocked() {
  if (blocked.length) {
    console.log(`Skipped ${blocked.length} blocked shot(s):`);
    for (const s of blocked) console.log(`  ${s.id} (blocked: ${s.blocked})`);
  }
  if (manual.length) {
    console.log(`Skipped ${manual.length} shot(s) of desktop programs, made by hand:`);
    for (const s of manual) {
      const there = fs.existsSync(mediaPath(s.id, OUT_DIR)) ? 'image present' : 'IMAGE MISSING';
      console.log(`  ${s.id} (${s.desktop}: ${there} at ${show(mediaPath(s.id, OUT_DIR))})`);
    }
  }
}

async function main() {
  let chromium;
  try {
    ({chromium} = await import('playwright'));
  } catch {
    console.error('Playwright is missing: run `npm install` (it is a devDependency).');
    process.exit(1);
  }
  if (args.headed && !process.env.DISPLAY) {
    console.error('--headed needs a display: set DISPLAY, or run under `xvfb-run -a`.');
    process.exit(1);
  }

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ddb-capture-'));
  const browser = await chromium.launch({
    channel: 'chromium',
    headless: !args.headed,
    args: ['--use-gl=angle', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--hide-scrollbars']
  });
  const results = [];
  try {
    await checkGpu(browser);
    for (const shot of todo) results.push(await captureWithRetry(browser, shot, tmp));
  } finally {
    await browser.close();
    fs.rmSync(tmp, {recursive: true, force: true});
  }

  console.log('\nSummary');
  for (const r of results) {
    console.log(`  ${r.ok ? 'ok  ' : 'FAIL'} ${r.id.padEnd(48)} ${(r.ms / 1000).toFixed(1).padStart(6)} s` +
      `  ${r.attempts} attempt(s)${r.ok ? '' : `  ${r.error}`}`);
  }
  reportBlocked();
  if (args.index) {
    if (OUT_DIR !== MEDIA_DIR) console.warn('--index ignored: the images were not written to static/media');
    else await run(process.execPath, [path.join(CAPTURE_DIR, 'build-media-index.mjs')]).then(r => process.stdout.write(r.stdout));
  }
  const failed = results.filter(r => !r.ok);
  if (failed.length) {
    console.error(`\n${failed.length} of ${results.length} shot(s) FAILED; their previous images are unchanged.`);
    process.exit(1);
  }
  console.log(`\n${results.length} shot(s) captured.` + (args.index ? '' : ' Run `npm run media:index` to update src/data/media.json.'));
}

/** Fails when WebGL runs in software: 3D viewers then render other frames than a user sees. */
async function checkGpu(browser) {
  const page = await browser.newPage();
  const renderer = await page.evaluate(() => {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return 'no WebGL 2';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unknown';
  });
  await page.close();
  console.log(`WebGL: ${renderer}`);
  if (/swiftshader|llvmpipe|software|no webgl/i.test(renderer) && !args['allow-software-gl']) {
    throw new Error('WebGL has no GPU; pass --allow-software-gl to capture anyway');
  }
}

async function captureWithRetry(browser, shot, tmp) {
  const start = Date.now();
  let lastError;
  for (let attempt = 1; attempt <= RETRIES + 1; attempt++) {
    try {
      console.log(`${shot.id}: attempt ${attempt}`);
      await captureOnce(browser, shot, tmp);
      return {id: shot.id, ok: true, attempts: attempt, ms: Date.now() - start};
    } catch (e) {
      lastError = e;
      console.warn(`${shot.id}: ${e.message.split('\n')[0]}`);
      if (e.fatal || e instanceof ReferenceError || e instanceof SyntaxError) break; // the same again on a retry
    }
  }
  return {id: shot.id, ok: false, attempts: RETRIES + 1, ms: Date.now() - start, error: lastError.message.split('\n')[0]};
}

/** Signed-in browser state of a role on a Hub, cached until less than an hour of the token is left. */
async function storageState(browser, role, base) {
  const host = new URL(base).host.replace(/[^a-z0-9.-]/gi, '_');
  const file = path.join(AUTH_DIR, `${role}@${host}.json`);
  try {
    const state = JSON.parse(fs.readFileSync(file, 'utf8'));
    const jwt = state.cookies.find(c => c.name === 'jwtToken');
    if (jwt && jwt.expires * 1000 > Date.now() + 3600e3) return file;
  } catch { /* no cached sign-in */ }

  const {username, password} = credentialsOf(role);
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto(`${base}/login`, {waitUntil: 'domcontentloaded', timeout: TIMEOUT});
    await page.locator("[aria-label='Username']").fill(username, {timeout: TIMEOUT});
    await page.locator("input[type='password']").fill(password);
    await page.getByRole('button', {name: 'Login'}).click();
    // Signed in when the Hub leaves /login; the login page shows the reason when it refuses
    await page.waitForFunction(() => !location.pathname.startsWith('/login') || document.querySelector('.login-error'),
      null, {timeout: TIMEOUT});
    const error = page.locator('.login-error');
    if (await error.isVisible()) {
      const e = new Error(`sign-in as ${username} on ${base} failed: ${(await error.innerText()).trim()}`);
      e.fatal = true;
      throw e;
    }
    fs.mkdirSync(AUTH_DIR, {recursive: true, mode: 0o700});
    await context.storageState({path: file});
    fs.chmodSync(file, 0o600);
    console.log(`Signed in as ${username} on ${base}`);
    return file;
  } finally {
    await context.close();
  }
}

/** Whether the shot sets the splat quality itself (an action that names Quality). */
function setsSplatQuality(shot) {
  return /quality/i.test(JSON.stringify(shot.actions));
}

async function captureOnce(browser, shot, tmp) {
  const base = resolveBase(shot.base, args.base);
  const url = shotUrl(shot, base);
  const isClip = shot.type === 'clip';
  const fixSplat = shot.open?.view === 'splat' && !setsSplatQuality(shot);

  // Screenshots at device pixel ratio 2; a clip at ratio 1, because the recording has the CSS size
  // of the viewport (encode.sh scales it to 1920x1200 when the shot sets another viewport). The
  // screen is the viewport: the Hub picks its phone, tablet or computer layout from screen.width
  const options = {
    viewport: shot.viewport, screen: shot.viewport, deviceScaleFactor: isClip ? 1 : DPR, locale: 'en-US',
    timezoneId: 'UTC', colorScheme: 'light'
  };
  if (shot.auth !== 'none') options.storageState = await storageState(browser, shot.auth, base);
  if (isClip) options.recordVideo = {dir: tmp, size: shot.viewport};

  const context = await browser.newContext(options);
  context.setDefaultTimeout(TIMEOUT);
  let video = null;
  try {
    if (isClip) await context.addInitScript({content: 'window.__ddbCaptureCursor = true;'});
    if (fixSplat) {
      await context.addInitScript({content: `try { localStorage.setItem('${SPLAT_QUALITY_KEY}', 'high'); } catch {}`});
    }
    await context.addInitScript({path: OVERLAY});
    // Relative times ("1 hour ago") stay the same on each run: the page clock of a page that is not a
    // viewer starts at a fixed time after the last demo reset of its Hub and runs on from there
    const resetAt = shot.open?.view ? null : demoResetTime(base);
    if (resetAt) await context.clock.install({time: resetAt + CLOCK_AFTER_RESET_MS});

    let page = await context.newPage();
    await throttleUploads(page, shot.uploadKBps);
    video = page.video();
    const t0 = Date.now();
    let net = watchNetwork(page, new URL(base).origin);

    const res = await page.goto(url, {waitUntil: 'domcontentloaded'});
    if (!res || res.status() >= 400) throw new Transient(`HTTP ${res ? res.status() : 'no response'} for ${url}`);
    try {
      await waitReady(page, shot, net);
    } catch (e) {
      if (new URL(page.url()).pathname.startsWith('/login')) {
        if (options.storageState) fs.rmSync(options.storageState, {force: true});
        throw new Transient(`the Hub asked for a sign-in at ${url}` +
          (options.storageState ? ': the cached sign-in was dropped' : ' (does the shot need auth: demo?)'));
      }
      throw e;
    }
    if (fixSplat) await forceSplatQuality(page);
    const tReady = Date.now();
    if (isClip) await page.waitForTimeout(800);

    let newTab = false;
    for (const action of shot.actions) {
      const opened = await runAction(page, action, isClip);
      if (opened) {
        newTab = true;
        // The shot goes on in the page the click opened (a new tab)
        page = opened;
        await throttleUploads(page, shot.uploadKBps);
        net = watchNetwork(page, new URL(base).origin);
        await page.waitForLoadState('domcontentloaded');
      }
    }
    // After the actions, the viewer's loaded state only in a tab that an action opened: in the same tab an
    // action can leave it (Edit in the Markdown viewer replaces the rendered Markdown with its source)
    if (shot.actions.length) await waitReady(page, {...shot, waitFor: {...shot.waitFor, selector: newTab ? undefined : null}}, net);

    if (shot.highlight) {
      const box = await visibleBox(page, shot.highlight);
      await page.evaluate(rect => window.__ddbCapture.highlight(rect), box);
    }

    if (!isClip) {
      if (shot.waitFor.stable !== false) await waitStable(page);
      const png = await page.screenshot({clip: await cropRect(page, shot), caret: 'hide', style: hiddenToasts(shot)});
      await encodeWebp(png, mediaPath(shot.id, OUT_DIR), tmp);
      return;
    }

    await page.waitForTimeout(1500);
    const posterPng = path.join(tmp, `${shot.id.replace(/\W/g, '_')}-poster.png`);
    await page.screenshot({path: posterPng, caret: 'hide', style: hiddenToasts(shot)});
    const tEnd = Date.now();
    await context.close();
    const webm = await video.path();
    const start = Math.max(0, (tReady - t0) / 1000);
    const length = (tEnd - tReady) / 1000;
    if (length > shot.maxSeconds) console.warn(`${shot.id}: the actions took ${length.toFixed(1)} s, the clip stops at ${shot.maxSeconds} s`);
    const mp4 = path.join(VIDEO_DIR, `${shot.id}.mp4`);
    await encode(['clip', webm, mp4, start.toFixed(2), Math.min(length, shot.maxSeconds).toFixed(2),
      posterPng, mediaPath(shot.id, OUT_DIR)]);
  } finally {
    await context.close().catch(() => {});
    if (video) await video.delete().catch(() => {});
  }
}

/**
 * Slows the uploads of a page down to kbps KB/s (uploadKBps of the shot), through the network
 * emulation of Chromium; downloads keep their speed. Nothing happens without a speed.
 */
async function throttleUploads(page, kbps) {
  if (!kbps) return;
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions',
    {offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: kbps * 1024});
}

/**
 * Requests of a page, for an idle network that ignores streams: the Hub keeps a server-sent
 * events connection open on dataset pages, which never finishes (Playwright's own "networkidle"
 * waits for it forever). Also collects the 5xx answers of the Hub.
 */
function watchNetwork(page, origin) {
  const pending = new Set();
  const serverErrors = [];
  let last = Date.now();
  const done = r => { if (pending.delete(r)) last = Date.now(); };
  page.on('request', r => { pending.add(r); last = Date.now(); });
  page.on('requestfinished', done);
  page.on('requestfailed', done);
  page.on('response', r => {
    if (r.status() >= 500 && r.url().startsWith(origin)) serverErrors.push(`${r.status()} ${r.url()}`);
    if ((r.headers()['content-type'] || '').startsWith('text/event-stream')) done(r.request());
  });
  return {
    serverErrors,
    /** Resolves after 500 ms without a request in flight. */
    async idle(timeout, quietMs = 500) {
      const end = Date.now() + timeout;
      while (Date.now() < end) {
        if (!pending.size && Date.now() - last >= quietMs) return;
        await page.waitForTimeout(100);
      }
      throw new Error(`network still busy after ${timeout} ms: ${[...pending].slice(0, 3).map(r => r.url()).join(', ')}`);
    }
  };
}

/** Waits until the page is ready: its selector, an idle network, no spinner, the fonts, extraMs. */
async function waitReady(page, shot, net) {
  const w = shot.waitFor;
  const timeout = w.timeout ?? TIMEOUT;
  const selector = w.selector === undefined ? VIEW_READY[shot.open?.view] : w.selector;   // null: none
  try {
    if (selector) await page.locator(selector).first().waitFor({state: 'visible', timeout});
    if (w.networkIdle !== false) await net.idle(timeout);
    await page.waitForFunction(busy => !busy.some(sel => [...document.querySelectorAll(sel)]
      .some(e => e.offsetParent !== null || e.getClientRects().length > 0)), BUSY, {timeout});
    await page.evaluate(() => document.fonts.ready);
  } catch (e) {
    throw new Transient(`${shot.id} not ready (${selector || 'page'}): ${e.message.split('\n')[0]}`);
  }
  if (w.extraMs) await page.waitForTimeout(w.extraMs);
  if (net.serverErrors.length) throw new Transient(`server error: ${net.serverErrors[0]}`);
  for (const sel of ERRORS) {
    const el = page.locator(sel).first();
    if (await el.isVisible().catch(() => false)) {
      throw new Transient(`the Hub shows an error: ${(await el.innerText()).trim().slice(0, 200)}`);
    }
  }
}

/** Waits until two frames in a row are the same (WebGL viewers keep drawing while they load). */
async function waitStable(page, timeout = 20000) {
  const end = Date.now() + timeout;
  let previous = await page.screenshot({scale: 'css'});
  while (Date.now() < end) {
    await page.waitForTimeout(500);
    const next = await page.screenshot({scale: 'css'});
    if (next.equals(previous)) return;
    previous = next;
  }
  throw new Transient('the page kept changing for 20 s (set waitFor.stable: false for a page that animates)');
}

/**
 * Notifications that come and go ("3 measurements loaded") are hidden in the images, unless the
 * shot is about one (its selectors name a toast).
 */
function hiddenToasts(shot) {
  return /toast/i.test(JSON.stringify([shot.waitFor, shot.highlight, shot.crop, shot.actions]))
    ? undefined : '.p-toast { visibility: hidden !important; }';
}

/** Sets the splat viewer to High after the account preferences loaded (they can override the device). */
async function forceSplatQuality(page) {
  await page.evaluate(key => {
    if (localStorage.getItem(key) === 'high') return;
    localStorage.setItem(key, 'high');
    window.dispatchEvent(new StorageEvent('storage', {key, newValue: 'high', storageArea: localStorage}));
  }, SPLAT_QUALITY_KEY);
}

async function visibleBox(page, selector) {
  const loc = page.locator(selector).first();
  await loc.waitFor({state: 'visible'});
  await loc.scrollIntoViewIfNeeded();
  const box = await loc.boundingBox();
  if (!box) throw new Transient(`${selector} has no box on the page`);
  return box;
}

/** Moves the mouse in steps (clips: the cursor dot travels visibly) and returns the point. */
async function pointTo(page, x, y, isClip) {
  if (isClip) await page.mouse.move(x, y, {steps: 24});
  return {x, y};
}

async function center(page, selector, isClip) {
  const box = await visibleBox(page, selector);
  return pointTo(page, box.x + box.width / 2, box.y + box.height / 2, isClip);
}

/** Runs one action; returns the new page when a `click` with `popup: true` opened one. */
async function runAction(page, action, isClip) {
  const [name, v] = Object.entries(action)[0];
  if (isClip) await page.waitForTimeout(500);
  switch (name) {
    case 'click': {
      const {selector, button, modifiers, popup} = typeof v === 'string' ? {selector: v} : v;
      await center(page, selector, isClip);
      const click = page.locator(selector).first().click({button, modifiers});
      if (!popup) {
        await click;
        break;
      }
      const [opened] = await Promise.all([page.context().waitForEvent('page'), click]);
      return opened;
    }
    case 'rightClick':
      await center(page, v, isClip);
      await page.locator(v).first().click({button: 'right'});
      break;
    case 'hover':
      await center(page, v, isClip);
      await page.locator(v).first().hover();
      break;
    case 'fill': {
      await center(page, v.selector, isClip);
      const loc = page.locator(v.selector).first();
      if (isClip) {
        await loc.fill('');
        await loc.pressSequentially(String(v.value), {delay: 70});
      } else await loc.fill(String(v.value));
      break;
    }
    case 'select': {
      await center(page, v.selector, isClip);
      const loc = page.locator(v.selector).first();
      if (await loc.evaluate(e => e.tagName === 'SELECT')) {
        await loc.selectOption({label: String(v.value)}).catch(() => loc.selectOption(String(v.value)));
      } else {
        // PrimeVue Select: open it, then pick the option by its text
        await loc.click();
        const option = page.getByRole('option', {name: String(v.value), exact: true}).first();
        await option.waitFor({state: 'visible'});
        const box = await option.boundingBox();
        if (box) await pointTo(page, box.x + box.width / 2, box.y + box.height / 2, isClip);
        await option.click();
      }
      break;
    }
    case 'setFiles': {
      // A file input is often hidden (a picker button creates it): only a drop zone is pointed at
      const loc = page.locator(v.selector).first();
      await loc.waitFor({state: 'attached'});
      if (!await loc.evaluate(isFileInput)) await center(page, v.selector, isClip);
      await setFiles(page, v.selector, v.files.map(inputPath));
      break;
    }
    case 'press':
      await page.keyboard.press(v);
      break;
    case 'wait':
      if (typeof v === 'number') await page.waitForTimeout(v);
      else await page.locator(v).first().waitFor({state: 'visible'});
      break;
    case 'mouse': {
      const [kind, [x, y]] = Object.entries(v).find(([k]) => k !== 'button');
      await pointTo(page, x, y, isClip);
      if (kind === 'move') await page.mouse.move(x, y);
      else await page.mouse[kind](x, y, {button: v.button});
      break;
    }
    case 'drag': {
      let {from, to} = v;
      if (v.selector) {
        const box = await visibleBox(page, v.selector);
        const at = ([fx, fy]) => [box.x + fx * box.width, box.y + fy * box.height];
        [from, to] = [at(from), at(to)];
      }
      await pointTo(page, ...from, isClip);
      await page.mouse.move(...from);
      await page.mouse.down();
      await page.mouse.move(...to, {steps: isClip ? 40 : 12});
      await page.mouse.up();
      break;
    }
    case 'scroll': {
      await center(page, v.selector, isClip);
      // In small steps: a map zooms and a list scrolls the same way on each run
      const steps = Math.max(1, Math.ceil(Math.max(Math.abs(v.y || 0), Math.abs(v.x || 0)) / 100));
      for (let i = 0; i < steps; i++) {
        await page.mouse.wheel((v.x || 0) / steps, (v.y || 0) / steps);
        await page.waitForTimeout(isClip ? 120 : 60);
      }
      break;
    }
    default:
      throw new Error(`unknown action ${name}`);
  }
}

/**
 * Gives files to a file input (setInputFiles) or drops them on a drop zone: the files go through a
 * hidden file input of the page, then a drop with their DataTransfer is dispatched on the zone,
 * the way a browser delivers a drag from the desktop. A single folder keeps its structure: each
 * file carries its path in the folder (webkitRelativePath), as a folder input or a folder drag does.
 */
async function setFiles(page, selector, files) {
  const fatal = msg => Object.assign(new Error(`setFiles: ${msg}`), {fatal: true});
  const missing = files.filter(f => !fs.existsSync(f));
  if (missing.length) throw fatal(`missing input file(s) ${missing.join(', ')} (set DDB_DOCS_INPUTS)`);
  const folder = files.some(f => fs.statSync(f).isDirectory());
  if (folder && files.length > 1) throw fatal(`give one folder or only files, not ${files.join(', ')}`);
  const target = page.locator(selector).first();
  if (await target.evaluate(isFileInput)) {
    await target.setInputFiles(files);
    return;
  }
  const input = await page.evaluateHandle(folder => {
    const el = document.createElement('input');
    el.type = 'file';
    el.multiple = true;
    el.webkitdirectory = folder;
    el.style.display = 'none';
    document.body.appendChild(el);
    return el;
  }, folder);
  await input.asElement().setInputFiles(files);
  const dataTransfer = await page.evaluateHandle(el => {
    const dt = new DataTransfer();
    for (const f of el.files) dt.items.add(f);
    el.remove();
    return dt;
  }, input);
  for (const type of ['dragenter', 'dragover', 'drop']) await target.dispatchEvent(type, {dataTransfer});
}

/** The screenshot clip of `crop`, in CSS pixels, padded to keep the highlight box inside. */
async function cropRect(page, shot) {
  if (!shot.crop) return undefined;
  if (typeof shot.crop === 'object') return shot.crop;
  const box = await visibleBox(page, shot.crop);
  const pad = 12;
  const vp = page.viewportSize();
  const x = Math.max(0, Math.floor(box.x - pad));
  const y = Math.max(0, Math.floor(box.y - pad));
  return {x, y, width: Math.min(vp.width, Math.ceil(box.x + box.width + pad)) - x,
    height: Math.min(vp.height, Math.ceil(box.y + box.height + pad)) - y};
}

async function encode(argv) {
  try {
    const {stdout} = await run('bash', [ENCODE, ...argv]);
    process.stdout.write(stdout);
  } catch (e) {
    const err = new Error((e.stderr || e.message).trim());
    // Too large even at the lowest quality: another attempt gives the same image
    err.fatal = e.code === 3;
    throw err;
  }
}

async function encodeWebp(png, out, tmp) {
  const file = path.join(tmp, 'shot.png');
  fs.writeFileSync(file, png);
  await encode(['webp', file, out, String(MAX_BYTES)]);
}

/** A path for messages: relative inside the repository, absolute outside it. */
function show(file) {
  const rel = path.relative(REPO_ROOT, file);
  return rel.startsWith('..') ? file : rel;
}
