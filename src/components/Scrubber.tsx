import { useEffect, useMemo, useRef, useState } from 'react';
import { fmtShort, frameUrl, type Snap } from '../lib/backspace';

interface Props {
  url: string;
  snaps: Snap[];
  idx: number;
  cmpIdx: number | null; // set when the Compare tab is showing copy B
  changesOnly: boolean;
  setChangesOnly: (v: boolean) => void;
  canOlder: boolean;
  canNewer: boolean;
  onStep: (d: -1 | 1) => void;
  onFirst: () => void;
  onLatest: () => void;
  onSelect: (i: number) => void;
  showLegend: boolean;
}

// The preview renders the real page at desktop size, shrunk into a small card.
const PREVIEW_W = 240;
const PREVIEW_H = 150;
const PAGE_W = 1280;
const PREVIEW_DELAY = 250; // wait for the pointer to settle before loading a page

function Preview({ url, snap }: { url: string; snap: Snap }) {
  const [loaded, setLoaded] = useState(false);
  const scale = PREVIEW_W / PAGE_W;
  return (
    <div className="scrub-preview" style={{ width: PREVIEW_W, height: PREVIEW_H }}>
      <iframe
        src={frameUrl(url, snap.ts)}
        title={`Preview of ${fmtShort(snap.ts)}`}
        tabIndex={-1}
        onLoad={() => setLoaded(true)}
        style={{ width: PAGE_W, height: PREVIEW_H / scale, transform: `scale(${scale})` }}
      />
      {!loaded && <div className="scrub-preview-wait">Loading preview…</div>}
    </div>
  );
}

export function Scrubber({ url, snaps, idx, cmpIdx, changesOnly, setChangesOnly, canOlder, canNewer, onStep, onFirst, onLatest, onSelect, showLegend }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [hover, setHover] = useState<number | null>(null);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);
  const n = snaps.length;

  // Only load a preview once the pointer rests on a bar for a moment.
  useEffect(() => {
    if (hover == null) {
      setPreviewIdx(null);
      return;
    }
    const t = setTimeout(() => setPreviewIdx(hover), PREVIEW_DELAY);
    return () => clearTimeout(t);
  }, [hover]);

  const idxFromX = (x: number) => {
    const el = trackRef.current;
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    return Math.floor(Math.min(0.9999, Math.max(0, (x - r.left - 6) / (r.width - 12))) * n);
  };

  const years = useMemo(() => {
    let out: { year: number; left: number }[] = [];
    let last: number | null = null;
    snaps.forEach((sn, i) => {
      if (sn.year !== last) {
        out.push({ year: sn.year, left: (i / Math.max(n, 1)) * 100 });
        last = sn.year;
      }
    });
    const every = out.length > 24 ? 4 : out.length > 12 ? 2 : 1;
    out = out.filter((y, i) => i === 0 || y.year % every === 0);
    for (let i = out.length - 1; i > 0; i--) if (out[i].left - out[i - 1].left < 5) out.splice(i, 1);
    return out;
  }, [snaps, n]);

  // First copy of each year, or its first change when skipping unchanged copies.
  const yearJumps = useMemo(() => {
    const map = new Map<number, number>();
    snaps.forEach((s) => {
      if (!map.has(s.year)) map.set(s.year, s.i);
    });
    if (changesOnly) {
      const firstChange = new Map<number, number>();
      snaps.forEach((s) => s.changed && !firstChange.has(s.year) && firstChange.set(s.year, s.i));
      firstChange.forEach((i, y) => map.set(y, i));
    }
    return [...map.entries()];
  }, [snaps, changesOnly]);

  const barColor = (sn: Snap, i: number) => {
    if (i === idx) return 'var(--accent)';
    if (cmpIdx != null && i === cmpIdx) return 'var(--blue)';
    if (i === hover) return 'var(--ink)';
    if (sn.changed) return 'var(--bar-changed)';
    return changesOnly ? '#e4e1d8' : 'var(--bar-same)';
  };

  const showI = hover ?? idx;
  const show = snaps[showI];
  const cur = snaps[idx];

  // Keep the tooltip card inside the track.
  const trackW = trackRef.current?.clientWidth ?? 0;
  const half = (previewIdx != null ? PREVIEW_W : 120) / 2 + 8;
  const tipX = Math.max(half, Math.min(trackW - half, ((showI + 0.5) / Math.max(n, 1)) * trackW));

  return (
    <div className="scrubber">
      <div className="scrub-controls">
        <button type="button" className="btn-step" onClick={onFirst} disabled={idx === 0} title="Jump to the oldest saved copy (Home key)">⇤ First version</button>
        <button type="button" className="btn-step" onClick={() => onStep(-1)} disabled={!canOlder}>← Older</button>
        <button type="button" className="btn-step" onClick={() => onStep(1)} disabled={!canNewer}>Newer →</button>
        <button type="button" className="btn-step" onClick={onLatest} disabled={idx === n - 1} title="Jump to the newest saved copy (End key)">Latest ⇥</button>
        <label className="skip-toggle">
          <input type="checkbox" checked={changesOnly} onChange={() => setChangesOnly(!changesOnly)} />
          Skip copies where nothing changed
        </label>
        <div className="spacer" />
        {showLegend && (
          <div className="legend">
            <span><i />Tall bar: page changed</span>
            <span><i className="same" />Short bar: looked the same</span>
            <span><i className="here" />You are here</span>
            {cmpIdx != null && <span><i className="b" />Copy B</span>}
          </div>
        )}
      </div>
      <div className="year-jumps" data-tour="years">
        <span>Jump to</span>
        {yearJumps.map(([year, i]) => (
          <button type="button" key={year} className={cur?.year === year ? 'on' : ''} aria-pressed={cur?.year === year} onClick={() => onSelect(i)}>
            {year}
          </button>
        ))}
      </div>
      <div className="scrub-track-wrap" data-tour="timeline">
        {hover != null && show && (
          <div className="scrub-tip" style={{ left: tipX }}>
            {previewIdx === hover && <Preview key={show.ts} url={url} snap={show} />}
            <div className="scrub-tip-date">{fmtShort(show.ts)}{show.changed ? ' · changed' : ''}</div>
          </div>
        )}
        <div
          ref={trackRef}
          className="scrub-track"
          role="slider"
          tabIndex={0}
          aria-label="Saved copies timeline"
          aria-valuemin={1}
          aria-valuemax={n}
          aria-valuenow={idx + 1}
          aria-valuetext={cur ? fmtShort(cur.ts) : undefined}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            dragging.current = true;
            setHover(idxFromX(e.clientX));
          }}
          onPointerMove={(e) => {
            const h = idxFromX(e.clientX);
            if (h !== hover) setHover(h);
          }}
          onPointerUp={(e) => {
            if (!dragging.current) return;
            dragging.current = false;
            onSelect(idxFromX(e.clientX));
            if (e.pointerType !== 'mouse') setHover(null);
          }}
          onPointerCancel={() => {
            dragging.current = false;
            setHover(null);
          }}
          onPointerLeave={() => {
            if (!dragging.current) setHover(null);
          }}
        >
          {snaps.map((sn, i) => (
            <div key={sn.i} className="scrub-bar" style={{ height: sn.changed ? '100%' : '34%', background: barColor(sn, i) }} />
          ))}
        </div>
        <div className="scrub-years">
          {years.map((y) => <span key={y.year} style={{ left: `${y.left}%` }}>{y.year}</span>)}
        </div>
      </div>
      <div className="scrub-range">
        {n ? `${n} saved copies, from ${snaps[0].year} to ${snaps[n - 1].year}` : ''}. Tip: ← → step through copies. Home and End jump to the first and latest.
      </div>
    </div>
  );
}
