#!/bin/bash
set -e

set -a
. ./srcs/.env
set +a

URL="http://localhost:$PORT_KIBANA/api/status"
AUTH="$ELASTIC_USERNAME:$ELASTIC_PASSWORD"

echo "[*] Waiting for Kibana..."

for _ in $(seq 1 24); do
  LEVEL=$(curl -s -u "$AUTH" "$URL" 2>/dev/null \
    | jq -r '.status.overall.level // .status.overall.state // empty' 2>/dev/null || true)
  if [ "$LEVEL" = "available" ] || [ "$LEVEL" = "degraded" ] || [ "$LEVEL" = "green" ] || [ "$LEVEL" = "yellow" ]; then
    echo "[+] Kibana ready ($LEVEL)"
    exit 0
  fi
  sleep 5
done
echo "[-] Kibana not ready (last level: ${LEVEL:-<no response>})"
exit 1

