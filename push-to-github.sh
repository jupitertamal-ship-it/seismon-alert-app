#!/bin/bash
# Run this script from the Replit Shell to push to GitHub
# Usage: bash push-to-github.sh

set -e

REPO_URL="https://jupitertamal-ship-it:${GITHUB_PERSONAL_ACCESS_TOKEN}@github.com/jupitertamal-ship-it/seismon-alert-app.git"

echo "==> Configuring git identity..."
git config user.email "jupitertamal@gmail.com"
git config user.name "jupitertamal-ship-it"

echo "==> Checking for uncommitted changes..."
git add -A
git status --short

echo "==> Committing all changes..."
git commit -m "Initial commit: Earthquake Early Warning app with Android Capacitor setup" || echo "Nothing new to commit."

echo "==> Adding GitHub remote..."
git remote remove github 2>/dev/null || true
git remote add github "$REPO_URL"

echo "==> Pushing to github.com/jupitertamal-ship-it/seismon-alert-app ..."
git push github HEAD:main --force

echo ""
echo "Done! Your project is live at:"
echo "https://github.com/jupitertamal-ship-it/seismon-alert-app"
