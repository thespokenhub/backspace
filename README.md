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

- **Home**: hero search, three-step explainer, feature cards, use case cards, short Q&A and a closing search box.
- **Use case pages** for copywriters, SEO specialists, developers and anyone curious, each with a one-click example.
- **Results workspace** with four tabs:
  - **Page**: one saved copy with a draggable timeline (tall bars mark changes), ← → / Backspace keys, and "Skip copies where nothing changed".
  - **Compare**: two dates side by side or as a swipe view, with date pickers and swap.
  - **All pages**: every URL saved in a chosen year, grouped by section, filterable, exportable to CSV.
  - **Changes**: every date the page looked different, with a rough content size change.
- Loading, empty and invalid address states.

## Layout

```
src/
  App.tsx              view state, search, scroll targets, loading/empty screens
  lib/backspace.ts     snapshot + page lookups, sample fallbacks, date formatting
  lib/cases.ts         use case copy and tab ids
  components/          Nav, Home, UseCasePage, Results, Scrubber, tabs
  styles.css           all styles (tokens on :root)
```

`App` takes two optional props from the prototype's tweaks: `startAt` (`'newest' | 'oldest'`) and `showLegend`.

## Data

Snapshot lists come from the public CDX endpoint at `web.archive.org`, and pages render in an iframe from the same host. If the lookup fails or times out, the app falls back to deterministic sample data so every screen still works. As the design asks, the UI doesn't mention where the data comes from.
