// Minimal client of the Registry REST API (the endpoints the Hub itself calls), for the tools
// that prepare the demo data. Uploads go one file per request; files larger than CHUNK_BYTES go
// through the resumable chunk endpoints, as the Hub sends them.

import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';

export const CHUNK_BYTES = 64 * 1024 * 1024;

export class RegistryError extends Error {
  constructor(method, url, status, body) {
    super(`${method} ${url} -> ${status}${body ? `: ${String(body).slice(0, 300)}` : ''}`);
    this.status = status;
  }
}

export class Registry {
  constructor(base) {
    this.base = base.replace(/\/+$/, '');
    this.token = null;
  }

  async login(username, password) {
    const body = new URLSearchParams({username, password});
    const res = await this.request('POST', '/users/authenticate', {body, auth: false});
    this.token = res.token;
    return res;
  }

  /** JSON (or text) of a request to an API path or a full URL; throws RegistryError on a status that is not 2xx. */
  async request(method, endpoint, {body, json, auth = true, headers = {}} = {}) {
    const url = /^https?:\/\//.test(endpoint) ? endpoint : this.base + endpoint;
    const h = {...headers};
    if (auth && this.token) h.Authorization = `Bearer ${this.token}`;
    if (json !== undefined) {
      h['Content-Type'] = 'application/json';
      body = JSON.stringify(json);
    }
    const res = await fetch(url, {method, body, headers: h});
    const text = await res.text();
    if (!res.ok) throw new RegistryError(method, url, res.status, text);
    if (!text) return null;
    return (res.headers.get('content-type') || '').includes('json') ? JSON.parse(text) : text;
  }

  /** Whether a GET answers 2xx (404 is false; other errors throw). */
  async exists(endpoint) {
    try {
      await this.request('GET', endpoint);
      return true;
    } catch (e) {
      if (e.status === 404) return false;
      throw e;
    }
  }

  dsPrefix(org, ds) {
    return `/orgs/${encodeURIComponent(org)}/ds/${encodeURIComponent(ds)}`;
  }

  /** Uploads a local file to `dest` (a path in the dataset). */
  async upload(org, ds, file, dest) {
    const size = fs.statSync(file).size;
    const blob = await fs.openAsBlob(file);
    const name = path.basename(dest);
    if (size <= CHUNK_BYTES) {
      const form = new FormData();
      form.append('path', dest);
      form.append('file', blob, name);
      return this.request('POST', `${this.dsPrefix(org, ds)}/obj`, {body: form, headers: {'X-Upload-Id': randomUUID()}});
    }
    const fileId = randomUUID();
    const total = Math.ceil(size / CHUNK_BYTES);
    for (let i = 0; i < total; i++) {
      const form = new FormData();
      form.append('fileId', fileId);
      form.append('chunkIndex', String(i));
      form.append('totalChunks', String(total));
      form.append('totalFileSize', String(size));
      form.append('chunkSize', String(CHUNK_BYTES));
      form.append('path', dest);
      form.append('chunk', blob.slice(i * CHUNK_BYTES, Math.min(size, (i + 1) * CHUNK_BYTES)), name);
      await this.request('POST', `${this.dsPrefix(org, ds)}/obj/chunk`, {body: form, headers: {'X-Upload-Id': fileId}});
    }
    return this.request('POST', `${this.dsPrefix(org, ds)}/obj/chunk/${fileId}/commit`,
      {body: new FormData(), headers: {'X-Upload-Id': fileId}});
  }
}
