// Server-side pass-through to the Wayback CDX API. Browsers calling it directly
// can fail (CORS, slow responses), which silently dropped users onto sample data.
//
// Tries the CDX endpoint, then the timemap endpoint (same index, used by the Wayback
// site itself), retrying once on throttling. Failures return JSON describing every
// attempt, and successes carry an X-Backspace-Upstream header, so problems can be
// diagnosed by opening /api/cdx?url=example.com&limit=5 in a browser.

const UPSTREAMS = ['https://web.archive.org/cdx/search/cdx', 'https://web.archive.org/web/timemap/json'];
const ALLOWED = new Set(['url', 'output', 'fl', 'filter', 'collapse', 'from', 'to', 'limit']);
const UA = 'Backspace/1.0 (+https://github.com/thespokenhub/backspace)';
const PER_TRY_MS = 25000; // two endpoints x 25s stays inside the 60s maxDuration

export async function GET(request: Request): Promise<Response> {
  const incoming = new URL(request.url).searchParams;
  if (!incoming.get('url')) return new Response('Missing url', { status: 400 });

  const params = new URLSearchParams();
  for (const [k, v] of incoming) if (ALLOWED.has(k)) params.append(k, v);
  if (!params.has('output')) params.set('output', 'json');

  const attempts: string[] = [];
  for (const upstream of UPSTREAMS) {
    for (let tryNo = 0; tryNo < 2; tryNo++) {
      const started = Date.now();
      try {
        const r = await fetch(`${upstream}?${params}`, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(PER_TRY_MS) });
        const body = await r.text();
        const note = `${upstream.split('/').slice(3).join('/')} ${r.status} ${Date.now() - started}ms`;
        if (r.ok && (body.trim() === '' || body.trimStart().startsWith('['))) {
          return new Response(body.trim() === '' ? '[]' : body, {
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
              'X-Backspace-Upstream': note,
            },
          });
        }
        attempts.push(`${note}: ${body.slice(0, 160).replace(/\s+/g, ' ')}`);
        if (r.status !== 429 && r.status < 500) break; // not worth retrying this endpoint
        await new Promise((res) => setTimeout(res, 800));
      } catch (e) {
        attempts.push(`${upstream.split('/').slice(3).join('/')} failed after ${Date.now() - started}ms: ${(e as Error).name} ${(e as Error).message}`);
        break; // a timeout will just time out again
      }
    }
  }
  return new Response(JSON.stringify({ error: 'Upstream unavailable', attempts }, null, 2), {
    status: 502,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
