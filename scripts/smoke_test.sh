#!/usr/bin/env bash
set -euo pipefail

API_BASE="${1:-http://localhost:8000/api}"
EMAIL="smoke$(date +%s)@example.com"
PASSWORD="Pass1234"
NAME="Smoke User"

echo "[1/4] Health check"
curl -fsS "$API_BASE/health" >/dev/null

echo "[2/4] Signup"
curl -fsS -X POST "$API_BASE/signup" \
  -H 'Content-Type: application/json' \
  -d "{\"name\":\"$NAME\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" >/dev/null

echo "[3/4] Login"
TOKEN=$(curl -fsS -X POST "$API_BASE/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | python -c 'import sys,json; print(json.load(sys.stdin)["token"])')

echo "[4/4] Protected route /me"
curl -fsS "$API_BASE/me" -H "Authorization: Bearer $TOKEN" >/dev/null

echo "Smoke test passed for $API_BASE"
