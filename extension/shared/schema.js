/* Ayar şeması: seçenekler sayfası, popup ve içerik betikleri aynı tanımı kullanır.
 * Yeni ayar eklemek için buraya bir satır eklemek yeterlidir; seçenekler sayfası otomatik oluşur. */
(function (g) {
  'use strict';
  const YTX = (g.YTX = g.YTX || {});

  // --- Yardımcılar (öğe üreticileri) ---
  const tg = (key, label, def, desc, o) => ({ type: 'toggle', key, label, def, desc, ...o });
  const nm = (key, label, def, min, max, step, desc, o) => ({ type: 'number', key, label, def, min, max, step, desc, ...o });
  const rg = (key, label, def, min, max, step, desc, o) => ({ type: 'range', key, label, def, min, max, step, desc, ...o });
  const sl = (key, label, def, options, desc, o) => ({ type: 'select', key, label, def, options, desc, ...o });
  const tx = (key, label, def, desc, o) => ({ type: 'text', key, label, def, desc, ...o });
  const ta = (key, label, def, desc, o) => ({ type: 'textarea', key, label, def, desc, ...o });
  const co = (key, label, def, desc, o) => ({ type: 'color', key, label, def, desc, ...o });
  const sc = (key, label, def, desc, o) => ({ type: 'shortcut', key, label, def, desc, ...o });
  const ac = (id, label, desc, o) => ({ type: 'action', id, label, desc, ...o });
  const sec = (id, title, module, desc, items, group) => ({ id, title, module, desc, items, group: group || 'Diğer' });
  const TOP = 'Sık kullanılanlar';

  const QUALITIES = [
    ['auto', 'YouTube seçsin (otomatik)'], ['highres', 'En yüksek mevcut'], ['hd2160', '4K (2160p)'], ['hd1440', '2K (1440p)'],
    ['hd1080', '1080p'], ['hd720', '720p'], ['large', '480p'], ['medium', '360p'], ['small', '240p'], ['tiny', '144p'],
  ];

  const SCHEMA = [
    // ============ SIK KULLANILANLAR ============
    sec('speed', 'Video hızı (tüm siteler)', 'speed', 'YouTube dahil her sitedeki videolarda çalışır. Kısayollar yazı alanlarındayken devre dışıdır.', [
      tg('sp_on', 'Hız kısayollarını etkinleştir', true, '', { quick: true }),
      sc('sp_kPreset', 'Hazır hıza geç', 'G', 'Aşağıdaki “Hazır hız” değerini uygular.'),
      sc('sp_kReset', 'Normal hıza dön (1x)', 'R'),
      sc('sp_kSlow', 'Yavaşlat', 'O'),
      sc('sp_kFast', 'Hızlandır', 'P'),
      nm('sp_preset', 'Hazır hız', 1.5, 0.1, 16, 0.05, 'Hazır hız kısayolunun uygulayacağı değer.', { quick: true }),
      nm('sp_step', 'Yavaşlat / hızlandır adımı', 0.1, 0.05, 2, 0.05),
      tg('sp_remember', 'Son hızı tarayıcı genelinde hatırla', true, 'Seçtiğiniz son hız, tüm sitelerde açılan her videoya otomatik uygulanır.', { quick: true }),
      tg('sp_pitch', 'Hız değişince ses perdesini koru', true),
      tg('sp_osd', 'Hız değişince ekranda göster', true),
    ], TOP),

    sec('quality', 'Video kalitesi (YouTube)', 'enhancer', 'Seçilen kalite yoksa otomatik olarak bir alttaki en yüksek kalite seçilir (örn. 4K → 2K → 1080p → 720p…).', [
      sl('e_quality', 'Otomatik kalite', 'auto', QUALITIES, 'Her videoda uygulanır.', { quick: true }),
      tg('e_premium', 'Varsa yüksek bit hızlı sürümü tercih et', true, 'Seçilen çözünürlükte “Premium / yüksek bit hızı” seçeneği varsa onu kullanır, yoksa normal sürüme düşer.', { quick: true, dep: 'e_quality!=auto' }),
    ], TOP),

    sec('hide', 'Gizleme (YouTube)', 'clutter', 'Her öğe ayrı ayrı açılıp kapatılır. Ayrıntılı filtreler aşağıdaki “Diğer” bölümlerindedir.', [
      tg('c_shorts', 'Shorts (her yerde)', false, 'Ana sayfa, arama, abonelikler, öneriler, kanal sayfaları ve sol menü.', { cls: 'hideShorts', quick: true }),
      tg('c_topicShelves', 'Ana sayfadaki “Yeni konuları keşfedin” satırı', true, '', { quick: true }),
      tg('c_irrelevant', 'Anketler, YouTube Oyunları ve diğer alakasız öğeler', false, '“Bu video hoşunuza gitti mi?” anketi, oyun/Playables rafları, tanıtım bantları vb. Ek raf başlıkları “Diğer › Gizleme ayrıntıları” bölümünden eklenir.', { cls: 'hideIrrelevant', quick: true }),
      tg('m_repeat', 'Tekrar eden videolar', true, 'Birkaç kez gösterilmiş önerileri gizler.', { quick: true }),
      nm('r_max', 'Kaç gösterimden sonra gizlensin', 3, 1, 50, 1, '', { dep: 'm_repeat' }),
      tg('c_mixes', 'YouTube Mix', true, '“Your Mix” ve “Mix – ...” (RDCLAK resmi listeler hariç).', { quick: true }),
      tg('c_coursePodcast', 'Kurs ve podcast olarak çıkan playlistler', false, '', { quick: true }),
      tg('c_inProgress', 'Daha önce izlenmiş videolar', true, 'Küçük resminde izleme çubuğu olanlar. Oran aralığı “Diğer › Gizleme ayrıntıları”nda.', { quick: true }),
      tg('c_live', 'Şu an süren canlı yayınlar (yalnızca Abonelikler)', true, '', { quick: true }),
      tg('c_liveEnded', 'Bitmiş canlı yayınlar (yalnızca Abonelikler)', false, '', { quick: true }),
    ], TOP),

    // ============ DİĞER ============
    sec('clutter', 'Gizleme ayrıntıları', 'clutter', 'Gizleme bölümündeki kuralların inceliklerini ve ek filtreleri ayarlar.', [
      rg('c_progressMin', 'En az izlenme oranı (%)', 1, 1, 100, 1, 'Bu orandan az izlenmişse “izlenmiş” sayılmaz.', { dep: 'c_inProgress' }),
      rg('c_progressMax', 'En çok izlenme oranı (%)', 100, 1, 100, 1, 'Sadece tamamen izlenenleri gizlemek için min=90 yapın.', { dep: 'c_inProgress' }),
      tg('c_upcoming', 'Yaklaşan yayın / prömiyerleri gizle', false),
      tg('c_membersOnly', 'Üyelere özel videoları gizle', false),
      nm('c_minDuration', 'Şundan kısa videoları gizle (sn)', 0, 0, 36000, 10, '0 = kapalı.'),
      nm('c_maxDuration', 'Şundan uzun videoları gizle (sn)', 0, 0, 360000, 60, '0 = kapalı.'),
      ta('c_keywords', 'Başlıkta geçen anahtar kelimeler', '', 'Her satıra bir kelime. /regex/i biçimi de desteklenir. Eşleşen karolar gizlenir.'),
      ta('c_channels', 'Gizlenecek kanallar', '', 'Her satıra bir kanal adı (büyük/küçük harf fark etmez).'),
      ta('c_shelfTitles', 'Alakasız sayılacak ek raf başlıkları', 'playables\nyoutube oyun\nyoutube games\nilgili aramalar\nrelated searches', 'Her satıra bir başlık parçası. “Anketler, Oyunlar ve alakasız öğeler” açıkken, başlığı bunları içeren raflar gizlenir.', { dep: 'c_irrelevant' }),
      tg('c_dim', 'Gizlemek yerine soluklaştır', false, 'Karolar kaybolmaz, yalnızca silikleşir.', { cls: 'dimClutter' }),
      ta('c_excludePaths', 'Dokunulmayacak sayfalar', '/feed/history\n/playlist\n/feed/library\n/feed/you', 'Her satıra bir yol öneki. Bu sayfalarda hiçbir şey gizlenmez.'),
    ]),

    sec('repeat', 'Tekrar gizleyici ayrıntıları', 'repeat', 'Hangi sayfalarda ve nasıl sayılacağı.', [
      tg('r_home', 'Ana sayfada uygula', true),
      tg('r_watch', 'İzleme sayfası önerilerinde uygula', true),
      tg('r_search', 'Arama sonuçlarında uygula', false),
      tg('r_subs', 'Abonelikler sayfasında uygula', false),
      tg('r_shorts', 'Shorts’u da say', true),
      rg('r_visibility', 'Gösterim sayılma eşiği (%)', 10, 1, 100, 1, 'Karonun en az bu kadarı ekranda görününce “gösterildi” sayılır.'),
      nm('r_ageDays', 'Kayıt saklama süresi (gün)', 30, 1, 365, 1, 'Daha eski kayıtlar silinir.'),
      nm('r_maxEntries', 'En fazla kayıt sayısı', 20000, 500, 200000, 500),
      tg('r_dim', 'Gizlemek yerine soluklaştır', false, '', { cls: 'dimRepeat' }),
      ac('repeatStats', 'İstatistik', 'Kaç videonun sayıldığını ve kaçının gizlendiğini gösterir.'),
      ac('repeatReset', 'Sayaçları sıfırla', 'Tüm gösterim sayaçlarını siler.', { danger: true }),
    ]),

    sec('playlist', 'Playlist temizleyici', 'playlist', 'Başlatmak için bir playlist sayfasındayken eklenti simgesine tıklayın ve “Listeyi temizle” düğmesine basın.', [
      tg('p_confirm', 'Başlamadan önce onay iste', true),
      nm('p_limit', 'En fazla kaldırılacak video', 0, 0, 100000, 10, '0 = sınırsız. Bu sayıya ulaşınca durur.'),
      nm('p_stepDelay', 'İki silme arası bekleme (ms)', 700, 100, 10000, 50),
      nm('p_waitMenu', 'Menü öğesi için azami bekleme (ms)', 3000, 500, 15000, 100),
      nm('p_waitRemoved', 'Karonun kalkması için azami bekleme (ms)', 4000, 500, 20000, 100),
      nm('p_scrollDelay', 'Yeni video yükleme beklemesi (ms)', 1200, 300, 10000, 100),
      nm('p_maxLoadTries', 'Yeni video için kaydırma denemesi', 5, 1, 50, 1),
      nm('p_maxFailStreak', 'Üst üste kaç hatada dursun', 3, 1, 50, 1),
      tx('p_extraText', 'Ek “kaldır” kelimeleri', '', 'Başka dil için | ile ayırarak yazın. Örn: удалить|remover'),
    ]),

    sec('player', 'Oynatıcı (YouTube)', 'enhancer', 'Ses, altyazı ve otomatik davranışlar.', [
      sl('e_volMode', 'Varsayılan ses', 'off', [['off', 'YouTube’a bırak'], ['fixed', 'Sabit ses'], ['remember', 'Son kullandığımı hatırla']]),
      rg('e_volume', 'Sabit ses (%)', 50, 0, 100, 1, '', { dep: 'e_volMode=fixed' }),
      sl('e_captions', 'Altyazı', 'off', [['off', 'YouTube’a bırak'], ['on', 'Hep aç'], ['never', 'Hep kapat']]),
      tx('e_captionLang', 'Altyazı dili kodu', '', 'Boş = varsayılan. Örn: tr, en, de', { dep: 'e_captions=on' }),
      tg('e_noAutonext', 'Sonraki video otomatik oynatmayı kapat', false),
      tg('e_noAutoplay', 'Video yüklenince otomatik başlatma (duraklat)', false, 'Yeni sekmede açılan videoyu duraklatır.'),
      tg('e_noAutoplayList', 'Playlist’lerde bu kuralı uygulama', true, '', { dep: 'e_noAutoplay' }),
      tg('e_pauseHidden', 'Sekme gizlenince duraklat', false),
      tg('e_resumeVisible', 'Sekme görününce devam ettir', false, '', { dep: 'e_pauseHidden' }),
      tg('e_pauseOthers', 'Başka sekmedeki YouTube’u duraklat', false, 'Yeni bir video başlayınca diğer sekmelerdeki videolar durur.'),
      tg('e_autoLoop', 'Videoları otomatik döngüye al', false),
      tg('e_autoTheater', 'Sinema (geniş) modunda başlat', false),
      tg('e_expandDesc', 'Açıklamayı otomatik genişlet', false),
      tg('e_focus', 'Oynatıcıya odaklan', false, 'Klavye kısayollarının hemen çalışması için.'),
    ]),

    sec('page', 'Sayfa düzeni (YouTube)', 'enhancer', 'Arayüzün istenmeyen parçalarını gizle.', [
      tg('h_comments', 'Yorumları gizle', false, '', { cls: 'hideComments' }),
      tg('h_related', 'Önerilen videolar kenar çubuğunu gizle', false, '', { cls: 'hideRelated' }),
      tg('h_chat', 'Canlı sohbeti gizle', false, '', { cls: 'hideChat' }),
      tg('h_endcards', 'Bitiş kartlarını / ekranını gizle', false, '', { cls: 'hideEndCards' }),
      tg('h_cards', 'Bilgi kartları, notlar ve kanal logosunu gizle', false, '', { cls: 'hideCards' }),
      tg('h_watermark', 'Oynatıcıdaki kanal filigranını gizle', false, '', { cls: 'hideWatermark' }),
      tg('h_merch', 'Ürün / bağış / bilet raflarını gizle', false, '', { cls: 'hideMerch' }),
      tg('h_info', 'Bilgi panellerini gizle', false, 'Konu açıklama kutuları vb.', { cls: 'hideInfoPanel' }),
      tg('h_promos', 'Premium ve diğer tanıtım bantlarını gizle', false, '', { cls: 'hidePromos' }),
      tg('h_ambient', 'Ambient (ışık yansıması) modunu kapat', false, '', { cls: 'hideAmbient' }),
      tg('h_autoplayBtn', 'Otomatik oynat düğmesini gizle', false, '', { cls: 'hideAutoplayBtn' }),
      tg('h_notif', 'Bildirim sayısı rozetini gizle', false, '', { cls: 'hideNotif' }),
      tg('h_voice', 'Sesli arama düğmesini gizle', false, '', { cls: 'hideVoice' }),
      nm('h_cols', 'Ana sayfada satır başına video', 0, 0, 10, 1, '0 = YouTube’un kendi düzeni.'),
      tg('h_accentOn', 'İlerleme çubuğu rengini özelleştir', false),
      co('h_accent', 'İlerleme çubuğu rengi', '#ff0000', '', { dep: 'h_accentOn' }),
    ]),

    sec('keys', 'Ses kısayolları (YouTube)', 'enhancer', 'Kutuya tıklayıp tuşa basın. Esc veya Backspace kısayolu temizler. (Hız kısayolları en üstteki “Video hızı” bölümündedir.)', [
      tg('s_on', 'Kısayolları etkinleştir', true),
      sc('s_volUp', 'Sesi artır', ''),
      sc('s_volDown', 'Sesi azalt', ''),
      nm('s_volStep', 'Ses kısayolu adımı (%)', 5, 1, 25, 1),
    ]),

    sec('general', 'Genel', null, 'Eklentinin ana anahtarı ve gelişmiş ayarlar.', [
      tg('enabled', 'Eklenti etkin', true, 'Kapalıyken hiçbir özellik çalışmaz.', { quick: true }),
      tg('x_debug', 'Hata ayıklama günlüğü', false, 'Tarayıcı konsoluna [YTX] günlükleri yazar.'),
      nm('x_scanMs', 'Tarama aralığı (ms)', 250, 50, 3000, 50, 'Sayfa değişikliklerinin ne sıklıkla taranacağı. Düşük = hızlı ama daha fazla CPU.'),
    ]),
  ];

  // --- Türetilmiş veriler ---
  const DEFAULTS = {};
  const ITEMS = {};
  for (const s of SCHEMA) for (const it of s.items) {
    it.section = s.id; it.module = s.module;
    if (it.key) { DEFAULTS[it.key] = it.def; ITEMS[it.key] = it; }
  }

  // Tuş kombinasyonu: "Ctrl+Alt+Shift+Meta+Tuş". Tek karakterli tuşlar büyük harfe çevrilir.
  function comboFromEvent(e) {
    const k = e.key;
    if (['Control', 'Shift', 'Alt', 'Meta', 'Dead', 'Unidentified'].includes(k)) return '';
    const parts = [];
    if (e.ctrlKey) parts.push('Ctrl');
    if (e.altKey) parts.push('Alt');
    const isLetter = k.length === 1 && k.toLowerCase() !== k.toUpperCase();
    if (e.shiftKey && (k.length > 1 || isLetter || k === ' ')) parts.push('Shift');
    if (e.metaKey) parts.push('Meta');
    parts.push(k === ' ' ? 'Space' : k.length === 1 ? k.toUpperCase() : k);
    return parts.join('+');
  }

  // dep: "anahtar" | "anahtar=değer" | "anahtar!=değer"
  function depOk(item, s) {
    if (!item.dep) return true;
    const m = item.dep.match(/^([^!=]+)(!?=)?(.*)$/);
    if (!m[2]) return !!s[m[1]];
    const eq = String(s[m[1]]) === m[3];
    return m[2] === '=' ? eq : !eq;
  }

  const STORE_KEY = 'settings';
  const api = (g.chrome && g.chrome.storage && g.chrome.storage.local) || null;

  Object.assign(YTX, {
    SCHEMA, DEFAULTS, ITEMS, STORE_KEY, comboFromEvent, depOk,
    async loadSettings() {
      const r = await api.get(STORE_KEY);
      return Object.assign({}, DEFAULTS, r[STORE_KEY] || {});
    },
    async saveSettings(patch) {
      const cur = await YTX.loadSettings();
      await api.set({ [STORE_KEY]: Object.assign(cur, patch) });
    },
    async replaceSettings(obj) {
      await api.set({ [STORE_KEY]: Object.assign({}, DEFAULTS, obj) });
    },
  });
})(typeof globalThis !== 'undefined' ? globalThis : window);
