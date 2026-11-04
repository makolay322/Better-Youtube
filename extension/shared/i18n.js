/* UI translations. English lives inline (schema.js and the t() fallbacks), other
 * languages in shared/locales/<code>.js as flat { id: text } maps.
 *
 * Ids:  s.<section> / s.<section>.d        section title / description
 *       <key or action id> / <id>.d        item label / description
 *       o.<key>.<value>                     select option
 *       g.<group>                           nav group
 *       ui.<name>                           everything else
 * Text may contain {name} placeholders. */
(function (g) {
  'use strict';
  const YTX = (g.YTX = g.YTX || {});
  YTX.LOCALES = YTX.LOCALES || {};
  let dict = {}, lang = 'en';

  function detect() {
    let l = 'en';
    try { l = (g.chrome && chrome.i18n && chrome.i18n.getUILanguage()) || navigator.language || 'en'; } catch (e) { /* ignore */ }
    l = l.toLowerCase().split(/[-_]/)[0];
    return (YTX.LANGS || []).some(([c]) => c === l) ? l : 'en';
  }

  function setLang(pref) {
    lang = !pref || pref === 'auto' ? detect() : pref;
    dict = YTX.LOCALES[lang] || {};
    if (g.document && document.documentElement) document.documentElement.lang = lang;
    return lang;
  }

  function t(id, fallback, vars) {
    let s = Object.prototype.hasOwnProperty.call(dict, id) ? dict[id] : fallback != null ? fallback : id;
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
    return s;
  }

  // Schema helpers
  const secTitle = (sec) => t('s.' + sec.id, sec.title);
  const secDesc = (sec) => t('s.' + sec.id + '.d', sec.desc);
  const label = (it) => t(it.key || it.id, it.label);
  const desc = (it) => (it.desc ? t((it.key || it.id) + '.d', it.desc) : '');
  const option = (it, o) => (o[2] === 0 ? o[1] : t('o.' + it.key + '.' + o[0], o[1]));
  const group = (id) => t('g.' + id, (YTX.GROUPS || {})[id] || id);

  // Static HTML: data-i18n="id" (textContent), data-i18n-ph="id" (placeholder), data-i18n-title="id"
  function applyStatic(root) {
    (root || document).querySelectorAll('[data-i18n], [data-i18n-ph], [data-i18n-title]').forEach((el) => {
      if (!el.dataset.en) el.dataset.en = el.dataset.i18n ? el.textContent : '';
      if (el.dataset.i18n) el.textContent = t(el.dataset.i18n, el.dataset.en);
      if (el.dataset.i18nPh) {
        if (!el.dataset.enPh) el.dataset.enPh = el.placeholder;
        el.placeholder = t(el.dataset.i18nPh, el.dataset.enPh);
      }
      if (el.dataset.i18nTitle) {
        if (!el.dataset.enTitle) el.dataset.enTitle = el.title;
        el.title = t(el.dataset.i18nTitle, el.dataset.enTitle);
      }
    });
  }

  Object.assign(YTX, { t, setLang, getLang: () => lang, applyStatic, tr: { secTitle, secDesc, label, desc, option, group } });
})(typeof globalThis !== 'undefined' ? globalThis : window);
