/* Self-reload: if the files in the extension folder are updated (e.g. via git pull),
 * the extension reloads itself when the manifest version on disk differs from the loaded one. */
const ALARM = 'ytx-selfupdate';

async function check() {
  try {
    const res = await fetch(chrome.runtime.getURL('manifest.json'), { cache: 'no-store' });
    const disk = (await res.json()).version;
    if (disk && disk !== chrome.runtime.getManifest().version) chrome.runtime.reload();
  } catch (e) { /* file not accessible: try again next time */ }
}

chrome.alarms.get(ALARM, (a) => { if (!a) chrome.alarms.create(ALARM, { periodInMinutes: 15 }); });
chrome.alarms.onAlarm.addListener((a) => { if (a.name === ALARM) check(); });
chrome.runtime.onStartup.addListener(check);
chrome.runtime.onInstalled.addListener(check);
