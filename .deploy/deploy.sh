#!/bin/bash
# Secure Deployment Script for lenaAI-website
# This script runs on the GCP VM via IAP tunnel

set -Eeuo pipefail
trap 'echo "❌ Error on line $LINENO"; exit 1' ERR

echo "🌐 Starting secure deployment for lenaAI-website..."

cd ~/lenaai-website

echo "📥 Pulling latest changes..."
git config pull.rebase false
git pull origin main --no-rebase

echo "🧹 Stopping old container if exists..."
docker rm -f lenaai_nextjs_app || true

echo "🔧 Ensure shared Docker network exists..."
docker network inspect lenaai_network >/dev/null 2>&1 || \
  docker network create lenaai_network

echo "🔨 Building the new image..."
docker build -t lenaai_nextjs_app .

echo "🚀 Running new container in lenaai_network..."
docker run -d \
  --restart=always \
  --name lenaai_nextjs_app \
  --network lenaai_network \
  -p 3002:3000 \
  lenaai_nextjs_app

echo "✅ lenaAI-website deployment completed successfully!"
echo "🌐 Website available at: http://localhost:3002"
