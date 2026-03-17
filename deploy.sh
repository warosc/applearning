#!/usr/bin/env bash
# deploy.sh — Manual production deployment script for EXHCOBA Simulator
# Usage: ./deploy.sh [--no-pull]
set -euo pipefail

COMPOSE_FILE="docker/docker-compose.prod.yml"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

cd "$PROJECT_DIR"

echo "==> EXHCOBA Simulator — Deploy $(date '+%Y-%m-%d %H:%M:%S')"

# Optional: skip git pull (e.g. when deploying local changes)
if [[ "${1:-}" != "--no-pull" ]]; then
  echo "==> Pulling latest code from origin/main..."
  git pull origin main
fi

echo "==> Building and starting containers..."
docker compose -f "$COMPOSE_FILE" up --build -d --remove-orphans

echo "==> Waiting for backend to be healthy (up to 60s)..."
for i in $(seq 1 12); do
  if docker compose -f "$COMPOSE_FILE" exec -T backend wget -qO- http://127.0.0.1:4000/api/config/public > /dev/null 2>&1; then
    echo "    Backend healthy after $((i * 5))s"
    break
  fi
  if [[ $i -eq 12 ]]; then
    echo "    WARNING: Backend did not respond within 60s — check logs:"
    docker compose -f "$COMPOSE_FILE" logs --tail=50 backend
    exit 1
  fi
  sleep 5
done

echo "==> Container status:"
docker compose -f "$COMPOSE_FILE" ps

echo "==> Cleaning unused images..."
docker image prune -f

echo "==> Deploy complete."
