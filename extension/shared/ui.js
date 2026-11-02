/* Shared control builder for the options page and popup. */
(function (g) {
  'use strict';
  const YTX = g.YTX;

  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (v !== undefined && v !== null && v !== false) el.setAttribute(k, v === true ? '' : v);
    }
    kids.flat().forEach((c) => c != null && el.append(c));
    return el;
  }

  // ctx: { get(key), set(key, value), run(actionId) }
  function control(item, ctx) {
    const v = item.key ? ctx.get(item.key) : null;
    const id = 'f_' + item.key;
    switch (item.type) {
      case 'toggle': {
        const i = h('input', { type: 'checkbox', id });
        i.checked = !!v;
        i.addEventListener('change', () => ctx.set(item.key, i.checked));
        return h('label', { class: 'sw' }, i, h('i'));
      }
      case 'number': {
        const i = h('input', { type: 'number', min: item.min, max: item.max, step: item.step, id });
        i.value = v;
        i.addEventListener('change', () => {
          let n = parseFloat(i.value);
          if (!isFinite(n)) n = item.def;
          n = Math.min(item.max, Math.max(item.min, n));
          i.value = n; ctx.set(item.key, n);
        });
        return i;
      }
      case 'range': {
        const out = h('span', { class: 'rv' }, String(v));
        const i = h('input', { type: 'range', min: item.min, max: item.max, step: item.step, id });
        i.value = v;
        i.addEventListener('input', () => { out.textContent = i.value; ctx.set(item.key, parseFloat(i.value)); });
        return [i, out];
      }
      case 'select': {
        const s = h('select', { id }, item.options.map(([val, lab]) => h('option', { value: val }, lab)));
        s.value = v;
        s.addEventListener('change', () => ctx.set(item.key, s.value));
        return s;
      }
      case 'text': {
        const i = h('input', { type: 'text', id, spellcheck: 'false' });
        i.value = v;
        i.addEventListener('input', () => ctx.set(item.key, i.value));
        return i;
      }
      case 'textarea': {
        const t = h('textarea', { id, spellcheck: 'false', rows: 4 });
        t.value = v;
        t.addEventListener('input', () => ctx.set(item.key, t.value));
        return t;
      }
      case 'color': {
        const i = h('input', { type: 'color', id });
        i.value = v;
        i.addEventListener('input', () => ctx.set(item.key, i.value));
        return i;
      }
      case 'shortcut': {
        const box = h('div', { class: 'keybox', tabindex: '0', role: 'textbox' });
        const show = () => { const c = ctx.get(item.key); box.textContent = c || '(off)'; box.classList.toggle('empty', !c); };
        show();
        box.addEventListener('keydown', (e) => {
          e.preventDefault();
          if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'Delete') { ctx.set(item.key, ''); show(); return; }
          const c = YTX.comboFromEvent(e);
          if (c) { ctx.set(item.key, c); show(); }
        });
        box.addEventListener('focus', () => { box.textContent = 'Press a key…'; });
        box.addEventListener('blur', show);
        return box;
      }
      case 'action':
        return h('button', { class: item.danger ? 'danger' : '', onclick: () => ctx.run(item.id) }, item.label);
      default:
        return null;
    }
  }

  YTX.h = h;
  YTX.control = control;
})(typeof globalThis !== 'undefined' ? globalThis : window);
