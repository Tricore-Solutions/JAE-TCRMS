#!/bin/bash

# Change to the directory where this script lives
cd "$(dirname "$0")"

echo "============================================"
echo " JAE Philippines, Inc."
echo " Training and Certification Record System"
echo " Server v1.0.0"
echo "============================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org"
    echo "Minimum version: 18.x"
    read -p "Press Enter to close..."
    exit 1
fi

# Install dependencies if node_modules is missing
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies (first time only)..."
    npm install
    echo ""
fi

echo "Starting server..."
echo "Server will be accessible to all computers on this network."
echo ""

# Show this machine's IP address
echo "Your IP address:"
ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "(Could not detect IP — check System Settings > Network)"
echo ""
echo "Port: 3000"
echo ""
echo "Use the IP above when configuring the client app."
echo "Keep this window open while the app is in use."
echo "Press Ctrl+C to stop the server."
echo ""

node src/index.js
