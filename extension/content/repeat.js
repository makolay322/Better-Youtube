/* Repeated video hider. */
(function () {
  'use strict';
  const YTX = window.YTX;
  const STORE = 'repeatCounts';
  const ATTR = 'data-ytx-repeat';

  // "Session" = each page view. A video that reappears in the same page view is counted once.
  const sessionSeen = new Set();
  let counts = {};          // { id: { c, t } }
  const pending = new Map(); // id -> delta to add (0 = only refresh the last-seen time)
  let saveTimer = null, io = null, loaded = false;

  const INNER_TILE_SELECTOR = [
    'ytd-compact-video-renderer', 'yt-lockup-view-model', 'ytd-video-renderer', 'ytd-grid-video-renderer',
    'ytm-shorts-lockup-view-model', 'ytd-reel-item-renderer',
  ].join(',');
  const LINK_SELECTOR = 'a[href*="/watch?v="], a[href^="/shorts/"]';

  const pageOn = () => {
    const s = YTX.s, p = location.pathname;
    return (p === '/' && s.r_home) || (p === '/watch' && s.r_watch) || (p === '/results' && s.r_search) ||
      (p === '/feed/subscriptions' && s.r_subs);
  };
  // Pages cached in YouTube's DOM but not currently shown are neither counted nor hidden
  const excludedArea = () => (YTX.s.r_subs ? 'ytd-browse[hidden]' : 'ytd-browse[page-subtype="subscriptions"], ytd-browse[hidden]');
  const currentVideoId = () => (location.pathname === '/watch' ? new URLSearchParams(location.search).get('v') : null);

  function getVideoId(tile) {
    const a = tile.querySelector(LINK_SELECTOR);
    if (!a) return null;
    const href = a.getAttribute('href');
    if (!YTX.s.r_shorts && href.startsWith('/shorts/')) return null;
    const m = href.match(/[?&]v=([\w-]{6,})/) || href.match(/\/shorts\/([\w-]+)/);
    return m ? m[1] : null;
  }

  function findTiles() {
    const area = excludedArea();
    const tiles = new Set();
    document.querySelectorAll(LINK_SELECTOR).forEach((a) => {
      if (a.closest(area)) return;
      const tile = a.closest('ytd-rich-item-renderer') || a.closest(INNER_TILE_SELECTOR);
      if (tile) tiles.add(tile);
    });
    return tiles;
  }

  // To avoid overwriting other tabs' writes, re-reads the store when saving and applies the deltas.
  async function flush() {
    saveTimer = null;
    if (!pending.size) return;
    const r = await chrome.storage.local.get(STORE);
    const stored = r[STORE] || {};
    const now = Date.now(), s = YTX.s;
    for (const [id, delta] of pending) {
      const rec = stored[id] || { c: 0, t: 0 };
      rec.c += delta; rec.t = now; stored[id] = rec;
    }
    pending.clear();
    const maxAge = s.r_ageDays * 86400000;
    let ids = Object.keys(stored);
    for (const id of ids) if (now - stored[id].t > maxAge) delete stored[id];
    ids = Object.keys(stored);
    if (ids.length > s.r_maxEntries) {
      ids.sort((x, y) => stored[x].t - stored[y].t).slice(0, ids.length - s.r_maxEntries).forEach((id) => delete stored[id]);
    }
    counts = stored;
    await chrome.storage.local.set({ [STORE]: stored });
  }
  const scheduleSave = () => { if (!saveTimer) saveTimer = setTimeout(flush, 1000); };

  function makeObserver() {
    io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const tile = entry.target, id = tile.dataset.ytxrId;
        io.unobserve(tile); delete tile.dataset.ytxrObs;
        if (!id || sessionSeen.has(id) || !pageOn() || tile.closest(excludedArea())) continue;
        sessionSeen.add(id);
        (counts[id] || (counts[id] = { c: 0, t: 0 })).c += 1;
        pending.set(id, (pending.get(id) || 0) + 1);
        scheduleSave();
      }
    }, { threshold: Math.max(0.01, YTX.s.r_visibility / 100) });
  }

  function processTile(tile) {
    const id = getVideoId(tile);
    if (!id || id === currentVideoId()) { // izlenen videoyu sayma/gizleme
      tile.removeAttribute(ATTR);
      if (tile.dataset.ytxrObs) { io.unobserve(tile); delete tile.dataset.ytxrObs; }
      delete tile.dataset.ytxrId;
      return;
    }
    tile.dataset.ytxrId = id;
    const seen = sessionSeen.has(id), rec = counts[id];
    const hide = !seen && !!rec && rec.c >= YTX.s.r_max;
    tile.toggleAttribute(ATTR, hide);
    if (hide) { pending.set(id, pending.get(id) || 0); scheduleSave(); } // keep the record alive
    if (hide || seen) {
      if (tile.dataset.ytxrObs) { io.unobserve(tile); delete tile.dataset.ytxrObs; }
    } else if (tile.dataset.ytxrObs !== id) {
      io.unobserve(tile); io.observe(tile); tile.dataset.ytxrObs = id;
    }
  }

  function scan() {
    if (!loaded) return;
    if (!pageOn()) { clearHidden(); return; }
    findTiles().forEach(processTile);
  }
  function clearHidden() { document.querySelectorAll('[' + ATTR + ']').forEach((el) => el.removeAttribute(ATTR)); }

  function onNav() { // new page view = new session
    flush();
    sessionSeen.clear();
    io.disconnect();
    document.querySelectorAll('[data-ytxr-obs]').forEach((el) => delete el.dataset.ytxrObs);
    scan();
  }
  const onPageHide = () => { flush(); };
  // Reset from the options page / update from another tab
  const onStorage = (ch, area) => {
    if (area !== 'local' || !ch[STORE]) return;
    counts = ch[STORE].newValue || {};
    if (!Object.keys(counts).length) { sessionSeen.clear(); pending.clear(); clearHidden(); }
    YTX.requestScan();
  };

  YTX.register({
    id: 'repeat',
    async start() {
      makeObserver();
      const r = await chrome.storage.local.get(STORE);
      counts = r[STORE] || {};
      loaded = true;
      YTX.onMutate(scan); YTX.onNav(onNav);
      window.addEventListener('pagehide', onPageHide);
      chrome.storage.onChanged.addListener(onStorage);
      scan();
    },
    stop() {
      loaded = false;
      YTX.offMutate(scan); YTX.offNav(onNav);
      window.removeEventListener('pagehide', onPageHide);
      chrome.storage.onChanged.removeListener(onStorage);
      if (io) io.disconnect();
      document.querySelectorAll('[data-ytxr-obs]').forEach((el) => delete el.dataset.ytxrObs);
      clearHidden();
    },
    update() {
      if (io) io.disconnect();
      document.querySelectorAll('[data-ytxr-obs]').forEach((el) => delete el.dataset.ytxrObs);
      makeObserver();
      scan();
    },
  });
})();
