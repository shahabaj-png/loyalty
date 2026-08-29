#!/bin/bash

# Initial VPS Setup Script for Hostinger
# Run this script on a fresh Ubuntu/Debian VPS

set -e

echo "🔧 Setting up VPS for Loyalty Platform..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root"
    exit 1
fi

# Update system
print_info "Updating system packages..."
apt update && apt upgrade -y
print_success "System updated"

# Install Node.js 20.x
print_info "Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node --version
print_success "Node.js installed"

# Install PostgreSQL
print_info "Installing PostgreSQL..."
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql
print_success "PostgreSQL installed"

# Install Redis
print_info "Installing Redis..."
apt install -y redis-server
systemctl start redis-server
systemctl enable redis-server
print_success "Redis installed"

# Install Nginx
print_info "Installing Nginx..."
apt install -y nginx
systemctl start nginx
systemctl enable nginx
print_success "Nginx installed"

# Install Git
print_info "Installing Git..."
apt install -y git
print_success "Git installed"

# Install PM2
print_info "Installing PM2..."
npm install -g pm2
print_success "PM2 installed"

# Install Certbot for SSL
print_info "Installing Certbot..."
apt install -y certbot python3-certbot-nginx
print_success "Certbot installed"

# Create application directory
print_info "Creating application directory..."
mkdir -p /var/www/loyalty-platform
print_success "Directory created"

# Configure PostgreSQL
print_info "Configuring PostgreSQL..."
echo "Please enter a secure password for the database user:"
read -s DB_PASSWORD

sudo -u postgres psql << EOF
CREATE DATABASE loyalty_platform;
CREATE USER loyalty_user WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE loyalty_platform TO loyalty_user;
ALTER DATABASE loyalty_platform OWNER TO loyalty_user;
\q
EOF
print_success "PostgreSQL configured"

# Configure firewall
print_info "Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
print_success "Firewall configured"

# Save database password to file
echo "DATABASE_PASSWORD=$DB_PASSWORD" > /root/.loyalty-db-creds
chmod 600 /root/.loyalty-db-creds
print_success "Database credentials saved to /root/.loyalty-db-creds"

echo ""
print_success "🎉 VPS setup completed!"
echo ""
print_info "Next steps:"
echo "1. Upload your application code to /var/www/loyalty-platform"
echo "2. Configure environment variables in backend/.env.production"
echo "3. Run the deployment script: bash deploy.sh"
echo "4. Set up SSL: certbot --nginx -d yourdomain.com -d api.yourdomain.com"
echo ""
print_info "Database credentials saved in: /root/.loyalty-db-creds"
