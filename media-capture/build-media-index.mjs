#!/usr/bin/env node
// Writes src/data/media.json, the list of captured shots that <Screenshot>, <Clip> and
// <LiveEmbed> read: for each shot of media-capture/shots/*.yaml whose image is in static/media,
// its type, the pixel size of the image, its alt text and its YouTube id.
//
//   node media-capture/build-media-index.mjs [--check]
//
//   --check   do not write: exit 1 when media.json is not what the shots and images give
//
// A shot without an image is left out (the page shows a placeholder and the build warns).
// An image without a shot is reported: it is left over from a renamed or removed shot.

import fs from 'node:fs';
import path from 'node:path';
import {REPO_ROOT, parseArgs} from './lib/env.mjs';
import {MEDIA_DIR, loadShots, mediaPath} from './lib/shots.mjs';
import {webpFileSize} from './lib/webp.mjs';

const INDEX = path.join(REPO_ROOT, 'src', 'data', 'media.json');
const args = parseArgs(process.argv.slice(2), {booleans: ['check']});

const {shots, errors} = loadShots();
if (errors.length) {
  console.error(`The shot definitions have ${errors.length} error(s):`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}

const index = {};
let missing = 0;
for (const shot of [...shots].sort((a, b) => a.id.localeCompare(b.id))) {
  const file = mediaPath(shot.id);
  if (!fs.existsSync(file)) {
    missing++;
    continue;
  }
  const {width, height} = webpFileSize(file);
  index[shot.id] = {type: shot.type, width, height, alt: shot.alt, youtubeId: shot.youtubeId};
}

const known = new Set(shots.map(s => s.id));
const orphans = listImages(MEDIA_DIR).filter(id => !known.has(id));
for (const id of orphans) console.warn(`warning: static/media/${id}.webp has no shot definition`);

const json = `${JSON.stringify(index, null, 2)}\n`;
const count = Object.keys(index).length;
if (args.check) {
  const current = fs.existsSync(INDEX) ? fs.readFileSync(INDEX, 'utf8') : '';
  if (current !== json) {
    console.error('src/data/media.json is out of date: run `npm run media:index`');
    process.exit(1);
  }
  console.log(`src/data/media.json is up to date (${count} shots)`);
} else {
  fs.writeFileSync(INDEX, json);
  console.log(`src/data/media.json: ${count} captured shot(s), ${missing} not captured yet` +
    (orphans.length ? `, ${orphans.length} image(s) without a shot` : ''));
}

/** Shot ids of the WebP images under static/media (<section>/<feature>--<shot>.webp). */
function listImages(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, {recursive: true})
    .filter(f => f.endsWith('.webp'))
    .map(f => f.split(path.sep).join('/').replace(/\.webp$/, ''));
}
