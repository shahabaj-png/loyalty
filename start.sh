#!/bin/sh

echo "=== Dynamic Node Launcher ==="

if [ -f "dist/src/main.js" ]; then
  echo "-> Launching node dist/src/main.js"
  exec node dist/src/main.js
elif [ -f "backend/dist/src/main.js" ]; then
  echo "-> Launching node backend/dist/src/main.js"
  exec node backend/dist/src/main.js
elif [ -d "backend" ]; then
  cd backend
  if [ -f "dist/src/main.js" ]; then
    echo "-> Launching node backend -> dist/src/main.js"
    exec node dist/src/main.js
  fi
fi

echo "-> Searching for main.js dynamically..."
TARGET=$(find /app . -name "main.js" 2>/dev/null | grep "dist" | head -n 1)
if [ -n "$TARGET" ]; then
  echo "-> Found target at $TARGET"
  exec node "$TARGET"
else
  echo "❌ Error: Could not locate compiled main.js output."
  exit 1
fi
