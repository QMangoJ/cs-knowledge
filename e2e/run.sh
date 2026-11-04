#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
python3 -m http.server 4173 --bind 127.0.0.1 --directory out >/dev/null 2>&1 & PID=$!
trap 'kill $PID' EXIT
sleep 1
node e2e/smoke.mjs http://127.0.0.1:4173
