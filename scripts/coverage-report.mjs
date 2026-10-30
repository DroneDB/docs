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
//   menu:<label-slug>   an action of the file context menu, webapp/js/libs/contextMenuItems.js:
//                       its label in lower case, with every run of other characters than letters and
//                       digits replaced by one hyphen ("Open Map" -> menu:open-map, "Compare to..." ->
//                       menu:compare-to, "Share/Embed" -> menu:share-embed). The rows of
//                       BUILD_DOWNLOADS and SPLAT_DOWNLOADS are actions too ("Download .spz (for
//                       other tools)" -> menu:download-spz-for-other-tools). The submenus Tools and
//                       Experimental are not actions; their items are.
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
      items.push({label: m[2], what: `menu ${m[1]}`});
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
    for (const label of labels) items.push({label, what: `menu ${g[1]} (${rel})`});
  }
  // The download rows that the menu turns into one item each
  for (const [rel, marker] of [['libs/build/buildDownloads.js', 'BUILD_DOWNLOADS = '],
    ['features/viewers/splat/splatDownloads.js', 'SPLAT_DOWNLOADS = ']]) {
    if (!src.includes(marker.split(' ')[0])) throw new Error(`${file} no longer uses ${marker.split(' ')[0]}`);
    const rows = arrayAfter(read(rel), marker, rel);
    for (const r of rows.matchAll(/label:\s*'([^']+)'/g)) items.push({label: r[1], what: `menu row of ${marker.split(' ')[0]}`});
  }
  const ids = new Map();
  for (const it of items) {
    const id = `menu:${slug(it.label)}`;
    if (ids.has(id)) throw new Error(`two menu items give ${id}: "${ids.get(id).label}" and "${it.label}"`);
    ids.set(id, it);
  }
  return [...ids].map(([id, it]) => ({id, what: `"${it.label}" (${it.what})`}));
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
