#!/bin/bash

# EnSolv Hackathon Demo Script
# Run this to quickly set up and demo the application

echo "🔮 Setting up EnSolv for ETHGlobal Bangkok Demo..."
echo "=================================================="

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm not found. Installing pnpm..."
    npm install -g pnpm
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Start backend in background (if exists)
if [ -d "backend" ]; then
    echo "🚀 Starting backend server..."
    cd backend
    pnpm install
    pnpm dev &
    BACKEND_PID=$!
    cd ..
    sleep 3
fi

# Start frontend
echo "🎨 Starting frontend development server..."
pnpm dev &
FRONTEND_PID=$!

echo ""
echo "✅ Demo setup complete!"
echo "=================================================="
echo ""
echo "🌐 Frontend: http://localhost:5173"
if [ -d "backend" ]; then
    echo "⚡ Backend:  http://localhost:3001"
fi
echo ""
echo "🎯 Demo Instructions:"
echo "1. Open the frontend URL in your browser"
echo "2. Connect MetaMask wallet (or skip for demo mode)"
echo "3. Try these ENS names:"
echo "   • vitalik.eth"
echo "   • austingriffith.eth"
echo "   • nick.eth"
echo "   • coopahtroopa.eth"
echo ""
echo "🔄 Swap Demo:"
echo "1. After resolving an ENS, click 'Swap Tokens'"
echo "2. Select from your portfolio tokens"
echo "3. Choose cross-chain destination (Polygon ↔ Rootstock)"
echo "4. See Katana Network integration in action"
echo ""
echo "⚡ Key Features to Highlight:"
echo "• Dual ENS resolution (Ethers.js + ENSJS fallback)"
echo "• Real-time portfolio across 10+ networks"
echo "• Katana Network cross-chain swaps"
echo "• Beautiful toast notifications"
echo "• Mobile-responsive design"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for user interrupt
trap 'echo ""; echo "🛑 Stopping servers..."; kill $FRONTEND_PID 2>/dev/null; if [ ! -z "$BACKEND_PID" ]; then kill $BACKEND_PID 2>/dev/null; fi; echo "✅ Demo stopped. Thanks for checking out EnSolv!"; exit 0' INT

# Keep script running
while true; do
    sleep 1
done