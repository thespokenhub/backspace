import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchSnapshots, normalize, type Snap } from './lib/backspace';
import { CASES, type CaseId, type StartAt, type TabId } from './lib/cases';
import { LoaderBar } from './components/common';
import { Home } from './components/Home';
import { Nav } from './components/Nav';
import { Results } from './components/Results';
import { UseCasePage } from './components/UseCasePage';

type View = 'home' | 'usecase' | 'loading' | 'empty' | 'results';
type ScrollTarget = 'features' | 'how' | 'try';

interface Props {
  /** Which copy a new search opens on. */
  startAt?: StartAt;
  /** Show the bar key next to the timeline. */
  showLegend?: boolean;
}

interface Search {
  id: number;
  url: string;
  snaps: Snap[];
  tab: TabId;
  start: StartAt;
}

const BAD_ADDRESS = "That doesn't look like a web address. Try something like apple.com";

export default function App({ startAt = 'newest', showLegend = true }: Props) {
  const [view, setView] = useState<View>('home');
  const [caseId, setCaseId] = useState<CaseId>('copy');
  const [menuOpen, setMenuOpen] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [pendingUrl, setPendingUrl] = useState('');
  const [search, setSearch] = useState<Search | null>(null);
  const [scrollTarget, setScrollTarget] = useState<ScrollTarget | null>(null);
  const requestId = useRef(0);

  const heroInputRef = useRef<HTMLInputElement>(null);
  const featuresRef = useRef<HTMLElement>(null);
  const howRef = useRef<HTMLElement>(null);

  const go = useCallback(
    async (raw: string, tab: TabId = 'page', start?: StartAt) => {
      const url = normalize(raw);
      if (!url) {
        setError(BAD_ADDRESS);
        return;
      }
      const id = ++requestId.current;
      setPendingUrl(url);
      setInput(url);
      setError('');
      setMenuOpen(false);
      setView('loading');
      window.scrollTo(0, 0);
      const res = await fetchSnapshots(url);
      if (requestId.current !== id) return; // superseded by a newer search
      if (!res.snaps.length) {
        setView('empty');
        return;
      }
      setSearch({ id, url, snaps: res.snaps, tab, start: start ?? startAt });
      setView('results');
    },
    [startAt],
  );

  const goHome = () => {
    requestId.current++;
    setView('home');
    setError('');
    setMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const openCase = (id: CaseId) => {
    setCaseId(id);
    setView('usecase');
    setMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const scrollTo = (target: ScrollTarget) => {
    setMenuOpen(false);
    setView('home');
    setScrollTarget(target);
  };

  // Runs after the home page has rendered, so the section refs exist.
  useEffect(() => {
    if (view !== 'home' || !scrollTarget) return;
    const raf = requestAnimationFrame(() => {
      if (scrollTarget === 'try') {
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
          onHome={goHome}
          onFeatures={() => scrollTo('features')}
          onHow={() => scrollTo('how')}
          onTry={() => scrollTo('try')}
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
          onSubmit={() => go(input)}
          onExample={(x) => go(x)}
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
          onTry={() => scrollTo('try')}
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
          <button type="button" className="btn-ink" onClick={goHome}>Try another address</button>
        </div>
      )}

      {view === 'results' && search && (
        <Results
          key={search.id}
          url={search.url}
          snaps={search.snaps}
          initialTab={search.tab}
          startAt={search.start}
          showLegend={showLegend}
          onHome={goHome}
          onSearch={(raw, tab) => go(raw, tab)}
        />
      )}
    </>
  );
}
