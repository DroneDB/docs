#!/usr/bin/env node
// Coverage of the Hub by the documentation: every Hub route, file context-menu action and
// Preferences tab must be named by the `hub_feature` front matter of a docs page.
//
//   node scripts/coverage-report.mjs [--hub <ClientApp folder>] [--list] [--report-only]
//
//   --hub <dir>     Hub source (default DDB_HUB_SRC, else /mnt/data/repos/Registry/Registry.Web/ClientApp);
//                   run it on the checkout of each Registry release tag
//   --list          print the feature ids the report expects, with what they are, and exit
//   --report-only   print the report and exit 0 even when something is not covered
//
// Feature ids (the values of `hub_feature`, a string or a list; other values are ignored):
//
//   route:<RouteName>   a named route of webapp/js/router.js (route:SingleMap, route:CompareMap).
//                       NotFound (any unknown URL) and LoginHome (the login page at /, the same as
//                       route:Login) are not features.
//   menu:<label-slug>   an action of the file context menu: its label in lower case, with every run
//                       of other characters than letters and digits replaced by one hyphen ("Open Map"
//                       -> menu:open-map, "Compare to..." -> menu:compare-to, "Share/Embed" ->
//                       menu:share-embed). The menu's own items are in webapp/js/libs/contextMenuItems.js;
//                       the actions it shares with the toolbar and the keys are in the action registry,
//                       webapp/js/libs/dataset/explorerActions.js (those offered in the menu or the
//                       background menu), and the "Open ..." items are the rows of the viewer table,
//                       VIEWERS in webapp/js/libs/openItemDefaults.js. The rows of BUILD_DOWNLOADS and
//                       SPLAT_DOWNLOADS are actions too ("Download .spz (for other tools)" ->
//                       menu:download-spz-for-other-tools). The submenus Tools and Experimental are not
//                       actions; their items are. Two distinct actions with the same label (the generic
//                       Open and the Open of a PDF) are one feature id.
//   prefs:<tab>         a tab of the Preferences window, webapp/js/features/account/PreferencesDialog.vue,
//                       by its value (prefs:units, prefs:map, prefs:notifications).
//
// Exit 1 when a feature has no page, or when a page names a route:/menu:/prefs: id that does not exist.

import fs from 'node:fs';
import path from 'node:path';
import {loadPages, asList} from './lib/docs.mjs';
import {parseArgs} from '../media-capture/lib/env.mjs';

const args = parseArgs(process.argv.slice(2), {booleans: ['list', 'report-only', 'help']});
if (args.help) {
  const text = fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n');
  console.log(text.slice(1, text.findIndex(l => l.startsWith('import'))).map(l => l.replace(/^\/\/ ?/, '')).join('\n'));
  process.exit(0);
}

const HUB = path.resolve(args.hub || process.env.DDB_HUB_SRC || '/mnt/data/repos/Registry/Registry.Web/ClientApp');
const JS = path.join(HUB, 'webapp', 'js');
const IGNORED_ROUTES = new Set(['NotFound', 'LoginHome']);
const PREFIXES = ['route:', 'menu:', 'prefs:'];

export const slug = label => label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function read(rel) {
  const file = path.join(JS, rel);
  if (!fs.existsSync(file)) {
    console.error(`coverage: ${file} not found (is --hub the ClientApp folder of a Hub checkout?)`);
    process.exit(1);
  }
  return fs.readFileSync(file, 'utf8');
}

/** The array literal that follows `marker` in `text` (bracket-matched). */
function arrayAfter(text, marker, file) {
  const at = text.indexOf(marker);
  if (at < 0) throw new Error(`${file}: "${marker}" not found: the coverage report needs an update`);
  const start = text.indexOf('[', at);
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '[') depth++;
    else if (text[i] === ']' && --depth === 0) return text.slice(start, i + 1);
  }
  throw new Error(`${file}: no end of the list after "${marker}"`);
}

function routes() {
  const src = arrayAfter(read('router.js'), 'const routes', 'router.js');
  return [...src.matchAll(/path:\s*'([^']+)',\s*name:\s*'(\w+)'/g)]
    .filter(m => !IGNORED_ROUTES.has(m[2]))
    .map(m => ({id: `route:${m[2]}`, what: `route ${m[1]}`}));
}

function menuItems() {
  const file = 'libs/contextMenuItems.js';
  const src = read(file);
  const items = [];
  // Each item factory: function fooItem(ctx) { return { label: '…', … } }, up to the next function
  const parts = src.split(/\n(?=function \w+\(ctx\))/);
  for (const part of parts) {
    // The label of the object the factory returns (a factory may compute things before it)
    const m = /^function (\w+)\(ctx\)\s*\{[\s\S]*?\n {4}return\s*\{\s*label:\s*'([^']+)'/.exec(part);
    if (m) {
      if (/\n\s*items:\s*\[/.test(part)) continue; // a submenu (Tools, Experimental), not an action
      items.push({key: m[1], label: m[2], what: `menu ${m[1]}`});
      continue;
    }
    // A label that depends on the user (Transfer for a writer, Copy to another dataset... for a
    // reader): get label() { return modeFor(ctx.canWrite).menuLabel; } — each menuLabel of the
    // module that exports modeFor is an action
    const g = /^function (\w+)\(ctx\)\s*\{[\s\S]*?\n {4}return\s*\{\s*get label\(\)\s*\{\s*return\s+(\w+)\([^)]*\)\.menuLabel/.exec(part);
    if (!g) continue;
    const from = new RegExp(`import\\s*\\{[^}]*\\b${g[2]}\\b[^}]*\\}\\s*from\\s*'@/([^']+)'`).exec(src);
    if (!from) throw new Error(`${file}: where ${g[2]} (the label of ${g[1]}) comes from is not found`);
    const rel = from[1].endsWith('.js') ? from[1] : `${from[1]}.js`;
    const labels = [...read(rel).matchAll(/menuLabel:\s*'([^']+)'/g)].map(r => r[1]);
    if (!labels.length) throw new Error(`${rel}: no menuLabel for ${g[1]}`);
    for (const label of labels) items.push({key: `${g[1]}:${label}`, label, what: `menu ${g[1]} (${rel})`});
  }
  // A Hub with the action registry (its menu imports actionMenuItem): the shared actions and the viewer rows
  if (/\bactionMenuItem\b/.test(src)) items.push(...registryActions(), ...viewerRows());
  // The download rows that the menu turns into one item each
  for (const [rel, marker] of [['libs/build/buildDownloads.js', 'BUILD_DOWNLOADS = '],
    ['features/viewers/splat/splatDownloads.js', 'SPLAT_DOWNLOADS = ']]) {
    if (!src.includes(marker.split(' ')[0])) throw new Error(`${file} no longer uses ${marker.split(' ')[0]}`);
    const rows = arrayAfter(read(rel), marker, rel);
    for (const r of rows.matchAll(/label:\s*'([^']+)'/g)) items.push({key: `${marker}${r[1]}`, label: r[1], what: `menu row of ${marker.split(' ')[0]}`});
  }
  // One action is one item: the same action twice is an error; two actions with one label are one id
  const keys = new Set();
  const ids = new Map();
  for (const it of items) {
    if (keys.has(it.key)) throw new Error(`the menu action ${it.key} is listed twice`);
    keys.add(it.key);
    const id = `menu:${slug(it.label)}`;
    if (ids.has(id)) ids.get(id).what.push(it.what);
    else ids.set(id, {label: it.label, what: [it.what]});
  }
  return [...ids].map(([id, it]) => ({id, what: `"${it.label}" (${it.what.join('; ')})`}));
}

/** The top-level objects of an array literal (its text without the brackets), by brace matching. */
function objectsIn(array) {
  const objects = [];
  let depth = 0, start = -1;
  for (let i = 0; i < array.length; i++) {
    if (array[i] === '{') { if (depth++ === 0) start = i; }
    else if (array[i] === '}' && --depth === 0) objects.push(array.slice(start, i + 1));
  }
  return objects;
}

/** The label of an action object: a string, or the fallback of a label computed from the selection. */
const labelOf = obj => (/\blabel:\s*'([^']+)'/.exec(obj) || /\blabel:[^\n]*\?\?\s*'([^']+)'/.exec(obj))?.[1];

/** The actions of the registry that the context menu offers (on a selection or on the background). */
function registryActions() {
  const file = 'libs/dataset/explorerActions.js';
  const actions = objectsIn(arrayAfter(read(file), 'EXPLORER_ACTIONS = ', file).slice(1, -1));
  if (!actions.length) throw new Error(`${file}: no action in EXPLORER_ACTIONS: the coverage report needs an update`);
  const items = [];
  for (const obj of actions) {
    const id = /\bid:\s*'([^']+)'/.exec(obj)?.[1];
    const surfaces = /\bsurfaces:\s*\[([^\]]*)\]/.exec(obj)?.[1];
    const label = labelOf(obj);
    if (!id || surfaces === undefined || !label) throw new Error(`${file}: an action without id, surfaces or label: the coverage report needs an update`);
    if (!/'(menu|background)'/.test(surfaces)) continue; // the toolbar's own (Grid, List, Thumbnails...)
    items.push({key: `action:${id}`, label, what: `action ${id} (${file})`});
  }
  return items;
}

/** The "Open ..." items of the menu: one per row of the viewer table. */
function viewerRows() {
  const file = 'libs/openItemDefaults.js';
  const rows = objectsIn(arrayAfter(read(file), 'VIEWERS = ', file).slice(1, -1));
  if (!rows.length) throw new Error(`${file}: no row in VIEWERS: the coverage report needs an update`);
  return rows.map(row => {
    const id = /\bid:\s*'([^']+)'/.exec(row)?.[1];
    const label = labelOf(row);
    if (!id || !label) throw new Error(`${file}: a viewer row without id or label: the coverage report needs an update`);
    return {key: `action:${id}`, label, what: `viewer row ${id} (${file})`};
  });
}

function prefsTabs() {
  const file = 'features/account/PreferencesDialog.vue';
  const src = arrayAfter(read(file), 'const TABS', file);
  return [...src.matchAll(/value:\s*'(\w+)',\s*label:\s*'([^']+)',\s*icon:/g)]
    .map(m => ({id: `prefs:${m[1]}`, what: `Preferences tab "${m[2]}"`}));
}

let expected;
try {
  expected = [...routes(), ...menuItems(), ...prefsTabs()];
} catch (e) {
  console.error(`coverage: ${e.message}`);
  process.exit(1);
}

if (args.list) {
  for (const f of expected) console.log(`${f.id.padEnd(40)} ${f.what}`);
  console.log(`${expected.length} feature ids (${HUB})`);
  process.exit(0);
}

const coveredBy = new Map(expected.map(f => [f.id, []]));
const unknown = [];
for (const page of loadPages()) {
  for (const id of asList(page.frontMatter.hub_feature)) {
    if (typeof id !== 'string') continue;
    if (coveredBy.has(id)) coveredBy.get(id).push(page.rel.replace(/^docs\//, '').replace(/\.mdx?$/, ''));
    else if (PREFIXES.some(p => id.startsWith(p))) unknown.push(`${page.rel}: hub_feature "${id}" is not a feature of this Hub`);
  }
}

const width = Math.max(...expected.map(f => f.id.length));
let missing = 0;
console.log(`${'Feature'.padEnd(width)}  Pages`);
for (const f of expected) {
  const pages = coveredBy.get(f.id);
  if (!pages.length) missing++;
  console.log(`${f.id.padEnd(width)}  ${pages.length ? pages.join(', ') : `NOT COVERED  ${f.what}`}`);
}
for (const u of unknown) console.log(u);
const covered = expected.length - missing;
console.log(`\n${covered} of ${expected.length} features covered (${Math.round(100 * covered / expected.length)} %)` +
  (unknown.length ? `, ${unknown.length} unknown id(s)` : '') + ` — Hub: ${HUB}`);
if ((missing || unknown.length) && !args['report-only']) process.exit(1);
