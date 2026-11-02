/* Tüm sitelerde video hızı: G = hazır hız, R = 1x, O = yavaşlat, P = hızlandır.
 * Son hız tarayıcı genelinde (chrome.storage.local) hatırlanır ve açılan her videoya uygulanır. */
(function () {
  'use strict';
  const YTX = window.YTX;
  if (!YTX || !window.chrome || !chrome.storage || window.__ytxSpeed) return;
  window.__ytxSpeed = true;

  const KEY = 'ytxSpeed';
  let s = Object.assign({}, YTX.DEFAULTS);
  let rate = 1;
  let gen = 0;                 // kullanıcı hızı elle değiştirince artar; bekleyen otomatik uygulamalar iptal olur
  const seen = new WeakMap();  // video -> son uygulanan kaynak anahtarı
  let osdEl = null, osdTimer = null;

  const active = () => !!(s.enabled && s.sp_on);
  const clamp = (r) => Math.round(Math.min(16, Math.max(0.1, r)) * 100) / 100;
  const area = (v) => v.clientWidth * v.clientHeight;

  function pickVideo() {
    const all = [...document.querySelectorAll('video')];
    if (!all.length) return null;
    const playing = all.filter((v) => !v.paused && !v.ended);
    return (playing.length ? playing : all).sort((a, b) => area(b) - area(a))[0];
  }

  function osd(v, text) {
    if (!s.sp_osd) return;
    if (!osdEl) {
      osdEl = document.createElement('div');
      osdEl.setAttribute('style', 'position:fixed;z-index:2147483647;pointer-events:none;background:rgba(0,0,0,.75);color:#fff;' +
        'padding:6px 12px;border-radius:8px;font:600 16px/1.2 system-ui,sans-serif;transition:opacity .15s;opacity:0');
    }
    const host = document.fullscreenElement || document.body;
    if (osdEl.parentElement !== host) host.appendChild(osdEl);
    const r = v.getBoundingClientRect();
    osdEl.style.left = Math.max(8, r.left + 12) + 'px';
    osdEl.style.top = Math.max(8, r.top + 12) + 'px';
    osdEl.textContent = text;
    osdEl.style.opacity = '1';
    clearTimeout(osdTimer);
    osdTimer = setTimeout(() => { if (osdEl) osdEl.style.opacity = '0'; }, 900);
  }

  function setRate(v, r) {
    v.playbackRate = r;
    v.preservesPitch = v.webkitPreservesPitch = !!s.sp_pitch;
  }

  // Kullanıcı eylemi: hızı uygula, kaydet, göster
  function userSet(r) {
    const v = pickVideo();
    if (!v) return false;
    r = clamp(r);
    gen++;
    rate = r;
    setRate(v, r);
    try { chrome.storage.local.set({ [KEY]: r }); } catch (e) { /* uzantı yeniden yüklendi */ }
    osd(v, `Hız: ${r}x`);
    return true;
  }

  // Yeni video: hatırlanan hızı uygula (site hızı sıfırlarsa kısa süre sonra yeniden)
  function autoApply(v) {
    if (!active() || !s.sp_remember || !(v instanceof HTMLVideoElement)) return;
    const key = (v.currentSrc || v.src || '') + '|' + location.href;
    if (seen.get(v) === key) return;
    seen.set(v, key);
    const myGen = gen;
    const go = () => { if (gen === myGen && active() && Math.abs(v.playbackRate - rate) > 0.001) setRate(v, rate); };
    setRate(v, rate);
    [300, 1200].forEach((ms) => setTimeout(go, ms));
  }

  function onMedia(e) { autoApply(e.target); }

  function onKey(e) {
    if (!active()) return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    const combo = YTX.comboFromEvent(e);
    if (!combo) return;
    const acts = [
      ['sp_kPreset', () => s.sp_preset], ['sp_kReset', () => 1],
      ['sp_kSlow', (v) => v.playbackRate - s.sp_step], ['sp_kFast', (v) => v.playbackRate + s.sp_step],
    ];
    for (const [key, calc] of acts) {
      if (!s[key] || s[key] !== combo) continue;
      const v = pickVideo();
      if (!v) return; // sayfada video yoksa tuşa dokunma
      e.preventDefault(); e.stopPropagation();
      userSet(calc(v));
      return;
    }
  }

  function start() {
    ['loadedmetadata', 'loadstart', 'playing'].forEach((n) => document.addEventListener(n, onMedia, true));
    window.addEventListener('keydown', onKey, true);
    document.querySelectorAll('video').forEach((v) => { if (v.readyState >= 1) autoApply(v); });
  }

  chrome.storage.onChanged.addListener((ch, area) => {
    if (area !== 'local') return;
    if (ch[YTX.STORE_KEY]) s = Object.assign({}, YTX.DEFAULTS, ch[YTX.STORE_KEY].newValue || {});
    if (ch[KEY] && typeof ch[KEY].newValue === 'number') rate = clamp(ch[KEY].newValue); // diğer sekmede değişti: sonraki videolar için
  });

  (async function boot() {
    try {
      const [a, b] = await Promise.all([YTX.loadSettings(), chrome.storage.local.get(KEY)]);
      s = a;
      if (typeof b[KEY] === 'number') rate = clamp(b[KEY]);
    } catch (e) { return; }
    start();
  })();
})();
