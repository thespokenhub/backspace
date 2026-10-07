// URL <-> app state. Every screen has a shareable address:
//   /                                   home
//   /for/copywriters                    use case page
//   /apple.com                          newest copy of apple.com
//   /apple.com/mac?date=2007-06-12      a page on a date
//   /apple.com?view=compare&date=2009-03-01&vs=2026-09-01
//   /apple.com?view=pages&year=2009
//   /apple.com?view=changes

import { normalize, type Snap } from './backspace';
import type { CaseId, StartAt, TabId } from './cases';

export interface SiteRoute {
  kind: 'site';
  url: string;
  view: TabId;
  date?: string; // YYYYMMDD of copy A
  vs?: string; // YYYYMMDD of copy B (compare)
  year?: number; // All pages year
  start?: StartAt; // not serialized: where to land when no date is given
}

export type Route = { kind: 'home' } | { kind: 'usecase'; id: CaseId } | SiteRoute;

const CASE_SLUGS: Record<CaseId, string> = { copy: 'copywriters', seo: 'seo', dev: 'developers', all: 'everyone' };
const VIEWS: TabId[] = ['page', 'compare', 'pages', 'changes'];

const toDay = (s: string | null) => {
  const m = s && /^(\d{4})-?(\d{2})-?(\d{2})$/.exec(s);
  return m ? m[1] + m[2] + m[3] : undefined;
};
const fromDay = (d: string) => `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;

export function parseRoute(loc: { pathname: string; search: string }): Route {
  let path = loc.pathname;
  try {
    path = decodeURIComponent(path);
  } catch {
    // keep the raw path
  }
  path = path.replace(/^\/+|\/+$/g, '');
  if (!path) return { kind: 'home' };
  const caseMatch = /^for\/([a-z-]+)$/.exec(path);
  if (caseMatch) {
    const id = (Object.keys(CASE_SLUGS) as CaseId[]).find((k) => CASE_SLUGS[k] === caseMatch[1]);
    return id ? { kind: 'usecase', id } : { kind: 'home' };
  }
  const url = normalize(path);
  if (!url) return { kind: 'home' };
  const q = new URLSearchParams(loc.search);
  const view = VIEWS.includes(q.get('view') as TabId) ? (q.get('view') as TabId) : 'page';
  const year = Number(q.get('year')) || undefined;
  return { kind: 'site', url, view, date: toDay(q.get('date')), vs: toDay(q.get('vs')), year };
}

export function routeToPath(r: Route): string {
  if (r.kind === 'home') return '/';
  if (r.kind === 'usecase') return `/for/${CASE_SLUGS[r.id]}`;
  const q = new URLSearchParams();
  if (r.view !== 'page') q.set('view', r.view);
  if (r.date && (r.view === 'page' || r.view === 'compare')) q.set('date', fromDay(r.date));
  if (r.vs && r.view === 'compare') q.set('vs', fromDay(r.vs));
  if (r.year && r.view === 'pages') q.set('year', String(r.year));
  const qs = q.toString();
  return `/${r.url}${qs ? `?${qs}` : ''}`;
}

/** Index of the copy closest to a YYYYMMDD day. */
export function nearestIdx(snaps: Snap[], day: string): number {
  const target = Date.UTC(+day.slice(0, 4), +day.slice(4, 6) - 1, +day.slice(6, 8));
  let best = 0;
  let bestDist = Infinity;
  snaps.forEach((s, i) => {
    const dist = Math.abs(Date.UTC(s.year, s.month - 1, s.day) - target);
    if (dist < bestDist) {
      best = i;
      bestDist = dist;
    }
  });
  return best;
}

export const dayOf = (s: Snap) => s.ts.slice(0, 8);
