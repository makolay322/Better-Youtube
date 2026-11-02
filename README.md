# Better Youtube

A Chrome / Chromium / Edge / Brave extension (Manifest V3) that improves YouTube and adds site-wide video speed hotkeys. Everything is configurable from the extension's **Settings** page (settings can be exported/imported as JSON).

## Install

Chrome rejects `.crx` files that don't come from the Web Store (`CRX_REQUIRED_PROOF_MISSING`), so the extension is installed unpacked. It takes about a minute and is permanent.

1. Download [`dist/better-youtube-1.2.1.zip`](dist/better-youtube-1.2.1.zip) (open the file on GitHub and click **Download raw file**) and extract it into a **permanent folder** (e.g. `Documents/better-youtube`). Don't delete the folder afterwards.
2. Open `chrome://extensions` and enable **Developer mode** (top right).
3. Click **Load unpacked** and select the extracted folder.
4. Click the toolbar icon, then **All settings…** to open the settings page.

> Because the video speed hotkeys work on **all sites**, Chrome shows a "read and change data on all sites" warning at install time. The speed script only looks at `<video>` elements and key presses and sends no data anywhere.

## Updating

Chrome does not auto-update unpacked extensions. Two options:

- **Chrome Web Store (easiest):** publish the extension once (one-time small developer fee). Chrome then distributes new versions automatically within a few hours.
- **Git (free):** clone the repo and load the `extension/` folder, then schedule `git pull` in it (Task Scheduler on Windows, cron on macOS/Linux). The extension checks its own `manifest.json` every 15 minutes and reloads itself when the version changes. Bump `version` in `manifest.json` on every release. Open tabs pick up the new version after a page refresh.

```bash
git clone https://github.com/makolay322/Better-Youtube.git
cd Better-Youtube && git pull   # schedule this; extension folder: extension/
```

If you installed from the zip: extract the new zip over the same folder and press the reload (↻) button on `chrome://extensions`. Your settings are kept. Run `./tools/build.sh` to rebuild the zip.

## Features

**Most used** (top of the settings page and the popup)

| Section | What it does |
|---|---|
| Video speed (all sites) | `G` preset speed, `R` 1x, `O` slower, `P` faster (keys and step are configurable). The last speed is remembered browser-wide and applied to every video |
| Video quality | If the chosen quality is unavailable it steps down automatically (4K → 2K → 1080p → …); a high-bitrate (Premium) variant is preferred when available |
| Hiding | Shorts (everywhere) · "Explore new topics" row · surveys / YouTube Playables / other irrelevant elements · repeated videos · Mix · course and podcast playlists · watched videos · ongoing and ended live streams (Subscriptions page only) |

**Other** (lower in the settings)

| Section | What it does |
|---|---|
| Hiding details | Watched-percentage range, upcoming premieres, members-only, duration filter, keyword / channel blocklist, extra shelf titles, dimming, excluded pages |
| Repeat hider details | Pages it applies to, visibility threshold, retention time/count, statistics and reset |
| Playlist cleaner | On a playlist page, click the toolbar icon and press "Clear list"; delays, limit, failure threshold, confirmation |
| Player | Default/remembered volume, captions, disable autoplay, pause when the tab is hidden, pause other tabs, theater mode, expand description |
| Page layout | Hide comments, recommendations, live chat, end cards, cards, watermark, shelves, info panels, ambient mode…; home grid columns; progress bar color |
| Volume keys | Volume up / down |

> YouTube changes its UI often. If something stops working, enable Settings → General → *Debug log* and check the console.
