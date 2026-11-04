#!/usr/bin/env bash
# Re-renders landing-page screenshots (WebP), og.png and the store images (into dist/store/).
# Needs Node + Playwright (Chromium) and Python with Pillow.
set -euo pipefail
cd "$(dirname "$0")/.."
node tools/render-screenshots.js "${1:-en}"
python3 - <<'EOF'
import glob, os
from PIL import Image
for f in glob.glob('docs/img/*.png'):
    if os.path.basename(f) in ('og.png', 'icon256.png'):
        continue
    Image.open(f).save(f[:-4] + '.webp', 'WEBP', quality=82, method=6)
    os.remove(f)
EOF
node tools/render-store-assets.js
