# Quick Railway Deployment (5 Minutes)

Get your backend running on Railway.app for free in 5 simple steps.

## Prerequisites
- GitHub account
- Your code pushed to GitHub

## Step 1: Push to GitHub (If Not Already Done)

```bash
cd "d:\Encore Loyalty-20260829T063931Z-1-001\Encore Loyalty\loyalty-platform"

# Initialize git if needed
git init
git add .
git commit -m "Initial commit"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/loyalty-platform.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Railway

1. **Go to:** https://railway.app
2. **Click:** "Start a New Project"
3. **Sign in** with GitHub
4. **Click:** "Deploy from GitHub repo"
5. **Select:** your `loyalty-platform` repository
6. **Root Directory:** Set to `backend`

## Step 3: Add Databases

**Add PostgreSQL:**
1. Click **"New"** → **"Database"** → **"PostgreSQL"**
2. Railway auto-connects it to your backend

**Add Redis:**
1. Click **"New"** → **"Database"** → **"Redis"**
2. Railway auto-connects it to your backend

## Step 4: Set Environment Variables

Click on your backend service → **"Variables"** → Add these:

```
NODE_ENV=production
PORT=4000
JWT_SECRET=PASTE_GENERATED_SECRET_HERE
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
FRONTEND_URL=https://torquerewards.com
CORS_ORIGINS=https://torquerewards.com,https://www.torquerewards.com
```

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and paste as `JWT_SECRET` value.

## Step 5: Generate Public URL & Deploy

1. Click on backend service → **"Settings"** → **"Networking"**
2. Click **"Generate Domain"**
3. Copy the URL (e.g., `loyalty-backend-production.up.railway.app`)
4. Go back to **"Variables"** and add:
   ```
   APP_URL=https://your-railway-url.up.railway.app
   ```
5. Click **"Deploy"**

## Step 6: Seed Database (One-time)

**Option A: Using Railway Dashboard**
1. Wait for deployment to complete
2. Click on backend service → **"Settings"**
3. Scroll to **"Deploy"** section
4. Under **"Custom Start Command"**, temporarily change to:
   ```
   npx prisma migrate deploy && npm run seed && npm run start:prod
   ```
5. Click **"Redeploy"**
6. After seeding completes, change back to:
   ```
   npx prisma migrate deploy && npm run start:prod
   ```

**Option B: Using Railway CLI**
```bash
npm install -g @railway/cli
railway login
railway link
railway run npm run seed
```

## Step 7: Update Frontend

**On your local machine:**

```powershell
cd "d:\Encore Loyalty-20260829T063931Z-1-001\Encore Loyalty\loyalty-platform\web-dashboard"

# Update with your Railway URL
@"
VITE_API_URL=https://your-railway-url.up.railway.app/api/v1
"@ | Out-File -FilePath .env.production -Encoding UTF8

# Rebuild
npm run build
```

**Upload to Hostinger via SFTP:**
1. Connect to: `sftp://us-bos-web1462.us-bos.webhostbox.net`
2. Username: `u127110035`
3. Navigate to: `/domains/torquerewards.com/public_html/loyalty/`
4. Delete old files: `index.html`, `assets/` folder
5. Upload new files from `web-dashboard/dist/`

**Or via SSH:**
```bash
# On Hostinger SSH
cd ~/domains/torquerewards.com/public_html/loyalty
rm -rf index.html assets

# Then upload new dist files via SFTP
```

## Step 8: Test Everything

1. **Backend API:** https://your-railway-url.up.railway.app/api/docs
2. **Frontend:** https://torquerewards.com/loyalty/
3. **Login:**
   - Email: `admin@loyaltyplatform.com`
   - Password: `Admin123!`

---

## ✅ You're Done!

Your full-stack app is now live:
- **Frontend:** https://torquerewards.com/loyalty/
- **Backend:** https://your-railway-url.up.railway.app
- **API Docs:** https://your-railway-url.up.railway.app/api/docs

---

## Troubleshooting

### Build fails
- Check Railway logs in dashboard
- Ensure all dependencies are in `package.json`
- Verify `prisma generate` runs successfully

### Can't connect to database
- Verify PostgreSQL service is running
- Check `DATABASE_URL` is automatically set
- View logs for connection errors

### CORS errors
- Update `CORS_ORIGINS` to include your domain
- Ensure no trailing slashes in URLs

### Frontend shows errors
- Check browser console (F12)
- Verify `VITE_API_URL` points to Railway URL
- Ensure backend is deployed and running

---

## Railway Free Tier

- **500 hours/month** (≈16 hours/day)
- **100 GB bandwidth**
- **1 GB RAM** per service
- **5 GB storage**

Perfect for development and small production apps!

---

## Need Help?

Check the full guide: [RAILWAY-DEPLOYMENT.md](./RAILWAY-DEPLOYMENT.md)
