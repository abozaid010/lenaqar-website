#!/bin/bash
# Secure Deployment Script for lenaAI-website
# This script runs on the GCP VM via IAP tunnel

set -Eeuo pipefail
trap 'echo "❌ Error on line $LINENO"; exit 1' ERR

echo "🌐 Starting secure deployment for lenaAI-website..."

# Determine repository root based on this script location (one level up from .deploy/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_PATH="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "✅ Using repository at: $REPO_PATH"

# Change to repo directory (code is expected to be up-to-date already)
cd "$REPO_PATH" || {
  echo "❌ Failed to change to directory: $REPO_PATH"
  exit 1
}

# ─── 1. Ensure shared Docker network exists ─────────────────────────
echo "🌐 Ensuring shared network exists..."
docker network inspect lenaai-network >/dev/null 2>&1 || \
  docker network create lenaai-network

# ─── 2. Build latest image ────────────────────────────────────────
echo "🔨 Building Docker image..."
docker build -t lenaai_website:latest .

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
