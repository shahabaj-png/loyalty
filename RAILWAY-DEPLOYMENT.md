# Deploy Backend to Railway.app (Free)

Railway.app offers a generous free tier perfect for deploying your Loyalty Platform backend with PostgreSQL and Redis included.

## Prerequisites

- GitHub account
- Railway account (sign up at https://railway.app)
- Your loyalty platform code pushed to GitHub

## Step-by-Step Deployment

### 1. Push Code to GitHub

If you haven't already, push your code to GitHub:

```bash
cd "d:\Encore Loyalty-20260829T063931Z-1-001\Encore Loyalty\loyalty-platform"
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/loyalty-platform.git
git push -u origin main
```

### 2. Sign Up for Railway

1. Go to https://railway.app
2. Click **"Start a New Project"**
3. Sign in with GitHub
4. Authorize Railway to access your repositories

### 3. Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your `loyalty-platform` repository
4. Railway will detect it's a monorepo

### 4. Configure Backend Service

1. Railway will ask which service to deploy
2. Select the **`backend`** folder
3. Click **"Add variables"** to set environment variables

### 5. Add PostgreSQL Database

1. In your Railway project dashboard
2. Click **"New"** → **"Database"** → **"Add PostgreSQL"**
3. Railway will automatically create a PostgreSQL database
4. Note: The `DATABASE_URL` will be automatically added to your backend service

### 6. Add Redis

1. Click **"New"** → **"Database"** → **"Add Redis"**
2. Railway will automatically create a Redis instance
3. Note: The `REDIS_URL` will be automatically added to your backend service

### 7. Configure Environment Variables

In your backend service settings, add these variables:

```env
NODE_ENV=production
PORT=4000
JWT_SECRET=<generate-a-strong-random-string>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
APP_URL=${{RAILWAY_PUBLIC_DOMAIN}}
FRONTEND_URL=https://torquerewards.com/loyalty
CORS_ORIGINS=https://torquerewards.com,https://www.torquerewards.com
```

**To generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Note:** `DATABASE_URL` and `REDIS_URL` are automatically set by Railway when you add those services.

### 8. Configure Build Settings

Railway should auto-detect your build settings, but verify:

**Root Directory:** `backend`

**Build Command:** `npm install && npx prisma generate && npm run build`

**Start Command:** `npx prisma migrate deploy && npm run start:prod`

### 9. Deploy

1. Click **"Deploy"**
2. Railway will build and deploy your backend
3. Watch the deployment logs for any errors

### 10. Run Database Migrations & Seed

After first deployment:

1. Go to your backend service
2. Click **"Settings"** → **"Deploy"**
3. The migrations will run automatically on startup
4. To seed the database, you can run a one-time command:
   - Click on your service
   - Go to **"Settings"** → **"Variables"**
   - Add a temporary variable: `RUN_SEED=true`
   - Redeploy
   - Remove the variable after seeding

**Or use Railway CLI:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run seed command
railway run npm run seed
```

### 11. Get Your Backend URL

1. In Railway dashboard, click on your backend service
2. Go to **"Settings"** → **"Networking"**
3. Click **"Generate Domain"**
4. Copy the URL (e.g., `https://loyalty-backend-production.up.railway.app`)

### 12. Update Frontend Configuration

Now update your frontend to use the Railway backend:

**On your local machine:**

```powershell
cd "d:\Encore Loyalty-20260829T063931Z-1-001\Encore Loyalty\loyalty-platform\web-dashboard"

# Update .env.production with your Railway URL
@"
VITE_API_URL=https://your-railway-backend-url.up.railway.app/api/v1
"@ | Out-File -FilePath .env.production -Encoding UTF8

# Rebuild
npm run build
```

**Upload to Hostinger:**

```bash
# On your SSH session
cd ~/domains/torquerewards.com/public_html/loyalty
rm -rf assets index.html

# Then upload the new dist files via SFTP
```

### 13. Test Your Deployment

1. Visit: `https://your-railway-backend-url.up.railway.app/api/docs`
2. You should see the Swagger API documentation
3. Visit: `https://torquerewards.com/loyalty/`
4. Try logging in with demo credentials:
   - Email: `admin@loyaltyplatform.com`
   - Password: `Admin123!`

---

## Railway Free Tier Limits

- **500 hours/month** of usage (about 16 hours/day)
- **100 GB bandwidth**
- **1 GB RAM** per service
- **5 GB storage**

This is sufficient for development and small production apps.

---

## Monitoring & Logs

**View Logs:**
1. Go to Railway dashboard
2. Click on your backend service
3. Click **"Deployments"** → Select latest deployment
4. View real-time logs

**Metrics:**
- CPU usage
- Memory usage
- Network traffic
- All available in the Railway dashboard

---

## Troubleshooting

### Build Fails

**Check logs for errors:**
- Missing dependencies: Run `npm install` locally first
- Prisma errors: Ensure `prisma generate` runs before build
- TypeScript errors: Fix in your code

### Database Connection Errors

**Verify:**
- PostgreSQL service is running in Railway
- `DATABASE_URL` variable is set
- Migrations have run: Check deployment logs

### Redis Connection Errors

**Verify:**
- Redis service is running in Railway
- `REDIS_URL` variable is set

### CORS Errors

**Update CORS_ORIGINS:**
```env
CORS_ORIGINS=https://torquerewards.com,https://www.torquerewards.com
```

---

## Updating Your Application

**When you push changes to GitHub:**
1. Railway automatically detects the push
2. Triggers a new deployment
3. Builds and deploys automatically

**Manual deployment:**
1. Go to Railway dashboard
2. Click on your service
3. Click **"Deploy"** → **"Redeploy"**

---

## Cost Optimization

**To stay within free tier:**
- Monitor usage in Railway dashboard
- Set up usage alerts
- Consider upgrading to paid plan ($5/month) for production use

---

## Alternative: Using Railway CLI

```bash
# Install
npm install -g @railway/cli

# Login
railway login

# Initialize in your backend folder
cd backend
railway init

# Add PostgreSQL
railway add --database postgresql

# Add Redis
railway add --database redis

# Deploy
railway up

# View logs
railway logs

# Open in browser
railway open
```

---

## Security Best Practices

✅ Use strong JWT secrets (64+ characters)
✅ Enable CORS only for your domain
✅ Keep dependencies updated
✅ Use environment variables for all secrets
✅ Enable Railway's built-in DDoS protection
✅ Monitor logs for suspicious activity

---

## Support

- **Railway Docs:** https://docs.railway.app
- **Railway Discord:** https://discord.gg/railway
- **Railway Status:** https://status.railway.app

---

**Your backend will be live at:** `https://your-project.up.railway.app`

**API Documentation:** `https://your-project.up.railway.app/api/docs`
