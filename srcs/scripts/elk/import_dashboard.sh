#!/bin/bash

set -a
source ./srcs/.env
set +a

sleep 3

KIBANA_URL="http://localhost:$PORT_KIBANA"
NDJSON_DIR="./srcs/services/elk/export"

KIBANA_USER="$ELASTIC_USERNAME"
KIBANA_PASSWORD="$ELASTIC_PASSWORD"

echo "Checking Kibana status..."
STATUS_RESPONSE=$(curl -u "$KIBANA_USER:$KIBANA_PASSWORD" -s "$KIBANA_URL/api/status")

if echo "$STATUS_RESPONSE" | jq '.status.overall.state' &>/dev/null; then
  echo "Kibana status: $(echo "$STATUS_RESPONSE" | jq '.status.overall.state')"
else
  echo "Kibana is not ready or returned invalid response:"
  echo "$STATUS_RESPONSE"
  exit 1
fi

echo "Importing index pattern (multipart)..."
curl -u "$KIBANA_USER:$KIBANA_PASSWORD" -X POST "$KIBANA_URL/api/saved_objects/_import?overwrite=true" \
  -H "kbn-xsrf: true" \
  -F "file=@$NDJSON_DIR/index-pattern.ndjson"

echo ""
echo "Importing visualizations (multipart)..."
curl -u "$KIBANA_USER:$KIBANA_PASSWORD" -X POST "$KIBANA_URL/api/saved_objects/_import?overwrite=true" \
  -H "kbn-xsrf: true" \
  -F "file=@$NDJSON_DIR/visualization.ndjson"

echo ""
echo "Kibana dashboard and index pattern import completed via multipart."
