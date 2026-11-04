/* Popup: settings marked quick:true in the schema + the playlist cleaner button. */
(async function () {
  'use strict';
  const YTX = window.YTX, h = YTX.h, { t, tr } = YTX;
  let s = await YTX.loadSettings();
  YTX.setLang(s.ui_lang);
  YTX.applyStatic();
  const list = document.getElementById('list');

  let patch = {}, timer = null;
  const ctx = {
    get: (k) => s[k],
    set(k, v) {
      s[k] = v; patch[k] = v;
      clearTimeout(timer);
      timer = setTimeout(async () => { const p = patch; patch = {}; await YTX.saveSettings(p); update(); }, 120);
      update();
    },
    run() {},
  };

  const rows = [];
  function update() {
    rows.forEach(({ item, el }) => el.classList.toggle('disabled', !YTX.depOk(item, s)));
    document.body.classList.toggle('off', !s.enabled);
    offNote.hidden = !!s.enabled;
  }
  const offNote = h('p', { class: 'off-note', hidden: true }, t('ui.offNote', 'The extension is off — no feature runs.'));

  function render() {
    list.textContent = '';
    // Master switch
    const master = YTX.ITEMS.enabled;
    list.append(row(master, true), offNote);
    for (const sec of YTX.SCHEMA) {
      const items = sec.items.filter((i) => i.quick && i.key !== 'enabled');
      if (!items.length) continue;
      list.append(h('h3', null, tr.secTitle(sec)));
      items.forEach((it) => list.append(row(it)));
    }
  }
  function row(it, strong) {
    const el = h('div', { class: 'row' + (strong ? ' master' : '') + (it.type === 'select' ? ' sel' : '') }, h('label', { class: 'label' + (strong ? ' strong' : ''), for: 'f_' + it.key }, tr.label(it)), h('div', { class: 'ctl' }, YTX.control(it, ctx)));
    rows.push({ item: it, el });
    return el;
  }

  // --- Playlist cleaning (message to the page's content script) ---
  const plBox = document.getElementById('pl');
  let plTimer = null;
  async function send(cmd, extra) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return null;
    try { return await chrome.tabs.sendMessage(tab.id, Object.assign({ ytx: 'pl', cmd }, extra)); } catch (e) { return null; }
  }
  async function renderPlaylist() {
    const st = await send('status');
    plBox.textContent = '';
    if (!st || !st.onPlaylist) { plBox.hidden = true; clearTimeout(plTimer); return; }
    plBox.hidden = false;
    const info = h('div', { class: 'pl-info' }, st.running
      ? t('ui.plRunning', 'Running… Removed: {r} · Failed: {f}', { r: st.removed, f: st.failed })
      : st.removed || st.failed
        ? t('ui.plDone', 'Removed: {r} · Failed: {f}', { r: st.removed, f: st.failed }) + (st.lastReason ? '\n' + t('ui.plLastError', 'Last error:') + ' ' + st.lastReason : '')
        : t('ui.plReady', 'Ready · loaded videos: {n}', { n: st.items }));
    const btn = h('button', { class: st.running ? '' : 'primary', onclick: async () => {
      if (st.running) { await send('stop'); }
      else {
        if (s.p_confirm && !confirm(t('ui.plConfirm', 'Videos in this list will be removed one by one (currently loaded: {n}). Continue?', { n: st.items }))) return;
        await send('start');
      }
      renderPlaylist();
    } }, st.running ? t('ui.plStop', 'Stop') : t('ui.plClear', 'Clear list'));
    plBox.append(h('h3', null, t('ui.plTitle', 'This playlist')), info, btn);
    clearTimeout(plTimer);
    if (st.running) plTimer = setTimeout(renderPlaylist, 1000);
  }

  render(); update(); renderPlaylist();
  document.getElementById('ver').textContent = 'v' + chrome.runtime.getManifest().version;
  document.getElementById('opts').addEventListener('click', () => { chrome.runtime.openOptionsPage(); window.close(); });
})();
