import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ago, fmt, fmtShort, frameUrl, MONTHS, MONTHS_SHORT, plural, type SitePage, type Snap } from '../lib/backspace';
import { LoaderBar } from './common';

// Tracks whether an iframe has finished loading its current src. State lives in the
// component that mounts the iframe, so remounting (switching tab or compare mode)
// shows the loading veil again. Old copies can hang, so give up after 25s.
function useFrameLoad(src: string): [boolean, () => void] {
  const [done, setDone] = useState<string | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setDone(src), 25000);
    return () => clearTimeout(t);
  }, [src]);
  return [done !== src, () => setDone(src)];
}

export function PageView({ url, cur }: { url: string; cur: Snap }) {
  const src = frameUrl(url, cur.ts);
  const [loading, onLoad] = useFrameLoad(src);
  return (
    <div className="browser">
      <div className="browser-bar">
        <div className="browser-dots"><span /><span /><span /></div>
        <div className="browser-url">{url}</div>
        <span className="date-pill">{fmtShort(cur.ts)}</span>
      </div>
      <div className="frame-wrap">
        <iframe src={src} onLoad={onLoad} title="Saved copy" />
        {loading && (
          <div className="frame-veil">
            <div className="frame-veil-title">Opening the {fmt(cur.ts)} copy</div>
            <div className="frame-veil-sub">Old pages can be slow to open. On very old copies, some pictures or links might be missing.</div>
            <LoaderBar size="md" />
          </div>
        )}
      </div>
    </div>
  );
}

interface CompareProps {
  url: string;
  snaps: Snap[];
  idx: number;
  cmpIdx: number;
  mode: 'side' | 'swipe';
  onPickA: (i: number) => void;
  onPickB: (i: number) => void;
  onSwap: () => void;
}

function DateSelect({ snaps, value, onChange, label }: { snaps: Snap[]; value: number; onChange: (i: number) => void; label: string }) {
  return (
    <select value={String(value)} onChange={(e) => onChange(+e.target.value)} aria-label={label}>
      {snaps.map((sn) => (
        <option key={sn.i} value={String(sn.i)}>{fmtShort(sn.ts) + (sn.changed ? ' ·' : '')}</option>
      ))}
    </select>
  );
}

function ComparePane({ side, src, title, short, children }: { side: 'a' | 'b'; src: string; title: string; short: string; children: ReactNode }) {
  const [loading, onLoad] = useFrameLoad(src);
  return (
    <div className={`cmp-pane cmp-pane--${side}`}>
      <div className="cmp-pane-bar">{children}</div>
      <div className="frame-wrap">
        <iframe src={src} onLoad={onLoad} title={title} />
        {loading && (
          <div className="frame-veil frame-veil--small">
            Opening {short}
            <LoaderBar size="sm" />
          </div>
        )}
      </div>
    </div>
  );
}

function SwipeView({ url, a, b }: { url: string; a: Snap; b: Snap }) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [split, setSplit] = useState(50);
  const srcA = frameUrl(url, a.ts);
  const srcB = frameUrl(url, b.ts);
  const [aLoading, onALoad] = useFrameLoad(srcA);
  const [bLoading, onBLoad] = useFrameLoad(srcB);

  const move = (x: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setSplit(Math.max(2, Math.min(98, ((x - r.left) / r.width) * 100)));
  };

  return (
    <div className="swipe" ref={ref}>
      <iframe src={srcB} onLoad={onBLoad} title="Copy B" />
      <iframe src={srcA} onLoad={onALoad} title="Copy A" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }} />
      <div className="swipe-line" style={{ left: `${split}%` }} />
      <div className="swipe-handle" style={{ left: `${split}%` }}>◀ Drag ▶</div>
      <div className="swipe-tag swipe-tag--a">A · {fmtShort(a.ts)}</div>
      <div className="swipe-tag swipe-tag--b">B · {fmtShort(b.ts)}</div>
      <div
        className="swipe-hit"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          dragging.current = true;
          move(e.clientX);
        }}
        onPointerMove={(e) => dragging.current && move(e.clientX)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
      />
      {(aLoading || bLoading) && (
        <div className="frame-veil frame-veil--small">
          Opening both copies
          <LoaderBar size="sm" />
        </div>
      )}
    </div>
  );
}

export function CompareView({ url, snaps, idx, cmpIdx, mode, onPickA, onPickB, onSwap }: CompareProps) {
  const a = snaps[idx];
  const b = snaps[cmpIdx];
  if (mode === 'swipe') return <SwipeView url={url} a={a} b={b} />;
  return (
    <div className="cmp-grid">
      <ComparePane side="a" src={frameUrl(url, a.ts)} title="Copy A" short={fmtShort(a.ts)}>
        <span className="tag">A</span>
        <DateSelect snaps={snaps} value={idx} onChange={onPickA} label="Date for copy A" />
        <span>{ago(a.ts)}</span>
        <div className="spacer" />
        <span>Timeline below moves this side</span>
      </ComparePane>
      <ComparePane side="b" src={frameUrl(url, b.ts)} title="Copy B" short={fmtShort(b.ts)}>
        <span className="tag">B</span>
        <DateSelect snaps={snaps} value={cmpIdx} onChange={onPickB} label="Date for copy B" />
        <span>{ago(b.ts)}</span>
        <div className="spacer" />
        <button type="button" onClick={() => onPickB(Math.max(0, idx - 1))}>Copy before A</button>
        <button type="button" onClick={() => onPickB(snaps.length - 1)}>Newest</button>
        <button type="button" onClick={onSwap} title="Swap sides" aria-label="Swap sides">⇄</button>
      </ComparePane>
    </div>
  );
}

interface PagesProps {
  years: number[];
  year: number | null;
  month: number | null;
  onMonth: (m: number | null) => void;
  pages: SitePage[];
  loading: boolean;
  filter: string;
  setFilter: (v: string) => void;
  onYear: (y: number) => void;
  onView: (path: string) => void;
  onExport: (rows: SitePage[]) => void;
}

const MAIN = 'Main pages';
const SECTIONS_SHOWN = 10;

// "/blog/2009/launch" -> "/blog"; one-level pages like "/about" are main pages.
const sectionOf = (path: string) => (path === '/' || path.split('/').length < 3 ? MAIN : '/' + path.split('/')[1]);
// "/blog/2009/launch" -> "/blog/2009"; null when there is no deeper level.
const subOf = (path: string) => {
  const parts = path.split('/');
  return parts.length >= 4 ? `/${parts[1]}/${parts[2]}` : null;
};

function countBy<T>(items: T[], key: (t: T) => string | null) {
  const m = new Map<string, number>();
  items.forEach((t) => {
    const k = key(t);
    if (k) m.set(k, (m.get(k) || 0) + 1);
  });
  return m;
}

export function PagesView({ years, year, month, onMonth, pages, loading, filter, setFilter, onYear, onView, onExport }: PagesProps) {
  const [section, setSection] = useState<string | null>(null);
  const [sub, setSub] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Sections come from the pages the site actually had that year, biggest first.
  const sections = useMemo(() => {
    const counts = [...countBy(pages, (p) => sectionOf(p.path)).entries()];
    return counts.sort((a, b) => (a[0] === MAIN ? -1 : b[0] === MAIN ? 1 : b[1] - a[1] || a[0].localeCompare(b[0])));
  }, [pages]);

  // A picked section may not exist in another year; treat it as cleared.
  const activeSection = section && sections.some(([name]) => name === section) ? section : null;
  const inSection = useMemo(() => (activeSection ? pages.filter((p) => sectionOf(p.path) === activeSection) : pages), [pages, activeSection]);

  const subs = useMemo(() => {
    if (!activeSection || activeSection === MAIN) return [];
    const counts = [...countBy(inSection, (p) => subOf(p.path)).entries()];
    return counts.length > 1 ? counts.sort((a, b) => a[0].localeCompare(b[0])) : [];
  }, [inSection, activeSection]);
  const activeSub = sub && subs.some(([name]) => name === sub) ? sub : null;

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return inSection.filter((p) => (!activeSub || p.path.startsWith(activeSub + '/')) && (!q || p.path.toLowerCase().includes(q)));
  }, [inSection, activeSub, filter]);

  const groups = useMemo(() => {
    const gmap = new Map<string, SitePage[]>();
    filtered.forEach((p) => {
      const seg = sectionOf(p.path);
      if (!gmap.has(seg)) gmap.set(seg, []);
      gmap.get(seg)!.push(p);
    });
    return [...gmap.entries()].sort((a, b) => (a[0] === MAIN ? -1 : b[0] === MAIN ? 1 : b[1].length - a[1].length));
  }, [filtered]);

  const pickSection = (name: string | null) => {
    setSection(name === activeSection ? null : name);
    setSub(null);
  };
  const clearAll = () => {
    setSection(null);
    setSub(null);
    setFilter('');
  };
  const anyFilter = !!(activeSection || filter.trim());
  const shown = showAll ? [...sections] : sections.slice(0, SECTIONS_SHOWN);
  // Keep the picked section visible even when it's past the fold.
  if (activeSection && !shown.some(([n]) => n === activeSection)) shown.push(sections.find(([n]) => n === activeSection)!);

  const now = new Date();
  const isFuture = (m: number) => year === now.getFullYear() && m > now.getMonth() + 1;
  const when = month && year ? `${MONTHS[month - 1]} ${year}` : String(year ?? '');

  return (
    <div className="panel">
      <div className="pages-years">
        <span>Year</span>
        <div className="year-chips">
          {years.map((y) => (
            <button type="button" key={y} className={y === year ? 'year-chip on' : 'year-chip'} aria-pressed={y === year} onClick={() => onYear(y)}>{y}</button>
          ))}
        </div>
      </div>
      <div className="pages-months">
        <span>Month</span>
        <div className="year-chips">
          <button type="button" className={month == null ? 'year-chip on' : 'year-chip'} aria-pressed={month == null} onClick={() => onMonth(null)}>Whole year</button>
          {MONTHS_SHORT.map((label, i) => (
            <button
              type="button"
              key={label}
              className={month === i + 1 ? 'year-chip on' : 'year-chip'}
              aria-pressed={month === i + 1}
              aria-label={MONTHS[i]}
              disabled={isFuture(i + 1)}
              onClick={() => onMonth(month === i + 1 ? null : i + 1)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {!loading && pages.length > 0 && (
        <div className="sections">
          <div className="sections-row">
            <span className="sections-label">Sections</span>
            <button type="button" className={!activeSection ? 'section-chip on' : 'section-chip'} aria-pressed={!activeSection} onClick={() => pickSection(null)}>
              All <i>{pages.length}</i>
            </button>
            {shown.map(([name, count]) => (
              <button type="button" key={name} className={name === activeSection ? 'section-chip on' : 'section-chip'} aria-pressed={name === activeSection} onClick={() => pickSection(name)}>
                {name} <i>{count}</i>
              </button>
            ))}
            {sections.length > SECTIONS_SHOWN && (
              <button type="button" className="section-more" onClick={() => setShowAll(!showAll)}>
                {showAll ? 'Show fewer' : `+${sections.length - SECTIONS_SHOWN} more`}
              </button>
            )}
          </div>
          {subs.length > 0 && (
            <div className="sections-row sections-row--sub">
              <span className="sections-label">Inside {activeSection}</span>
              {subs.map(([name, count]) => (
                <button type="button" key={name} className={name === activeSub ? 'section-chip on' : 'section-chip'} aria-pressed={name === activeSub} onClick={() => setSub(name === activeSub ? null : name)}>
                  {name.slice(activeSection!.length)} <i>{count}</i>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="pages-tools">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={activeSection && activeSection !== MAIN ? `Search inside ${activeSection}` : 'Search pages, like /blog or pricing'}
          aria-label="Search pages"
          list="bs-page-suggestions"
          type="search"
        />
        <datalist id="bs-page-suggestions">
          {inSection.slice(0, 300).map((p) => <option key={p.path} value={p.path} />)}
        </datalist>
        <span className="count">{plural(filtered.length, 'page', 'pages')}</span>
        {anyFilter && <button type="button" className="clear-filters" onClick={clearAll}>Clear filters</button>}
        <div className="spacer" />
        <button type="button" className="btn-csv" onClick={() => onExport(filtered)}>Download as spreadsheet (CSV)</button>
      </div>
      <div className="pages-list">
        {loading ? (
          <div className="pages-msg">
            <b>Finding every page saved in {when}</b>
            <LoaderBar size="md" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="pages-msg">
            {anyFilter ? (
              <>
                No pages match that{activeSection ? ` in ${activeSection}` : ''}. Try a shorter word, or pick another year.
                <button type="button" className="clear-filters" onClick={clearAll}>Clear filters</button>
              </>
            ) : (
              month ? `No pages were saved in ${when}. Try the whole year, or another month.` : 'No pages were saved that year. Pick another year.'
            )}
          </div>
        ) : (
          groups.map(([name, list]) => (
            <div className="pages-group" key={name}>
              <div className="pages-group-head"><b>{name}</b><span>{plural(list.length, 'page', 'pages')}</span></div>
              {list.slice(0, 80).map((p) => (
                <div className="pages-row" key={p.path}>
                  <span className="path" title={p.path}>{p.path}</span>
                  <span className="first">first saved {fmtShort(p.ts)}</span>
                  <button type="button" className="btn-ghost" onClick={() => onView(p.path)}>View history</button>
                </div>
              ))}
              {list.length > 80 && (
                <div className="pages-more">
                  {plural(list.length - 80, 'more page', 'more pages')} in {name}.{' '}
                  {name !== activeSection ? (
                    <button type="button" onClick={() => pickSection(name)}>Show only {name}</button>
                  ) : (
                    'Search above to narrow them down, or download the full list.'
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function ChangesView({ snaps, onView, onCompare }: { snaps: Snap[]; onView: (i: number) => void; onCompare: (i: number) => void }) {
  const changed = snaps.filter((x) => x.changed);
  const unchanged = snaps.length - changed.length;
  return (
    <div className="changes">
      <div className="changes-note">
        {plural(unchanged, 'copy', 'copies')} where nothing changed are hidden from this list. Each row is a date the page looked different from the copy before it.
      </div>
      {changed.slice().reverse().map((sn) => {
        const prev = snaps[sn.i - 1];
        let size = 'The first copy we have';
        if (prev && prev.length && sn.length) {
          const pct = Math.round(((sn.length - prev.length) / prev.length) * 100);
          size = Math.abs(pct) < 3 ? 'About the same amount of content' : `About ${Math.abs(pct)}% ${pct > 0 ? 'more' : 'less'} content than before`;
        } else if (prev) size = 'Looked different from the copy before';
        return (
          <div className="change-row" key={sn.i}>
            <span className="change-dot" />
            <div className="change-main">
              <div className="change-date">{fmt(sn.ts)} <span>· {ago(sn.ts)}</span></div>
              <div className="change-size">{size}</div>
            </div>
            <button type="button" className="change-view" onClick={() => onView(sn.i)}>View</button>
            {prev && <button type="button" className="change-cmp" onClick={() => onCompare(sn.i)}>Compare with copy before</button>}
          </div>
        );
      })}
    </div>
  );
}
