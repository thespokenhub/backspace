export type TabId = 'page' | 'compare' | 'pages' | 'changes';
export type CaseId = 'copy' | 'seo' | 'dev' | 'all';
export type StartAt = 'newest' | 'oldest';

export interface UseCase {
  title: string;
  short: string;
  kicker: string;
  headline: string;
  intro: string;
  tasks: [title: string, text: string, tool: string][];
  example: { label: string; url: string; tab: TabId; start?: StartAt };
}

export const TABS: [TabId, string][] = [['page', 'Page'], ['compare', 'Compare'], ['pages', 'All pages'], ['changes', 'Changes']];

export const CASES: Record<CaseId, UseCase> = {
  copy: {
    title: 'Copywriters', short: 'Old copy, rival messaging, launch dates', kicker: 'FOR COPYWRITERS',
    headline: 'See how any headline, offer or page has changed.',
    intro: 'Words on the web get rewritten all the time. Read every old version of a page, so you can get back copy you lost or see how others found the words that worked.',
    tasks: [
      ['Get back copy you overwrote', 'You rewrote the homepage last spring and want the old wording. Drag back to that month and copy it out.', 'Page view'],
      ["Study a rival's messaging", 'Put two dates side by side and see exactly how their headline, pricing line or button text changed.', 'Compare'],
      ['Find the day a change went live', 'The change list shows every date the page looked different, so you know when a new line first appeared.', 'Changes'],
    ],
    example: { label: "Compare apple.com's homepage over time", url: 'apple.com', tab: 'compare' },
  },
  seo: {
    title: 'SEO specialists', short: 'Lost URLs, redirects, ranking drops', kicker: 'FOR SEO SPECIALISTS',
    headline: 'Find lost pages, old URLs and what changed before traffic dropped.',
    intro: 'When rankings move, the first question is what changed. See the page, and the whole site, exactly as it was on any date.',
    tasks: [
      ['List every URL a site had', 'Pick a year and see all the pages that existed. Export the list to plan redirects after a migration.', 'All pages'],
      ['Check a page before a drop', 'Jump to the weeks before traffic fell and put the old page next to the current one.', 'Compare'],
      ['Check a domain before you buy it', 'See what an expired or for-sale domain used to host, year by year.', 'Page view'],
    ],
    example: { label: 'See every page nytimes.com had', url: 'nytimes.com', tab: 'pages' },
  },
  dev: {
    title: 'Developers', short: 'Regressions, migrations, lost assets', kicker: 'FOR DEVELOPERS',
    headline: 'See how a site was built, and the day it broke.',
    intro: "Old builds, lost content and pages nobody remembers shipping. Open any of them and click around like they're live.",
    tasks: [
      ['Track down a regression', 'Step through copies one at a time until the layout breaks. Now you have a date to search your commits.', 'Page view'],
      ['Recover content after a rebuild', 'Pages missing after a migration? List the old URLs and open each one to see what was there.', 'All pages'],
      ['Skip to what changed', 'Hide the copies where nothing changed and land right on the ones that matter.', 'Changes'],
    ],
    example: { label: 'Step through wikipedia.org changes', url: 'wikipedia.org', tab: 'changes' },
  },
  all: {
    title: 'Anyone curious', short: 'Gone sites, old favorites, proof', kicker: 'FOR ANYONE CURIOUS',
    headline: 'Look at the web the way you remember it.',
    intro: 'Your first blog, a shop that closed, the site you checked every day after school. If it was saved, you can see it again.',
    tasks: [
      ['Visit sites that are gone', 'Even if a website shut down years ago, its old pages may still be here.', 'Page view'],
      ['Show what a page said', 'Show someone exactly how a page looked on a certain day, with the date right on screen.', 'Page view'],
      ['Watch a site grow up', 'Drag from the first copy to today and watch years of design go by.', 'Page view'],
    ],
    example: { label: 'Open the 1996 Space Jam site', url: 'spacejam.com', tab: 'page', start: 'oldest' },
  },
};

export const CASE_IDS = Object.keys(CASES) as CaseId[];
