#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="$ROOT/backup/pp-backup-${STAMP}.tar.gz"

mkdir -p "$ROOT/backup"
cd "$ROOT"

tar \
  --exclude="./backup/*.tar.gz" \
  --exclude="./backup/*.zip" \
  -czf "$OUT" .

echo "Created: $OUT"
