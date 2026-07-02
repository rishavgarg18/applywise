#!/usr/bin/env bash
# Package Applywise extension for Chrome Web Store upload.
# Usage: ./scripts/package.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${ROOT}/../applywise-extension.zip"
STAGING=$(mktemp -d)

cleanup() { rm -rf "$STAGING"; }
trap cleanup EXIT

echo "Packaging extension from $ROOT"

rsync -a \
  --exclude '.DS_Store' \
  --exclude 'scripts' \
  --exclude 'store' \
  --exclude 'CHROME_WEB_STORE.md' \
  --exclude 'requirement.txt' \
  "$ROOT/" "$STAGING/"

cd "$STAGING"
zip -r "$OUT" . -x '*.DS_Store' > /dev/null

echo "Created: $OUT"
echo "Size: $(du -h "$OUT" | cut -f1)"
echo ""
echo "Next: upload to https://chrome.google.com/webstore/devconsole"
