# Yayınlama rehberi — Kolay Youtube

Chrome Web Store, Firefox Add-ons (AMO) ve landing page için adım adım yapılacaklar.
Kopyala-yapıştır metinler `store/LISTING.md` içinde; görseller `store/` klasöründe.

## 0. Paketleri üret

```bash
./tools/build.sh
```

`dist/` içinde üç dosya oluşur:

| Dosya | Nereye |
|---|---|
| `kolay-youtube-<ver>-chrome.zip` | Chrome Web Store (Edge Add-ons da aynı paketi kabul eder) |
| `kolay-youtube-<ver>-firefox.zip` | addons.mozilla.org |
| `kolay-youtube-<ver>-source.zip` | Sadece AMO kaynak kodu isterse |

Mağaza paketlerinde `background.js` (git pull ile kendini yenileme) ve `alarms` izni yoktur; tek izin `storage`. Böylece incelemede gerekçe istenecek izin sayısı minimumda kalır.

## 1. Landing page (GitHub Pages) — önce bunu yap

Mağazalar gizlilik politikası URL'si istiyor, o yüzden önce site yayında olmalı.

1. Bu branch'i `main`'e merge et.
2. GitHub → repo **Settings → Pages** → *Source: Deploy from a branch* → **Branch: `main`**, klasör: **`/docs`** → Save.
3. 1–2 dakika sonra: `https://makolay322.github.io/Better-Youtube/` ve `.../privacy.html` açılmalı.

> Repo adını `Kolay-Youtube` yapmak istersen: GitHub repo yönlendirmesi yapar ama **Pages adresi yönlendirilmez**. Bu durumda `extension/manifest.json` (`homepage_url`), `docs/index.html` (og:image), `README.md` ve `store/LISTING.md` içindeki `Better-Youtube` adreslerini güncelle. Mağazaya göndermeden önce karar vermek en temizi.

## 2. Chrome Web Store

1. https://chrome.google.com/webstore/devconsole → geliştirici hesabı aç (tek seferlik **5 $**), e-postanı doğrula.
2. **New item** → `kolay-youtube-<ver>-chrome.zip` yükle.
3. **Store listing** sekmesi:
   - Description: `store/LISTING.md` → "Detailed description — English"
   - Category: Productivity → Tools (veya Entertainment), Language: English
   - Store icon: `extension/icons/icon128.png`
   - Screenshots: `store/screenshots/01…04.png` (1280×800)
   - Small promo tile: `store/promo-small-440x280.png`, Marquee: `store/promo-marquee-1400x560.png` (isteğe bağlı)
   - Homepage URL / Support URL: `store/LISTING.md`'deki adresler
   - Türkçe listeleme eklemek için: Language → Turkish ekle, Türkçe açıklamayı yapıştır.
4. **Privacy practices** sekmesi: tek amaç açıklaması, `storage` ve host izni gerekçeleri, "remote code: No" — hepsi `store/LISTING.md`'de. Veri toplama listesinde **hiçbir şeyi** işaretleme, alttaki üç beyanı işaretle. Privacy policy URL: `https://makolay322.github.io/Better-Youtube/privacy.html`
5. **Distribution**: Public, tüm bölgeler.
6. **Submit for review.** `<all_urls>` erişimi yüzünden inceleme genelde birkaç gün sürer (ilk gönderimde 1–3 hafta da olabilir).

## 3. Firefox Add-ons (AMO)

1. https://addons.mozilla.org/developers/ → Firefox hesabıyla giriş (ücretsiz).
2. **Submit a New Add-on** → *On this site* (listelenen) → `kolay-youtube-<ver>-firefox.zip` yükle. Otomatik doğrulama `web-ext lint` ile aynıdır; bizde 0 hata / 0 uyarı.
3. "Do you need to submit source code?" → **No** (kod derlenmiyor / küçültülmüyor). İnceleyici isterse `dist/kolay-youtube-<ver>-source.zip`.
4. Listeleme: ad, özet, açıklama `store/LISTING.md`'den. AMO açıklamada sınırlı Markdown destekler; emoji'ler sorun değil.
   - Kategoriler: *Photos, Music & Videos* ve *Appearance*
   - Destek sitesi: GitHub issues, Lisans: **MIT**
   - Gizlilik politikası: `docs/privacy.html` içeriğini (İngilizce kısmı) yapıştırabilirsin.
   - Notes to reviewer: `store/LISTING.md`'deki metin.
   - Ekran görüntüleri: `store/screenshots/*.png`
5. Eklenti adresi (slug) olarak `kolay-youtube` seç → link `https://addons.mozilla.org/firefox/addon/kolay-youtube/` olur.

Teknik notlar:
- Add-on ID: `kolay-youtube@makolay322` — **bir kez yayınladıktan sonra değiştirme**, yoksa güncellemeler eski kurulumlara gitmez.
- Minimum Firefox sürümü 140 (MAIN world içerik betikleri ve zorunlu `data_collection_permissions` beyanı için).
- Firefox 127+ içerik betiği host izinlerini kurulumda verir; daha eski davranışta kullanıcı izinleri eklenti menüsünden açmak zorundaydı.

## 4. Linkleri siteye ekle

İki mağaza da onaylayınca `docs/index.html` en alttaki script'te:

```js
const STORES = {
  chrome: 'https://chromewebstore.google.com/detail/kolay-youtube/<ID>',
  firefox: 'https://addons.mozilla.org/firefox/addon/kolay-youtube/',
};
```

Bunlar boşken butonlar sayfadaki kurulum bölümüne kayar; dolunca mağazaya gider. Firefox ile gelen ziyaretçide Firefox butonu otomatik öne alınır. README'deki "Install" bölümüne de linkleri ekle.

## 5. Yeni sürüm yayınlama

1. `extension/manifest.json` → `version`'ı artır (ör. `1.3.1`).
2. `./tools/build.sh`
3. Chrome devconsole → paket → *Upload new package*; AMO → *Upload New Version*.
4. İsteğe bağlı: `git tag v1.3.1 && git push --tags` → GitHub Actions zip'leri Release'e ekler.

## Dikkat edilecekler

- **İsimde "YouTube" geçmesi:** Mağazalar "X for YouTube" kalıbını marka açısından daha güvenli görüyor. "Kolay Youtube" çoğu durumda kabul edilir (benzer adlı pek çok eklenti var), ama inceleme marka gerekçesiyle reddederse yedek isim önerisi: **"Kolay — Toolkit for YouTube"**. Sadece `manifest.json`'daki `name`/`short_name`/`default_title` ve listeleme metnini değiştirmek yeterli. Eski ikon YouTube logosunun neredeyse aynısıydı; bu yüzden özgün "K" ikonuyla değiştirildi.
- Landing page ve açıklamalarda "YouTube veya Google ile bağlantılı değildir" ibaresi zaten var — kaldırma.
- Lisans olarak MIT eklendi; farklı bir lisans istersen `LICENSE` dosyasını değiştir.
