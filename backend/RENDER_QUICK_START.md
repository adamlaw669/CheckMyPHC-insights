# Render Deployment - Quick Start ⚡

**5-Minute Deployment Guide** for CheckMyPHC Backend

---

## Prerequisites ✅

- [ ] Code pushed to GitHub
- [ ] Render account created (free): https://dashboard.render.com/register
- [ ] Data files accessible (in repo or will use Render Disks)

---

## Step 1: Run Pre-Deployment Check

```bash
cd backend
./pre-deployment-check.sh
```

Fix any errors before proceeding.

---

## Step 2: Deploy on Render Dashboard

### A. Create Service

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub and select your repository

### B. Configure Service

| Setting | Value |
|---------|-------|
| **Name** | `checkmyphc-backend` |
| **Region** | `Oregon` (or closest to you) |
| **Branch** | `main` |
| **Environment** | `Docker` |
| **Dockerfile Path** | `./backend/Dockerfile` |
| **Docker Context** | `./backend` |

### C. Set Environment Variables

Click **"Advanced"** and add:

```
PORT=8000
OUTPUT_DIR=/data/outputs
DATA_DIR=/data/source
CORS_ORIGINS=*
LOG_LEVEL=INFO
DEBUG=False
```

⚠️ **Update `CORS_ORIGINS`** with your frontend URL before production!

### D. Configure Health Check

```
Health Check Path: /health
```

### E. Select Plan

- **Free**: Good for testing (sleeps after 15min inactivity)
- **Starter ($7/mo)**: Always-on, better for production

### F. Deploy

Click **"Create Web Service"** and wait ~5-10 minutes.

---

## Step 3: Verify Deployment

Once deployed, test your API:

```bash
# Replace with your actual URL
export API_URL="https://checkmyphc-backend.onrender.com"

# Health check
curl $API_URL/health

# API docs
open $API_URL/docs

# Test endpoint
curl "$API_URL/api/v1/outbreak-alerts?limit=5"
```

Expected response:
```json
{
  "status": "healthy",
  "service": "CheckMyPHC Insights API",
  "version": "1.0.0"
}
```

---

## Handling Data Files 📦

Your backend needs access to:
- `Backend/Outputs/*.json`
- `Backend/Data/*.csv`

### Option A: Include in Repository (Simplest)

If files are <100MB:

```bash
git add Backend/Outputs/*.json
git add Backend/Data/*.csv
git commit -m "Add data files"
git push
```

Update `Dockerfile` (add after line 19):
```dockerfile
COPY ../Backend/Outputs /data/outputs
COPY ../Backend/Data /data/source
```

### Option B: Use Render Disks

For larger files:
1. Render Dashboard → Your Service → **"Disks"**
2. Add disk: Mount at `/data`
3. Upload files via SSH

### Option C: Cloud Storage (Recommended for Production)

Store files in S3/GCS/Azure and fetch at runtime.

---

## Common Issues 🚨

### Issue: Build Fails

**Fix**: Check **Docker Context** is set to `./backend`

### Issue: Health Check Fails

**Fix**: Verify data files are accessible. Check logs in Render Dashboard.

### Issue: CORS Errors

**Fix**: Update `CORS_ORIGINS` environment variable:
```
CORS_ORIGINS=https://your-frontend.vercel.app
```

Restart service after changing env vars.

---

## Next Steps 🚀

- [ ] Update CORS_ORIGINS with your frontend URL
- [ ] Test all endpoints
- [ ] Configure custom domain (optional)
- [ ] Set up monitoring
- [ ] Enable auto-deploy on push

---

## Useful Links 🔗

- **Render Dashboard**: https://dashboard.render.com
- **Your API Docs**: `https://your-service.onrender.com/docs`
- **Render Docs**: https://render.com/docs/web-services
- **Full Guide**: See `RENDER_DEPLOYMENT_GUIDE.md`

---

## Environment Variables Reference

Copy-paste ready for Render:

```
PORT=8000
OUTPUT_DIR=/data/outputs
DATA_DIR=/data/source
CORS_ORIGINS=*
LOG_LEVEL=INFO
DEBUG=False
```

**Production** (update CORS):
```
PORT=8000
OUTPUT_DIR=/data/outputs
DATA_DIR=/data/source
CORS_ORIGINS=https://your-frontend.com
LOG_LEVEL=WARNING
DEBUG=False
```

---

## Auto-Deploy from GitHub

Render automatically deploys when you push:

```bash
git add .
git commit -m "Update API"
git push origin main
# Render detects and deploys automatically!
```

---

## Support

- **Render Status**: https://status.render.com
- **Render Support**: support@render.com
- **Your Logs**: Render Dashboard → Your Service → Logs

---

**That's it!** Your backend is live at:
```
https://your-service-name.onrender.com
```

🎉 **Happy deploying!**
