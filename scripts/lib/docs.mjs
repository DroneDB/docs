// The docs pages (docs/**/*.md and *.mdx) with their front matter, for the site tools.

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import yaml from 'js-yaml';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const DOCS_DIR = path.join(REPO_ROOT, 'docs');

/**
 * Every page under docs/: { rel, file, frontMatter, body, bodyLine }. `rel` is the path from the
 * repository root; `bodyLine` is the line number of the first body line (for messages).
 * Throws on front matter that is not valid YAML.
 */
export function loadPages(dir = DOCS_DIR) {
  return fs.readdirSync(dir, {recursive: true})
    .filter(f => /\.mdx?$/.test(f))
    .sort()
    .map(f => {
      const file = path.join(dir, f);
      const rel = path.relative(REPO_ROOT, file).split(path.sep).join('/');
      const text = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
      const m = /^---\n([\s\S]*?)\n---\n?/.exec(text);
      let frontMatter = {};
      if (m) {
        try {
          frontMatter = yaml.load(m[1]) || {};
        } catch (e) {
          throw new Error(`${rel}: front matter: ${e.message.split('\n')[0]}`);
        }
      }
      const head = m ? m[0] : '';
      return {rel, file, frontMatter, body: text.slice(head.length), bodyLine: head.split('\n').length};
    });
}

/** The translated pages of every locale (i18n/<locale>/docusaurus-plugin-content-docs/current). */
export function loadTranslatedPages() {
  const i18n = path.join(REPO_ROOT, 'i18n');
  if (!fs.existsSync(i18n)) return [];
  return fs.readdirSync(i18n)
    .map(locale => path.join(i18n, locale, 'docusaurus-plugin-content-docs', 'current'))
    .filter(dir => fs.existsSync(dir))
    .flatMap(dir => loadPages(dir));
}

/** A front matter value that is a string or a list of strings, as a list. */
export function asList(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

/** Line number (1-based, in the file) of an offset in a page body. */
export function lineOf(page, offset) {
  return page.bodyLine + page.body.slice(0, offset).split('\n').length - 1;
}
