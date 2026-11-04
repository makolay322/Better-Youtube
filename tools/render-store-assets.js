/* Renders store images into store/ and docs/img/og.png.
 * Usage: node tools/render-store-assets.js   (needs Playwright; screenshots in docs/img must exist) */
const { chromium } = require('playwright');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const fs = require('fs');
const MIME = { '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png' };
const img = (f) => `data:${MIME[path.extname(f)]};base64,` + fs.readFileSync(path.join(ROOT, 'docs', f)).toString('base64');

const base = `
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;700;800&display=swap" rel="stylesheet">
  <style>
  *{box-sizing:border-box} body{margin:0;font-family:Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
  .bg{position:absolute;inset:0;background:linear-gradient(125deg,#ff8a3d,#e3245f)}
  .bg::after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 85% 10%,rgba(255,255,255,.25),transparent 45%),radial-gradient(circle at 10% 100%,rgba(80,0,40,.25),transparent 50%)}
  .shot{border-radius:14px;overflow:hidden;box-shadow:0 30px 60px -20px rgba(60,0,30,.55),0 0 0 1px rgba(255,255,255,.25);background:#fff}
  .shot img{display:block;width:100%}
  h1,h2{margin:0;color:#fff;letter-spacing:-.03em}
  p{margin:0;color:rgba(255,255,255,.9)}
  </style>`;

const SHOTS = [
  ['01-hiding', 'Hide Shorts, Mixes and clutter', 'Every rule has its own switch.', 'img/options-hide-light.webp'],
  ['02-speed', 'Speed hotkeys on every site', 'G · R · O · P — remembered browser-wide.', 'img/options-light.webp'],
  ['03-popup', 'Most used switches, one click away', 'Quality, speed and hiding right from the toolbar.', 'img/popup-light.webp', true],
  ['04-dark', 'Light and dark, searchable settings', 'JSON export / import · 8 languages.', 'img/options-dark.webp'],
];

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ deviceScaleFactor: 1 });
  const render = async (w, h, html, out) => {
    await p.setViewportSize({ width: w, height: h });
    await p.setContent(`<html><head>${base}</head><body style="width:${w}px;height:${h}px;position:relative;overflow:hidden"><div class="bg"></div>${html}</body></html>`, { waitUntil: 'networkidle' });
    await p.screenshot({ path: path.join(ROOT, out) });
    console.log(out);
  };

  for (const [name, title, sub, src, popup] of SHOTS) {
    const visual = popup
      ? `<div class="shot" style="position:absolute;right:120px;top:70px;width:340px;height:760px"><img src="${img(src)}"></div>`
      : `<div class="shot" style="position:absolute;left:330px;top:250px;width:1100px"><img src="${img(src)}"></div>`;
    const text = popup
      ? `<div style="position:absolute;left:96px;top:0;bottom:0;width:640px;display:flex;flex-direction:column;justify-content:center;gap:18px">
           <img src="${img('icon.svg')}" width="88" height="88"><h1 style="font-size:58px;line-height:1.05">${title}</h1><p style="font-size:26px">${sub}</p></div>`
      : `<div style="position:absolute;left:80px;top:70px;width:1120px"><h1 style="font-size:54px;line-height:1.05">${title}</h1><p style="font-size:24px;margin-top:12px">${sub}</p></div>`;
    await render(1280, 800, text + visual, `store/screenshots/${name}.png`);
  }

  const tile = (w, h, iconS, titleS, subS) => `
    <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:${iconS * .3}px">
      <img src="${img('icon.svg')}" width="${iconS}" height="${iconS}" style="filter:drop-shadow(0 10px 20px rgba(60,0,30,.35))">
      <div style="max-width:${w * .6}px"><h1 style="font-size:${titleS}px;line-height:1.02">Kolay for YouTube</h1><p style="font-size:${subS}px;margin-top:${subS * .5}px;font-weight:500">A calmer, faster YouTube.</p></div>
    </div>`;
  await render(440, 280, tile(440, 280, 96, 38, 17), 'store/promo-small-440x280.png');
  await render(1400, 560, tile(1400, 560, 200, 92, 36), 'store/promo-marquee-1400x560.png');

  await render(1200, 630, `
    <div style="position:absolute;left:72px;top:0;bottom:0;width:560px;display:flex;flex-direction:column;justify-content:center;gap:20px">
      <img src="${img('icon.svg')}" width="84" height="84">
      <h1 style="font-size:64px;line-height:1.02">YouTube, the way you want it.</h1>
      <p style="font-size:24px">Free for Chrome &amp; Firefox · No tracking</p>
    </div>
    <div class="shot" style="position:absolute;left:680px;top:70px;width:900px"><img src="${img('img/options-hide-light.webp')}"></div>`, 'docs/img/og.png');

  await b.close();
})();
