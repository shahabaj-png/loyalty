#!/bin/bash

# Loyalty Platform Deployment Script for Hostinger VPS
# This script automates the deployment process

set -e

echo "🚀 Starting Loyalty Platform Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/var/www/loyalty-platform"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/web-dashboard"

# Function to print colored messages
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
    print_error "Please run as root (use sudo)"
    exit 1
fi

# Step 1: Pull latest code
print_info "Pulling latest code..."
cd $APP_DIR
git pull origin main
print_success "Code updated"

# Step 2: Deploy Backend
print_info "Deploying backend..."
cd $BACKEND_DIR

# Install dependencies
print_info "Installing backend dependencies..."
npm install --production

# Generate Prisma client
print_info "Generating Prisma client..."
npx prisma generate

# Run migrations
print_info "Running database migrations..."
npx prisma migrate deploy

# Build application
print_info "Building backend..."
npm run build

# Restart PM2 process
print_info "Restarting backend service..."
pm2 restart loyalty-backend || pm2 start npm --name "loyalty-backend" -- run start:prod
print_success "Backend deployed"

# Step 3: Deploy Frontend
print_info "Deploying frontend..."
cd $FRONTEND_DIR

# Install dependencies
print_info "Installing frontend dependencies..."
npm install

# Build application
print_info "Building frontend..."
npm run build

print_success "Frontend deployed"

# Step 4: Reload Nginx
print_info "Reloading Nginx..."
nginx -t && systemctl reload nginx
print_success "Nginx reloaded"

# Step 5: Save PM2 configuration
pm2 save

# Final status check
print_info "Checking application status..."
pm2 status

echo ""
print_success "🎉 Deployment completed successfully!"
echo ""
print_info "Backend API: Check with 'pm2 logs loyalty-backend'"
print_info "Frontend: Served by Nginx"
print_info "Monitor: Run 'pm2 monit'"
