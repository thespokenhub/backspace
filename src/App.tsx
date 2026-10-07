import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchSnapshots, normalize, type Snap, type SnapResult } from './lib/backspace';
import { CASES, type CaseId, type StartAt, type TabId } from './lib/cases';
import { parseRoute, routeToPath, type Route, type SiteRoute } from './lib/router';
import { LoaderBar } from './components/common';
import { Home } from './components/Home';
import { Nav } from './components/Nav';
import { Results } from './components/Results';
import { SaveNow } from './components/SaveNow';
import { UseCasePage } from './components/UseCasePage';

type View = 'home' | 'usecase' | 'loading' | 'empty' | 'results';
type ScrollTarget = 'top' | 'features' | 'how' | 'try';

interface Props {
  /** Which copy a new search opens on when the link has no date. */
  startAt?: StartAt;
  /** Show the bar key next to the timeline. */
  showLegend?: boolean;
}

interface Search {
  id: number;
  url: string;
  snaps: Snap[];
  source: SnapResult['source'];
  route: SiteRoute;
  start: StartAt;
}

const BAD_ADDRESS = "That doesn't look like a web address. Try something like apple.com";
const TITLE = 'Backspace: see any website the way it used to look';

const here = () => window.location.pathname + window.location.search;

export default function App({ startAt = 'newest', showLegend = true }: Props) {
  const [view, setView] = useState<View>('home');
  const [caseId, setCaseId] = useState<CaseId>('copy');
  const [menuOpen, setMenuOpen] = useState(false);
  const [input, setInput] = useState('');
  const [intent, setIntent] = useState<TabId>('page');
  const [error, setError] = useState('');
  const [pendingUrl, setPendingUrl] = useState('');
  const [search, setSearch] = useState<Search | null>(null);
  const [scrollTarget, setScrollTarget] = useState<ScrollTarget | null>(null);
  const requestId = useRef(0);

  const heroInputRef = useRef<HTMLInputElement>(null);
  const featuresRef = useRef<HTMLElement>(null);
  const howRef = useRef<HTMLElement>(null);

  const load = useCallback(
    async (r: SiteRoute) => {
      const id = ++requestId.current;
      setPendingUrl(r.url);
      setInput(r.url);
      setView('loading');
      document.title = `${r.url} · Backspace`;
      window.scrollTo(0, 0);
      const res = await fetchSnapshots(r.url);
      if (requestId.current !== id) return; // superseded by a newer search
      if (!res.snaps.length) {
        setView('empty');
        return;
      }
      setSearch({ id, url: r.url, snaps: res.snaps, source: res.source, route: r, start: r.start ?? startAt });
      setView('results');
    },
    [startAt],
  );

  // Shows whatever a route describes, without touching history.
  const applyRoute = useCallback(
    (r: Route) => {
      setMenuOpen(false);
      setError('');
      if (r.kind === 'site') {
        load(r);
        return;
      }
      requestId.current++; // drop any search still loading
      document.title = r.kind === 'usecase' ? `For ${CASES[r.id].title.toLowerCase()} · Backspace` : TITLE;
      if (r.kind === 'usecase') {
        setCaseId(r.id);
        setView('usecase');
        window.scrollTo(0, 0);
      } else {
        setView('home');
      }
    },
    [load],
  );

  const navigate = useCallback(
    (r: Route) => {
      const path = routeToPath(r);
      if (path !== here()) window.history.pushState(null, '', path);
      applyRoute(r);
    },
    [applyRoute],
  );

  useEffect(() => {
    applyRoute(parseRoute(window.location));
    const onPop = () => applyRoute(parseRoute(window.location));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [applyRoute]);

  const go = (raw: string, view: TabId = 'page', start?: StartAt) => {
    const url = normalize(raw);
    if (!url) {
      setError(BAD_ADDRESS);
      return;
    }
    navigate({ kind: 'site', url, view, start });
  };

  const goHome = (target: ScrollTarget = 'top') => {
    navigate({ kind: 'home' });
    setScrollTarget(target);
  };

  const openCase = (id: CaseId) => navigate({ kind: 'usecase', id });

  // Runs after the home page has rendered, so the section refs exist.
  useEffect(() => {
    if (view !== 'home' || !scrollTarget) return;
    const raf = requestAnimationFrame(() => {
      if (scrollTarget === 'top') {
        window.scrollTo(0, 0);
      } else if (scrollTarget === 'try') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => heroInputRef.current?.focus({ preventScroll: true }), 300);
      } else {
        const el = (scrollTarget === 'features' ? featuresRef : howRef).current;
        if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 64, behavior: 'smooth' });
      }
      setScrollTarget(null);
    });
    return () => cancelAnimationFrame(raf);
  }, [view, scrollTarget]);

  const showNav = view === 'home' || view === 'usecase';

  return (
    <>
      {showNav && (
        <Nav
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          onHome={() => goHome()}
          onFeatures={() => goHome('features')}
          onHow={() => goHome('how')}
          onTry={() => goHome('try')}
          onCase={openCase}
        />
      )}

      {view === 'home' && (
        <Home
          input={input}
          setInput={(v) => {
            setInput(v);
            setError('');
          }}
          intent={intent}
          setIntent={setIntent}
          onSubmit={() => go(input, intent)}
          onExample={(x) => go(x, intent)}
          onCase={openCase}
          error={error}
          heroInputRef={heroInputRef}
          featuresRef={featuresRef}
          howRef={howRef}
        />
      )}

      {view === 'usecase' && (
        <UseCasePage
          caseId={caseId}
          onExample={() => {
            const ex = CASES[caseId].example;
            go(ex.url, ex.tab, ex.start);
          }}
          onTry={() => goHome('try')}
          onCase={openCase}
        />
      )}

      {view === 'loading' && (
        <div className="state state--loading" aria-live="polite">
          <span className="logo-key logo--big" aria-hidden="true">⌫</span>
          <div className="state-title">Looking for saved copies of {pendingUrl}</div>
          <div className="state-sub">We're checking every copy saved since 1996. This takes a few seconds.</div>
          <LoaderBar />
        </div>
      )}

      {view === 'empty' && (
        <div className="state">
          <div className="mono-kicker">NOTHING SAVED YET</div>
          <div className="empty-title">There are no saved copies of {pendingUrl}</div>
          <div className="empty-sub">Check the spelling. If you typed a long address, try just the main site, like apple.com instead of apple.com/some/page.</div>
          <div className="empty-actions">
            <button type="button" className="btn-ink" onClick={() => goHome()}>Try another address</button>
            <SaveNow url={pendingUrl} variant="big" />
          </div>
        </div>
      )}

      {view === 'results' && search && (
        <Results
          key={search.id}
          url={search.url}
          snaps={search.snaps}
          source={search.source}
          initial={search.route}
          startAt={search.start}
          showLegend={showLegend}
          onHome={() => goHome()}
          onSearch={(raw, tab) => go(raw, tab)}
          onRetry={() => applyRoute(parseRoute(window.location))}
          onRouteChange={(r) => {
            const path = routeToPath(r);
            if (path !== here()) window.history.replaceState(null, '', path);
          }}
        />
      )}
    </>
  );
}
