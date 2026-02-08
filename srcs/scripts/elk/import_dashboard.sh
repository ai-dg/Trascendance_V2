#!/bin/bash
set -e

set -a
. ./srcs/.env
set +a

KIBANA_URL="http://localhost:$PORT_KIBANA"
AUTH="$ELASTIC_USERNAME:$ELASTIC_PASSWORD"
DIR="./srcs/services/elk/export"

echo "[*] Waiting for Kibana..."

for i in $(seq 1 60); do
  STATE=$(curl -s -u "$AUTH" "$KIBANA_URL/api/status" \
    | jq -r '.status.overall.state // empty' 2>/dev/null || true)
  if [ "$STATE" = "available" ] || [ "$STATE" = "degraded" ] || [ "$STATE" = "green" ] || [ "$STATE" = "yellow" ]; then
    echo "[+] Kibana ready ($STATE)"
    break
  fi
  sleep 2
done

[ "$STATE" ] || { echo "[-] Kibana not ready"; exit 1; }

echo "[*] Import index pattern"
curl -s -u "$AUTH" -X POST "$KIBANA_URL/api/saved_objects/_import?overwrite=true" \
  -H "kbn-xsrf: true" \
  -F "file=@$DIR/index.ndjson" >/dev/null

echo "[*] Import visualizations"
curl -s -u "$AUTH" -X POST "$KIBANA_URL/api/saved_objects/_import?overwrite=true" \
  -H "kbn-xsrf: true" \
  -F "file=@$DIR/dashboard.ndjson" >/dev/null

echo "[+] Done"
