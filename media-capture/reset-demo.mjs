#!/usr/bin/env node
// Puts the demo data of the documentation back in its fixed state, through the Registry REST API,
// as media-capture/demo-inputs.yaml describes it: signed in as the demo account, it deletes every
// dataset of the demo organization (creating the organization when it is missing), creates the
// listed datasets again, uploads their files, waits for their builds and resets the account's
// Preferences to the Hub defaults. Run it before a capture of the shots with `auth: demo`.
//
//   node media-capture/reset-demo.mjs [options]       (npm run reset-demo)
//
//   --base <url>     Hub to reset (default DDB_DOCS_BASE_URL, else hub.dronedb.app)
//   --source <url>   Hub the `from:` files are downloaded from (default DDB_DOCS_SOURCE_URL, else
//                    the Hub that is reset: it has the same public showcase datasets)
//   --inputs <file>  the demo inputs file (default media-capture/demo-inputs.yaml)
//   --only <slug>    reset only these datasets (repeat or comma-separate); the others are kept
//   --dry-run        resolve every input file and print the plan, change nothing
//   --no-wait        do not wait for the builds
//
// Accounts: DDB_DOCS_USER / DDB_DOCS_PASSWORD (the demo account), and DDB_DOCS_ADMIN_USER /
// DDB_DOCS_ADMIN_PASSWORD for the account metadata (skipped without them), from the environment
// or the credentials.env of the local Registry. Local input files are read from DDB_DOCS_INPUTS
// (default /mnt/data/datasets); downloads are cached in $DDB_DOCS_HOME/demo-inputs-cache.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import yaml from 'js-yaml';
import {CAPTURE_DIR, DOCS_HOME, credentialsOf, inputPath, loadCredentials, parseArgs, resolveBase} from './lib/env.mjs';
import {Registry} from './lib/registry.mjs';
import {listApiUrl} from '../src/lib/hub.mjs';

const run = promisify(execFile);
const VISIBILITY = {private: 0, unlisted: 1, public: 2};
const BUILDING = new Set(['queued', 'building']);
const CACHE = path.join(DOCS_HOME, 'demo-inputs-cache');
/** Listings of the source Hub, by URL (a glob and the files of one folder list it once). */
const listings = new Map();

const args = parseArgs(process.argv.slice(2), {booleans: ['dry-run', 'no-wait', 'help'], repeat: ['only']});
if (args.help) {
  const text = fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n');
  console.log(text.slice(1, text.findIndex(l => l.startsWith('import'))).map(l => l.replace(/^\/\/ ?/, '')).join('\n'));
  process.exit(0);
}
loadCredentials();

const base = resolveBase('hub', args.base);
const source = (args.source || process.env.DDB_DOCS_SOURCE_URL || base).replace(/\/+$/, '');
const inputsFile = path.resolve(args.inputs || path.join(CAPTURE_DIR, 'demo-inputs.yaml'));
const spec = checkSpec(yaml.load(fs.readFileSync(inputsFile, 'utf8')));
const datasets = args.only ? spec.datasets.filter(d => args.only.includes(d.slug)) : spec.datasets;
if (args.only && datasets.length !== args.only.length) {
  fail(`--only: unknown dataset(s) ${args.only.filter(s => !datasets.some(d => d.slug === s)).join(', ')}`);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ddb-reset-demo-'));
try {
  await main();
} catch (e) {
  fail(e.cause ? `${e.message} (${e.cause.code || e.cause.message})` : e.message);
} finally {
  fs.rmSync(tmp, {recursive: true, force: true});
}

async function main() {
  const t0 = Date.now();
  console.log(`Reset ${spec.org.slug} on ${base} (files from ${source})`);

  // Resolve every input first: a missing file stops the run before anything is deleted
  const plan = [];
  for (const ds of datasets) {
    const files = [];
    for (const f of ds.files) files.push(...await resolveFile(f));
    plan.push({ds, files});
    console.log(`  ${ds.slug} (${ds.visibility}): ${files.length} file(s), ${mb(files.reduce((n, f) => n + fs.statSync(f.local).size, 0))}`);
  }
  if (args['dry-run']) {
    for (const {ds, files} of plan) for (const f of files) console.log(`    ${ds.slug}/${f.dest} <- ${f.origin}`);
    console.log('Dry run: nothing changed.');
    return;
  }

  const {username, password} = credentialsOf('demo');
  const reg = new Registry(base);
  await reg.login(username, password);
  const org = spec.org.slug;
  const orgPath = `/orgs/${encodeURIComponent(org)}`;

  if (!await reg.exists(orgPath)) {
    await reg.request('POST', '/orgs', {body: new URLSearchParams({
      slug: org, name: spec.org.name || org, description: spec.org.description || '', isPublic: 'false'
    })});
    console.log(`Created organization ${org}`);
  }

  // Every dataset of the organization goes (also those a capture created), or only the --only ones
  const existing = await reg.request('GET', `${orgPath}/ds`);
  for (const d of existing) {
    if (args.only && !args.only.includes(d.slug)) continue;
    await reg.request('DELETE', `${orgPath}/ds/${encodeURIComponent(d.slug)}`);
    console.log(`Deleted ${org}/${d.slug}`);
  }

  const uploaded = [];
  for (const {ds, files} of plan) {
    await reg.request('POST', `${orgPath}/ds`, {body: new URLSearchParams({
      slug: ds.slug, name: ds.name || ds.slug, visibility: String(VISIBILITY[ds.visibility])
    })});
    for (const f of files) {
      const t = Date.now();
      await reg.upload(org, ds.slug, f.local, f.dest);
      uploaded.push({ds: ds.slug, path: f.dest});
      console.log(`  ${ds.slug}/${f.dest} (${mb(fs.statSync(f.local).size)}, ${((Date.now() - t) / 1000).toFixed(1)} s)`);
    }
    console.log(`Created ${org}/${ds.slug}`);
  }

  if (spec.account?.resetPreferences) {
    const prefs = await reg.request('GET', '/users/preferences') || {};
    const sections = Object.keys(prefs);
    if (sections.length) await reg.request('PATCH', '/users/preferences', {json: Object.fromEntries(sections.map(k => [k, null]))});
    console.log(`Preferences of ${username} reset to the defaults (${sections.length} section(s) deleted)`);
  }
  if (spec.account?.meta) await setAccountMeta(username, spec.account.meta);

  if (!args['no-wait']) await waitForBuilds(reg, org, uploaded);
  console.log(`Done in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}

/** Checks the demo inputs file; returns it with defaults. */
function checkSpec(doc) {
  const errors = [];
  if (!doc?.org?.slug) errors.push('org.slug is required');
  if (!Array.isArray(doc?.datasets)) errors.push('datasets: a list');
  const seen = new Set();
  for (const [i, d] of (doc?.datasets || []).entries()) {
    const where = `datasets[${i}]${d?.slug ? ` (${d.slug})` : ''}`;
    if (!d?.slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(d.slug)) errors.push(`${where}: slug in lower case`);
    if (seen.has(d?.slug)) errors.push(`${where}: duplicate slug`);
    seen.add(d?.slug);
    d.visibility ??= 'private';
    d.files ??= [];
    if (!(d.visibility in VISIBILITY)) errors.push(`${where}: visibility private | unlisted | public`);
    for (const [j, f] of d.files.entries()) {
      const kinds = ['from', 'file', 'text', 'zip'].filter(k => f?.[k] !== undefined);
      if (!f?.dest || kinds.length !== 1) errors.push(`${where} files[${j}]: dest and one of from | file | text | zip`);
    }
  }
  if (errors.length) fail(`${inputsFile}:\n  ${errors.join('\n  ')}`);
  return doc;
}

/** Local files of a `files` entry: [{ dest, local, origin }] (a glob gives several). */
async function resolveFile(f) {
  if (f.zip) {
    const stage = fs.mkdtempSync(path.join(tmp, 'zip-'));
    for (const entry of f.zip) {
      for (const src of await resolveSource(entry)) {
        const rel = !entry.as ? path.basename(src.name) : entry.as.endsWith('/') ? entry.as + path.basename(src.name) : entry.as;
        fs.mkdirSync(path.dirname(path.join(stage, rel)), {recursive: true});
        fs.copyFileSync(src.local, path.join(stage, rel));
      }
    }
    const local = path.join(tmp, `${path.basename(stage)}.zip`);
    await run('zip', ['-q', '-r', '-X', local, '.'], {cwd: stage});
    return [{dest: f.dest, local, origin: `zip of ${f.zip.length} source(s)`}];
  }
  const sources = await resolveSource(f);
  if (sources.length > 1 && !f.dest.endsWith('/')) throw new Error(`${f.dest}: a glob needs a folder dest (ending with /)`);
  return sources.map(s => ({dest: f.dest.endsWith('/') ? f.dest + path.basename(s.name) : f.dest, local: s.local, origin: s.origin}));
}

/** [{ name, local, origin }] of a from / file / text source; `bytes: N` keeps the first N bytes. */
async function resolveSource(src) {
  const found = await resolveWhole(src);
  if (!src.bytes) return found;
  return found.map(f => {
    const local = path.join(fs.mkdtempSync(path.join(tmp, 'cut-')), path.basename(f.local));
    fs.writeFileSync(local, fs.readFileSync(f.local).subarray(0, src.bytes));
    return {...f, local, origin: `${f.origin} (first ${src.bytes} bytes)`};
  });
}

async function resolveWhole(src) {
  if (src.text !== undefined) {
    const local = path.join(fs.mkdtempSync(path.join(tmp, 'text-')), 'file');
    fs.writeFileSync(local, String(src.text));
    return [{name: path.basename(src.as || src.dest || 'file.txt'), local, origin: 'text'}];
  }
  if (src.file !== undefined) {
    const local = inputPath(src.file);
    if (!fs.existsSync(local)) throw new Error(`missing input file ${local} (set DDB_DOCS_INPUTS)`);
    return [{name: path.basename(local), local, origin: local}];
  }
  const m = /^([^/]+)\/([^/]+)\/(.+)$/.exec(src.from || '');
  if (!m) throw new Error(`from: "<org>/<dataset>/<path>", not "${src.from}"`);
  const [, org, ds, filePath] = m;
  const dir = path.posix.dirname(filePath);
  const name = path.posix.basename(filePath);
  const entries = await listSource(org, ds, dir === '.' ? '' : dir);
  const re = globRegExp(name);
  const matches = entries.filter(e => re.test(path.posix.basename(e.path)) && e.type !== 1);
  if (!matches.length) throw new Error(`no file ${src.from} on ${source}`);
  const out = [];
  for (const e of matches) out.push({name: e.path, local: await download(org, ds, e), origin: `${source} ${org}/${ds}/${e.path}`});
  return out;
}

async function listSource(org, ds, dir) {
  const url = listApiUrl({org, ds, path: dir || undefined, base: source});
  if (!listings.has(url)) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
    listings.set(url, await res.json());
  }
  return listings.get(url);
}

/** Downloads a file of a public dataset into the cache (kept while its size matches). */
async function download(org, ds, entry) {
  const local = path.join(CACHE, org, ds, entry.path);
  if (fs.existsSync(local) && fs.statSync(local).size === entry.size) return local;
  fs.mkdirSync(path.dirname(local), {recursive: true});
  const url = `${source}/orgs/${encodeURIComponent(org)}/ds/${encodeURIComponent(ds)}/download?path=${encodeURIComponent(entry.path)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  const part = `${local}.part`;
  await fs.promises.writeFile(part, res.body);
  if (fs.statSync(part).size !== entry.size) throw new Error(`${url}: got ${fs.statSync(part).size} bytes, expected ${entry.size}`);
  fs.renameSync(part, local);
  console.log(`  downloaded ${org}/${ds}/${entry.path} (${mb(entry.size)})`);
  return local;
}

function globRegExp(glob) {
  const re = glob.replace(/[.+^${}()|\\]/g, '\\$&').replace(/\*/g, '[^/]*').replace(/\?/g, '[^/]');
  return new RegExp(`^${re}$`);
}

async function setAccountMeta(username, meta) {
  let admin;
  try {
    admin = credentialsOf('admin');
  } catch {
    console.warn('Account metadata skipped: no DDB_DOCS_ADMIN_USER / DDB_DOCS_ADMIN_PASSWORD');
    return;
  }
  const reg = new Registry(base);
  await reg.login(admin.username, admin.password);
  await reg.request('POST', `/users/${encodeURIComponent(username)}/meta`, {json: meta});
  console.log(`Account metadata of ${username}: ${JSON.stringify(meta)}`);
}

/** Waits until no uploaded file has a build queued or running (30 minutes at most). */
async function waitForBuilds(reg, org, files) {
  const end = Date.now() + 30 * 60e3;
  let states;
  do {
    states = new Map();
    for (const f of files) {
      const list = await reg.request('GET', listApiUrl({org, ds: f.ds, path: f.path, base}));
      states.set(`${f.ds}/${f.path}`, list?.[0]?.buildStatus || null);
    }
    const active = [...states].filter(([, s]) => BUILDING.has(s));
    if (!active.length) break;
    console.log(`  ${active.length} build(s) queued or running`);
    await new Promise(r => setTimeout(r, 5000));
  } while (Date.now() < end);
  const summary = {};
  for (const [file, s] of states) if (s) (summary[s] ||= []).push(file);
  for (const [s, list] of Object.entries(summary)) console.log(`Builds ${s}: ${list.join(', ')}`);
  if ([...states.values()].some(s => BUILDING.has(s))) throw new Error('builds still running after 30 minutes');
}

function mb(bytes) {
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function fail(msg) {
  console.error(`reset-demo: ${msg}`);
  process.exit(1);
}
