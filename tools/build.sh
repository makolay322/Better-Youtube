#!/usr/bin/env bash
# Eklentiyi dist/ klasörüne .zip olarak paketler.
set -euo pipefail
cd "$(dirname "$0")/.."
VER=$(python3 -c "import json;print(json.load(open('extension/manifest.json'))['version'])")
mkdir -p dist
ZIP="dist/better-youtube-$VER.zip"
rm -f "$ZIP"
(cd extension && zip -qr "../$ZIP" . -x '*.DS_Store')
echo "zip: $ZIP"
