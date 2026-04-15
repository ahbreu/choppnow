#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
node_bin="$("$repo_root/scripts/resolve-node.sh")"

exec "$node_bin" "$repo_root/node_modules/typescript/bin/tsc" --noEmit
