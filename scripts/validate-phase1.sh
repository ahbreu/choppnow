#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

"$repo_root/scripts/typecheck.sh"
"$repo_root/scripts/test-unit.sh"
"$repo_root/scripts/export-web.sh"
