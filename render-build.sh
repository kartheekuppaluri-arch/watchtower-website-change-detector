#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "📦 Installing project dependencies..."
npm install

echo "🌐 Installing Chromium for Puppeteer..."
npx puppeteer browsers install chrome

echo "⚡ Building frontend assets..."
npm run build

echo "✅ Render build complete!"
