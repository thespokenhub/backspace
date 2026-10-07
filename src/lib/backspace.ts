// Snapshot lookup, sample fallbacks and date formatting.
// Ported from the design bundle's backspace-data.js.

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const EXAMPLES = ['apple.com', 'nytimes.com', 'spacejam.com', 'wikipedia.org'];

export interface RawSnap {
  ts: string;
  digest: string;
  length: number;
}

export interface Snap extends RawSnap {
  i: number;
  year: number;
  month: number;
  day: number;
  changed: boolean;
}

export interface SnapResult {
  source: 'live' | 'sample';
  snaps: Snap[];
}

export interface SitePage {
  path: string;
  ts: string;
}

export interface PagesResult {
  source: 'live' | 'sample';
  pages: SitePage[];
}

// Same-origin proxy (api/cdx.ts on Vercel, vite.config.ts in dev).
const CDX = '/api/cdx';

const snapCache = new Map<string, SnapResult>();
const pageCache = new Map<string, PagesResult>();

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(api: string): Promise<unknown> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 30000);
  try {
    const r = await fetch(api, { signal: ctrl.signal });
    if (!r.ok) throw new Error('bad');
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

export function normalize(input: string): string | null {
  const s = (input || '').trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/+$/, '');
  if (!s) return null;
  const parts = s.split('/');
  parts[0] = parts[0].toLowerCase();
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(parts[0])) return null;
  return parts.join('/');
}

export const hostOf = (url: string) => url.split('/')[0];

export function decorate(snaps: RawSnap[]): Snap[] {
  let prev: string | null = null;
  return snaps.map((s, i) => {
    const o = { ...s, i, year: +s.ts.slice(0, 4), month: +s.ts.slice(4, 6), day: +s.ts.slice(6, 8) || 1, changed: prev === null || s.digest !== prev };
    prev = s.digest;
    return o;
  });
}

function seeded(seed: number, text: string) {
  let h = seed;
  for (const c of text) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return () => {
    h = (h * 1664525 + 1013904223) >>> 0;
    return h / 4294967296;
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

export function sample(url: string): RawSnap[] {
  const rnd = seeded(7, url);
  const now = new Date();
  const startY = 1997 + Math.floor(rnd() * 9);
  const out: RawSnap[] = [];
  let d = 'a0';
  let len = 6000 + Math.floor(rnd() * 8000);
  for (let y = startY; y <= now.getFullYear(); y++) {
    for (let m = 1; m <= 12; m++) {
      if (y === now.getFullYear() && m > now.getMonth() + 1) break;
      if (rnd() > Math.min(0.95, 0.3 + (y - startY) * 0.07)) continue;
      if (rnd() < 0.38) {
        d = Math.floor(rnd() * 1e9).toString(36);
        len = Math.round(len * (0.82 + rnd() * 0.5));
      }
      const isNow = y === now.getFullYear() && m === now.getMonth() + 1;
      const day = 1 + Math.floor(rnd() * (isNow ? Math.max(1, now.getDate() - 1) : 27));
      out.push({ ts: `${y}${pad(m)}${pad(day)}120000`, digest: d, length: len });
    }
  }
  return out;
}

export async function fetchSnapshots(url: string): Promise<SnapResult> {
  const hit = snapCache.get(url);
  if (hit) return hit;
  const api = `${CDX}?url=${encodeURIComponent(url)}&output=json&fl=timestamp,digest,length&filter=statuscode:200&collapse=timestamp:6`;
  let res: SnapResult;
  try {
    const rows = (await fetchJson(api)) as string[][] | null;
    res = { source: 'live', snaps: decorate((rows || []).slice(1).map(([ts, digest, length]) => ({ ts, digest, length: +length || 0 }))) };
    snapCache.set(url, res); // only cache real answers, so "Try again" can retry
  } catch {
    await wait(900);
    res = { source: 'sample', snaps: decorate(sample(url)) };
  }
  return res;
}

export const frameUrl = (url: string, ts: string) => `https://web.archive.org/web/${ts}if_/http://${url}`;

export const fmt = (ts: string) => `${MONTHS[+ts.slice(4, 6) - 1]} ${+ts.slice(6, 8) || 1}, ${ts.slice(0, 4)}`;
export const fmtShort = (ts: string) => `${MONTHS[+ts.slice(4, 6) - 1].slice(0, 3)} ${+ts.slice(6, 8) || 1}, ${ts.slice(0, 4)}`;

export function ago(ts: string): string {
  const now = new Date();
  const months = (now.getFullYear() - +ts.slice(0, 4)) * 12 + (now.getMonth() + 1 - +ts.slice(4, 6));
  if (months <= 0) return 'this month';
  if (months < 12) return months === 1 ? '1 month ago' : months + ' months ago';
  const y = Math.floor(months / 12);
  return y === 1 ? '1 year ago' : y + ' years ago';
}

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function pathOf(orig: string): string {
  let p = orig.replace(/^https?:\/\//i, '').replace(/^[^/]+/, '').split('?')[0].split('#')[0];
  if (!p) p = '/';
  return p.length > 1 ? p.replace(/\/+$/, '') : p;
}

const WORDS = ['news', 'spring', 'launch', 'guide', 'team', 'update', 'design', 'store', 'pricing', 'faq', 'history', 'tour', 'press', 'events', 'support', 'help', 'jobs', 'partners', 'stories', 'gallery', 'downloads', 'features', 'mobile', 'music', 'video', 'travel', 'sports', 'tech', 'world', 'science'];

export function samplePages(host: string, year: number): SitePage[] {
  const rnd = seeded(year, host);
  const pick = () => WORDS[Math.floor(rnd() * WORDS.length)];
  const set = new Set(['/', '/about', '/contact', '/privacy']);
  const sections = ['products', 'blog', 'support', 'news', 'careers', 'press'];
  const size = Math.min(140, 18 + (year - 1996) * 5);
  let guard = 0;
  while (set.size < size && guard++ < 2000) {
    const sec = sections[Math.floor(rnd() * Math.min(sections.length, 2 + (year - 1996) / 5))];
    if (sec === 'blog' || sec === 'news') set.add(`/${sec}/${year}/${pick()}-${pick()}`);
    else if (rnd() < 0.5) set.add(`/${sec}`);
    else set.add(`/${sec}/${pick()}`);
  }
  const now = new Date();
  const cur = year === now.getFullYear();
  return [...set].map((path) => {
    const m = 1 + Math.floor(rnd() * (cur ? now.getMonth() + 1 : 12));
    const dd = 1 + Math.floor(rnd() * (cur && m === now.getMonth() + 1 ? Math.max(1, now.getDate() - 1) : 27));
    return { path, ts: `${year}${pad(m)}${pad(dd)}120000` };
  });
}

export async function fetchPages(url: string, year: number): Promise<PagesResult> {
  const host = hostOf(url);
  const key = `${host}:${year}`;
  const hit = pageCache.get(key);
  if (hit) return hit;
  const api = `${CDX}?url=${encodeURIComponent(host)}/*&output=json&fl=original,timestamp&collapse=urlkey&filter=statuscode:200&filter=mimetype:text/html&from=${year}&to=${year}&limit=500`;
  let list: SitePage[];
  let source: PagesResult['source'] = 'live';
  try {
    const rows = (await fetchJson(api)) as string[][] | null;
    const seen = new Map<string, SitePage>();
    (rows || []).slice(1).forEach(([o, ts]) => {
      const p = pathOf(o);
      if (!seen.has(p)) seen.set(p, { path: p, ts });
    });
    list = [...seen.values()];
    if (!list.length) throw new Error('empty');
  } catch {
    await wait(700);
    list = samplePages(host, year);
    source = 'sample';
  }
  list.sort((a, b) => a.path.localeCompare(b.path));
  const res = { source, pages: list };
  if (source === 'live') pageCache.set(key, res);
  return res;
}

export function downloadCsv(name: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
