# Store listing texts

Copy-paste material for the Chrome Web Store and Firefox Add-ons (AMO).
Images: `store/screenshots/*.png` (1280×800), `store/promo-small-440x280.png`,
`store/promo-marquee-1400x560.png`, icon: `assets/icon256.png` / `extension/icons/icon128.png`.

---

## Name

```
Kolay for YouTube
```

## Summary (Chrome "short description" = manifest description, max 132 chars; AMO summary max 250)

```
Speed hotkeys for every video, auto quality, Shorts & clutter hiding, a repeat hider and a playlist cleaner for YouTube.
```

## Localized short descriptions

The manifest is localized (`extension/_locales/*/messages.json`), so the Chrome Web Store shows the short description in en, tr, es, pt_BR, de, fr, ru and ja automatically.

## Category

- Chrome: **Productivity → Tools** (or "Entertainment" alternatively)
- Firefox: **Photos, Music & Videos** + **Appearance**

## Homepage / support / privacy URLs

- Homepage: `https://makolay322.github.io/Kolay-for-Youtube/`
- Support: `https://github.com/makolay322/Kolay-for-Youtube/issues`
- Privacy policy: `https://makolay322.github.io/Kolay-for-Youtube/privacy.html`

---

## Detailed description — English

```
Kolay for YouTube makes YouTube calmer and faster — and gives every video on the web keyboard speed controls. Every feature has its own switch, so you only turn on what you need.

⚡ SPEED HOTKEYS ON EVERY SITE
• G – jump to your preset speed, R – back to 1×, O / P – slower / faster
• Works on any website with a video, not just YouTube
• Your last speed is remembered browser-wide; pitch is preserved
• Keys, preset and step size are fully configurable

🎞 QUALITY THAT STICKS
• Choose 4K, 1440p, 1080p… once
• If it isn't available, the next best quality is picked automatically
• Prefers the high-bitrate ("enhanced bitrate") version when it exists

🧹 HIDE WHAT YOU DON'T WANT
• Shorts everywhere (home, search, subscriptions, channels, side menu)
• Mixes, course & podcast playlists, "Explore new topics", surveys, Playables
• Already watched videos (with an adjustable percentage range)
• Ongoing / ended live streams on the Subscriptions page
• Block channels and title keywords (regex supported), filter by duration
• Dim instead of hide if you prefer

🔁 REPEAT HIDER
Recommendations you've already scrolled past several times disappear, so your home page finally shows something new.

🗑 PLAYLIST CLEANER
Empty Watch Later or any of your playlists with one click.

▶ PLAYER & LAYOUT
• Default or remembered volume, captions always on/off
• No autoplay, pause when the tab is hidden or another video starts
• Theater mode, auto-expand description, auto loop
• Hide comments, sidebar, end cards, live chat, promo strips and more
• Videos per row on the home page, custom progress bar color

⚙ SETTINGS
Searchable settings page, light & dark theme, export / import as JSON. Available in English, Turkish, Spanish, Portuguese, German, French, Russian and Japanese.

🔒 PRIVACY
No data collection, no analytics, no network requests, no ads. Settings are stored only in your browser. Open source: https://github.com/makolay322/Kolay-for-Youtube

Why "access to all websites"? Only for the speed hotkeys, which work on videos on any site. That script just listens for your shortcut keys and changes the playback speed of <video> elements.

Kolay for YouTube is an independent project and is not affiliated with YouTube or Google LLC.
```

## Detailed description — Türkçe

```
Kolay for YouTube, YouTube'u daha sade ve hızlı hale getirir — webdeki her videoya da klavyeden hız kontrolü kazandırır. Her özelliğin kendi anahtarı var; sadece ihtiyacın olanı açarsın.

⚡ HER SİTEDE HIZ KISAYOLLARI
• G – hazır hıza geç, R – 1×'e dön, O / P – yavaşlat / hızlandır
• Sadece YouTube değil, video olan her sitede çalışır
• Son hız tarayıcı genelinde hatırlanır; ses tonu korunur
• Tuşlar, hazır hız ve adım tamamen ayarlanabilir

🎞 HEP AYNI KALİTE
• 4K, 1440p, 1080p… bir kez seç
• Yoksa bir alttaki kalite otomatik seçilir
• Varsa yüksek bit hızlı (Premium) sürüm tercih edilir

🧹 İSTEMEDİĞİNİ GİZLE
• Her yerde Shorts (ana sayfa, arama, abonelikler, kanallar, yan menü)
• Mix'ler, kurs ve podcast listeleri, "Yeni konuları keşfet", anketler, Playables
• İzlenmiş videolar (ayarlanabilir yüzde aralığı)
• Abonelikler sayfasında devam eden / biten canlı yayınlar
• Kanal ve başlık kelimesi engelleme (regex destekli), süreye göre filtre
• İstersen gizlemek yerine soluklaştır

🔁 TEKRAR GİZLEYİCİ
Defalarca önüne gelen öneriler kaybolur; ana sayfan nihayet yeni bir şey gösterir.

🗑 OYNATMA LİSTESİ TEMİZLEYİCİ
Daha Sonra İzle'yi ya da kendi listelerini tek tıkla boşalt.

▶ OYNATICI VE SAYFA DÜZENİ
• Varsayılan / hatırlanan ses, altyazı hep açık / kapalı
• Otomatik oynatma yok, sekme gizlenince ya da başka video başlayınca duraklat
• Sinema modu, açıklamayı otomatik genişlet, otomatik döngü
• Yorumları, yan paneli, bitiş kartlarını, canlı sohbeti, tanıtımları gizle
• Ana sayfada satır başına video sayısı, özel ilerleme çubuğu rengi

⚙ AYARLAR
Aranabilir ayarlar sayfası, açık ve koyu tema, JSON olarak dışa / içe aktarma. Türkçe, İngilizce, İspanyolca, Portekizce, Almanca, Fransızca, Rusça ve Japonca.

🔒 GİZLİLİK
Veri toplama yok, analitik yok, ağ isteği yok, reklam yok. Ayarlar sadece tarayıcında saklanır. Açık kaynak: https://github.com/makolay322/Kolay-for-Youtube

Neden "tüm sitelere erişim"? Sadece her sitedeki videolarda çalışan hız kısayolları için. O betik yalnızca kısayol tuşlarını dinler ve <video> öğelerinin hızını değiştirir.

Kolay for YouTube bağımsız bir projedir; YouTube veya Google LLC ile bağlantılı değildir.
```

---

## Chrome Web Store — "Privacy practices" tab

**Single purpose description**

```
Kolay for YouTube improves the YouTube viewing experience (hiding unwanted content, automatic quality, player and layout tweaks) and adds keyboard shortcuts to control the playback speed of videos.
```

**Permission justifications**

| Field | Text |
|---|---|
| `storage` | `Saves the user's settings (switches, shortcuts, filters, last speed/volume) and the repeat-hider counters locally in the browser. Nothing is synced or sent anywhere.` |
| Host permission (`<all_urls>` via content scripts) | `The video speed shortcuts work on videos on every website, so a small content script runs on all pages. It only listens for the user's configured shortcut keys and changes the playbackRate of <video> elements. It does not read page content and makes no network requests. The YouTube-specific features run only on www.youtube.com.` |
| Remote code | **No, I am not using remote code.** |

**Data usage:** tick **nothing** in the "What user data do you plan to collect" list, then tick all three certifications (not sold / not used for unrelated purposes / not used for creditworthiness).

## Firefox AMO — submission answers

- **Data collection:** already declared in the manifest as `"data_collection_permissions": { "required": ["none"] }`.
- **Source code:** the add-on is not minified or bundled, so answering *"No"* to "Do you need to submit source code?" is correct. If the reviewer asks anyway, upload `dist/kolay-youtube-<ver>-source.zip`.
- **Notes to reviewer:**

```
No build step: the files in the package are the original sources (https://github.com/makolay322/Kolay-for-Youtube, folder extension/). The content script on <all_urls> (shared/schema.js + content/speed.js) only implements keyboard speed shortcuts for <video> elements. content/main-world.js runs in the MAIN world on youtube.com because the YouTube player API (setPlaybackQualityRange) is only reachable from the page context; it communicates with the content script via window.postMessage and only accepts messages from the same window. No network requests, no remote code, no data collection.
```

- **License:** pick the one that matches the repo (e.g. MIT) — see "Open items" in `PUBLISHING.md`.
