#!/bin/bash

echo "🎵 Setting up Spotify Auto-Refresh System..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first:"
    echo "   https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔑 Next steps:"
echo "1. Create a .env file with your Spotify credentials:"
echo "   SPOTIFY_CLIENT_ID=your_client_id_here"
echo "   SPOTIFY_CLIENT_SECRET=your_client_secret_here"
echo "   PORT=3001"
echo ""
echo "2. Get your credentials from: https://developer.spotify.com/dashboard"
echo ""
echo "3. Start the server:"
echo "   npm start"
echo ""
echo "4. Open your portfolio website - it will automatically use the backend proxy!"
echo ""
echo "🚀 Your Spotify token will now refresh automatically every hour!"
