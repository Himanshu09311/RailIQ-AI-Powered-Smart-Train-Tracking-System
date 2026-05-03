#!/usr/bin/env bash
set -euo pipefail

API_BASE="${1:-http://localhost:8000/api}"
EMAIL="smoke$(date +%s)@example.com"
PASSWORD="Pass1234"
NAME="Smoke User"

json_get() {
  python3 -c 'import json,sys; print(json.load(sys.stdin).get(sys.argv[1], ""))' "$1"
}

echo "[1/6] Health check"
curl -fsS "$API_BASE/health" >/dev/null

echo "[2/6] Signup"
curl -fsS -X POST "$API_BASE/signup" \
  -H 'Content-Type: application/json' \
  -d "{\"name\":\"$NAME\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" >/dev/null

echo "[3/6] Login"
LOGIN_JSON=$(curl -fsS -X POST "$API_BASE/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
TOKEN=$(printf '%s' "$LOGIN_JSON" | json_get token)
if [[ -z "$TOKEN" ]]; then
  echo "Login response did not contain token"
  exit 1
fi

echo "[4/6] Protected route /me"
curl -fsS "$API_BASE/me" -H "Authorization: Bearer $TOKEN" >/dev/null

echo "[5/6] Unauthorized /me should fail"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/me")
if [[ "$STATUS" != "401" ]]; then
  echo "Expected 401 for unauthorized /me, got $STATUS"
  exit 1
fi

echo "[6/6] Logout"
curl -fsS -X POST "$API_BASE/logout" -H "Authorization: Bearer $TOKEN" >/dev/null

echo "Smoke test passed for $API_BASE"
