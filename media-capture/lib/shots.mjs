// Reads and checks the shot definitions (media-capture/shots/<section>.yaml). The format is
// described in media-capture/shots/README.md; this module is its only implementation, used by the
// capture runner, the media index and the link checker.

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import {HUB_VIEWS, hubUrl} from '../../src/lib/hub.mjs';
import {CAPTURE_DIR, REPO_ROOT} from './env.mjs';

export const SHOTS_DIR = path.join(CAPTURE_DIR, 'shots');
export const MEDIA_DIR = path.join(REPO_ROOT, 'static', 'media');

export const SECTIONS = ['get-started', 'datasets', 'files', 'viewing', 'measure', 'analyse',
  'processing', 'sharing', 'account', 'self-hosting'];
export const TYPES = ['screenshot', 'clip'];
export const BASES = ['hub', 'local'];
export const AUTHS = ['none', 'demo', 'admin'];
export const BLOCKED = ['data', 'release'];
export const DEFAULT_VIEWPORT = Object.freeze({width: 1440, height: 900});
/** Clips record the viewport at device pixel ratio 1: 1920×1200 is also the size of the video. */
export const CLIP_VIEWPORT = Object.freeze({width: 1920, height: 1200});
export const DEFAULT_CLIP_SECONDS = 30;
export const MAX_CLIP_SECONDS = 60;

const ID_RE = /^([a-z0-9]+(?:-[a-z0-9]+)*)\/([a-z0-9]+(?:-[a-z0-9]+)*)--([a-z0-9]+(?:-[a-z0-9]+)*)$/;
const YOUTUBE_RE = /^[A-Za-z0-9_-]{11}$/;
const KEYS = ['id', 'type', 'alt', 'page', 'open', 'url', 'base', 'auth', 'viewport', 'waitFor', 'actions',
  'highlight', 'crop', 'maxSeconds', 'blocked', 'youtubeId', 'desktop'];
const OPEN_KEYS = ['org', 'ds', 'path', 'view', 'compare'];
const WAIT_KEYS = ['selector', 'networkIdle', 'extraMs', 'stable', 'timeout'];

const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = v => typeof v === 'string' && v.trim() !== '';
const isPoint = v => Array.isArray(v) && v.length === 2 && v.every(n => Number.isFinite(n));
const isInt = (v, min = 0) => Number.isInteger(v) && v >= min;
const unknownKeys = (obj, allowed) => Object.keys(obj).filter(k => !allowed.includes(k));
const MODIFIERS = ['Alt', 'Control', 'ControlOrMeta', 'Meta', 'Shift'];
const isModifiers = v => v === undefined || (Array.isArray(v) && v.every(m => MODIFIERS.includes(m)));
const isButton = v => v === undefined || ['left', 'right', 'middle'].includes(v);

/**
 * Checkers of the action keys: each returns an error message or null. An action is a mapping with
 * exactly one of these keys.
 */
export const ACTIONS = {
  click: v => isStr(v) || (isObj(v) && isStr(v.selector) && isButton(v.button) && isModifiers(v.modifiers) &&
    (v.popup === undefined || typeof v.popup === 'boolean') && !unknownKeys(v, ['selector', 'button', 'modifiers', 'popup']).length)
    ? null : `click: a selector, or { selector, button: left | right | middle, modifiers: [${MODIFIERS.join(', ')}], popup: true }`,
  rightClick: v => isStr(v) ? null : 'rightClick: a selector (opens a context menu)',
  hover: v => isStr(v) ? null : 'hover: a selector',
  press: v => isStr(v) ? null : 'press: a key name (Enter, Escape, Control+A …)',
  fill: v => isObj(v) && isStr(v.selector) && v.value !== undefined && !unknownKeys(v, ['selector', 'value']).length
    ? null : 'fill: { selector, value }',
  select: v => isObj(v) && isStr(v.selector) && v.value !== undefined && !unknownKeys(v, ['selector', 'value']).length
    ? null : 'select: { selector, value }',
  wait: v => isInt(v) || isStr(v) ? null : 'wait: milliseconds or a selector',
  mouse: v => {
    const keys = isObj(v) ? Object.keys(v).filter(k => k !== 'button') : [];
    return keys.length === 1 && ['click', 'dblclick', 'move'].includes(keys[0]) && isPoint(v[keys[0]]) &&
      isButton(v.button) && !(keys[0] === 'move' && v.button !== undefined)
      ? null : 'mouse: { click | dblclick | move: [x, y] } (click and dblclick take button: left | right | middle)';
  },
  drag: v => isObj(v) && isPoint(v.from) && isPoint(v.to) && !unknownKeys(v, ['from', 'to']).length
    ? null : 'drag: { from: [x, y], to: [x, y] }',
  setFiles: v => isObj(v) && isStr(v.selector) && Array.isArray(v.files) && v.files.length && v.files.every(isStr) &&
    !unknownKeys(v, ['selector', 'files']).length ? null : 'setFiles: { selector, files: [paths under the demo inputs root] }',
  scroll: v => isObj(v) && isStr(v.selector) && (Number.isFinite(v.y) || Number.isFinite(v.x)) &&
    !unknownKeys(v, ['selector', 'x', 'y']).length ? null : 'scroll: { selector, y } (and/or x)'
};

/** Checks one entry. Returns [errors, normalized entry]. */
export function checkShot(raw) {
  const errors = [];
  const err = msg => errors.push(msg);
  if (!isObj(raw)) return [['an entry must be a mapping'], null];

  for (const k of unknownKeys(raw, KEYS)) err(`unknown key "${k}"`);
  const m = isStr(raw.id) ? ID_RE.exec(raw.id) : null;
  if (!m) err('id: "<section>/<feature>--<shot>" in lower case (letters, digits, hyphens)');
  else if (!SECTIONS.includes(m[1])) err(`id: unknown section "${m[1]}" (one of ${SECTIONS.join(', ')})`);
  if (!TYPES.includes(raw.type)) err(`type: one of ${TYPES.join(' | ')}`);
  if (!isStr(raw.alt)) err('alt: the alt text is required');
  if (!isStr(raw.page)) err('page: the docs page that shows the shot is required (for example hub-guide/analyse/plant-health)');

  // A shot of a desktop program (desktop: qgis) is made by hand: it has no Hub page to open
  const desktop = raw.desktop ?? null;
  if (desktop !== null && !isStr(desktop)) err('desktop: the name of the desktop program (the shot is made by hand)');
  const url = raw.url ?? undefined;
  if (desktop) {
    if (raw.open !== undefined || url !== undefined) err('desktop: a shot made by hand has no `open` or `url`');
  } else if ((raw.open === undefined) === (url === undefined)) err('either `open` or `url`, not both and not neither');
  if (raw.open !== undefined) {
    const o = raw.open;
    if (!isObj(o)) err('open: { org, ds, path, view }');
    else {
      for (const k of unknownKeys(o, OPEN_KEYS)) err(`open: unknown key "${k}"`);
      if (!isStr(o.org)) err('open.org is required');
      if (o.ds !== undefined && !isStr(o.ds)) err('open.ds: a dataset slug');
      if (o.view !== undefined && !HUB_VIEWS.includes(o.view)) err(`open.view: one of ${HUB_VIEWS.join(' | ')}`);
      if ((o.path === undefined) !== (o.view === undefined)) err('open.path and open.view go together');
      if ((o.path !== undefined || o.view !== undefined) && !isStr(o.ds)) err('open.path needs open.ds');
      if (o.compare !== undefined) {
        if (!(Array.isArray(o.compare) && o.compare.length >= 2 && o.compare.every(isStr))) err('open.compare: a list of 2 or more raster paths');
        if (!isStr(o.ds) || o.path !== undefined) err('open.compare needs open.ds and goes without open.path and open.view');
      }
    }
  }
  if (url !== undefined && !(isStr(url) && (url.startsWith('/') || /^https?:\/\//.test(url)))) {
    err('url: a Hub path that starts with "/", or an absolute http(s) URL (not a Hub: --base does not change it)');
  }

  const base = raw.base ?? 'hub';
  if (!BASES.includes(base)) err(`base: one of ${BASES.join(' | ')}`);
  const auth = raw.auth ?? 'none';
  if (!AUTHS.includes(auth)) err(`auth: one of ${AUTHS.join(' | ')}`);

  let viewport = raw.type === 'clip' ? CLIP_VIEWPORT : DEFAULT_VIEWPORT;
  if (raw.viewport !== undefined && raw.viewport !== null) {
    const v = raw.viewport;
    if (!isObj(v) || !isInt(v.width, 200) || !isInt(v.height, 200) || unknownKeys(v, ['width', 'height']).length) {
      err('viewport: { width, height } in CSS pixels');
    } else viewport = {width: v.width, height: v.height};
  }

  const waitFor = raw.waitFor ?? {};
  if (!isObj(waitFor)) err('waitFor: a mapping');
  else {
    for (const k of unknownKeys(waitFor, WAIT_KEYS)) err(`waitFor: unknown key "${k}"`);
    if (waitFor.selector !== undefined && !isStr(waitFor.selector)) err('waitFor.selector: a selector');
    for (const k of ['networkIdle', 'stable']) {
      if (waitFor[k] !== undefined && typeof waitFor[k] !== 'boolean') err(`waitFor.${k}: true or false`);
    }
    for (const k of ['extraMs', 'timeout']) {
      if (waitFor[k] !== undefined && !isInt(waitFor[k])) err(`waitFor.${k}: milliseconds`);
    }
  }

  const actions = raw.actions ?? [];
  if (!Array.isArray(actions)) err('actions: a list');
  else actions.forEach((a, i) => {
    const keys = isObj(a) ? Object.keys(a) : [];
    if (keys.length !== 1) return err(`actions[${i}]: one action per item (${Object.keys(ACTIONS).join(', ')})`);
    const check = ACTIONS[keys[0]];
    if (!check) return err(`actions[${i}]: unknown action "${keys[0]}" (one of ${Object.keys(ACTIONS).join(', ')})`);
    const msg = check(a[keys[0]]);
    if (msg) err(`actions[${i}]: ${msg}`);
  });

  if (raw.type === 'clip' && Array.isArray(actions) && actions.some(a => isObj(a) && isObj(a.click) && a.click.popup)) {
    err('click with popup: screenshots only (a clip records one tab): open the target page with `open` or `url`');
  }

  if (raw.highlight != null && !isStr(raw.highlight)) err('highlight: null or a selector');
  const crop = raw.crop ?? null;
  if (crop !== null && !isStr(crop) &&
      !(isObj(crop) && ['x', 'y', 'width', 'height'].every(k => Number.isFinite(crop[k])) && crop.width > 0 &&
        crop.height > 0 && !unknownKeys(crop, ['x', 'y', 'width', 'height']).length)) {
    err('crop: null, a selector or { x, y, width, height }');
  }

  const isClip = raw.type === 'clip';
  // maxSeconds on a screenshot is ignored (the README example carries it)
  if (raw.maxSeconds != null && isClip) {
    if (!(Number.isFinite(raw.maxSeconds) && raw.maxSeconds > 0 && raw.maxSeconds <= MAX_CLIP_SECONDS)) {
      err(`maxSeconds: 1–${MAX_CLIP_SECONDS} seconds`);
    }
  }
  if (raw.youtubeId != null) {
    if (!isClip) err('youtubeId: clips only');
    else if (!(typeof raw.youtubeId === 'string' && YOUTUBE_RE.test(raw.youtubeId))) err('youtubeId: the 11-character YouTube video id');
  }
  if (raw.blocked != null && !BLOCKED.includes(raw.blocked)) err(`blocked: null, ${BLOCKED.join(' or ')}`);

  if (errors.length) return [errors, null];
  return [[], {
    id: raw.id, section: m[1], type: raw.type, alt: raw.alt.trim(), page: raw.page,
    open: raw.open ?? null, url: url ?? null, desktop, base, auth, viewport,
    waitFor: {...waitFor}, actions, highlight: raw.highlight ?? null, crop,
    maxSeconds: isClip ? raw.maxSeconds ?? DEFAULT_CLIP_SECONDS : null,
    blocked: raw.blocked ?? null, youtubeId: isClip ? raw.youtubeId ?? null : null
  }];
}

/** YAML files of a shots folder (README.md and other files are ignored). */
export function shotFiles(dir = SHOTS_DIR) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => /\.ya?ml$/.test(f)).sort().map(f => path.join(dir, f));
}

/**
 * Loads every shot of the folders. Returns { shots, errors, warnings }; `errors` is empty when
 * every entry follows the format and every id is unique across all files.
 */
export function loadShots(dirs = [SHOTS_DIR]) {
  const shots = [];
  const errors = [];
  const warnings = [];
  const seen = new Map();
  for (const file of dirs.flatMap(d => shotFiles(d))) {
    const rel = path.relative(REPO_ROOT, file);
    let doc;
    try {
      doc = yaml.load(fs.readFileSync(file, 'utf8'), {filename: rel});
    } catch (e) {
      errors.push(`${rel}: ${e.message}`);
      continue;
    }
    if (doc == null) continue;
    if (!Array.isArray(doc)) {
      errors.push(`${rel}: the file must be a YAML list of entries`);
      continue;
    }
    const fileSection = path.basename(file).replace(/\.ya?ml$/, '');
    doc.forEach((raw, i) => {
      const where = `${rel} entry ${i + 1}${raw && raw.id ? ` (${raw.id})` : ''}`;
      const [errs, shot] = checkShot(raw);
      for (const e of errs) errors.push(`${where}: ${e}`);
      if (!shot) return;
      if (seen.has(shot.id)) {
        errors.push(`${where}: duplicate id, first defined in ${seen.get(shot.id)}`);
        return;
      }
      seen.set(shot.id, where);
      if (SECTIONS.includes(fileSection) && fileSection !== shot.section) {
        errors.push(`${where}: the section of the id must be the file name (${fileSection})`);
        return;
      }
      if (!docPageExists(shot.page)) warnings.push(`${where}: page "${shot.page}" is not a docs page (yet)`);
      shots.push({...shot, file: rel});
    });
  }
  return {shots, errors, warnings};
}

/** Whether docs/<page>.md(x) or docs/<page>/index.md(x) exists. */
export function docPageExists(page) {
  const base = path.join(REPO_ROOT, 'docs', page);
  return ['.md', '.mdx', '/index.md', '/index.mdx'].some(ext => fs.existsSync(base + ext));
}

/** URL of the Hub page a shot opens, on the given base URL. */
export function shotUrl(shot, base) {
  if (shot.desktop) return null;
  if (shot.open) return hubUrl({...shot.open, base});
  return /^https?:\/\//.test(shot.url) ? shot.url : base + shot.url;
}

/** Image of a shot (screenshot, or poster of a clip). */
export function mediaPath(id, dir = MEDIA_DIR) {
  return path.join(dir, `${id}.webp`);
}

/** Whether the id starts with one of the prefixes (all ids without prefixes). */
export function matchesPrefix(id, prefixes) {
  return !prefixes || !prefixes.length || prefixes.some(p => id.startsWith(p));
}
