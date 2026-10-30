// Settings of the capture tools: the credentials file of the local Registry and the Hub base URLs.
// Every script of media-capture/ resolves them here, so they mean the same thing everywhere.

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {HUB_URL} from '../../src/lib/hub.mjs';

/** Root of the docs repository. */
export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const CAPTURE_DIR = path.join(REPO_ROOT, 'media-capture');

/** Working folder of the local Registry (start.sh writes credentials.env there). */
export const DOCS_HOME = process.env.DDB_DOCS_HOME || '/mnt/data/docs-capture';

/** When reset-demo last finished on each Hub: { "<base URL>": "<ISO time>" }. */
const DEMO_RESETS = path.join(DOCS_HOME, 'demo-resets.json');

/** The time (ms) reset-demo last finished on the Hub at base, or null when it never ran there. */
export function demoResetTime(base) {
  try {
    const at = JSON.parse(fs.readFileSync(DEMO_RESETS, 'utf8'))[base];
    return at ? Date.parse(at) : null;
  } catch {
    return null;
  }
}

/** Records that reset-demo finished on the Hub at base, now. */
export function recordDemoReset(base) {
  let all = {};
  try {
    all = JSON.parse(fs.readFileSync(DEMO_RESETS, 'utf8'));
  } catch {
    // first reset, or an unreadable file: start again
  }
  all[base] = new Date().toISOString();
  fs.mkdirSync(DOCS_HOME, {recursive: true});
  fs.writeFileSync(DEMO_RESETS, JSON.stringify(all, null, 2) + '\n');
}

/**
 * Reads KEY=value lines of the credentials file into process.env. A variable that is already set
 * wins, so the environment can point the tools at another Hub (production) with other accounts.
 * Returns the path read, or null when there is no file.
 */
export function loadCredentials(file = process.env.DDB_DOCS_CREDENTIALS || path.join(DOCS_HOME, 'credentials.env')) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    return null;
  }
  for (const line of text.split(/\r?\n/)) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (!m || line.trimStart().startsWith('#')) continue;
    const value = m[2].replace(/^(['"])(.*)\1$/, '$2');
    if (process.env[m[1]] === undefined) process.env[m[1]] = value;
  }
  return file;
}

/**
 * Root of the input files that the demo data and the upload shots use (setFiles, demo-inputs.yaml):
 * DDB_DOCS_INPUTS, else /mnt/data/datasets. They are never committed to the docs repository.
 */
export const inputsRoot = () => process.env.DDB_DOCS_INPUTS || '/mnt/data/datasets';

/** A path of an input file: absolute as it is, relative under the inputs root. */
export function inputPath(p) {
  return path.isAbsolute(p) ? p : path.join(inputsRoot(), p);
}

const trimSlash = url => url.replace(/\/+$/, '');

/**
 * Base URL of a shot. `hub`: --base, else DDB_DOCS_BASE_URL, else hub.dronedb.app.
 * `local`: always the throwaway local Registry (DDB_DOCS_LOCAL_URL, else localhost:DDB_DOCS_PORT).
 */
export function resolveBase(kind, cliBase) {
  if (kind === 'local') {
    return trimSlash(process.env.DDB_DOCS_LOCAL_URL || `http://localhost:${process.env.DDB_DOCS_PORT || 5180}`);
  }
  return trimSlash(cliBase || process.env.DDB_DOCS_BASE_URL || HUB_URL);
}

/** User name and password of a sign-in role of the shot format (`demo` or `admin`). */
export function credentialsOf(role) {
  const [userVar, passVar] = role === 'admin'
    ? ['DDB_DOCS_ADMIN_USER', 'DDB_DOCS_ADMIN_PASSWORD']
    : ['DDB_DOCS_USER', 'DDB_DOCS_PASSWORD'];
  const username = process.env[userVar];
  const password = process.env[passVar];
  if (!username || !password) {
    throw new Error(`auth: ${role} needs ${userVar} and ${passVar} (environment or ${path.join(DOCS_HOME, 'credentials.env')})`);
  }
  return {username, password};
}

/** Small argv parser: --flag, --key value, --key=value; repeated keys collect into arrays. */
export function parseArgs(argv, {booleans = [], repeat = []} = {}) {
  const out = {_: []};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { out._.push(a); continue; }
    let [key, value] = a.slice(2).split(/=(.*)/s);
    if (booleans.includes(key)) { out[key] = value === undefined ? true : value !== 'false'; continue; }
    if (value === undefined) {
      value = argv[++i];
      if (value === undefined) throw new Error(`--${key} needs a value`);
    }
    if (repeat.includes(key)) (out[key] ||= []).push(...value.split(','));
    else out[key] = value;
  }
  return out;
}
