// Links into DroneDB Hub. The docs site, the link checker and the capture pipeline all build
// Hub URLs here, so the URL format exists once.

export const HUB_URL = 'https://hub.dronedb.app';

/** The Hub views a file can open in (the routes /r/:org/:ds/view/:encodedPath/<view>). */
export const HUB_VIEWS = ['map', 'pointcloud', 'model', 'unified', 'splat', 'panorama', 'markdown'];

/** Base64 of a UTF-8 path, as the Hub encodes it (webapp/js/libs/base64.js b64encode). */
export function encodePath(path) {
  const bytes = new TextEncoder().encode(path);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

/** URL of a dataset, or of one file in one of its views. */
export function hubUrl({org, ds, path, view, embed = false, base = HUB_URL}) {
  if (!org) return base;
  let url = `${base}/r/${encodeURIComponent(org)}`;
  if (ds) url += `/${encodeURIComponent(ds)}`;
  if (ds && path && view) {
    if (!HUB_VIEWS.includes(view)) throw new Error(`Unknown Hub view "${view}"`);
    url += `/view/${encodePath(path)}/${view}`;
  }
  // Registry lets a page be framed only when the request asks for the embedded view
  return embed ? `${url}?embed=1` : url;
}

/** API URL that lists the entries at a path of a dataset (the link checker uses it). */
export function listApiUrl({org, ds, path, base = HUB_URL}) {
  const q = path ? `?path=${encodeURIComponent(path)}` : '';
  return `${base}/orgs/${encodeURIComponent(org)}/ds/${encodeURIComponent(ds)}/list${q}`;
}
