/* Kendi kendini yenileme: eklenti klasöründeki dosyalar güncellenirse (ör. git pull ile)
 * diskteki manifest sürümü yüklü sürümden farklı olduğunda eklenti kendini yeniden yükler. */
const ALARM = 'ytx-selfupdate';

async function check() {
  try {
    const res = await fetch(chrome.runtime.getURL('manifest.json'), { cache: 'no-store' });
    const disk = (await res.json()).version;
    if (disk && disk !== chrome.runtime.getManifest().version) chrome.runtime.reload();
  } catch (e) { /* dosyaya erişilemedi: sonraki denemede */ }
}

chrome.alarms.get(ALARM, (a) => { if (!a) chrome.alarms.create(ALARM, { periodInMinutes: 15 }); });
chrome.alarms.onAlarm.addListener((a) => { if (a.name === ALARM) check(); });
chrome.runtime.onStartup.addListener(check);
chrome.runtime.onInstalled.addListener(check);
