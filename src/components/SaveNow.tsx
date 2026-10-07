import { useEffect, useRef, useState } from 'react';

type Status = 'idle' | 'saving' | 'saved' | 'error';

interface SaveResponse {
  status: 'saved' | 'pending' | 'error';
  job?: string;
  message?: string;
}

const POLL_MS = 4000;
const GIVE_UP_MS = 120000;

// Asks for a fresh copy of the page to be saved today (api/save.ts).
export function SaveNow({ url, variant }: { url: string; variant: 'big' | 'small' }) {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const finish = (r: SaveResponse) => {
    if (!alive.current) return;
    if (r.status === 'saved') setStatus('saved');
    else {
      setStatus('error');
      setMessage(r.message || "Couldn't save it right now. Try again in a few minutes.");
    }
  };

  const poll = async (job: string, startedAt: number) => {
    while (alive.current && Date.now() - startedAt < GIVE_UP_MS) {
      await new Promise((r) => setTimeout(r, POLL_MS));
      try {
        const r: SaveResponse = await (await fetch(`/api/save?job=${encodeURIComponent(job)}`)).json();
        if (r.status !== 'pending') return finish(r);
      } catch {
        // network blip, keep polling
      }
    }
    finish({ status: 'error', message: "It's taking longer than usual. Check back later." });
  };

  const save = async () => {
    setStatus('saving');
    setMessage('');
    try {
      const res = await fetch('/api/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
      const r: SaveResponse = await res.json();
      if (r.status === 'pending' && r.job) return poll(r.job, Date.now());
      finish(r);
    } catch {
      finish({ status: 'error' });
    }
  };

  const label =
    status === 'saving' ? 'Saving a copy… this can take a minute'
    : status === 'saved' ? '✓ Saved. New copies can take a few hours to show up here.'
    : status === 'error' ? message
    : variant === 'big' ? `Save a copy of ${url} now` : "Save today's version";

  if (status === 'saved' || status === 'error') {
    return (
      <span className={`save-note save-note--${status}`} role="status">
        {label}
        {status === 'error' && <button type="button" onClick={save}>Try again</button>}
      </span>
    );
  }
  return (
    <button type="button" className={variant === 'big' ? 'btn-outline' : 'save-btn'} onClick={save} disabled={status === 'saving'}>
      {label}
    </button>
  );
}
