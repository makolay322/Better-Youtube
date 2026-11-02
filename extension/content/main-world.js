/* Sayfa dünyasında (MAIN world) çalışır: YouTube oynatıcı API'sine yalnızca burada erişilebilir.
 * İçerik betiği window.postMessage ile komut gönderir, yanıtı aynı yolla alır. */
(function () {
  'use strict';
  // Yüksekten alçağa kalite sırası; seçilen yoksa aşağıya doğru ilk mevcut olan seçilir (4K → 2K → 1080p → ...)
  const ORDER = ['highres', 'hd2880', 'hd2160', 'hd1440', 'hd1080', 'hd720', 'large', 'medium', 'small', 'tiny'];
  const PREMIUM = /premium|enhanced|yüksek bit|high bitrate|bitrate/i;
  const player = () => document.getElementById('movie_player');

  const commands = {
    // q: istenen kalite, premium: aynı çözünürlükte yüksek bit hızlı sürüm varsa onu seç
    setQuality(p, q, premium) {
      if (!p.setPlaybackQualityRange || q === 'auto') return { ok: false };
      const levels = ((p.getAvailableQualityLevels && p.getAvailableQualityLevels()) || []).filter((l) => l !== 'auto');
      const data = (p.getAvailableQualityData && p.getAvailableQualityData()) || [];
      if (!levels.length && !data.length) return { ok: false, wait: true }; // oynatıcı henüz hazır değil
      const have = (l) => levels.includes(l) || data.some((d) => d.quality === l && d.isPlayable !== false);
      let pick;
      if (q === 'highres') pick = ORDER.find(have) || levels[0];
      else pick = ORDER.slice(Math.max(0, ORDER.indexOf(q))).find(have) || levels[levels.length - 1];
      if (!pick) return { ok: false };
      let formatId;
      if (premium) {
        const prem = data.find((d) => d.quality === pick && d.isPlayable !== false && d.formatId && PREMIUM.test(d.qualityLabel || ''));
        if (prem) formatId = prem.formatId;
      }
      if (formatId) p.setPlaybackQualityRange(pick, pick, formatId);
      else p.setPlaybackQualityRange(pick, pick);
      if (p.setPlaybackQuality) p.setPlaybackQuality(pick);
      return { ok: true, pick, premium: !!formatId };
    },
    setCaptions(p, mode, lang) {
      if (mode === 'never') { if (p.unloadModule) p.unloadModule('captions'); return true; }
      if (p.loadModule) p.loadModule('captions');
      if (lang && p.setOption) {
        const list = (p.getOption && p.getOption('captions', 'tracklist')) || [];
        const hit = list.find((t) => t.languageCode === lang) || list.find((t) => (t.languageCode || '').startsWith(lang));
        if (hit) p.setOption('captions', 'track', hit);
        return !!hit;
      }
      if (p.toggleSubtitlesOn) p.toggleSubtitlesOn();
      return true;
    },
    setVolume(p, v) { if (p.unMute && v > 0) p.unMute(); p.setVolume(Math.max(0, Math.min(100, v))); return true; },
    getInfo(p) {
      const d = (p.getVideoData && p.getVideoData()) || {};
      return { id: d.video_id, title: d.title, author: d.author, isLive: !!d.isLive, volume: p.getVolume && p.getVolume(), muted: p.isMuted && p.isMuted() };
    },
  };

  window.addEventListener('message', (e) => {
    const m = e.data;
    if (e.source !== window || !m || m.ytx !== 1 || typeof m.cmd !== 'string') return;
    let result = null, error = null;
    try {
      const p = player();
      if (!p) throw new Error('player yok');
      if (commands[m.cmd]) result = commands[m.cmd](p, ...(m.args || []));
    } catch (err) { error = String(err && err.message || err); }
    window.postMessage({ ytxr: 1, id: m.id, result, error }, '*');
  });
})();
