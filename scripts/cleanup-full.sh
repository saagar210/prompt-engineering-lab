#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

"$ROOT_DIR/scripts/cleanup-heavy.sh"

FULL_TARGETS=(
  "node_modules"
  ".npm"
  ".pnpm-store"
  ".yarn/cache"
  ".yarn/unplugged"
  ".yarn/install-state.gz"
  ".yarn/build-state.yml"
  "src/generated/prisma"
  "next-env.d.ts"
)

removed_any=0
for target in "${FULL_TARGETS[@]}"; do
  path="$ROOT_DIR/$target"
  if [ -e "$path" ]; then
    rm -rf "$path"
    echo "removed $target"
    removed_any=1
  fi
done

while IFS= read -r tsbuildinfo; do
  rm -f "$tsbuildinfo"
  echo "removed ${tsbuildinfo#"$ROOT_DIR"/}"
  removed_any=1
done < <(find "$ROOT_DIR" -maxdepth 2 -name "*.tsbuildinfo" -type f)

if [ "$removed_any" -eq 0 ]; then
  echo "nothing additional to clean (full local cleanup)"
fi
