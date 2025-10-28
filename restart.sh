#!/bin/bash

echo "🔍 Finding and killing LinkedIn Dashboard processes..."

# Kill all node processes related to this project (next dev, next-server, postcss)
pkill -f "next dev" 2>/dev/null
pkill -f "next-server" 2>/dev/null
pkill -f "linkedin-dashboard.*postcss" 2>/dev/null

# Also kill any processes on ports 3000, 3001, 3002 (common dev ports)
for port in 3000 3001 3002; do
  pid=$(lsof -ti :$port 2>/dev/null)
  if [ ! -z "$pid" ]; then
    echo "  Killing process on port $port (PID: $pid)"
    kill -9 $pid 2>/dev/null
  fi
done

echo "✅ All processes killed"
echo ""

# Wait for processes to fully terminate
sleep 1

echo "🚀 Starting LinkedIn Dashboard..."
echo ""

# Start the dev server
npm run dev
