#!/usr/bin/env bash
set -e
mkdir -p tmp/dev
[ -f tmp/dev/amen-break.mp3 ] && echo "Sample audio file already exists, skipping download" && exit 0
echo "Downloading sample audio file from Wikimedia..."
curl -L -o tmp/dev/amen-break.mp3 -H "User-Agent: Mozilla/5.0 (compatible; audioplotter/1.0)" "https://upload.wikimedia.org/wikipedia/en/transcoded/8/80/The_Amen_Break%2C_in_context.ogg/The_Amen_Break%2C_in_context.ogg.mp3"
echo "Sample audio downloaded successfully to: tmp/dev/amen-break.mp3"
