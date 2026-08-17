#!/bin/bash
# MySQL setup for JAE TRMS — developer use on macOS

set -e

MYSQL_USER="${MYSQL_ROOT_USER:-root}"
APP_USER="tcrms_user"
APP_PASSWORD="tcrms_password"
DATABASE="tcrms"

echo "Setting up MySQL for JAE TRMS (macOS dev)..."

if ! command -v mysql >/dev/null 2>&1; then
  echo "ERROR: mysql client not found."
  echo "Install MySQL: brew install mysql"
  echo "Then start it:   brew services start mysql"
  exit 1
fi

run_mysql() {
  if [ -n "$MYSQL_PASSWORD" ]; then
    mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$@"
  else
    mysql -u "$MYSQL_USER" "$@"
  fi
}

# Detect working root credentials
if [ -n "$MYSQL_ROOT_PASSWORD" ]; then
  MYSQL_PASSWORD="$MYSQL_ROOT_PASSWORD"
elif run_mysql -e "SELECT 1" >/dev/null 2>&1; then
  MYSQL_PASSWORD=""
  echo "Connected to MySQL (no root password)."
elif mysql -u "$MYSQL_USER" -prootroot -e "SELECT 1" >/dev/null 2>&1; then
  MYSQL_PASSWORD="rootroot"
  echo "Connected to MySQL (root password: rootroot)."
else
  echo ""
  echo "ERROR: Could not connect to MySQL as root."
  echo ""
  echo "Your Mac is running MySQL, but the root password is not the default."
  echo "This is common if you installed MySQL from mysql.com (Oracle installer)."
  echo ""
  echo "Fix — run the setup again with YOUR MySQL root password:"
  echo ""
  echo "  export MYSQL_ROOT_PASSWORD='your_mysql_root_password'"
  echo "  ./deployment/setup-mysql.command"
  echo ""
  echo "Don't remember the password?"
  echo "  • Check the password you set during MySQL installation"
  echo "  • Or open MySQL Workbench / System Settings if you saved it there"
  echo "  • Or reset it: https://dev.mysql.com/doc/refman/8.0/en/resetting-permissions.html"
  echo ""
  exit 1
fi

echo "Creating database and app user..."

run_mysql -e "
CREATE DATABASE IF NOT EXISTS ${DATABASE} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
DROP USER IF EXISTS '${APP_USER}'@'localhost';
CREATE USER '${APP_USER}'@'localhost' IDENTIFIED BY '${APP_PASSWORD}';
GRANT ALL PRIVILEGES ON ${DATABASE}.* TO '${APP_USER}'@'localhost';
FLUSH PRIVILEGES;
"

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -f backend/venv/bin/python ]; then
  echo "Backend venv not found — running npm run install:backend..."
  npm run install:backend
fi

if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
fi

node scripts/backend-python.js manage.py migrate

echo ""
echo "Done. Database: ${DATABASE}, user: ${APP_USER}"
echo "Start server:  npm run server"
echo "Start client:  npm run dev"
