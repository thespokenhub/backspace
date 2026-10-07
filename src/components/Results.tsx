import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ago, downloadCsv, fetchPages, fmt, hostOf, normalize, plural, type SitePage, type Snap, type SnapResult } from '../lib/backspace';
import { TABS, type StartAt, type TabId } from '../lib/cases';
import { dayOf, nearestIdx, type SiteRoute } from '../lib/router';
import { Logo } from './common';
import { SaveNow } from './SaveNow';
import { ShareButton } from './ShareButton';
import { Tour, tourSeen } from './Tour';
import { Scrubber } from './Scrubber';
import { ChangesView, CompareView, PagesView, PageView } from './tabs';

interface Props {
  url: string;
  snaps: Snap[];
  source: SnapResult['source'];
  initial: SiteRoute;
  startAt: StartAt;
  showLegend: boolean;
  onHome: () => void;
  onSearch: (raw: string, tab: TabId) => void;
  onRetry: () => void;
  onRouteChange: (r: SiteRoute) => void;
}

// Nearest copy in direction d that changed, stopping at either end.
function findChange(snaps: Snap[], i: number, d: number) {
  let j = i + d;
  while (j > 0 && j < snaps.length - 1 && !snaps[j].changed) j += d;
  return Math.max(0, Math.min(snaps.length - 1, j));
}

// Next copy in direction d, honoring "skip copies where nothing changed". -1 if none.
function stepTarget(snaps: Snap[], idx: number, d: number, changesOnly: boolean) {
  let i = idx + d;
  if (changesOnly) while (i >= 0 && i < snaps.length && !snaps[i].changed) i += d;
  return i < 0 || i >= snaps.length ? -1 : i;
}

export function Results({ url, snaps, source, initial, startAt, showLegend, onHome, onSearch, onRetry, onRouteChange }: Props) {
  const n = snaps.length;
  const yearList = useMemo(() => [...new Set(snaps.map((s) => s.year))], [snaps]);
  const [input, setInput] = useState(url);
  const [invalid, setInvalid] = useState(false);
  const [tab, setTabState] = useState<TabId>(initial.view);
  const [idx, setIdx] = useState(() => {
    if (initial.date) return nearestIdx(snaps, initial.date);
    const start = startAt === 'oldest' ? 0 : n - 1;
    // Compare opens on the last change before the newest copy, so A and B differ.
    return initial.view === 'compare' && start === n - 1 ? findChange(snaps, start, -1) : start;
  });
  const [cmpIdx, setCmpIdx] = useState<number | null>(() => (initial.vs ? nearestIdx(snaps, initial.vs) : null));
  const [touring, setTouring] = useState(false);
  const [cmpMode, setCmpMode] = useState<'side' | 'swipe'>('side');
  const [changesOnly, setChangesOnly] = useState(false);
  const [pagesYear, setPagesYear] = useState<number | null>(null);
  const [pages, setPages] = useState<SitePage[]>([]);
  const [pagesSample, setPagesSample] = useState(false);
  const [pagesLoading, setPagesLoading] = useState(false);
  const [pageFilter, setPageFilter] = useState('');

  const cur = snaps[idx];
  const cmpI = cmpIdx ?? n - 1;
  const cmp = snaps[cmpI];
  const host = hostOf(url);

  const wantedYear = useRef<number | null>(null);
  const loadPages = useCallback(
    async (year: number) => {
      wantedYear.current = year;
      setPagesYear(year);
      setPagesLoading(true);
      const res = await fetchPages(url, year);
      if (wantedYear.current !== year) return; // a different year was picked meanwhile
      setPages(res.pages);
      setPagesSample(res.source === 'sample');
      setPagesLoading(false);
    },
    [url],
  );

  const setTab = (t: TabId) => {
    if (t === 'compare' && idx === n - 1 && cmpIdx == null) setIdx(findChange(snaps, idx, -1));
    setTabState(t);
  };

  // All pages opens on the year from the link, else the year of the copy you were looking at.
  const linkYear = useRef(initial.year);
  useEffect(() => {
    if (tab !== 'pages' || pagesYear != null) return;
    loadPages(linkYear.current && yearList.includes(linkYear.current) ? linkYear.current : cur.year);
    linkYear.current = undefined;
  }, [tab, pagesYear, cur.year, loadPages, yearList]);

  // Keep the address bar in step, so any screen can be shared or bookmarked.
  useEffect(() => {
    onRouteChange({ kind: 'site', url, view: tab, date: dayOf(cur), vs: tab === 'compare' ? dayOf(cmp) : undefined, year: pagesYear ?? undefined });
    document.title =
      tab === 'page' ? `${url} on ${fmt(cur.ts)} · Backspace`
      : tab === 'compare' ? `${url}: ${fmt(cur.ts)} vs ${fmt(cmp.ts)} · Backspace`
      : tab === 'pages' ? `Every page on ${host}${pagesYear ? ` in ${pagesYear}` : ''} · Backspace`
      : `Every change to ${url} · Backspace`;
  }, [url, host, tab, cur, cmp, pagesYear, onRouteChange]);

  // First visit: walk through the screen once.
  useEffect(() => {
    if (tourSeen() || (tab !== 'page' && tab !== 'compare')) return;
    const t = setTimeout(() => setTouring(true), 700);
    return () => clearTimeout(t);
  }, []);

  const step = useCallback(
    (d: -1 | 1) => {
      const i = stepTarget(snaps, idx, d, changesOnly);
      if (i >= 0) setIdx(i);
    },
    [snaps, idx, changesOnly],
  );

  useEffect(() => {
    if (touring || (tab !== 'page' && tab !== 'compare')) return;
    const onKey = (e: KeyboardEvent) => {
      const t = (e.target as HTMLElement).tagName;
      if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT' || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
        e.preventDefault();
        step(-1);
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        step(1);
      }
      if (e.key === 'Home') {
        e.preventDefault();
        setIdx(0);
      }
      if (e.key === 'End') {
        e.preventDefault();
        setIdx(n - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tab, step, n, touring]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!normalize(input)) {
      setInvalid(true);
      return;
    }
    onSearch(input, tab);
  };

  const changeCount = useMemo(() => snaps.filter((s) => s.changed).length, [snaps]);

  const lo = Math.min(idx, cmpI);
  const hi = Math.max(idx, cmpI);
  const between = snaps.slice(lo + 1, hi + 1).filter((x) => x.changed).length;
  const betweenText = idx === cmpI ? 'Pick two different dates to compare.' : between === 0 ? 'Nothing changed between these two copies.' : `The page changed ${plural(between, 'time', 'times')} between them.`;
  const changeNote = cur.i === 0 ? 'This is the oldest copy there is.' : cur.changed ? 'The page looked different from the copy before it.' : 'It looked the same as the copy before it.';

  return (
    <div className="results">
      <header className="r-header">
        <Logo small onClick={onHome} />
        <form className="r-search" onSubmit={submit} style={invalid ? { borderColor: 'var(--error)' } : undefined}>
          <input
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setInvalid(false);
            }}
            aria-label="Website address"
            aria-invalid={invalid}
            list={pages.length ? 'bs-site-pages' : undefined}
            title={invalid ? "That doesn't look like a web address. Try something like apple.com" : undefined}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <button type="submit">Search</button>
          {pages.length > 0 && (
            <datalist id="bs-site-pages">
              {pages.slice(0, 300).map((p) => <option key={p.path} value={host + (p.path === '/' ? '' : p.path)} />)}
            </datalist>
          )}
        </form>
        <div className="spacer" />
        <ShareButton />
        <button
          type="button"
          className="help-btn"
          aria-label="Show me how this screen works"
          title="Show me how this screen works"
          onClick={() => {
            if (tab !== 'page' && tab !== 'compare') setTab('page');
            setTouring(true);
          }}
        >
          ?
        </button>
        <div className="seg" role="tablist" data-tour="tabs">
          {TABS.map(([id, label]) => (
            <button type="button" role="tab" aria-selected={tab === id} key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>
      </header>

      <div className="r-banner" data-tour="banner">
        {tab === 'page' && (
          <>
            <div style={{ maxWidth: 800 }}>
              <div className="r-banner-title">
                You're looking at <span className="url">{url}</span> as it looked on <span className="a">{fmt(cur.ts)}</span>.
              </div>
              <div className="r-banner-sub">That's {ago(cur.ts)}. {changeNote}</div>
            </div>
            <div className="r-banner-side">
              <SaveNow url={url} variant="small" />
              <div className="r-position">Copy {idx + 1} of {n}</div>
            </div>
          </>
        )}
        {tab === 'compare' && (
          <>
            <div style={{ maxWidth: 860 }}>
              <div className="r-banner-title">
                <span className="a">{fmt(cur.ts)}</span> next to <span className="b">{fmt(cmp.ts)}</span>.
              </div>
              <div className="r-banner-sub">Two copies of {url}. {betweenText}</div>
            </div>
            <div className="seg seg--small">
              <button type="button" className={cmpMode === 'side' ? 'on' : ''} onClick={() => setCmpMode('side')}>Side by side</button>
              <button type="button" className={cmpMode === 'swipe' ? 'on' : ''} onClick={() => setCmpMode('swipe')}>Swipe</button>
            </div>
          </>
        )}
        {tab === 'pages' && <div className="r-banner-title">These are the pages on {host} that were saved in {pagesYear ?? cur.year}.</div>}
        {tab === 'changes' && <div className="r-banner-title">{url} changed {plural(changeCount, 'time', 'times')}. Here's each one, newest first.</div>}
      </div>

      {(source === 'sample' || (tab === 'pages' && pagesSample && !pagesLoading)) && (
        <div className="notice" role="status">
          <span>We couldn't load the real history of {host} just now, so you're seeing example {tab === 'pages' ? 'pages' : 'dates'}.</span>
          <button type="button" onClick={onRetry}>Try again</button>
        </div>
      )}

      <div className="r-body">
        {tab === 'page' && <PageView url={url} cur={cur} />}
        {tab === 'compare' && (
          <CompareView
            url={url}
            snaps={snaps}
            idx={idx}
            cmpIdx={cmpI}
            mode={cmpMode}
            onPickA={setIdx}
            onPickB={setCmpIdx}
            onSwap={() => {
              setIdx(cmpI);
              setCmpIdx(idx);
            }}
          />
        )}
        {tab === 'pages' && (
          <PagesView
            years={yearList}
            year={pagesYear}
            pages={pages}
            loading={pagesLoading}
            filter={pageFilter}
            setFilter={setPageFilter}
            onYear={loadPages}
            onView={(path) => onSearch(host + (path === '/' ? '' : path), 'page')}
            onExport={(rows) => downloadCsv(`${host}-pages-${pagesYear}.csv`, [['url', 'first saved'], ...rows.map((p) => [host + p.path, fmt(p.ts)])])}
          />
        )}
        {tab === 'changes' && (
          <ChangesView
            snaps={snaps}
            onView={(i) => {
              setIdx(i);
              setTabState('page');
            }}
            onCompare={(i) => {
              setIdx(i);
              setCmpIdx(Math.max(0, i - 1));
              setCmpMode('side');
              setTabState('compare');
            }}
          />
        )}
      </div>

      {tab === 'page' || tab === 'compare' ? (
        <Scrubber
          url={url}
          snaps={snaps}
          idx={idx}
          cmpIdx={tab === 'compare' ? cmpI : null}
          changesOnly={changesOnly}
          setChangesOnly={setChangesOnly}
          canOlder={stepTarget(snaps, idx, -1, changesOnly) >= 0}
          canNewer={stepTarget(snaps, idx, 1, changesOnly) >= 0}
          onStep={step}
          onFirst={() => setIdx(0)}
          onLatest={() => setIdx(n - 1)}
          onSelect={setIdx}
          showLegend={showLegend}
        />
      ) : (
        <div className="scrub-gap" />
      )}

      {touring && <Tour compare={tab === 'compare'} onDone={() => setTouring(false)} />}
    </div>
  );
}
