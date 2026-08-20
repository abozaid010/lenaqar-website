#!/usr/bin/env bash
# Sync server-side env vars required for the opportunities feed to Vercel Production.
# Requires: vercel login, project linked (vercel link), and .env.local with values set.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT/.env.local}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE"
  exit 1
fi

read_env() {
  local key="$1"
  grep -E "^${key}=" "$ENV_FILE" | tail -1 | cut -d= -f2- | tr -d '\r' | sed 's/^["'\'']//; s/["'\'']$//'
}

sync_var() {
  local key="$1"
  local value
  value="$(read_env "$key" || true)"
  if [[ -z "$value" ]]; then
    echo "Skip $key (empty in $ENV_FILE)"
    return 0
  fi
  echo "Setting $key on Vercel (production + preview)..."
  printf '%s' "$value" | vercel env add "$key" production preview --force
}

cd "$ROOT"
sync_var BFF_SECRET
sync_var X_API_KEY
sync_var NEXT_PUBLIC_LENAQAR_TENANT_ID

echo "Done. Redeploy production for runtime env to take effect:"
echo "  vercel deploy --prod"
