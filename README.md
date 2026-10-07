# Backspace

See any website the way it used to look. Type an address, drag back through the years, and see the page, every URL on the site and every change on any date since 1996.

Built with Vite, React and TypeScript from the Claude Design prototype in `project/Backspace v2.dc.html`. The design conversation is in `chats/`.

## Run it

```sh
npm install
npm run dev      # local dev server
npm run build    # type-check and production build into dist/
```

## What's in it

- **Home**: hero search with an "I want to…" picker that opens the right view, three-step explainer, feature cards, use case cards, short Q&A and a closing search box.
- **Use case pages** for copywriters, SEO specialists, developers and anyone curious, each with a one-click example.
- **Results workspace** with four tabs:
  - **Page**: one saved copy with a draggable timeline (tall bars mark changes, hovering shows a live preview), First version / Latest buttons, year jump buttons, ← → / Backspace / Home / End keys, and "Skip copies where nothing changed".
  - **Compare**: two dates side by side or as a swipe view, with date pickers and swap.
  - **All pages**: every URL saved in a chosen year, grouped by section, filterable, exportable to CSV.
  - **Changes**: every date the page looked different, with a rough content size change.
- **Shareable links** for every screen, with working back and forward buttons (see below), plus a Copy link button.
- **Guided tour** the first time someone opens a site, and again from the **?** button.
- **Save a copy now** (results and the "no copies" screen) asks the Wayback Machine to save the page today.
- Loading, empty and invalid address states, and a notice whenever example data is showing.

## Links

```
/                                         home
/for/copywriters | seo | developers | everyone
/apple.com                                newest copy
/apple.com/mac?date=2007-06-12            a page on a date (nearest copy)
/apple.com?view=compare&date=2009-03-01&vs=2026-09-01
/apple.com?view=pages&year=2009
/apple.com?view=changes
```

`vercel.json` rewrites every non-API path to `index.html` so these load directly.

## Layout

```
src/
  App.tsx              view state, search, scroll targets, loading/empty screens
  lib/backspace.ts     snapshot + page lookups, sample fallbacks, date formatting
  lib/cases.ts         use case copy and tab ids
  lib/router.ts        URL <-> screen state
  components/          Nav, Home, UseCasePage, Results, Scrubber, Tour, SaveNow, ShareButton, tabs
  styles.css           all styles (tokens on :root)
api/
  cdx.ts               Vercel function: proxies snapshot lookups
  save.ts              Vercel function: Save Page Now
```

`App` takes two optional props from the prototype's tweaks: `startAt` (`'newest' | 'oldest'`) and `showLegend`.

## Environment variables (Vercel)

| Name | Needed for |
| --- | --- |
| `ARCHIVE_ACCESS_KEY`, `ARCHIVE_SECRET_KEY` | Optional. Free keys from https://archive.org/account/s3.php. With them, "Save a copy now" uses the Save Page Now 2 API (more reliable, with progress). Without them it uses the slower anonymous save. |

The `/api/*` functions only run on Vercel (or `vercel dev`). Under `npm run dev`, lookups go through Vite's proxy and saving shows an error.

## Data

Snapshot lists come from the public CDX endpoint at `web.archive.org`, and pages render in an iframe from the same host. If the lookup fails or times out, the app falls back to deterministic sample data so every screen still works. As the design asks, the UI doesn't mention where the data comes from.
