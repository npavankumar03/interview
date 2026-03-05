#!/bin/bash
set -e

# ============================================
#  ZoomMate — One-Click Ubuntu Installation
# ============================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                          ║${NC}"
echo -e "${BLUE}║   ${GREEN}ZoomMate Installer${BLUE}                     ║${NC}"
echo -e "${BLUE}║   ${NC}Real-Time Interview Copilot${BLUE}             ║${NC}"
echo -e "${BLUE}║                                          ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
  echo -e "${RED}Please don't run as root. Run as a regular user with sudo access.${NC}"
  exit 1
fi

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$APP_DIR"

# ---- Step 1: System Dependencies ----
echo -e "${GREEN}[1/7] Installing system dependencies...${NC}"
sudo apt-get update -qq
sudo apt-get install -y -qq curl git postgresql postgresql-contrib nginx certbot python3-certbot-nginx > /dev/null 2>&1
echo -e "  ✓ PostgreSQL, Nginx, Certbot installed"

# ---- Step 2: Node.js ----
echo -e "${GREEN}[2/7] Installing Node.js 20...${NC}"
if ! command -v node &> /dev/null || [ "$(node -v | cut -d'.' -f1 | tr -d 'v')" -lt 18 ]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - > /dev/null 2>&1
  sudo apt-get install -y -qq nodejs > /dev/null 2>&1
  echo -e "  ✓ Node.js $(node -v) installed"
else
  echo -e "  ✓ Node.js $(node -v) already installed"
fi

# ---- Step 3: Install npm packages ----
echo -e "${GREEN}[3/7] Installing npm packages...${NC}"
npm install --production=false --silent 2>/dev/null
echo -e "  ✓ Dependencies installed"

# ---- Step 4: PostgreSQL Setup ----
echo -e "${GREEN}[4/7] Setting up PostgreSQL database...${NC}"
sudo systemctl start postgresql
sudo systemctl enable postgresql > /dev/null 2>&1

# Create DB user and database
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='zoommate'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER zoommate WITH PASSWORD 'zoommate';" > /dev/null 2>&1
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='zoommate'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE zoommate OWNER zoommate;" > /dev/null 2>&1
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE zoommate TO zoommate;" > /dev/null 2>&1

# Run schema
PGPASSWORD=zoommate psql -h localhost -U zoommate -d zoommate -f src/lib/schema.sql > /dev/null 2>&1

# Generate admin password hash and set it
ADMIN_HASH=$(node -e "const b=require('bcryptjs');console.log(b.hashSync('admin123',10));")
PGPASSWORD=zoommate psql -h localhost -U zoommate -d zoommate -c \
  "UPDATE users SET password_hash = '$ADMIN_HASH' WHERE email = 'admin@zoommate.local';" > /dev/null 2>&1

echo -e "  ✓ Database created and initialized"

# ---- Step 5: Environment Configuration ----
echo -e "${GREEN}[5/7] Configuring environment...${NC}"
if [ ! -f .env.local ]; then
  NEXTAUTH_SECRET=$(openssl rand -base64 32)
  cat > .env.local << EOF
DATABASE_URL=postgresql://zoommate:zoommate@localhost:5432/zoommate
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
EOF
  echo -e "  ✓ .env.local created with secure secret"
else
  echo -e "  ✓ .env.local already exists (keeping existing config)"
fi

# ---- Step 6: Build the app ----
echo -e "${GREEN}[6/7] Building the application...${NC}"
npm run build 2>/dev/null
echo -e "  ✓ Application built successfully"

# ---- Step 7: Setup systemd service ----
echo -e "${GREEN}[7/7] Setting up system service...${NC}"
sudo tee /etc/systemd/system/zoommate.service > /dev/null << EOF
[Unit]
Description=ZoomMate - Real-Time Interview Copilot
After=network.target postgresql.service

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$APP_DIR
ExecStart=$(which node) node_modules/.bin/next start -p 3000
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=$APP_DIR/.env.local

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable zoommate > /dev/null 2>&1
sudo systemctl restart zoommate

# ---- Setup Nginx reverse proxy ----
sudo tee /etc/nginx/sites-available/zoommate > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
        client_max_body_size 10M;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/zoommate /etc/nginx/sites-enabled/zoommate
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t > /dev/null 2>&1 && sudo systemctl restart nginx

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                          ║${NC}"
echo -e "${GREEN}║   ✓ ZoomMate installed successfully!     ║${NC}"
echo -e "${GREEN}║                                          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BLUE}App URL:${NC}       http://$(hostname -I | awk '{print $1}')"
echo -e "  ${BLUE}Admin Login:${NC}   admin@zoommate.local"
echo -e "  ${BLUE}Admin Pass:${NC}    admin123"
echo ""
echo -e "  ${YELLOW}NEXT STEPS:${NC}"
echo -e "  1. Open the app in your browser"
echo -e "  2. Log in as admin"
echo -e "  3. Go to Admin → Settings"
echo -e "  4. Enter your OpenAI API key"
echo -e "  5. Enter your Deepgram API key"
echo -e "  6. You're ready to go!"
echo ""
echo -e "  ${YELLOW}OPTIONAL — Setup HTTPS with your domain:${NC}"
echo -e "  sudo certbot --nginx -d yourdomain.com"
echo -e "  Then update NEXTAUTH_URL in .env.local"
echo ""
echo -e "  ${YELLOW}USEFUL COMMANDS:${NC}"
echo -e "  sudo systemctl status zoommate    # Check app status"
echo -e "  sudo systemctl restart zoommate   # Restart app"
echo -e "  sudo journalctl -u zoommate -f    # View logs"
echo ""
