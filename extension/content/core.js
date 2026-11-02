/* Çekirdek: ayar yükleme, modül yaşam döngüsü, ortak yardımcılar. */
(function () {
  'use strict';
  const YTX = window.YTX;
  YTX.s = Object.assign({}, YTX.DEFAULTS);

  const modules = [];
  YTX.register = (m) => modules.push(m); // { id, start(), stop(), update() }
  // Yalnızca açma/kapama anahtarı olan modüller (ör. m_repeat) kendi anahtarına bakar
  YTX.isActive = (id) => !!(YTX.s.enabled && (!(('m_' + id) in YTX.DEFAULTS) || YTX.s['m_' + id]));
  YTX.log = (...a) => { if (YTX.s.x_debug) console.log('[YTX]', ...a); };

  // --- Yardımcılar ---
  YTX.sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  YTX.visible = (el) => !!(el && (el.offsetParent || el.getClientRects().length));
  YTX.lines = (text) => String(text || '').split('\n').map((x) => x.trim()).filter(Boolean);
  YTX.waitFor = async (fn, timeout, token) => {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      if (token && token.cancelled) return null;
      const v = fn();
      if (v) return v;
      await YTX.sleep(100);
    }
    return null;
  };
  // YouTube bazı düğmelerde yalnızca tam işaretçi olay dizisine tepki verir
  YTX.realClick = (el) => {
    ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach((type) => {
      const Ctor = type.startsWith('pointer') ? PointerEvent : MouseEvent;
      el.dispatchEvent(new Ctor(type, { bubbles: true, cancelable: true, composed: true, view: window, button: 0 }));
    });
  };
  // Ayar metnindeki satırlardan eşleştirici üretir (/regex/i veya düz metin)
  YTX.matchers = (text) => YTX.lines(text).map((l) => {
    const m = l.match(/^\/(.+)\/([a-z]*)$/);
    if (m) { try { const re = new RegExp(m[1], m[2] || 'i'); return (t) => re.test(t); } catch (e) { /* düz metin say */ } }
    const low = l.toLowerCase();
    return (t) => t.toLowerCase().includes(low);
  });

  // --- Ortak DOM gözlemcisi (tek MutationObserver, kısıtlı çağrı) ---
  const mutateCbs = new Set();
  let mo = null, moTimer = null;
  function fireMutate() { moTimer = null; mutateCbs.forEach((fn) => { try { fn(); } catch (e) { console.error('[YTX]', e); } }); }
  function schedule() { if (!moTimer) moTimer = setTimeout(fireMutate, YTX.s.x_scanMs || 250); }
  YTX.onMutate = (fn) => {
    mutateCbs.add(fn);
    if (!mo && document.body) { mo = new MutationObserver(schedule); mo.observe(document.body, { childList: true, subtree: true }); }
  };
  YTX.offMutate = (fn) => {
    mutateCbs.delete(fn);
    if (!mutateCbs.size && mo) { mo.disconnect(); mo = null; }
  };
  YTX.requestScan = schedule;

  const navCbs = new Set();
  YTX.onNav = (fn) => navCbs.add(fn);
  YTX.offNav = (fn) => navCbs.delete(fn);
  window.addEventListener('yt-navigate-finish', () => { navCbs.forEach((fn) => { try { fn(); } catch (e) { console.error('[YTX]', e); } }); schedule(); });

  // --- Ana sayfa ayar sınıfları (<html class="ytx-...">) ---
  function applyClasses() {
    const root = document.documentElement;
    for (const it of Object.values(YTX.ITEMS)) {
      if (!it.cls) continue;
      const on = !!YTX.s[it.key] && YTX.s.enabled && (!it.module || YTX.isActive(it.module));
      root.classList.toggle('ytx-' + it.cls, on);
    }
  }

  // --- Modül yaşam döngüsü ---
  const running = new Set();
  function refresh() {
    applyClasses();
    for (const m of modules) {
      const should = YTX.isActive(m.id);
      try {
        if (should && !running.has(m.id)) { running.add(m.id); m.start(); }
        else if (!should && running.has(m.id)) { running.delete(m.id); m.stop(); }
        else if (should && m.update) m.update();
      } catch (e) { console.error('[YTX] modül hatası', m.id, e); }
    }
  }

  async function boot() {
    YTX.s = await YTX.loadSettings();
    refresh();
    chrome.storage.onChanged.addListener((ch, area) => {
      if (area !== 'local' || !ch[YTX.STORE_KEY]) return;
      YTX.s = Object.assign({}, YTX.DEFAULTS, ch[YTX.STORE_KEY].newValue || {});
      refresh();
    });
  }
  if (document.body) boot(); else document.addEventListener('DOMContentLoaded', boot, { once: true });
})();
