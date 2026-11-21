#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ ! -f .env ]]; then cp .env.example .env; fi
set -a
source .env
set +a
./scripts/db.sh
(cd api && go build -buildvcs=false -o behnosh-api ./cmd/server)
./api/behnosh-api &
api_pid=$!
npm run dev &
web_pid=$!
cleanup(){ kill "$api_pid" "$web_pid" 2>/dev/null || true; wait "$api_pid" "$web_pid" 2>/dev/null || true; }
trap cleanup EXIT INT TERM
wait -n "$api_pid" "$web_pid"
