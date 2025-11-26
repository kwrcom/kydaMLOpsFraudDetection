#!/usr/bin/env bash
# verify_services.sh
# Purpose: Verify that all Docker Compose services are up and healthy.
# This script runs `docker compose ps` and checks the HEALTHY status for each container.
# It exits with code 0 if all services are healthy, otherwise prints the failing services.

set -euo pipefail

# Ensure we are in the docker directory
cd "$(dirname "$0")/docker"

# Get the list of services and their health status
STATUS=$(docker compose ps --services --filter "status=running" | while read svc; do
  health=$(docker inspect --format='{{.State.Health.Status}}' "${svc}" 2>/dev/null || echo "no-health")
  echo "$svc:$health"
done)

FAILURES=0
while IFS= read -r line; do
  svc=$(echo "$line" | cut -d: -f1)
  health=$(echo "$line" | cut -d: -f2)
  if [[ "$health" != "healthy" ]]; then
    echo "⚠️ Service $svc is not healthy (status: $health)"
    FAILURES=$((FAILURES+1))
  else
    echo "✅ Service $svc is healthy"
  fi
done <<< "$STATUS"

if [[ $FAILURES -gt 0 ]]; then
  echo "\nSome services are not healthy. Please check the logs."
  exit 1
else
  echo "\nAll services are healthy."
  exit 0
fi
