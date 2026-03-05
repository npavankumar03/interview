#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

DB_NAME="zoommate"
DB_USER="zoommate"
DB_PASS="zoommate"
ADMIN_EMAIL="admin@zoommate.local"
ADMIN_PASS="admin123"

echo -e "${GREEN}Setting up ZoomMate database...${NC}"

# Create database user and database
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null || echo "User already exists"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || echo "Database already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

# Run schema
echo -e "${GREEN}Creating tables...${NC}"
PGPASSWORD=$DB_PASS psql -h localhost -U $DB_USER -d $DB_NAME -f src/lib/schema.sql

# Generate proper admin password hash using Node.js
echo -e "${GREEN}Creating admin account...${NC}"
ADMIN_HASH=$(node -e "
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('$ADMIN_PASS', 10);
console.log(hash);
")

PGPASSWORD=$DB_PASS psql -h localhost -U $DB_USER -d $DB_NAME -c "
  UPDATE users SET password_hash = '$ADMIN_HASH' WHERE email = '$ADMIN_EMAIL';
"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Database setup complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "  Admin login:"
echo -e "    Email:    ${YELLOW}$ADMIN_EMAIL${NC}"
echo -e "    Password: ${YELLOW}$ADMIN_PASS${NC}"
echo ""
echo -e "  ${YELLOW}IMPORTANT: Change the admin password after first login!${NC}"
echo ""
