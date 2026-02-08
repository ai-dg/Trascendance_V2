#!/bin/bash

LOG_DIR=./srcs/logs
PID_FILE="$LOG_DIR/pids.txt"

rm -f "$PID_FILE"
rm -rf ./srcs/logs/*

SERVICES=(
  modsecurity
  gateway
  server-rendering_app
  auth_app
  language-manager_app
  live-chat_app
  realtime-sockets_app
  remote-players_app
  game-engine_app
  backend-ai_app
  gt_mailpit
  rabbit
  redis
  frontend_app
  elasticsearch
  kibana
  logstash
  prometheus
  grafana
  redis-exporter
  cadvisor
)

for service in "${SERVICES[@]}"; do
  echo "Starting follower logs for : $service"
  docker logs --follow "$service" > "$LOG_DIR/$service.log" 2>&1 &
  echo $! >> "$PID_FILE"
done

echo "All followers are started. PID saved at $PID_FILE"