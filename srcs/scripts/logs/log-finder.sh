cd /Users/mari/Trascendance_V2
docker compose -f srcs/docker-compose.yml logs -f remote-players_app#!/bin/bash

LOG_DIR=./srcs/logs
PID_FILE="$LOG_DIR/pids.txt"
ALL_LOGS="$LOG_DIR/all_services.log"

mkdir -p "$LOG_DIR"
rm -f "$PID_FILE"
rm -rf ./srcs/logs/*

SERVICES=(
  gateway
  server-rendering_app
  auth_app
  language-manager_app
  live-chat_app
  realtime-sockets_app
  backend-ai_app
  game-engine_app
  gt_mailpit
  mail
  rabbit
  redis

)

# Create aggregated log file
echo "=== AGGREGATED LOG FILE - Started at $(date) ===" > "$ALL_LOGS"
echo "" >> "$ALL_LOGS"

for service in "${SERVICES[@]}"; do
  echo "⏳ Starting follower logs for : $service"
  # Individual service log
  docker logs --follow "$service" > "$LOG_DIR/$service.log" 2>&1 &
  echo $! >> "$PID_FILE"

  # Aggregate all logs with service name prefix
  docker logs --follow "$service" 2>&1 | while IFS= read -r line; do
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$service] $line"
  done >> "$ALL_LOGS" &
  echo $! >> "$PID_FILE"
done

echo "✅ All followers are started. PID saved at $PID_FILE"
echo "📝 Combined logs available at: $ALL_LOGS"
