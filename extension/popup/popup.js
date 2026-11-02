/* Açılır pencere: şemada quick:true işaretli ayarlar + playlist temizleme düğmesi. */
(async function () {
  'use strict';
  const YTX = window.YTX, h = YTX.h;
  let s = await YTX.loadSettings();
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
  function update() { rows.forEach(({ item, el }) => el.classList.toggle('disabled', !YTX.depOk(item, s))); }

  function render() {
    list.textContent = '';
    // Ana anahtar
    const master = YTX.ITEMS.enabled;
    list.append(row(master, true));
    for (const sec of YTX.SCHEMA) {
      const items = sec.items.filter((i) => i.quick && i.key !== 'enabled');
      if (!items.length) continue;
      list.append(h('h3', null, sec.title));
      items.forEach((it) => list.append(row(it)));
    }
  }
  function row(it, strong) {
    const el = h('div', { class: 'row' }, h('div', { class: 'label' + (strong ? ' strong' : '') }, it.label), h('div', { class: 'ctl' }, YTX.control(it, ctx)));
    rows.push({ item: it, el });
    return el;
  }

  // --- Playlist temizleme (sayfadaki içerik betiğine mesaj) ---
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
      ? `Çalışıyor… Kaldırılan: ${st.removed} · Başarısız: ${st.failed}`
      : st.removed || st.failed ? `Kaldırılan: ${st.removed} · Başarısız: ${st.failed}${st.lastReason ? '\nSon hata: ' + st.lastReason : ''}` : `Hazır · yüklü video: ${st.items}`);
    const btn = h('button', { class: st.running ? '' : 'primary', onclick: async () => {
      if (st.running) { await send('stop'); }
      else {
        if (s.p_confirm && !confirm(`Bu listedeki videolar tek tek kaldırılacak (şu an yüklü: ${st.items}). Devam edilsin mi?`)) return;
        await send('start');
      }
      renderPlaylist();
    } }, st.running ? 'Durdur' : 'Listeyi temizle');
    plBox.append(h('h3', null, 'Bu playlist'), info, btn);
    clearTimeout(plTimer);
    if (st.running) plTimer = setTimeout(renderPlaylist, 1000);
  }

  render(); update(); renderPlaylist();
  document.getElementById('ver').textContent = 'v' + chrome.runtime.getManifest().version;
  document.getElementById('opts').addEventListener('click', () => { chrome.runtime.openOptionsPage(); window.close(); });
})();
