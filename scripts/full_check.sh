#!/usr/bin/env bash
set -euo pipefail

API_BASE="${1:-http://localhost:8000/api}"

echo "== RailIQ Full Check =="
echo "[A] Backend syntax"
python3 -m py_compile backend/server.py

echo "[B] Shell script syntax"
bash -n scripts/smoke_test.sh
bash -n scripts/dashboard_check.sh

echo "[C] Dashboard static checks"
./scripts/dashboard_check.sh

echo "[D] API smoke checks (requires running backend at $API_BASE)"
./scripts/smoke_test.sh "$API_BASE"

echo "All checks passed"
