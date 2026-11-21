#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p .local
if [[ ! -f .local/postgres/PG_VERSION ]]; then
  initdb -D "$PWD/.local/postgres" -U behnosh --auth-local=trust --auth-host=scram-sha-256 --pwfile=<(printf '%s' 'behnosh-local') --encoding=UTF8 --locale=C.UTF-8 >/dev/null
fi
if ! pg_ctl -D "$PWD/.local/postgres" status >/dev/null 2>&1; then
  pg_ctl -D "$PWD/.local/postgres" -l "$PWD/.local/postgres.log" -o "-h 127.0.0.1 -p 55432 -k $PWD/.local" start
fi
if ! PGPASSWORD=behnosh-local psql -h 127.0.0.1 -p 55432 -U behnosh -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='behnosh'" | rg -q 1; then
 PGPASSWORD=behnosh-local createdb -h 127.0.0.1 -p 55432 -U behnosh behnosh
fi
