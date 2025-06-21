#!/bin/bash

if [ -z "$1" ]; then
  echo "a valid path to your js files is required."
  exit 1
fi

find "$1" -type f -name "*.js" | while read -r fichier; do
  sed -i '/^import /s/";$/\.js";/' "$fichier"
done

