#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# 1) Required dashboard files
for f in index.html app.js styles.css auth.js; do
  test -f "$f"
done

# 2) HTML section anchors exist
for id in track pnr predict assistant alerts; do
  grep -q "id=\"$id\"" index.html
done

# 3) Core JS handlers exist
for fn in trackTrain checkPNR predictDelay askAssistant setAlert renderRecentTrains; do
  grep -q "function $fn" app.js
done

# 4) Auth guard is loaded on dashboard
grep -q '<script src="auth.js"></script>' index.html
grep -q '<script src="app.js"></script>' index.html

# 5) Optional syntax check when node is installed
if command -v node >/dev/null 2>&1; then
  node --check app.js >/dev/null
  node --check auth.js >/dev/null
fi

echo "Dashboard checks passed"
