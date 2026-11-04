/* Screenshots of the popup and settings page for the landing page (docs/img/*.png).
 * Usage: tools/render-all.sh   (renders, converts to WebP and builds the store images)
 */
const { chromium } = require('playwright');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'docs/img');
const LANG = process.argv[2] || 'en';

(async () => {
  const ext = path.join(ROOT, 'extension');
  const ctx = await chromium.launchPersistentContext('', {
    headless: true, channel: 'chromium', deviceScaleFactor: 2,
    args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
  });
  let [sw] = ctx.serviceWorkers();
  if (!sw) sw = await ctx.waitForEvent('serviceworker');
  const id = sw.url().split('/')[2];
  await sw.evaluate((l) => chrome.storage.local.set({ settings: { ui_lang: l } }), LANG);
  const p = await ctx.newPage();
  for (const scheme of ['light', 'dark']) {
    await p.emulateMedia({ colorScheme: scheme });
    await p.setViewportSize({ width: 340, height: 600 });
    await p.goto(`chrome-extension://${id}/popup/popup.html`); await p.waitForTimeout(400);
    const h = await p.evaluate(() => document.documentElement.scrollHeight);
    await p.setViewportSize({ width: 340, height: h });
    await p.screenshot({ path: `${OUT}/popup-${scheme}.png` });
    await p.setViewportSize({ width: 1200, height: 750 });
    await p.goto(`chrome-extension://${id}/options/options.html`); await p.waitForTimeout(400);
    await p.screenshot({ path: `${OUT}/options-${scheme}.png` });
    await p.goto(`chrome-extension://${id}/options/options.html#sec_hide`); await p.reload(); await p.waitForTimeout(400);
    await p.screenshot({ path: `${OUT}/options-hide-${scheme}.png` });
  }
  await ctx.close();
  console.log('screenshots written to docs/img');
})();
