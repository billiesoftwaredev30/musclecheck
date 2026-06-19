#!/bin/bash
# run_dev.sh

# Function to terminate background processes on exit
cleanup() {
  echo "Shutting down servers..."
  kill "$BACKEND_PID" 2>/dev/null
  kill "$FRONTEND_PID" 2>/dev/null
  exit 0
}

# Trap CTRL+C (SIGINT) and SIGTERM
trap cleanup SIGINT SIGTERM

echo "🚀 Starting FastAPI Backend..."
# Run FastAPI using python from local virtualenv on port 8000
./.venv/bin/python3 -m uvicorn backend.main:app --reload --port 8000 &
BACKEND_PID=$!

# Wait a brief moment for the backend to initialize
sleep 2

echo "🚀 Starting Next.js Frontend..."
# Run next dev server on default port 3000
npm run dev &
FRONTEND_PID=$!

# Wait for both processes
wait
