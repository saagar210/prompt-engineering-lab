#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

TARGETS=(
  ".next"
  ".next-lean"
  ".lean-cache"
  ".turbo"
  ".cache"
  ".parcel-cache"
  ".vite"
  "coverage"
  "dist"
  "build"
  "out"
  ".eslintcache"
)

removed_any=0
for target in "${TARGETS[@]}"; do
  path="$ROOT_DIR/$target"
  if [ -e "$path" ]; then
    rm -rf "$path"
    echo "removed $target"
    removed_any=1
  fi
done

if [ "$removed_any" -eq 0 ]; then
  echo "nothing to clean (heavy artifacts)"
fi
