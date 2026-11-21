#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
set -a
source .env.example
set +a
cd api
go build -buildvcs=false -o behnosh-api ./cmd/server
exec ./behnosh-api
