# Backspace archive interface redesign

_Started 2026-10-06 20:48 UTC_

---

## User

The idea:
Design and prototype a modern alternative interface for browsing archived websites.

The product should provide the same basic value as the Wayback Machine: enter a URL, see historical snapshots of that page, and browse what the page looked like at different points in time.

The difference is the user experience. evwen beginners shouls be able to use and understyand what's going on. that'ss the biggest winning point. copywriters can see, seos, devs, everyone.

The current Wayback Machine (https://web.archive.org/) feels like a tool built for archivists and power users. It is functional, but difficult to understand, visually dated, and unnecessarily cumbersome.

We want to make web history feel as easy to explore as browsing a modern product.

Primary goal:
Create a full working prototype, not a collection of static screens. The prototype should feel like a real product.

Use realistic interactions, transitions, states, loading behavior, empty states, and sample historical data.

give me 3 wildly different prototypes. 

the home page should be understable at once. and no, AI-ey copy. no em dashes.
Important UX principle

The user should never have to ask:
"What am I looking at?"

the name of the tool will be Backspace (like a p[play on the function on a keyboard).

  feel free to go wild. attached the current look of watback machine

## Assistant

_[tool: list_files]_

_[tool: list_files]_

_[tool: write_file]_

_[tool: dc_write]_

## Assistant

## Assistant

## Assistant

## Assistant

## Assistant

_[tool: dc_write]_

_[tool: dc_write]_

## Assistant

_[tool: dc_write]_

Now the third one, the editorial "story" version.

_[tool: dc_write]_

Now a small index linking all three.

_[tool: dc_write]_

_[tool: ready_for_verification]_

I built three working prototypes. `Backspace Prototypes.dc.html` links to all of them:

- **A · Scrub** (light, product-style): one big view of the page with a draggable timeline under it. Tall bars mark the days the page changed. Your arrow keys move one saved copy at a time, and a toggle skips copies where nothing changed.
- **B · Keys** (dark, keyboard-themed): you fill in one sentence, "Show me ___ the way it looked in ___", and the old page opens next to today's version. Press ⌫ to go back one copy, Enter to go forward and S to switch between side by side and a swipe view. Rows of year and month buttons let you jump around.
- **C · Story** (newspaper style): each site gets a history page with the oldest and newest copies side by side and one row of months per year. Click a month to open that copy full screen.

Every screen spells out what you're looking at, for example "You're looking at apple.com as it looked on June 12, 2007. That's 19 years ago." Each prototype also has loading screens, a "no copies found" screen and a message for addresses that don't look valid. The copy has no em dashes.

Things to know:
- They pull the real list of saved copies from the Internet Archive and show the actual archived pages. I haven't checked that the archive's pages load inside these prototypes. If they don't, the page area will stay blank.
- If the archive's list can't be reached, the prototypes switch to made-up sample dates and say so with a small label.
- Your Wayback Machine screenshot didn't come through, and the attached design system is empty, so I picked a separate look for each prototype.
- Each one has a Tweaks setting: A chooses whether to start on the newest or oldest copy and can hide the bar key, B chooses which view opens first, and C sets the order of the years.

## User

Found issues — fixing…

## Assistant

_[tool: str_replace_edit]_

_[tool: ready_for_verification]_

I fixed the future dates. In the current month, sample copies are now dated before today, so none land after October 6, 2026. I haven't rechecked this on screen. The fix is in the shared data file, so it applies to all three prototypes.

In the check, the live archive lookup failed and all three prototypes used sample dates. Reviewers will likely see that sample view too.

## User

i love number 1!

a couple of change though. after the hero page they should be some more context so people know what the site does. i thin k we neeed some use case pages too. 

i love the skip copies where nothing changed feature too.

but i would love the side by side feature  from "backspace keys" here. also, they need to be able to do more than just view what the page looked like. they should be able to see sitemaps, urls, something... dont know.

also, i can see taking from the archive littered everywhere. that doesnt serve as at all. remove those. 

we might also, need a nav bar. for features, use cases, etc

## Assistant

_[tool: str_replace_edit]_

_[tool: dc_write]_

Now the use case page, loading, and empty states.

_[tool: dc_html_str_replace]_

Now the results workspace: header with tabs and the banner.

_[tool: dc_html_str_replace]_

Page and Compare tabs.

_[tool: dc_html_str_replace]_

All pages + Changes tabs, then the scrubber.

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

Linking v2 from the index.

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

I built `Backspace v2.dc.html` from prototype 1. The original Scrub file is unchanged, and v2 sits at the top of the index page. A background check is still running.

- **Nav bar:** Features, a Use cases dropdown, How it works, and a "Try it free" button.
- **Below the hero:** the home page now has four feature cards, four use case cards, three short questions and answers, and a final search box.
- **Use case pages:** one each for copywriters, SEO specialists, developers and anyone curious. Each shows three real tasks and a button that opens a ready example (for instance, every page nytimes.com had).
- **Four views of a site:**
  - **Page** is the timeline view you liked, still with "Skip copies where nothing changed".
  - **Compare** puts two dates side by side, taken from Backspace Keys. You can pick either date, swap sides, or switch to a swipe view.
  - **All pages** works like an old sitemap: every URL on the site in a chosen year, with a filter and a spreadsheet download.
  - **Changes** lists every date the page changed, with roughly how much content was added or removed, and buttons to view or compare.
- **Internet Archive mentions:** removed from all of v2's screens, including the sample-data label.

When the live lookup can't be reached, the page lists and change sizes use made-up sample data, same as before. Unlike v1 there's no label saying so, because that label mentioned the archive.

## User

Found issues — fixing…

## Assistant

_[tool: str_replace_edit]_

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

I fixed both issues the check found in the All pages tab, and the page opens with no errors. I didn't run the full check again.

- **Future dates:** sample pages for 2026 now have dates no later than yesterday, so nothing shows after October 6.
- **Wrapping dates:** the "first saved" date on each row now stays on one line.

