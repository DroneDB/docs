#!/usr/bin/env node
// Checks the links of the docs into DroneDB Hub, so a page never sends a reader to a dataset or a
// file that is gone.
//
//   node scripts/check-links.mjs [--offline] [--base <url>] [--concurrency <n>]
//
// What it checks, in docs/**/*.md(x):
//   - every hub.dronedb.app URL of a dataset (/r/<org>/<ds>, …/view/<path>/<view>, …/compare?p=…,
//     /orgs/<org>/ds/<ds>…), every <TryLive> and <LiveEmbed>, and every `datasets:` entry of the
//     front matter (org/ds or org/ds/path): the list API of the dataset at that path
//     (listApiUrl of src/lib/hub.mjs) must answer 200 with a non-empty list. The /r/… page itself is
//     not checked: the Hub answers 200 for any org;
//   - every <LiveEmbed>: its URL has embed=1 and the answer to it carries no X-Frame-Options;
//   - every youtubeId of the shot definitions: YouTube oEmbed answers 200.
//
//   --offline          only the syntax: props, views, paths, ids (no network; for every pull request)
//   --base <url>       check against another Hub (the URLs keep hub.dronedb.app in the pages)
//   --concurrency <n>  requests at a time (default 2: production is a small server)
//
// Example URLs of the organizations my-org and your-org (a private dataset in an API example) are
// placeholders and not checked. Each URL is requested once per run. Exit 1 on any error; warnings (shot ids that no shot file
// defines yet) do not fail.

import {HUB_URL, HUB_VIEWS, hubUrl, listApiUrl} from '../src/lib/hub.mjs';
import * as hub from '../src/lib/hub.mjs';
import {loadPages, loadTranslatedPages, asList, lineOf} from './lib/docs.mjs';
import {parseArgs} from '../media-capture/lib/env.mjs';
import {loadShots} from '../media-capture/lib/shots.mjs';

const args = parseArgs(process.argv.slice(2), {booleans: ['offline', 'help']});
if (args.help) {
  const {readFileSync} = await import('node:fs');
  const text = readFileSync(new URL(import.meta.url), 'utf8').split('\n');
  console.log(text.slice(1, text.findIndex(l => l.startsWith('import'))).map(l => l.replace(/^\/\/ ?/, '')).join('\n'));
  process.exit(0);
}
const BASE = (args.base || HUB_URL).replace(/\/+$/, '');
const CONCURRENCY = Math.max(1, Number(args.concurrency || 2));
const HUB_HOST = new URL(HUB_URL).host;

const errors = [];
const warnings = [];
/** Dataset paths to check: key org/ds/path -> { org, ds, path, where[] } */
const targets = new Map();
const orgs = new Map(); // org → where it is linked
const embeds = new Map();
const youtube = new Map();

const PLACEHOLDER_ORGS = new Set(['my-org', 'your-org']);

function addTarget(org, ds, path, where) {
  if (PLACEHOLDER_ORGS.has(org)) return;
  const key = `${org}/${ds}/${path || ''}`;
  if (!targets.has(key)) targets.set(key, {org, ds, path: path || undefined, where: []});
  targets.get(key).where.push(where);
}

// ---------------------------------------------------------------------------- shot definitions
const shots = loadShots();
for (const e of shots.errors) errors.push(`shot definitions: ${e}`);
const shotIds = new Set(shots.shots.map(s => s.id));
for (const s of shots.shots) if (s.youtubeId) youtube.set(s.youtubeId, `${s.file} (${s.id})`);

// ---------------------------------------------------------------------------- pages
let pages;
try {
  pages = loadPages();
} catch (e) {
  console.error(`check-links: ${e.message}`);
  process.exit(1);
}

const COMPONENT_RE = /<(TryLive|LiveEmbed|Screenshot|Clip)\b((?:\s+[\w-]+(?:=(?:"[^"]*"|'[^']*'|\{[^}]*\}))?)*)\s*\/?>/g;
const ATTR_RE = /([\w-]+)(?:=("[^"]*"|'[^']*'|\{[^}]*\}))?/g;
const URL_RE = /https?:\/\/hub\.dronedb\.app(?:\/[^\s)"'<>`\]]*)?/g;

for (const page of pages) {
  const body = withoutComments(page.body);

  for (const ds of asList(page.frontMatter.datasets)) {
    const m = typeof ds === 'string' && /^([a-z0-9-]+)\/([a-z0-9-]+)(?:\/(.+))?$/.exec(ds);
    if (!m) errors.push(`${page.rel}: datasets: "${ds}" is not org/dataset or org/dataset/path`);
    else addTarget(m[1], m[2], m[3], `${page.rel} (datasets)`);
  }

  let liveEmbeds = 0;
  for (const c of body.matchAll(COMPONENT_RE)) {
    const where = `${page.rel}:${lineOf(page, c.index)}`;
    const props = {};
    for (const a of c[2].matchAll(ATTR_RE)) {
      const raw = a[2];
      if (raw === undefined) { props[a[1]] = true; continue; }
      const lit = /^\{\s*(["'])(.*)\1\s*\}$/.exec(raw);
      if (raw.startsWith('{') && !lit) {
        if (['org', 'ds', 'path', 'view', 'compare', 'id', 'poster'].includes(a[1])) {
          errors.push(`${where}: <${c[1]} ${a[1]}> must be a string literal, the checker cannot read ${raw}`);
        }
        continue;
      }
      props[a[1]] = lit ? lit[2] : raw.slice(1, -1);
    }
    if (c[1] === 'Screenshot' || c[1] === 'Clip') {
      if (!props.id) errors.push(`${where}: <${c[1]}> without id`);
      else if (!shotIds.has(props.id)) warnings.push(`${where}: <${c[1]} id="${props.id}"> has no shot definition yet`);
      continue;
    }
    if (c[1] === 'LiveEmbed' && ++liveEmbeds === 2) errors.push(`${where}: more than one <LiveEmbed> on the page`);
    checkComponent(c[1], props, where);
  }

  for (const u of body.matchAll(URL_RE)) checkHubUrl(u[0].replace(/[.,;:!?]+$/, ''), `${page.rel}:${lineOf(page, u.index)}`);
}

// Links between pages start from the docs root (/hub-guide/viewing/map.mdx). Docusaurus resolves
// a relative link in the locale folder of the page that has it, so a relative link breaks as
// soon as only one of the two pages is translated.
const RELATIVE_LINK_RE = /\]\((\.{1,2}\/[^)\s]*)\)/g;
for (const page of [...pages, ...loadTranslatedPages()]) {
  for (const l of withoutComments(page.body).matchAll(RELATIVE_LINK_RE)) {
    errors.push(`${page.rel}:${lineOf(page, l.index)}: relative link ${l[1]}: start it from the docs root (/<section>/<page>.mdx)`);
  }
}

function checkComponent(name, p, where) {
  const compare = typeof p.compare === 'string' ? p.compare.split(',').map(s => s.trim()).filter(Boolean) : null;
  if (!p.org) {
    if (name === 'LiveEmbed') errors.push(`${where}: <LiveEmbed> needs org and ds`);
    return;
  }
  if (p.view && !HUB_VIEWS.includes(p.view)) return errors.push(`${where}: <${name}> view "${p.view}" is not one of ${HUB_VIEWS.join(', ')}`);
  if (Boolean(p.path) !== Boolean(p.view) && !compare) return errors.push(`${where}: <${name}> path and view go together`);
  if (compare && (compare.length < 2 || p.path || p.view || !p.ds)) {
    return errors.push(`${where}: <${name}> compare needs ds and 2 or more paths, without path and view`);
  }
  if (!p.ds) {
    if (name === 'LiveEmbed') errors.push(`${where}: <LiveEmbed> needs ds`);
    return;
  }
  if (p.poster && !shotIds.has(p.poster)) warnings.push(`${where}: <LiveEmbed poster="${p.poster}"> has no shot definition yet`);
  for (const path of compare || [p.path]) addTarget(p.org, p.ds, path, where);
  if (name === 'LiveEmbed') {
    const url = hubUrl({org: p.org, ds: p.ds, path: p.path, view: p.view, compare: compare || undefined, embed: true, base: BASE});
    if (!new URL(url).searchParams.has('embed', '1')) errors.push(`${where}: the <LiveEmbed> URL has no embed=1: ${url}`);
    if (!embeds.has(url)) embeds.set(url, []);
    embeds.get(url).push(where);
  }
}

/** A dataset (and path) from a hub.dronedb.app URL; other Hub URLs are not checked. */
function checkHubUrl(text, where) {
  if (/[{}<>…*]/.test(text)) return; // a placeholder, not a link
  let url;
  try {
    url = new URL(text);
  } catch {
    return errors.push(`${where}: not a valid URL: ${text}`);
  }
  if (url.host !== HUB_HOST) return;
  const seg = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
  if (seg[0] === 'orgs' && seg[2] === 'ds' && seg[3]) return addTarget(seg[1], seg[3], undefined, where);
  if (seg[0] !== 'r' || !seg[1]) return;
  if (!seg[2]) {
    // An organization page: checked when src/lib/hub.mjs offers the API URL of its datasets
    if (typeof hub.datasetsApiUrl === 'function') addOrg(seg[1], where);
    else warnings.push(`${where}: organization link /r/${seg[1]} not checked (src/lib/hub.mjs has no datasetsApiUrl)`);
    return;
  }
  const [, org, ds, kind, encoded, view] = seg;
  if (!kind) return addTarget(org, ds, undefined, where);
  if (kind === 'compare') {
    const paths = url.searchParams.getAll('p');
    if (paths.length < 2) return errors.push(`${where}: a compare link needs 2 or more p= paths: ${text}`);
    for (const p of paths) {
      const path = decodeBase64(p.replace(/-/g, '+').replace(/_/g, '/'));
      if (path === null) errors.push(`${where}: compare path "${p}" is not base64url`);
      else addTarget(org, ds, path, where);
    }
    return;
  }
  if (kind !== 'view' || !encoded || !view) return errors.push(`${where}: not a Hub dataset URL: ${text}`);
  if (!HUB_VIEWS.includes(view)) return errors.push(`${where}: view "${view}" is not one of ${HUB_VIEWS.join(', ')}: ${text}`);
  const path = decodeBase64(encoded);
  if (path === null) return errors.push(`${where}: the path of ${text} is not base64`);
  addTarget(org, ds, path, where);
  if (url.searchParams.has('embed')) {
    const embed = BASE + url.pathname + url.search;
    if (!embeds.has(embed)) embeds.set(embed, []);
    embeds.get(embed).push(where);
  }
}

function addOrg(org, where) {
  if (!orgs.has(org)) orgs.set(org, []);
  orgs.get(org).push(where);
}

function decodeBase64(b64) {
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(b64)) return null;
  try {
    return new TextDecoder('utf-8', {fatal: true}).decode(Uint8Array.from(atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, '=')), ch => ch.charCodeAt(0)));
  } catch {
    return null;
  }
}

/** The body without MDX/HTML comments (examples in comments are not links). */
function withoutComments(body) {
  return body.replace(/\{\/\*[\s\S]*?\*\/\}|<!--[\s\S]*?-->/g, m => m.replace(/[^\n]/g, ' '));
}

// ---------------------------------------------------------------------------- network
console.log(`${pages.length} pages: ${targets.size} dataset paths, ${orgs.size} organizations, ${embeds.size} live embeds, ${youtube.size} YouTube ids`);

if (!args.offline) {
  const jobs = [];
  for (const t of targets.values()) {
    jobs.push(async () => {
      const url = listApiUrl({org: t.org, ds: t.ds, path: t.path, base: BASE});
      const res = await get(url);
      const list = res.ok ? await res.json().catch(() => null) : null;
      if (!res.ok || !Array.isArray(list) || !list.length) {
        errors.push(`${t.org}/${t.ds}${t.path ? `/${t.path}` : ''}: ${res.ok ? 'empty list' : `HTTP ${res.status}`} from ${url}\n    used at ${t.where.join(', ')}`);
      }
    });
  }
  for (const [org, where] of orgs) {
    jobs.push(async () => {
      const url = hub.datasetsApiUrl({org, base: BASE});
      const res = await get(url);
      const list = res.ok ? await res.json().catch(() => null) : null;
      if (!res.ok || !Array.isArray(list) || !list.length) errors.push(`${org}: ${res.ok ? 'no datasets' : `HTTP ${res.status}`} from ${url}\n    used at ${where.join(', ')}`);
    });
  }
  for (const [url, where] of embeds) {
    jobs.push(async () => {
      const res = await get(url);
      const xfo = res.headers.get('x-frame-options');
      if (!res.ok || xfo) errors.push(`live embed ${url}: ${res.ok ? `X-Frame-Options: ${xfo}` : `HTTP ${res.status}`}\n    used at ${where.join(', ')}`);
      await res.body?.cancel();
    });
  }
  for (const [id, where] of youtube) {
    jobs.push(async () => {
      const url = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://youtu.be/${id}`)}`;
      const res = await get(url);
      if (!res.ok) errors.push(`YouTube video ${id}: HTTP ${res.status} from oEmbed (${where})`);
      await res.body?.cancel();
    });
  }
  await runAll(jobs, CONCURRENCY);
}

for (const w of warnings) console.warn(`warning: ${w}`);
if (errors.length) {
  console.error(`\n${errors.length} link error(s):`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
console.log(args.offline ? 'Link syntax OK (offline: nothing requested)' : `All links OK on ${BASE}`);

/** GET with one retry on a network error; a network failure is reported as status 0. */
async function get(url) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fetch(url, {signal: AbortSignal.timeout(30000), headers: {'User-Agent': 'DroneDB-Docs link check'}});
    } catch (e) {
      if (attempt) return {ok: false, status: `0 (${e.cause?.code || e.message})`, headers: new Headers(), body: null, json: async () => null};
    }
  }
}

async function runAll(jobs, n) {
  let next = 0;
  await Promise.all(Array.from({length: Math.min(n, jobs.length)}, async () => {
    while (next < jobs.length) await jobs[next++]();
  }));
}
