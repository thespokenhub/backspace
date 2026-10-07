// Server-side pass-through to the Wayback CDX API. Browsers calling it directly
// can fail (CORS, slow responses), which silently dropped users onto sample data.

const UPSTREAM = 'https://web.archive.org/cdx/search/cdx';
const ALLOWED = new Set(['url', 'output', 'fl', 'filter', 'collapse', 'from', 'to', 'limit']);

export async function GET(request: Request): Promise<Response> {
  const incoming = new URL(request.url).searchParams;
  if (!incoming.get('url')) return new Response('Missing url', { status: 400 });

  const params = new URLSearchParams();
  for (const [k, v] of incoming) if (ALLOWED.has(k)) params.append(k, v);

  try {
    const r = await fetch(`${UPSTREAM}?${params}`, {
      headers: { 'User-Agent': 'Backspace (+https://github.com/thespokenhub/backspace)' },
      signal: AbortSignal.timeout(25000),
    });
    const body = await r.text();
    return new Response(body, {
      status: r.status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        // Snapshot lists change slowly; let Vercel's CDN keep them for a day.
        'Cache-Control': r.ok ? 'public, s-maxage=86400, stale-while-revalidate=604800' : 'no-store',
      },
    });
  } catch {
    return new Response('Upstream unavailable', { status: 504, headers: { 'Cache-Control': 'no-store' } });
  }
}
