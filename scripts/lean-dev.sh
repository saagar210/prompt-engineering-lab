#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LEAN_ROOT="$ROOT_DIR/.lean-cache"
mkdir -p "$LEAN_ROOT"

LEAN_DIST_REL=".lean-cache/next-dev"
LEAN_DIST_ABS="$ROOT_DIR/$LEAN_DIST_REL"

cleanup() {
  rm -rf "$LEAN_DIST_ABS"
  rmdir "$LEAN_ROOT" 2>/dev/null || true
}

trap cleanup EXIT INT TERM

echo "lean dev: using temporary Next build dir $LEAN_DIST_REL"
(
  cd "$ROOT_DIR"
  NEXT_DIST_DIR="$LEAN_DIST_REL" npm run dev
)
