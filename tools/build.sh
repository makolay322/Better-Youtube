#!/usr/bin/env bash
# Packages the extension for the Chrome Web Store and Firefox Add-ons (AMO) into dist/.
set -euo pipefail
cd "$(dirname "$0")/.."
python3 tools/build.py "$@"
