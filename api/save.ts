// "Save a copy now": asks the Wayback Machine's Save Page Now service to capture a page.
//
// With ARCHIVE_ACCESS_KEY and ARCHIVE_SECRET_KEY set (free keys from
// https://archive.org/account/s3.php) it uses the Save Page Now 2 API, which returns a
// job the client polls. Without keys it falls back to the anonymous save URL, which is
// slower and more rate-limited.

const SAVE = 'https://web.archive.org/save';
const UA = 'Backspace (+https://github.com/thespokenhub/backspace)';

type Result = { status: 'saved' | 'pending' | 'error'; job?: string; message?: string };

const json = (body: Result, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

const auth = () => {
  const key = process.env.ARCHIVE_ACCESS_KEY;
  const secret = process.env.ARCHIVE_SECRET_KEY;
  return key && secret ? `LOW ${key}:${secret}` : null;
};

const validUrl = (u: unknown): u is string =>
  typeof u === 'string' && u.length < 2000 && /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(u);

export async function POST(request: Request): Promise<Response> {
  let url: unknown;
  try {
    url = (await request.json()).url;
  } catch {
    // fall through to validation
  }
  if (!validUrl(url)) return json({ status: 'error', message: "That doesn't look like a web address." }, 400);

  const authorization = auth();
  try {
    if (authorization) {
      const r = await fetch(SAVE, {
        method: 'POST',
        headers: { Accept: 'application/json', Authorization: authorization, 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
        body: new URLSearchParams({ url: `https://${url}` }),
        signal: AbortSignal.timeout(20000),
      });
      const data = (await r.json().catch(() => ({}))) as { job_id?: string; message?: string };
      if (data.job_id) return json({ status: 'pending', job: data.job_id });
      return json({ status: 'error', message: data.message || "Couldn't save it right now. Try again in a few minutes." });
    }

    const r = await fetch(`${SAVE}/https://${url}`, { headers: { 'User-Agent': UA }, redirect: 'manual', signal: AbortSignal.timeout(55000) });
    if (r.ok || (r.status >= 300 && r.status < 400)) return json({ status: 'saved' });
    if (r.status === 429) return json({ status: 'error', message: 'Too many saves right now. Try again in a few minutes.' });
    return json({ status: 'error', message: "Couldn't save it right now. Try again in a few minutes." });
  } catch {
    return json({ status: 'error', message: "It's taking longer than usual. Check back later." });
  }
}

export async function GET(request: Request): Promise<Response> {
  const job = new URL(request.url).searchParams.get('job');
  const authorization = auth();
  if (!job || !/^[\w-]+$/.test(job) || !authorization) return json({ status: 'error' }, 400);
  try {
    const r = await fetch(`${SAVE}/status/${job}`, {
      headers: { Accept: 'application/json', Authorization: authorization, 'User-Agent': UA },
      signal: AbortSignal.timeout(15000),
    });
    const data = (await r.json()) as { status?: string; message?: string };
    if (data.status === 'success') return json({ status: 'saved' });
    if (data.status === 'pending') return json({ status: 'pending', job });
    return json({ status: 'error', message: data.message || "Couldn't save it this time." });
  } catch {
    return json({ status: 'pending', job }); // transient; the client keeps polling until it gives up
  }
}
