/* Playlist temizleyici. Sayfada kutu göstermez; eklenti penceresinden (popup) mesajla başlatılır/durdurulur. */
(function () {
  'use strict';
  const YTX = window.YTX;
  const { sleep, visible, realClick } = YTX;

  const LINK_SELECTOR = 'a[href*="/watch?v="]';
  const SKIP_AREA = 'ytd-playlist-header-renderer, ytd-playlist-sidebar-renderer, yt-page-header-renderer, ytd-masthead, ytd-miniplayer';
  const MENU_BTN_SELECTOR = '[class*="MenuButton"] button, #menu button, ytd-menu-renderer button, button[aria-label*="menu" i], button[aria-label*="menü" i], button[aria-label*="eylem" i], button[aria-label*="action" i], button[aria-label*="aktion" i]';
  const MENU_ITEM_SELECTOR = 'ytd-menu-service-item-renderer, yt-list-item-view-model, tp-yt-paper-item, ytd-menu-navigation-item-renderer, [role="menuitem"]';
  const POPUP_AREA = 'ytd-popup-container, tp-yt-iron-dropdown, ytd-menu-popup-renderer, yt-contextual-sheet-layout, yt-sheet-view-model, [role="menu"], [role="dialog"]';
  const CLICKABLE = 'yt-list-item-view-model, ytd-menu-service-item-renderer, tp-yt-paper-item, [role="menuitem"], button, a';
  const KNOWN_TILES = 'ytd-playlist-video-renderer, yt-lockup-view-model, ytd-playlist-panel-video-renderer';
  const BASE_REMOVE = 'remove from|kaldır|entfernen|supprimer|eliminar|quitar|rimuovi';

  let removeText = new RegExp(BASE_REMOVE, 'i');
  let running = false, removed = 0, failed = 0, lastReason = '';

  const videoId = (a) => (a.getAttribute('href').match(/[?&]v=([\w-]+)/) || [])[1];

  function popupTexts() {
    const out = [];
    document.querySelectorAll(POPUP_AREA + ', ' + MENU_ITEM_SELECTOR).forEach((el) => {
      if (!visible(el)) return;
      const t = el.textContent.replace(/\s+/g, ' ').trim();
      if (t && t.length < 90 && !out.includes(t)) out.push(t);
    });
    return out;
  }

  function findRemoveItem() {
    const direct = [...document.querySelectorAll(MENU_ITEM_SELECTOR)].find(
      (el) => visible(el) && removeText.test(el.textContent) && el.textContent.length < 120
    );
    if (direct) return direct;
    for (const area of document.querySelectorAll(POPUP_AREA)) {
      if (!visible(area)) continue;
      const hit = [...area.querySelectorAll('*')].filter((el) => !el.children.length && visible(el) && removeText.test(el.textContent))[0];
      if (hit) return hit.closest(CLICKABLE) || hit;
    }
    return null;
  }

  // Karo: video linkini ve tek bir üç nokta menü düğmesini içeren en büyük üst eleman
  function findItems() {
    const items = new Set();
    document.querySelectorAll(LINK_SELECTOR).forEach((a) => {
      if (a.closest(SKIP_AREA)) return;
      const id = videoId(a);
      let tile = null;
      for (let el = a.parentElement; el && el !== document.body; el = el.parentElement) {
        const menus = el.querySelectorAll(MENU_BTN_SELECTOR).length;
        const otherVideo = [...el.querySelectorAll(LINK_SELECTOR)].some((l) => videoId(l) !== id);
        if (menus > 1 || otherVideo) break;
        if (menus === 1) tile = el;
      }
      if (!tile) tile = a.closest(KNOWN_TILES);
      if (tile) items.add(tile);
    });
    document.querySelectorAll('ytd-playlist-video-renderer').forEach((el) => items.add(el));
    return [...items];
  }

  const nextItem = () => findItems().find((el) => !el.dataset.ytxpFailed && !el.dataset.ytxpDone && visible(el));
  const hasVideo = (id) => [...document.querySelectorAll(LINK_SELECTOR)].some((a) => videoId(a) === id && visible(a) && !a.closest(SKIP_AREA));

  async function removeOne(item) {
    const s = YTX.s;
    const link = item.querySelector(LINK_SELECTOR);
    const id = link && videoId(link);
    item.scrollIntoView({ block: 'center' });
    await sleep(150);
    item.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    const btn = item.querySelector(MENU_BTN_SELECTOR);
    if (!btn) { lastReason = 'menü düğmesi yok'; return false; }
    realClick(btn);

    const entry = await YTX.waitFor(findRemoveItem, s.p_waitMenu);
    if (!entry) {
      lastReason = 'kaldır öğesi yok; menüde görünenler: ' + (popupTexts().join(' | ') || '(menü açılmadı)');
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      document.body.click();
      return false;
    }
    const leaf = [...entry.querySelectorAll('*')].filter((el) => !el.children.length && removeText.test(el.textContent))[0];
    const targets = [entry.querySelector('button, a, [role="button"], [role="menuitem"]'), leaf, entry]
      .filter((el, i, arr) => el && arr.indexOf(el) === i);
    // YouTube öğeyi sunucuda siler ama karoyu hemen kaldırmayabilir: menünün kapanması da başarı sayılır
    const isGone = () => !item.isConnected || !visible(item) || (id && !hasVideo(id)) || !visible(entry);
    let gone = false;
    for (const t of targets) {
      realClick(t); t.click();
      gone = await YTX.waitFor(isGone, Math.min(2500, s.p_waitRemoved));
      if (gone) break;
    }
    if (!gone) lastReason = 'tıklandı ama menü kapanmadı: ' + entry.textContent.replace(/\s+/g, ' ').trim() +
      ' [hedef: ' + targets.map((t) => t.tagName.toLowerCase()).join(',') + ']';
    else item.dataset.ytxpDone = '1';
    return !!gone;
  }

  const onPlaylist = () => location.pathname === '/playlist';
  const snapshot = () => ({
    onPlaylist: onPlaylist(), running, removed, failed, lastReason,
    items: onPlaylist() ? findItems().length : 0,
  });

  async function run() {
    const s = YTX.s;
    running = true;
    let loadTries = 0, streak = 0;
    lastReason = '';
    while (running) {
      if (s.p_limit > 0 && removed >= s.p_limit) break;
      const item = nextItem();
      if (!item) {
        if (loadTries++ >= YTX.s.p_maxLoadTries) break; // liste tembel yükleniyor: kaydırıp bekle
        window.scrollTo(0, document.documentElement.scrollHeight);
        await sleep(YTX.s.p_scrollDelay);
        continue;
      }
      loadTries = 0;
      const ok = await removeOne(item);
      if (ok) { removed++; streak = 0; }
      else { failed++; streak++; item.dataset.ytxpFailed = '1'; if (streak >= YTX.s.p_maxFailStreak) break; }
      await sleep(YTX.s.p_stepDelay);
    }
    running = false;
  }

  // Popup'tan gelen komutlar: status | start | stop
  function onMessage(msg, sender, reply) {
    if (!msg || msg.ytx !== 'pl') return;
    if (msg.cmd === 'start' && !running && onPlaylist()) { removed = 0; failed = 0; run(); }
    else if (msg.cmd === 'stop') running = false;
    reply(snapshot());
  }
  const onNav = () => { if (!onPlaylist()) running = false; };

  function compile() {
    const extra = String(YTX.s.p_extraText || '').trim();
    try { removeText = new RegExp(BASE_REMOVE + (extra ? '|' + extra : ''), 'i'); } catch (e) { removeText = new RegExp(BASE_REMOVE, 'i'); }
  }

  YTX.register({
    id: 'playlist',
    start() {
      compile();
      removed = 0; failed = 0; lastReason = '';
      chrome.runtime.onMessage.addListener(onMessage);
      YTX.onNav(onNav);
    },
    stop() {
      running = false;
      chrome.runtime.onMessage.removeListener(onMessage);
      YTX.offNav(onNav);
    },
    update() { compile(); },
  });
})();
