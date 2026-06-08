#!/bin/bash
# Secure Deployment Script for lenaAI-website
# This script runs on the GCP VM via IAP tunnel

set -Eeuo pipefail
trap 'echo "❌ Error on line $LINENO"; exit 1' ERR

echo "🌐 Starting secure deployment for lenaAI-website..."

# Determine repository root based on this script location (one level up from .deploy/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_PATH="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "✅ Repository root: $REPO_PATH"

# Always fetch latest code before building (fails deploy if git sync fails)
export REPO_PATH
if [ -f "$SCRIPT_DIR/sync-repo.sh" ]; then
  bash "$SCRIPT_DIR/sync-repo.sh"
else
  echo "⚠️  sync-repo.sh not found — using inline git sync (legacy VM)"
  git -c safe.directory="$REPO_PATH" fetch origin main --prune
  git -c safe.directory="$REPO_PATH" checkout main
  git -c safe.directory="$REPO_PATH" reset --hard origin/main
  git -c safe.directory="$REPO_PATH" clean -fd
  echo "📌 VM commit: $(git -c safe.directory="$REPO_PATH" rev-parse HEAD)"
fi

cd "$REPO_PATH" || {
  echo "❌ Failed to change to directory: $REPO_PATH"
  exit 1
}

# ─── 1. Ensure shared Docker network exists ─────────────────────────
echo "🌐 Ensuring shared network exists..."
docker network inspect lenaai-network >/dev/null 2>&1 || \
  docker network create lenaai-network

# ─── 2. Build latest image ────────────────────────────────────────
# NEXT_PUBLIC_* must be passed at build time (inlined by Next.js, not read at runtime).
ENV_FILE="$REPO_PATH/.env"
DOCKER_BUILD_ARGS=()

read_env_var() {
  local name="$1"
  if [ ! -f "$ENV_FILE" ]; then
    return 1
  fi
  local line
  line="$(grep -E "^${name}=" "$ENV_FILE" | tail -1 || true)"
  [ -n "$line" ] || return 1
  local value="${line#*=}"
  value="${value%$'\r'}"
  value="${value#\"}"; value="${value%\"}"
  value="${value#\'}"; value="${value%\'}"
  printf '%s' "$value"
}

add_build_arg() {
  local name="$1"
  local default="${2:-}"
  local value
  value="$(read_env_var "$name" || true)"
  if [ -z "$value" ] && [ -n "$default" ]; then
    value="$default"
  fi
  if [ -n "$value" ]; then
    DOCKER_BUILD_ARGS+=(--build-arg "${name}=${value}")
  fi
}

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Missing $ENV_FILE — required for NEXT_PUBLIC_X_API_KEY at build time"
  exit 1
fi

add_build_arg NEXT_PUBLIC_X_API_KEY
add_build_arg NEXT_PUBLIC_API_BASE_URL "https://api.lenaai.net"
add_build_arg NEXT_PUBLIC_SITE_URL "https://www.lenaai.net"
add_build_arg NEXT_PUBLIC_IMAGE_BASE_URL
add_build_arg NEXT_PUBLIC_META_PIXEL_ID

if ! printf '%s\n' "${DOCKER_BUILD_ARGS[@]}" | grep -q 'NEXT_PUBLIC_X_API_KEY='; then
  echo "❌ NEXT_PUBLIC_X_API_KEY is missing from $ENV_FILE"
  exit 1
fi

echo "🔨 Building Docker image..."
docker build "${DOCKER_BUILD_ARGS[@]}" -t lenaai_website:latest .

# ─── 3. Stop old container if exists ──────────────────────────────
echo "🧹 Stopping old container if exists..."
docker rm -f lenaai_website || true

# ─── 4. Start new container ───────────────────────────────────────
echo "🚀 Starting new container..."
DOCKER_RUN_ARGS=(
  -d
  --name lenaai_website
  --restart=always
  --network lenaai-network
  --network-alias website-active
  -p 3002:3000
)

# Add env-file if it exists
if [ -f "$REPO_PATH/.env" ]; then
  DOCKER_RUN_ARGS+=(--env-file "$REPO_PATH/.env")
  echo "📝 Using .env file from repository"
fi

DOCKER_RUN_ARGS+=(lenaai_website:latest)

docker run "${DOCKER_RUN_ARGS[@]}"

# ─── 5. Wait for container to be healthy ──────────────────────────
echo "🩺 Waiting for container to be ready..."
for i in {1..10}; do
  if docker ps --format '{{.Names}}' | grep -q '^lenaai_website$'; then
    if docker exec lenaai_website wget -q --spider http://localhost:3000/api/health 2>/dev/null || \
       docker exec lenaai_website curl -f http://localhost:3000 >/dev/null 2>&1 || \
       [ "$i" -ge 5 ]; then
      echo "✅ Container is running"
      break
    fi
  fi
  echo "⏳ Waiting for container to be ready (retry $i/10)..."
  sleep 5
done

if ! docker ps --format '{{.Names}}' | grep -q '^lenaai_website$'; then
  echo "❌ Container failed to start"
  exit 1
fi

echo "✅ lenaAI-website deployment completed successfully!"
echo "🌐 Website available at: http://localhost:3002"
