#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

"$repo_root/scripts/export-web.sh"
CHOPPNOW_BACKEND_SERVE_DIST=true exec "$repo_root/scripts/backend-start.sh"
