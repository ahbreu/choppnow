#!/usr/bin/env bash
set -euo pipefail

if command -v node >/dev/null 2>&1; then
  command -v node
  exit 0
fi

workspace_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
shopt -s nullglob
node_candidates=("$workspace_root"/tools/node/versions/*/bin/node)
shopt -u nullglob

if [ "${#node_candidates[@]}" -gt 0 ]; then
  printf '%s\n' "${node_candidates[0]}"
  exit 0
fi

printf 'Node.js executable not found.\n' >&2
exit 1
