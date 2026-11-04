/* Settings page: generated from the schema, changes are saved instantly. */
(function () {
  'use strict';
  const YTX = window.YTX;
  const REPEAT_KEY = 'repeatCounts';
  let settings = Object.assign({}, YTX.DEFAULTS);
  const rows = {}; // key -> { item, el }

  const $ = (sel, root) => (root || document).querySelector(sel);
  const h = YTX.h;
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.classList.add('on');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), 2200);
  }

  // Batch changes and write once (sliders fire many events)
  let patch = {}, saveTimer = null;
  function set(key, value) {
    settings[key] = value;
    patch[key] = value;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => { const p = patch; patch = {}; await YTX.saveSettings(p); }, 150);
    updateDeps();
  }

  const ctx = { get: (k) => settings[k], set, run: (id) => runAction(id) };

  async function runAction(id) {
    if (id === 'repeatStats') {
      const r = (await chrome.storage.local.get(REPEAT_KEY))[REPEAT_KEY] || {};
      const ids = Object.keys(r);
      const hidden = ids.filter((k) => r[k].c >= settings.r_max).length;
      toast(`Tracked videos: ${ids.length}\nHidden (≥${settings.r_max} impressions): ${hidden}`);
    } else if (id === 'repeatReset') {
      if (!confirm('Delete all impression counters?')) return;
      await chrome.storage.local.remove(REPEAT_KEY);
      toast('Counters reset.');
    }
  }

  function build() {
    const nav = $('#nav'), main = $('#main');
    nav.textContent = ''; main.textContent = '';
    let lastGroup = null;
    YTX.SCHEMA.forEach((sec) => {
      if (sec.group !== lastGroup) { lastGroup = sec.group; nav.append(h('div', { class: 'nav-group' }, sec.group)); }
      const a = h('a', { href: '#sec_' + sec.id, onclick: (e) => { e.preventDefault(); $('#sec_' + sec.id).scrollIntoView({ behavior: 'smooth' }); } }, sec.title);
      a.dataset.sec = sec.id;
      nav.append(a);
      const card = h('section', { id: 'sec_' + sec.id, class: sec.group === 'Other' ? 'minor' : '' },
        h('div', { class: 'sec-head' }, h('h2', null, sec.title),
          h('button', { class: 'sec-reset', onclick: () => resetSection(sec) }, 'Reset section')),
        h('p', { class: 'sec-desc' }, sec.desc));
      for (const item of sec.items) {
        const wide = item.type === 'textarea';
        const label = h('div', null, h('div', { class: 'label' }, item.label), item.desc ? h('div', { class: 'desc' }, item.desc) : null);
        const ctl = h('div', { class: 'ctl' }, YTX.control(item, ctx));
        const row = h('div', { class: 'row' + (wide ? ' wide' : '') }, label, ctl);
        row.dataset.text = (item.label + ' ' + (item.desc || '') + ' ' + sec.title).toLowerCase();
        if (item.key) rows[item.key] = { item, el: row };
        card.append(row);
      }
      main.append(card);
    });
    updateDeps();
  }

  function updateDeps() {
    for (const { item, el } of Object.values(rows)) el.classList.toggle('disabled', !YTX.depOk(item, settings));
  }

  async function resetSection(sec) {
    if (!confirm(`Reset the settings in “${sec.title}” to defaults?`)) return;
    const p = {};
    sec.items.forEach((it) => { if (it.key) p[it.key] = it.def; });
    await YTX.saveSettings(p);
    settings = await YTX.loadSettings();
    build(); toast('Section reset.');
  }

  // Arama
  $('#search').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    document.querySelectorAll('.row').forEach((r) => r.classList.toggle('hidden', !!q && !r.dataset.text.includes(q)));
    document.querySelectorAll('section').forEach((s) => { s.style.display = q && !s.querySelector('.row:not(.hidden)') ? 'none' : ''; });
  });

  // Export / import / reset
  $('#export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const a = h('a', { href: URL.createObjectURL(blob), download: 'kolay-youtube-settings.json' });
    document.body.append(a); a.click(); a.remove();
  });
  $('#import').addEventListener('click', () => $('#file').click());
  $('#file').addEventListener('change', async (e) => {
    const f = e.target.files[0]; e.target.value = '';
    if (!f) return;
    try {
      const obj = JSON.parse(await f.text());
      const clean = {};
      for (const k of Object.keys(YTX.DEFAULTS)) if (k in obj && typeof obj[k] === typeof YTX.DEFAULTS[k]) clean[k] = obj[k];
      await YTX.replaceSettings(clean);
      settings = await YTX.loadSettings(); build();
      toast(`${Object.keys(clean).length} settings imported.`);
    } catch (err) { toast('Invalid settings file.'); }
  });
  $('#reset').addEventListener('click', async () => {
    if (!confirm('Reset all settings to defaults?')) return;
    await YTX.replaceSettings({});
    settings = await YTX.loadSettings(); build(); toast('Settings reset.');
  });

  // Highlight the active section in the side menu while scrolling
  const obs = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) {
      document.querySelectorAll('nav a').forEach((a) => a.classList.toggle('active', a.dataset.sec === e.target.id.slice(4)));
    } });
  }, { rootMargin: '-20% 0px -70% 0px' });

  // Refresh the page if settings change elsewhere (popup, shortcut)
  chrome.storage.onChanged.addListener((ch, area) => {
    if (area !== 'local' || !ch[YTX.STORE_KEY] || Object.keys(patch).length) return;
    const next = Object.assign({}, YTX.DEFAULTS, ch[YTX.STORE_KEY].newValue || {});
    const changed = Object.keys(next).filter((k) => next[k] !== settings[k]);
    if (!changed.length || document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    settings = next; build(); document.querySelectorAll('section').forEach((s) => obs.observe(s));
  });

  (async function init() {
    settings = await YTX.loadSettings();
    build();
    document.querySelectorAll('section').forEach((s) => obs.observe(s));
  })();
})();
