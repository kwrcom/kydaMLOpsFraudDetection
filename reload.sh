#!/usr/bin/env bash

# reload.sh – Rebuild and restart all Docker Compose services for the MLOps Fraud Detection system.
# This script stops the current stack, removes old containers, rebuilds images, and starts the services in detached mode.
# It is safe to run repeatedly; Docker will only rebuild images if source files have changed.

set -euo pipefail

# Navigate to the project root (assumes script is placed in the project root)
cd "$(dirname "$0")"

# Stop and remove containers, networks, volumes, and images created by docker compose
docker compose down

# Rebuild images and start services in the background
docker compose up --build -d

echo "✅ Docker services have been reloaded successfully."
