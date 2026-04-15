#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
node_bin="$("$repo_root/scripts/resolve-node.sh")"

"$node_bin" "$repo_root/node_modules/typescript/bin/tsc" -p "$repo_root/tsconfig.tests.json"

shopt -s nullglob
test_files=("$repo_root"/.test-dist/tests/*.test.js)
shopt -u nullglob

filtered_test_files=()
for test_file in "${test_files[@]}"; do
  case "$test_file" in
    *.smoke.test.js) ;;
    *) filtered_test_files+=("$test_file") ;;
  esac
done

if [ "${#filtered_test_files[@]}" -eq 0 ]; then
  printf 'No compiled test files were found in %s\n' "$repo_root/.test-dist/tests" >&2
  exit 1
fi

exec "$node_bin" --test "${filtered_test_files[@]}"
