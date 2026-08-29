# Quick Start: Deploy to Hostinger VPS

This is a simplified guide to get your Loyalty Platform running on Hostinger VPS quickly.

## Prerequisites

- Hostinger VPS (Business plan or higher)
- Domain name pointed to your VPS IP
- SSH access credentials

## Quick Deployment (5 Steps)

### 1. Initial VPS Setup

SSH into your VPS and run the setup script:

```bash
# Connect to VPS
ssh root@your-vps-ip

# Download and run setup script
cd /root
wget https://raw.githubusercontent.com/your-repo/loyalty-platform/main/setup-vps.sh
chmod +x setup-vps.sh
./setup-vps.sh
```

This will install:
- Node.js 20.x
- PostgreSQL
- Redis
- Nginx
- PM2
- Certbot (for SSL)

### 2. Upload Your Code

**Option A: Using Git (Recommended)**
```bash
cd /var/www
git clone https://github.com/your-username/loyalty-platform.git
cd loyalty-platform
```

**Option B: Using SFTP**
- Use FileZilla or similar
- Upload to `/var/www/loyalty-platform`

### 3. Configure Environment

**Backend:**
```bash
cd /var/www/loyalty-platform/backend
cp .env.production.example .env.production
nano .env.production
```

Update these critical values:
- `DATABASE_URL` - Use the password from setup script
- `JWT_SECRET` - Generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- `APP_URL` - Your API domain (e.g., https://api.yourdomain.com)
- `FRONTEND_URL` - Your frontend domain (e.g., https://yourdomain.com)
- `CORS_ORIGINS` - Your frontend domain

**Frontend:**
```bash
cd /var/www/loyalty-platform/web-dashboard
cp .env.production.example .env.production
nano .env.production
```

Update:
- `VITE_API_URL=https://api.yourdomain.com/api/v1`

### 4. Build and Deploy

```bash
# Backend
cd /var/www/loyalty-platform/backend
npm install --production
npx prisma generate
npx prisma migrate deploy
npm run seed
npm run build

# Start with PM2
pm2 start npm --name "loyalty-backend" -- run start:prod
pm2 save
pm2 startup

# Frontend
cd /var/www/loyalty-platform/web-dashboard
npm install
npm run build
```

### 5. Configure Nginx

**Setup API (Backend):**
```bash
cp /var/www/loyalty-platform/nginx-api.conf /etc/nginx/sites-available/loyalty-api
nano /etc/nginx/sites-available/loyalty-api
# Update 'api.yourdomain.com' to your actual domain
ln -s /etc/nginx/sites-available/loyalty-api /etc/nginx/sites-enabled/
```

**Setup Frontend:**
```bash
cp /var/www/loyalty-platform/nginx-frontend.conf /etc/nginx/sites-available/loyalty-frontend
nano /etc/nginx/sites-available/loyalty-frontend
# Update 'yourdomain.com' to your actual domain
ln -s /etc/nginx/sites-available/loyalty-frontend /etc/nginx/sites-enabled/
```

**Test and reload:**
```bash
nginx -t
systemctl reload nginx
```

### 6. Setup SSL (HTTPS)

```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

Follow the prompts and select option to redirect HTTP to HTTPS.

## Verify Deployment

1. **Check backend:**
   ```bash
   pm2 status
   pm2 logs loyalty-backend
   curl https://api.yourdomain.com/api/docs
   ```

2. **Check frontend:**
   Open browser: `https://yourdomain.com`

3. **Login:**
   - Email: `admin@loyaltyplatform.com`
   - Password: `Admin123!`

## Common Issues

### Backend won't start
```bash
pm2 logs loyalty-backend
# Check for database connection errors
systemctl status postgresql
systemctl status redis-server
```

### 502 Bad Gateway
```bash
pm2 restart loyalty-backend
systemctl reload nginx
```

### Database errors
```bash
# Check database exists
sudo -u postgres psql -l
# Check connection
sudo -u postgres psql -d loyalty_platform
```

## Update Application

```bash
cd /var/www/loyalty-platform
chmod +x deploy.sh
./deploy.sh
```

## Monitoring

```bash
# View logs
pm2 logs loyalty-backend

# Monitor resources
pm2 monit

# System resources
htop
```

## Backup Database

```bash
# Create backup
pg_dump -U loyalty_user loyalty_platform > backup_$(date +%Y%m%d).sql

# Restore backup
psql -U loyalty_user loyalty_platform < backup_20260829.sql
```

## Support

- **Application logs:** `pm2 logs loyalty-backend`
- **Nginx logs:** `/var/log/nginx/`
- **PostgreSQL logs:** `/var/log/postgresql/`
- **System logs:** `journalctl -xe`

## Security Reminders

✅ Change all default passwords
✅ Use strong JWT secrets (64+ characters)
✅ Enable firewall
✅ Setup SSL certificates
✅ Regular backups
✅ Keep packages updated: `apt update && apt upgrade`

---

**Need help?** Check the full [DEPLOYMENT.md](./DEPLOYMENT.md) guide for detailed instructions.
