#!/usr/bin/env bash
# Render Build Script for ChainMind
# Builds the React frontend and installs Python backend dependencies.

set -o errexit  # Exit on error

echo "=== [1/4] Installing Node.js dependencies ==="
npm install

echo "=== [2/4] Building React frontend ==="
npm run build

echo "=== [3/4] Installing Python dependencies ==="
pip install -r backend/requirements.txt

echo "=== [4/4] Build complete! ==="
echo "Frontend built to dist/"
echo "Backend ready with gunicorn"
