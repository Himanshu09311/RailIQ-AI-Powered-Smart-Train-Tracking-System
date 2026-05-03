#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "[1/4] Python syntax"
python3 -m py_compile backend/server.py

echo "[2/4] Required Python packages"
python3 - <<'PY'
import importlib
mods=["flask","flask_cors","bcrypt","jwt","requests"]
missing=[]
for m in mods:
    try:
        importlib.import_module(m)
    except Exception:
        missing.append(m)
if missing:
    raise SystemExit("Missing packages: " + ", ".join(missing))
print("All runtime packages are importable")
PY

echo "[3/4] Start backend and probe health"
RAILIQ_JWT_SECRET=test-secret RAILIQ_ALLOWED_ORIGINS='http://localhost:3000' python3 backend/server.py >/tmp/railiq_server.log 2>&1 &
PID=$!
cleanup(){ kill "$PID" >/dev/null 2>&1 || true; }
trap cleanup EXIT
sleep 2
curl -fsS http://127.0.0.1:8000/api/health >/dev/null

echo "[4/4] API smoke"
./scripts/smoke_test.sh http://127.0.0.1:8000/api >/dev/null

echo "Preflight passed: backend + dashboard checks can be trusted"
