#!/usr/bin/env bash
set -e

# ==============================================================================
# GoCustify CRM - Production Deployment Script for AWS EC2
# ==============================================================================
APP_DIR="/home/ubuntu/Mabdel"
PERSISTENT_ENV_DIR="/home/ubuntu/persistent_env"
REPO_URL="https://github.com/fahiiim/Gocustify-CRM.git"
BRANCH="main"

echo "=========================================================="
echo " Starting GoCustify CRM Deployment on AWS EC2"
echo " Timestamp: $(date)"
echo " Host: $(hostname)"
echo "=========================================================="

# ------------------------------------------------------------------------------
# 1. Back up existing manual .env files to persistent directory
# ------------------------------------------------------------------------------
mkdir -p "$PERSISTENT_ENV_DIR"

if [ -f "$APP_DIR/Mabdel Backend/.env" ]; then
  echo "[*] Safeguarding active backend .env to $PERSISTENT_ENV_DIR/backend.env..."
  cp "$APP_DIR/Mabdel Backend/.env" "$PERSISTENT_ENV_DIR/backend.env"
fi

if [ -f "$APP_DIR/Mabdel Website/.env" ]; then
  echo "[*] Safeguarding active website .env to $PERSISTENT_ENV_DIR/website.env..."
  cp "$APP_DIR/Mabdel Website/.env" "$PERSISTENT_ENV_DIR/website.env"
fi

if [ -f "$APP_DIR/madbel-dashboard/.env" ]; then
  echo "[*] Safeguarding active dashboard .env to $PERSISTENT_ENV_DIR/dashboard.env..."
  cp "$APP_DIR/madbel-dashboard/.env" "$PERSISTENT_ENV_DIR/dashboard.env"
fi

# ------------------------------------------------------------------------------
# 2. Clean out old code and pull latest commit from GitHub
# ------------------------------------------------------------------------------
mkdir -p "$APP_DIR"
cd "$APP_DIR"

if [ ! -d ".git" ]; then
  echo "[*] Initializing fresh clone from $REPO_URL..."
  git clone "$REPO_URL" .
else
  echo "[*] Fetching latest changes from $REPO_URL ($BRANCH)..."
  git remote set-url origin "$REPO_URL"
  git fetch origin "$BRANCH"
  git reset --hard "origin/$BRANCH"
  # Clean untracked files while preserving uploads and env files
  git clean -fd -e "uploads" -e "private_uploads" -e "*.env*"
fi

echo "[*] Code synchronized at commit: $(git log -1 --oneline)"

# ------------------------------------------------------------------------------
# 3. Restore manual .env files from persistent vault
# ------------------------------------------------------------------------------
echo "[*] Restoring manual .env files..."
if [ -f "$PERSISTENT_ENV_DIR/backend.env" ]; then
  cp "$PERSISTENT_ENV_DIR/backend.env" "$APP_DIR/Mabdel Backend/.env"
  chmod 600 "$APP_DIR/Mabdel Backend/.env"
  echo "[✓] Backend .env restored from persistent vault."
elif [ -f "$APP_DIR/Mabdel Backend/.env.example" ] && [ ! -f "$APP_DIR/Mabdel Backend/.env" ]; then
  cp "$APP_DIR/Mabdel Backend/.env.example" "$APP_DIR/Mabdel Backend/.env"
  echo "[!] Initialized default backend .env from example. Please edit with 'nano Mabdel\\ Backend/.env'."
fi

if [ -f "$PERSISTENT_ENV_DIR/website.env" ]; then
  cp "$PERSISTENT_ENV_DIR/website.env" "$APP_DIR/Mabdel Website/.env"
fi

if [ -f "$PERSISTENT_ENV_DIR/dashboard.env" ]; then
  cp "$PERSISTENT_ENV_DIR/dashboard.env" "$APP_DIR/madbel-dashboard/.env"
fi

# Ensure uploads directories exist with proper permissions
mkdir -p "$APP_DIR/Mabdel Backend/uploads" "$APP_DIR/Mabdel Backend/private_uploads"
chmod -R 775 "$APP_DIR/Mabdel Backend/uploads" "$APP_DIR/Mabdel Backend/private_uploads"

# ------------------------------------------------------------------------------
# 4. Build and restart Docker containers
# ------------------------------------------------------------------------------
echo "[*] Building and restarting Docker containers..."
cd "$APP_DIR/Mabdel Backend"
docker compose -f docker-compose.prod.yml down --remove-orphans || true
docker compose -f docker-compose.prod.yml up -d --build

# ------------------------------------------------------------------------------
# 5. Build and deploy Frontend Website (gocustify.com)
# ------------------------------------------------------------------------------
echo "[*] Building and deploying Frontend Website..."
cd "$APP_DIR/Mabdel Website"
if command -v npm &> /dev/null; then
  npm install --prefer-offline --no-audit
  npm run build
  sudo mkdir -p /var/www/gocustify
  sudo cp -r dist/* /var/www/gocustify/
  echo "[✓] Website deployed to /var/www/gocustify."
fi

# ------------------------------------------------------------------------------
# 6. Build and deploy Dashboard Frontend (admin / owner portals)
# ------------------------------------------------------------------------------
echo "[*] Building and deploying Admin / Owner Dashboard..."
cd "$APP_DIR/madbel-dashboard"
if command -v npm &> /dev/null; then
  npm install --prefer-offline --no-audit
  npm run build
  sudo mkdir -p /var/www/admin.gocustify.com /var/www/owner.gocustify.com
  sudo cp -r dist/* /var/www/admin.gocustify.com/
  sudo cp -r dist/* /var/www/owner.gocustify.com/
  echo "[✓] Dashboard deployed to /var/www/admin.gocustify.com and owner.gocustify.com."
fi

# ------------------------------------------------------------------------------
# 7. Reload Nginx
# ------------------------------------------------------------------------------
echo "[*] Verifying and reloading Nginx..."
if [ -f "$APP_DIR/deploy/nginx/gocustify.conf" ]; then
  sudo cp "$APP_DIR/deploy/nginx/gocustify.conf" /etc/nginx/sites-available/gocustify.conf
  sudo ln -sf /etc/nginx/sites-available/gocustify.conf /etc/nginx/sites-enabled/gocustify.conf
fi
sudo nginx -t && sudo systemctl reload nginx || true

# ------------------------------------------------------------------------------
# 8. Verify Backend Health
# ------------------------------------------------------------------------------
echo "[*] Verifying backend container health..."
for i in $(seq 1 15); do
  if curl -sf http://127.0.0.1:8000/health; then
    echo ""
    echo "[✓] Backend is healthy and responding on http://127.0.0.1:8000/health!"
    break
  fi
  echo "Waiting for backend service to report healthy ($i/15)..."
  sleep 4
done

# ------------------------------------------------------------------------------
# 9. Clean up dangling images & caches to protect EC2 disk
# ------------------------------------------------------------------------------
echo "[*] Pruning dangling Docker images and build caches..."
docker image prune -f
docker builder prune -f --keep-storage 1GB || true

echo "=========================================================="
echo " [✓] Deployment finished successfully at $(date)"
echo "=========================================================="
