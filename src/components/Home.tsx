import type { Ref } from 'react';
import { EXAMPLES } from '../lib/backspace';
import type { CaseId, TabId } from '../lib/cases';
import { Footer } from './common';
import { SearchForm } from './SearchForm';

interface Props {
  input: string;
  setInput: (v: string) => void;
  intent: TabId;
  setIntent: (t: TabId) => void;
  onSubmit: () => void;
  onExample: (url: string) => void;
  onCase: (id: CaseId) => void;
  error: string;
  heroInputRef: Ref<HTMLInputElement>;
  featuresRef: Ref<HTMLElement>;
  howRef: Ref<HTMLElement>;
}

// Tall = page changed, short = looked the same, here = selected copy.
const ART_BARS = ['tall', '', '', 'tall', '', 'tall', '', '', 'here', '', 'tall', '', '', 'tall'];

// What a first-time visitor came to do, mapped to the view that does it.
const INTENTS: [TabId, string][] = [
  ['page', 'See an old version'],
  ['compare', 'Compare two dates'],
  ['changes', 'Find what changed'],
  ['pages', 'List every old URL'],
];

const STEPS = [
  ['01', 'Type an address', 'Any site. Your own, a rival, a blog.'],
  ['02', 'Drag the timeline', 'Each bar is one saved copy of the page.'],
  ['03', 'See the old page', "Scroll it and click around, like it's live."],
];

const CASE_CARDS: [CaseId, string, string][] = [
  ['copy', 'COPYWRITERS', 'Get back old copy and study how rivals rewrote theirs.'],
  ['seo', 'SEO SPECIALISTS', 'Find lost URLs and what changed before traffic dropped.'],
  ['dev', 'DEVELOPERS', 'Pin down the day a page broke and recover lost content.'],
  ['all', 'ANYONE CURIOUS', 'Revisit sites that are gone and the web you remember.'],
];

const FAQ = [
  ['Where do old pages come from?', 'Since 1996, websites have been saved again and again, like photos taken of a page over the years. Backspace finds every photo of the address you type.'],
  ['Is this the real page?', "Yes. It's the page's actual text and code from that day. Some images or videos may be missing if they weren't saved at the time."],
  ['Why are some dates missing?', "Pages aren't saved every day. Popular sites have copies almost weekly. Small sites might have one a year, or none."],
];

export function Home({ input, setInput, intent, setIntent, onSubmit, onExample, onCase, error, heroInputRef, featuresRef, howRef }: Props) {
  return (
    <div>
      <section className="hero">
        <div className="hero-inner">
          <h1>See any website the way it used to look.</h1>
          <p className="hero-sub">Type a web address. Drag back through the years. See the page, every URL on the site and every change, on any date since 1996.</p>
          <div className="intents" role="radiogroup" aria-label="What do you want to do?">
            <span>I want to</span>
            {INTENTS.map(([id, label]) => (
              <button type="button" role="radio" aria-checked={intent === id} key={id} className={intent === id ? 'on' : ''} onClick={() => setIntent(id)}>
                {label}
              </button>
            ))}
          </div>
          <SearchForm variant="hero" value={input} onChange={setInput} onSubmit={onSubmit} inputRef={heroInputRef} />
          {error && <div className="hero-error" role="alert">{error}</div>}
          <div className="examples">
            <span>Not sure? Try one:</span>
            {EXAMPLES.map((ex) => (
              <button type="button" key={ex} className="example-chip" onClick={() => onExample(ex)}>{ex}</button>
            ))}
          </div>
        </div>
        <div className="steps">
          {STEPS.map(([num, title, text]) => (
            <div className="step" key={num}>
              <div className="mono-kicker">{num}</div>
              <div className="step-title">{title}</div>
              <div className="step-text">{text}</div>
            </div>
          ))}
        </div>
      </section>

      <section ref={featuresRef} className="section section--features">
        <div className="mono-kicker">WHAT YOU CAN DO</div>
        <h2>Four ways to look into a website's past.</h2>
        <div className="features">
          <div className="feature">
            <div className="feature-art art-bars" aria-hidden="true">
              <div className="art-bars-row">
                {ART_BARS.map((c, i) => <span key={i} className={c} />)}
              </div>
              <div className="art-years"><span>2004</span><span>2012</span><span>2026</span></div>
            </div>
            <div>
              <div className="feature-title">See any day</div>
              <div className="feature-text">Drag the timeline to any date and the page appears as it was. Scroll it, click links, read it in full.</div>
            </div>
          </div>
          <div className="feature">
            <div className="feature-art art-compare" aria-hidden="true">
              <div className="art-card">
                <span className="d accent">MAR 2009</span>
                <span className="h" style={{ width: '80%' }} />
                <span className="l" style={{ width: '60%' }} />
                <span className="l" style={{ width: '70%' }} />
              </div>
              <div className="art-card">
                <span className="d">SEP 2026</span>
                <span className="h" style={{ width: '55%' }} />
                <span className="l" style={{ width: '85%' }} />
                <span className="b" />
              </div>
            </div>
            <div>
              <div className="feature-title">Compare two dates</div>
              <div className="feature-text">Put an old copy next to a newer one. Spot the new headline, the moved button, the price that went up.</div>
            </div>
          </div>
          <div className="feature">
            <div className="feature-art art-urls" aria-hidden="true">
              <div><span>/</span><span className="muted">Jan 2009</span></div>
              <div><span>/products/ipod</span><span className="muted">Feb 2009</span></div>
              <div><span>/support/downloads</span><span className="muted">Feb 2009</span></div>
              <div><span>/press/2009/launch</span><span className="muted">Jun 2009</span></div>
              <div className="muted"><span>+ 212 more</span><span style={{ color: 'var(--accent)' }}>Export CSV</span></div>
            </div>
            <div>
              <div className="feature-title">List every page a site had</div>
              <div className="feature-text">Pick a year and get every URL on the site back then, like an old sitemap. Download it as a spreadsheet.</div>
            </div>
          </div>
          <div className="feature">
            <div className="feature-art art-changes" aria-hidden="true">
              <div><span className="dot accent" /><b>Aug 14, 2026</b><span className="note">About 18% more content</span></div>
              <div><span className="dot" /><b>May 2, 2026</b><span className="note">About 6% less content</span></div>
              <div><span className="dot" /><b>Jan 9, 2026</b><span className="note">About the same size</span></div>
              <div className="skipped"><span className="dot empty" /><span>11 copies with no change, skipped</span></div>
            </div>
            <div>
              <div className="feature-title">Know when it changed</div>
              <div className="feature-text">A list of every date the page looked different. Skip all the copies where nothing changed.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="mono-kicker">WHO IT'S FOR</div>
        <h2>Made for people who work with websites. And anyone who's curious.</h2>
        <div className="case-cards">
          {CASE_CARDS.map(([id, kicker, text]) => (
            <button type="button" key={id} className={id === 'all' ? 'case-card case-card--dark' : 'case-card'} onClick={() => onCase(id)}>
              <span className="k">{kicker}</span>
              <span className="t">{text}</span>
              <span className="spacer" />
              <span className="more">See how →</span>
            </button>
          ))}
        </div>
      </section>

      <section ref={howRef} className="section section--how">
        <div className="mono-kicker">HOW IT WORKS</div>
        <h2>Good questions, short answers.</h2>
        <div className="faq">
          {FAQ.map(([q, a]) => (
            <div key={q}>
              <div className="faq-q">{q}</div>
              <div className="faq-a">{a}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-wrap">
        <div className="cta">
          <div className="cta-title">Pick a site. Hit backspace.</div>
          <SearchForm variant="cta" value={input} onChange={setInput} onSubmit={onSubmit} />
        </div>
      </section>

      <Footer />
    </div>
  );
}
