/* Checks that every locale in extension/shared/locales/ translates every string,
 * has no stale ids and keeps the same {placeholders} as English.
 *   node tools/check-i18n.js          -> exit 1 on problems
 *   node tools/check-i18n.js --dump   -> prints the English catalog as JSON */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const EXT = path.join(ROOT, 'extension');

global.window = global;
require(path.join(EXT, 'shared/schema.js'));
const Y = global.YTX;

// 1. Schema strings
const en = {};
for (const [g, n] of Object.entries(Y.GROUPS)) en['g.' + g] = n;
for (const s of Y.SCHEMA) {
  en['s.' + s.id] = s.title;
  en['s.' + s.id + '.d'] = s.desc;
  for (const it of s.items) {
    const id = it.key || it.id;
    en[id] = it.label;
    if (it.desc) en[id + '.d'] = it.desc;
    if (it.options) for (const o of it.options) if (o[2] !== 0) en['o.' + it.key + '.' + o[0]] = o[1];
  }
}
// 2. t('ui.x', 'English') calls and data-i18n="ui.x" attributes in the sources
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? (e.name === 'locales' ? [] : walk(path.join(d, e.name))) : [path.join(d, e.name)]);
for (const f of walk(EXT).filter((f) => /\.(js|html)$/.test(f))) {
  const src = fs.readFileSync(f, 'utf8');
  for (const m of src.matchAll(/\bt\('(ui\.\w+)', '((?:[^'\\]|\\.)*)'/g)) en[m[1]] = m[2].replace(/\\n/g, '\n');
  for (const m of src.matchAll(/<[^>]*\bdata-i18n[^>]*>([^<]*)/g)) {
    const tag = m[0], attr = (n) => (tag.match(new RegExp('\\s' + n + '="([^"]*)"')) || [])[1];
    const txt = attr('data-i18n'), ph = attr('data-i18n-ph'), tt = attr('data-i18n-title');
    if (txt && txt.startsWith('ui.')) en[txt] = m[1].trim();
    if (ph && ph.startsWith('ui.')) en[ph] = attr('placeholder');
    if (tt && tt.startsWith('ui.')) en[tt] = attr('title');
  }
}

if (process.argv.includes('--dump')) { console.log(JSON.stringify(en, null, 1)); process.exit(0); }

const ph = (s) => (s.match(/\{\w+\}/g) || []).sort().join(',');
const dir = path.join(EXT, 'shared/locales');
let bad = 0;
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.js')).sort()) {
  const code = f.replace('.js', '');
  require(path.join(dir, f));
  const loc = Y.LOCALES[code] || {};
  const missing = Object.keys(en).filter((k) => !(k in loc));
  const extra = Object.keys(loc).filter((k) => !(k in en));
  const phs = Object.keys(loc).filter((k) => k in en && ph(loc[k]) !== ph(en[k]));
  const empty = Object.keys(loc).filter((k) => !String(loc[k]).trim());
  const problems = [['missing', missing], ['stale', extra], ['placeholder mismatch', phs], ['empty', empty]].filter(([, l]) => l.length);
  console.log(`${code}: ${Object.keys(loc).length}/${Object.keys(en).length}` + (problems.length ? '' : ' ok'));
  for (const [what, l] of problems) { bad++; console.log(`  ${what}: ${l.join(', ')}`); }
}
process.exit(bad ? 1 : 0);
