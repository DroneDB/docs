# Uploading clips to YouTube

The docs owner does this by hand after a capture that changed clips. YouTube cannot replace the
file of a video, so a re-recorded clip is always a **new** upload with a new id.

## Before the upload

1. Capture the section: `npm run media -- --only <section>/`. The MP4s are written to
   `media-capture/out/<section>/<feature>--<shot>.mp4` (not in git) and the posters to
   `static/media/`.
2. Watch each MP4 once: no half-loaded viewer, no personal data, the cursor visible, 5–40 s.

## For each clip

Upload to the official channel, `youtube.com/@DroneDB` (YouTube Studio → Create → Upload videos):

| Field | Value |
|-------|-------|
| File | `media-capture/out/<id>.mp4` |
| Title | `DroneDB Hub — <Feature>` (the title of the docs page, for example `DroneDB Hub — Plant health`) |
| Description | First line: the shot id (`analyse/plant-health--ndvi`). Second line: the docs page, `https://docs.dronedb.app/docs/<page>` (the `page` of the shot). Then one sentence from the `alt` of the shot. |
| Playlist | **Hub guide** |
| Audience | Not made for kids |
| Visibility | **Public**; **Unlisted** for a clip shorter than 10 s |
| Thumbnail | the poster, `static/media/<id>.webp` (convert to PNG or JPEG if Studio refuses WebP) |
| Captions, end screen, cards | none |

Then:

1. Copy the video id (the part after `youtu.be/` or `v=`, 11 characters).
2. Put it in `youtubeId:` of the shot in `media-capture/shots/<section>.yaml`. Never put a
   YouTube id in MDX: `<Clip id="…" />` reads it from `src/data/media.json`.
3. When the clip replaces an older one: set the old video to **Unlisted**. Do not delete it;
   links shared elsewhere keep working.

## After the uploads

1. `npm run media:index` (writes the ids into `src/data/media.json`).
2. `npm run check:links` (asks YouTube for each id: a typo fails here).
3. Commit the shot files, `src/data/media.json` and the posters together.

Plan about 1–2 hours of upload work for each Registry release that changes clips.
