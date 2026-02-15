#!/bin/bash

echo "Killing docker log followers..."
if pgrep -f "docker logs --follow" > /dev/null; then
  pgrep -f "docker logs --follow" | xargs kill
  echo "Followers stopped"
else
  echo "There is no follower active"
fi