#!/data/data/com.termux/files/usr/bin/bash
# MADC-SYS Termux Setup Script
# Run once on your phone to install everything

set -e

echo ""
echo "===================================="
echo "  MADC-SYS  Termux Setup"
echo "===================================="
echo ""

# Update packages
echo "[1/5] Updating Termux packages..."
pkg update -y && pkg upgrade -y

# Install Node.js and git
echo "[2/5] Installing Node.js..."
pkg install -y nodejs git

# Install pnpm (optional, only for workspace use)
echo "[3/5] Installing dependencies..."
npm install

# Build the bundle
echo "[4/5] Building MADC-SYS bundle..."
npm run build

# Make executable
chmod +x dist/madc.cjs

echo "[5/5] Installing globally..."
npm install -g .

echo ""
echo "===================================="
echo "  Setup complete!"
echo ""
echo "  Run:  madc"
echo "  Or:   node dist/madc.cjs"
echo "  Or:   node dist/madc.cjs \"build a REST API\""
echo "===================================="
echo ""
