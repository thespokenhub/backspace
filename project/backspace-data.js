(function () {
  const B = {};
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  B.MONTHS = MONTHS;
  B.examples = ['apple.com', 'nytimes.com', 'spacejam.com', 'wikipedia.org'];
  const cache = new Map();

  B.normalize = (input) => {
    let s = (input || '').trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/+$/, '');
    if (!s) return null;
    const parts = s.split('/');
    parts[0] = parts[0].toLowerCase();
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(parts[0])) return null;
    return parts.join('/');
  };

  B.decorate = (snaps) => {
    let prev = null;
    return snaps.map((s, i) => {
      const o = { ...s, i, year: +s.ts.slice(0, 4), month: +s.ts.slice(4, 6), day: +s.ts.slice(6, 8) || 1, changed: prev === null || s.digest !== prev };
      prev = s.digest;
      return o;
    });
  };

  B.sample = (url) => {
    let h = 7;
    for (const c of url) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const rnd = () => { h = (h * 1664525 + 1013904223) >>> 0; return h / 4294967296; };
    const now = new Date();
    const startY = 1997 + Math.floor(rnd() * 9);
    const out = [];
    let d = 'a0';
    let len = 6000 + Math.floor(rnd() * 8000);
    for (let y = startY; y <= now.getFullYear(); y++) {
      for (let m = 1; m <= 12; m++) {
        if (y === now.getFullYear() && m > now.getMonth() + 1) break;
        if (rnd() > Math.min(0.95, 0.3 + (y - startY) * 0.07)) continue;
        if (rnd() < 0.38) { d = Math.floor(rnd() * 1e9).toString(36); len = Math.round(len * (0.82 + rnd() * 0.5)); }
        const isNow = y === now.getFullYear() && m === now.getMonth() + 1;
        const day = 1 + Math.floor(rnd() * (isNow ? Math.max(1, now.getDate() - 1) : 27));
        out.push({ ts: `${y}${String(m).padStart(2, '0')}${String(day).padStart(2, '0')}120000`, digest: d, length: len });
      }
    }
    return out;
  };

  B.fetchSnapshots = async (url) => {
    if (cache.has(url)) return cache.get(url);
    const api = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url)}&output=json&fl=timestamp,digest,length&filter=statuscode:200&collapse=timestamp:6`;
    let res;
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 15000);
      const r = await fetch(api, { signal: ctrl.signal });
      clearTimeout(t);
      if (!r.ok) throw new Error('bad');
      const rows = await r.json();
      res = { source: 'live', snaps: B.decorate((rows || []).slice(1).map(([ts, digest, length]) => ({ ts, digest, length: +length || 0 }))) };
    } catch (e) {
      await new Promise((r) => setTimeout(r, 900));
      res = { source: 'sample', snaps: B.decorate(B.sample(url)) };
    }
    cache.set(url, res);
    return res;
  };

  B.frameUrl = (url, ts) => `https://web.archive.org/web/${ts}if_/http://${url}`;
  B.pageUrl = (url, ts) => `https://web.archive.org/web/${ts}/http://${url}`;
  B.fmt = (ts) => `${MONTHS[+ts.slice(4, 6) - 1]} ${+ts.slice(6, 8) || 1}, ${ts.slice(0, 4)}`;
  B.fmtShort = (ts) => `${MONTHS[+ts.slice(4, 6) - 1].slice(0, 3)} ${+ts.slice(6, 8) || 1}, ${ts.slice(0, 4)}`;
  B.fmtMonth = (ts) => `${MONTHS[+ts.slice(4, 6) - 1]} ${ts.slice(0, 4)}`;
  B.ago = (ts) => {
    const now = new Date();
    const months = (now.getFullYear() - +ts.slice(0, 4)) * 12 + (now.getMonth() + 1 - +ts.slice(4, 6));
    if (months <= 0) return 'this month';
    if (months < 12) return months === 1 ? '1 month ago' : months + ' months ago';
    const y = Math.floor(months / 12);
    return y === 1 ? '1 year ago' : y + ' years ago';
  };
  B.byYear = (snaps) => {
    const map = new Map();
    snaps.forEach((s) => { if (!map.has(s.year)) map.set(s.year, []); map.get(s.year).push(s); });
    return [...map.entries()].map(([year, list]) => ({ year, list, changes: list.filter((s) => s.changed).length }));
  };
  B.plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  const pathOf = (orig) => {
    let p = orig.replace(/^https?:\/\//i, '').replace(/^[^/]+/, '').split('?')[0].split('#')[0];
    if (!p) p = '/';
    return p.length > 1 ? p.replace(/\/+$/, '') : p;
  };
  const WORDS = ['news','spring','launch','guide','team','update','design','store','pricing','faq','history','tour','press','events','support','help','jobs','partners','stories','gallery','downloads','features','mobile','music','video','travel','sports','tech','world','science'];
  B.samplePages = (host, year) => {
    let h = year;
    for (const c of host) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const rnd = () => { h = (h * 1664525 + 1013904223) >>> 0; return h / 4294967296; };
    const pick = () => WORDS[Math.floor(rnd() * WORDS.length)];
    const set = new Set(['/', '/about', '/contact', '/privacy']);
    const sections = ['products', 'blog', 'support', 'news', 'careers', 'press'];
    const size = Math.min(140, 18 + (year - 1996) * 5);
    let guard = 0;
    while (set.size < size && guard++ < 2000) {
      const sec = sections[Math.floor(rnd() * Math.min(sections.length, 2 + (year - 1996) / 5))];
      if (sec === 'blog' || sec === 'news') set.add(`/${sec}/${year}/${pick()}-${pick()}`);
      else if (rnd() < 0.5) set.add(`/${sec}`);
      else set.add(`/${sec}/${pick()}`);
    }
    return [...set].map((path) => {
      const now = new Date();
      const cur = year === now.getFullYear();
      const m = 1 + Math.floor(rnd() * (cur ? now.getMonth() + 1 : 12));
      const dd = 1 + Math.floor(rnd() * (cur && m === now.getMonth() + 1 ? Math.max(1, now.getDate() - 1) : 27));
      return { path, ts: `${year}${String(m).padStart(2, '0')}${String(dd).padStart(2, '0')}120000` };
    });
  };
  B.fetchPages = async (url, year) => {
    const host = url.split('/')[0];
    const key = `p:${host}:${year}`;
    if (cache.has(key)) return cache.get(key);
    const api = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(host)}/*&output=json&fl=original,timestamp&collapse=urlkey&filter=statuscode:200&filter=mimetype:text/html&from=${year}&to=${year}&limit=500`;
    let list;
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 15000);
      const r = await fetch(api, { signal: ctrl.signal });
      clearTimeout(t);
      if (!r.ok) throw new Error('bad');
      const rows = await r.json();
      const seen = new Map();
      (rows || []).slice(1).forEach(([o, ts]) => { const p = pathOf(o); if (!seen.has(p)) seen.set(p, { path: p, ts }); });
      list = [...seen.values()];
      if (!list.length) throw new Error('empty');
    } catch (e) {
      await new Promise((r) => setTimeout(r, 700));
      list = B.samplePages(host, year);
    }
    list.sort((a, b) => a.path.localeCompare(b.path));
    cache.set(key, list);
    return list;
  };
  B.downloadCsv = (name, rows) => {
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
  };

  window.Backspace = B;
})();
