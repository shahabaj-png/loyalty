# Hostinger Deployment Guide

This guide will help you deploy the Loyalty Platform to a Hostinger VPS server.

## Prerequisites

- Hostinger VPS plan (Business or higher recommended)
- Domain name configured in Hostinger
- SSH access to your VPS
- Basic knowledge of Linux commands

## Deployment Options

### Option 1: VPS Deployment (Recommended)

This option gives you full control and is suitable for production use.

#### Step 1: Prepare Your VPS

1. **Connect to your VPS via SSH:**
   ```bash
   ssh root@your-vps-ip
   ```

2. **Update system packages:**
   ```bash
   apt update && apt upgrade -y
   ```

3. **Install Node.js 20.x:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
   apt install -y nodejs
   node --version  # Should show v20.x
   ```

4. **Install PostgreSQL:**
   ```bash
   apt install -y postgresql postgresql-contrib
   systemctl start postgresql
   systemctl enable postgresql
   ```

5. **Install Redis:**
   ```bash
   apt install -y redis-server
   systemctl start redis-server
   systemctl enable redis-server
   ```

6. **Install Nginx:**
   ```bash
   apt install -y nginx
   systemctl start nginx
   systemctl enable nginx
   ```

7. **Install PM2 (Process Manager):**
   ```bash
   npm install -g pm2
   ```

#### Step 2: Set Up PostgreSQL Database

1. **Create database and user:**
   ```bash
   sudo -u postgres psql
   ```

2. **Run these SQL commands:**
   ```sql
   CREATE DATABASE loyalty_platform;
   CREATE USER loyalty_user WITH PASSWORD 'your_secure_password_here';
   GRANT ALL PRIVILEGES ON DATABASE loyalty_platform TO loyalty_user;
   \q
   ```

#### Step 3: Upload Your Application

1. **Install Git (if not already installed):**
   ```bash
   apt install -y git
   ```

2. **Clone or upload your repository:**
   ```bash
   cd /var/www
   git clone <your-repo-url> loyalty-platform
   # OR upload via SFTP to /var/www/loyalty-platform
   ```

3. **Set proper permissions:**
   ```bash
   chown -R www-data:www-data /var/www/loyalty-platform
   ```

#### Step 4: Configure Backend

1. **Navigate to backend directory:**
   ```bash
   cd /var/www/loyalty-platform/backend
   ```

2. **Install dependencies:**
   ```bash
   npm install --production
   ```

3. **Create production environment file:**
   ```bash
   nano .env.production
   ```

4. **Add the following configuration:**
   ```env
   # Database
   DATABASE_URL=postgresql://loyalty_user:your_secure_password_here@localhost:5432/loyalty_platform

   # Redis
   REDIS_URL=redis://localhost:6379

   # JWT Secrets (Generate strong random strings)
   JWT_SECRET=your-super-secret-jwt-key-change-this-to-random-string
   JWT_ACCESS_EXPIRY=15m
   JWT_REFRESH_EXPIRY=7d

   # Server
   PORT=4000
   NODE_ENV=production

   # App URLs (Replace with your domain)
   APP_URL=https://api.yourdomain.com
   FRONTEND_URL=https://yourdomain.com
   CORS_ORIGINS=https://yourdomain.com

   # Optional: Identity Verification (if using)
   # ONFIDO_API_TOKEN=your-onfido-api-token
   # ONFIDO_WEBHOOK_SECRET=your-onfido-webhook-secret

   # Optional: AWS Services (if using)
   # AWS_REGION=us-east-1
   # AWS_ACCESS_KEY_ID=your-aws-access-key
   # AWS_SECRET_ACCESS_KEY=your-aws-secret-key
   # AWS_REKOGNITION_COLLECTION=loyalty-faces
   # AWS_S3_BUCKET=loyalty-platform-uploads
   ```

5. **Generate Prisma client:**
   ```bash
   npx prisma generate
   ```

6. **Run database migrations:**
   ```bash
   npx prisma migrate deploy
   ```

7. **Seed the database:**
   ```bash
   npm run seed
   ```

8. **Build the application:**
   ```bash
   npm run build
   ```

#### Step 5: Configure Frontend

1. **Navigate to frontend directory:**
   ```bash
   cd /var/www/loyalty-platform/web-dashboard
   ```

2. **Create environment file:**
   ```bash
   nano .env.production
   ```

3. **Add configuration:**
   ```env
   VITE_API_URL=https://api.yourdomain.com/api/v1
   ```

4. **Update API URL in source (if needed):**
   ```bash
   nano src/services/api.ts
   ```
   Make sure the baseURL points to your production API.

5. **Install dependencies:**
   ```bash
   npm install
   ```

6. **Build the frontend:**
   ```bash
   npm run build
   ```

#### Step 6: Configure Nginx

1. **Create Nginx configuration for backend API:**
   ```bash
   nano /etc/nginx/sites-available/loyalty-api
   ```

2. **Add this configuration:**
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;

       location / {
           proxy_pass http://localhost:4000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **Create Nginx configuration for frontend:**
   ```bash
   nano /etc/nginx/sites-available/loyalty-frontend
   ```

4. **Add this configuration:**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;
       root /var/www/loyalty-platform/web-dashboard/dist;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       location /assets {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
   }
   ```

5. **Enable the sites:**
   ```bash
   ln -s /etc/nginx/sites-available/loyalty-api /etc/nginx/sites-enabled/
   ln -s /etc/nginx/sites-available/loyalty-frontend /etc/nginx/sites-enabled/
   ```

6. **Test Nginx configuration:**
   ```bash
   nginx -t
   ```

7. **Reload Nginx:**
   ```bash
   systemctl reload nginx
   ```

#### Step 7: Set Up SSL with Let's Encrypt

1. **Install Certbot:**
   ```bash
   apt install -y certbot python3-certbot-nginx
   ```

2. **Obtain SSL certificates:**
   ```bash
   certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
   ```

3. **Follow the prompts and select option to redirect HTTP to HTTPS**

#### Step 8: Start Backend with PM2

1. **Navigate to backend directory:**
   ```bash
   cd /var/www/loyalty-platform/backend
   ```

2. **Start the application:**
   ```bash
   pm2 start npm --name "loyalty-backend" -- run start:prod
   ```

3. **Save PM2 configuration:**
   ```bash
   pm2 save
   pm2 startup
   ```

4. **Check status:**
   ```bash
   pm2 status
   pm2 logs loyalty-backend
   ```

#### Step 9: Configure Firewall

```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

#### Step 10: Verify Deployment

1. **Check backend API:**
   ```bash
   curl https://api.yourdomain.com/api/docs
   ```

2. **Visit your frontend:**
   Open browser to `https://yourdomain.com`

3. **Login with demo credentials:**
   - Email: `admin@loyaltyplatform.com`
   - Password: `Admin123!`

---

## Option 2: Hostinger Shared Hosting (Limited)

**Note:** Shared hosting has limitations and is NOT recommended for this full-stack application. You'll need VPS for PostgreSQL and Redis.

If you only want to deploy the frontend on shared hosting:

1. Build the frontend locally:
   ```bash
   cd web-dashboard
   npm run build
   ```

2. Upload the `dist` folder contents to `public_html` via File Manager or FTP

3. Create `.htaccess` file in `public_html`:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```

4. Update API URL to point to your backend VPS

---

## Maintenance Commands

### Update Application
```bash
cd /var/www/loyalty-platform
git pull origin main

# Backend
cd backend
npm install --production
npm run build
npx prisma migrate deploy
pm2 restart loyalty-backend

# Frontend
cd ../web-dashboard
npm install
npm run build
```

### View Logs
```bash
pm2 logs loyalty-backend
tail -f /var/log/nginx/error.log
```

### Database Backup
```bash
pg_dump -U loyalty_user loyalty_platform > backup_$(date +%Y%m%d).sql
```

### Monitor Resources
```bash
pm2 monit
htop
```

---

## Troubleshooting

### Backend won't start
- Check logs: `pm2 logs loyalty-backend`
- Verify database connection in `.env.production`
- Ensure PostgreSQL and Redis are running

### 502 Bad Gateway
- Check if backend is running: `pm2 status`
- Verify Nginx proxy configuration
- Check firewall rules

### Database connection errors
- Verify PostgreSQL is running: `systemctl status postgresql`
- Check database credentials in `.env.production`
- Ensure database exists: `sudo -u postgres psql -l`

### Frontend shows blank page
- Check browser console for errors
- Verify API URL in frontend configuration
- Check CORS settings in backend

---

## Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT secrets
- [ ] Enable firewall (UFW)
- [ ] Install SSL certificates
- [ ] Set up regular database backups
- [ ] Keep system packages updated
- [ ] Configure fail2ban for SSH protection
- [ ] Use environment variables for secrets
- [ ] Disable root SSH login
- [ ] Set up monitoring and alerts

---

## Performance Optimization

1. **Enable Gzip compression in Nginx**
2. **Set up Redis caching**
3. **Configure PostgreSQL connection pooling**
4. **Use CDN for static assets**
5. **Enable HTTP/2 in Nginx**
6. **Set up database indexes**
7. **Monitor with PM2 Plus or similar**

---

## Support

For issues specific to:
- **Hostinger VPS:** Contact Hostinger support
- **Application bugs:** Check application logs and GitHub issues
- **Database issues:** Check PostgreSQL logs at `/var/log/postgresql/`
