/* YouTube player settings: volume, quality, captions, automatic behaviors, page layout. */
(function () {
  'use strict';
  const YTX = window.YTX;
  const STATE_KEY = 'ytxState'; // last volume (kept separate from settings)

  let state = { volume: null };
  let started = false;
  let bcast = null;
  const tabId = Math.random().toString(36).slice(2);
  let lastVideoKey = '';
  let qualityToken = 0;

  // ---------- Helpers ----------
  const $ = (sel, root) => (root || document).querySelector(sel);
  const player = () => document.getElementById('movie_player');
  const video = () => $('#movie_player video.html5-main-video') || $('#movie_player video') || $('video');
  const onWatch = () => location.pathname === '/watch' || location.pathname.startsWith('/shorts');

  // Bridge to the player API in the page world
  let seq = 0;
  const waiting = new Map();
  window.addEventListener('message', (e) => {
    const m = e.data;
    if (e.source !== window || !m || m.ytxr !== 1) return;
    const w = waiting.get(m.id);
    if (w) { waiting.delete(m.id); w(m.result); }
  });
  function bridge(cmd, ...args) {
    return new Promise((resolve) => {
      const id = ++seq;
      waiting.set(id, resolve);
      window.postMessage({ ytx: 1, id, cmd, args }, '*');
      setTimeout(() => { if (waiting.delete(id)) resolve(null); }, 1500);
    });
  }
  const saveState = () => { try { chrome.storage.local.set({ [STATE_KEY]: state }); } catch (e) { /* extension was reloaded */ } };

  // ---------- Ses ----------
  function setVolume(pct) {
    pct = Math.max(0, Math.min(100, Math.round(pct)));
    bridge('setVolume', pct);
    const v = video();
    if (v) { v.volume = pct / 100; if (pct > 0) v.muted = false; }
    if (YTX.s.e_volMode === 'remember') { state.volume = pct; saveState(); }
  }
  const volNow = () => { const v = video(); return v ? Math.round(v.volume * 100) : 0; };

  // ---------- Kalite ----------
  // The player API becomes ready some time after the video loads; retries a few times until then.
  async function applyQuality() {
    const s = YTX.s;
    if (s.e_quality === 'auto') return;
    const token = ++qualityToken;
    let ok = 0;
    for (const wait of [0, 600, 900, 1500, 2500, 4000]) {
      if (wait) await YTX.sleep(wait);
      if (token !== qualityToken || !YTX.isActive('enhancer')) return;
      const r = await bridge('setQuality', s.e_quality, !!s.e_premium);
      if (r && r.ok && ++ok >= 2) return;
    }
  }

  // ---------- Per-video defaults ----------
  function applyDefaults() {
    const v = video(), s = YTX.s;
    if (!v || !onWatch()) return;
    if (s.e_volMode === 'fixed') setVolume(s.e_volume);
    else if (s.e_volMode === 'remember' && state.volume != null) setVolume(state.volume);
    applyQuality();
    if (s.e_captions === 'never') bridge('setCaptions', 'never');
    else if (s.e_captions === 'on') bridge('setCaptions', 'on', s.e_captionLang.trim());
    if (s.e_autoLoop) v.loop = true;
    if (s.e_noAutonext) autoNextOff();
    if (s.e_noAutoplay && !(s.e_noAutoplayList && /[?&]list=/.test(location.search))) {
      // Pause as soon as a new video loads; leave it alone if the user steps in (click/key)
      [50, 500].forEach((ms) => setTimeout(() => { if (!v.paused && !v.dataset.ytxUserPlayed) v.pause(); }, ms));
    }
    if (s.e_autoTheater) setTheater(true);
    if (s.e_expandDesc) expandDescription();
    if (s.e_focus) { const p = player(); if (p) p.focus({ preventScroll: true }); }
  }

  function autoNextOff() {
    const b = $('.ytp-autonav-toggle-button[aria-checked="true"]');
    if (b) b.click();
  }
  function setTheater(on) {
    const flexy = $('ytd-watch-flexy');
    if (!flexy || flexy.hasAttribute('theater') === on || flexy.hasAttribute('fullscreen')) return;
    const b = $('.ytp-size-button');
    if (b) b.click();
  }
  function expandDescription() {
    const tries = [() => $('tp-yt-paper-button#expand'), () => $('#description-inline-expander #expand'), () => $('ytd-text-inline-expander #expand')];
    setTimeout(() => { for (const t of tries) { const b = t(); if (b && YTX.visible(b)) { b.click(); break; } } }, 1200);
  }

  // ---------- Page variables (column count, accent color) ----------
  function applyVars() {
    const s = YTX.s, root = document.documentElement;
    root.classList.toggle('ytx-gridOn', s.h_cols > 0);
    root.style.setProperty('--ytx-cols', s.h_cols);
    root.classList.toggle('ytx-accentOn', !!s.h_accentOn);
    root.style.setProperty('--ytx-accent', s.h_accent);
  }
  function clearVars() {
    const root = document.documentElement;
    root.classList.remove('ytx-gridOn', 'ytx-accentOn');
    ['--ytx-cols', '--ytx-accent'].forEach((p) => root.style.removeProperty(p));
  }

  // ---------- Klavye (ses) ----------
  function onKey(e) {
    const s = YTX.s;
    if (!s.s_on || !onWatch()) return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    const combo = YTX.comboFromEvent(e);
    if (!combo) return;
    if (s.s_volUp && s.s_volUp === combo) { e.preventDefault(); e.stopPropagation(); setVolume(volNow() + s.s_volStep); }
    else if (s.s_volDown && s.s_volDown === combo) { e.preventDefault(); e.stopPropagation(); setVolume(volNow() - s.s_volStep); }
  }

  // ---------- Video events ----------
  function onVideoEvent(e) {
    const v = e.target;
    if (!(v instanceof HTMLVideoElement) || !v.classList.contains('html5-main-video')) return;
    if (e.type === 'loadedmetadata') {
      const key = location.href + '|' + (v.currentSrc || '').slice(-24);
      if (key !== lastVideoKey) { lastVideoKey = key; delete v.dataset.ytxUserPlayed; applyDefaults(); }
    } else if (e.type === 'play' && YTX.s.e_pauseOthers && bcast) bcast.postMessage({ t: 'play', id: tabId });
  }
  const onUserGesture = () => { const v = video(); if (v) v.dataset.ytxUserPlayed = '1'; };
  function onVisibility() {
    const s = YTX.s, v = video();
    if (!v || !s.e_pauseHidden) return;
    if (document.hidden) { if (!v.paused) { v.pause(); v.dataset.ytxAutoPaused = '1'; } }
    else if (s.e_resumeVisible && v.dataset.ytxAutoPaused) { delete v.dataset.ytxAutoPaused; v.play(); }
  }
  function onBroadcast(e) {
    const v = video();
    if (e.data && e.data.t === 'play' && e.data.id !== tabId && YTX.s.e_pauseOthers && v && !v.paused) v.pause();
  }
  const onNav = () => { lastVideoKey = ''; setTimeout(applyDefaults, 600); };

  const VIDEO_EVENTS = ['loadedmetadata', 'play'];

  YTX.register({
    id: 'enhancer',
    async start() {
      const r = await chrome.storage.local.get(STATE_KEY);
      state = Object.assign(state, r[STATE_KEY] || {});
      if (!started) {
        started = true;
        try { bcast = new BroadcastChannel('ytx-pause'); bcast.onmessage = onBroadcast; } catch (e) { bcast = null; }
      }
      VIDEO_EVENTS.forEach((n) => document.addEventListener(n, onVideoEvent, true));
      ['pointerdown', 'keydown'].forEach((n) => document.addEventListener(n, onUserGesture, true));
      window.addEventListener('keydown', onKey, true);
      document.addEventListener('visibilitychange', onVisibility);
      YTX.onNav(onNav);
      this.update();
      applyDefaults();
    },
    stop() {
      qualityToken++;
      VIDEO_EVENTS.forEach((n) => document.removeEventListener(n, onVideoEvent, true));
      ['pointerdown', 'keydown'].forEach((n) => document.removeEventListener(n, onUserGesture, true));
      window.removeEventListener('keydown', onKey, true);
      document.removeEventListener('visibilitychange', onVisibility);
      YTX.offNav(onNav);
      clearVars();
      const v = video();
      if (v) v.loop = false;
    },
    update() { applyVars(); },
  });
})();
