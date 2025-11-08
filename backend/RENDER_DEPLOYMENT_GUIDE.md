# Render Deployment Guide for CheckMyPHC Backend

## 📋 Overview

This guide walks you through deploying the CheckMyPHC Insights API backend to [Render](https://render.com/), a modern cloud platform that supports automatic deployments from GitHub.

## 🎯 Prerequisites

Before you begin, ensure you have:

1. ✅ A [Render account](https://dashboard.render.com/register) (free tier available)
2. ✅ Your backend code pushed to a GitHub repository
3. ✅ Access to your data files:
   - `backend/outputs/` (outbreak_alerts.json, underserved_phcs.json, resource_warnings.json)
   - `backend/data/` (telecommunication.csv)

## 🚀 Deployment Methods

Render offers two deployment approaches. We recommend **Method 1** for simplicity.

### Method 1: Dockerfile Deployment (Recommended)

Render will automatically detect and use your existing `Dockerfile`.

### Method 2: Native Python Deployment

Render can detect Python apps without Docker (faster builds, but requires configuration).

---

## 📦 Method 1: Deploy Using Docker (Recommended)

### Step 1: Prepare Your Repository

Your repository structure should look like this:

```
backend/
├── app/
├── Dockerfile          ✅ Already exists
├── requirements.txt    ✅ Already exists
└── render.yaml         ⬅️ We'll create this (optional)
```

### Step 2: Create render.yaml (Optional but Recommended)

Create a `render.yaml` file in the `backend/` directory for infrastructure-as-code:

```yaml
services:
  - type: web
    name: checkmyphc-backend
    env: docker
    dockerfilePath: ./Dockerfile
    dockerContext: .
    region: oregon  # Choose: oregon, frankfurt, singapore, ohio
    plan: free  # Options: free, starter, standard, pro
    branch: main  # Your main branch name
    healthCheckPath: /health
    envVars:
      - key: PORT
        value: 8000
      - key: OUTPUT_DIR
        value: /data/outputs
      - key: DATA_DIR
        value: /data/source
      - key: CORS_ORIGINS
        value: "*"  # Update with your frontend URL in production
      - key: LOG_LEVEL
        value: INFO
      - key: DEBUG
        value: False
```

### Step 3: Deploy on Render Dashboard

1. **Log in to Render**: Go to [dashboard.render.com](https://dashboard.render.com)

2. **Create New Web Service**:
   - Click **"New +"** → **"Web Service"**
   - Connect your GitHub account if not already connected
   - Select your repository

3. **Configure Service**:
   - **Name**: `checkmyphc-backend` (or your preferred name)
   - **Region**: Choose closest to your users (Oregon, Frankfurt, Singapore, Ohio)
   - **Branch**: `main` (or your primary branch)
   - **Environment**: Select **"Docker"**
   - **Dockerfile Path**: `./backend/Dockerfile` (if your Dockerfile is in the backend folder)
   - **Docker Context**: `./backend`

4. **Set Environment Variables**:
   Click **"Advanced"** and add these environment variables:

   | Key | Value | Description |
   |-----|-------|-------------|
   | `PORT` | `8000` | Server port (Render provides this automatically) |
   | `OUTPUT_DIR` | `/data/outputs` | Path to insight engine outputs |
   | `DATA_DIR` | `/data/source` | Path to source data files |
   | `CORS_ORIGINS` | `*` | CORS origins (update with your frontend URL) |
   | `LOG_LEVEL` | `INFO` | Logging level |
   | `DEBUG` | `False` | Debug mode |

5. **Configure Health Check**:
   - **Health Check Path**: `/health`

6. **Select Plan**:
   - **Free**: Great for testing (services spin down after 15 min of inactivity)
   - **Starter**: $7/month (always-on, better performance)

7. **Click "Create Web Service"**

### Step 4: Handle Data Files

⚠️ **Important**: Your backend needs access to data files in `backend/outputs/` and `backend/data/`.

#### Option A: Include Data Files in Repository (Simplest)

If your data files are small (<100MB):

1. Ensure data files are committed to your repository:
   ```bash
   git add backend/outputs/*.json
   git add backend/data/*.csv
   git commit -m "Add data files for deployment"
   git push
   ```

2. Update your `Dockerfile` to copy data files:

   ```dockerfile
   # Add after COPY app ./app
   COPY outputs /data/outputs
   COPY data /data/source
   ```

#### Option B: Use Render Disks (For Larger Files)

For files >100MB or frequently updated data:

1. In Render Dashboard, go to your service
2. Click **"Disks"** → **"Add Disk"**
3. Configure:
   - **Name**: `data-storage`
   - **Mount Path**: `/data`
   - **Size**: 1GB (or as needed)

4. Upload files via SSH or API (see Render docs)

#### Option C: Use External Storage (Production Recommended)

Store data files in:
- **AWS S3** / **Google Cloud Storage** / **Azure Blob**
- Update your backend to fetch from cloud storage

### Step 5: Update Dockerfile for Render (If Needed)

Render requires the `PORT` environment variable. Update your Dockerfile's CMD:

```dockerfile
# Current line 36:
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers"]
```

✅ This is already correct in your Dockerfile!

### Step 6: Deploy!

Once you click **"Create Web Service"**, Render will:
1. ✅ Clone your repository
2. ✅ Build your Docker image
3. ✅ Deploy your container
4. ✅ Assign a URL: `https://your-service-name.onrender.com`

**Build time**: ~5-10 minutes for first deployment

### Step 7: Verify Deployment

Once deployed, test your API:

```bash
# Health check
curl https://your-service-name.onrender.com/health

# API documentation
open https://your-service-name.onrender.com/docs

# Test endpoint
curl "https://your-service-name.onrender.com/api/v1/outbreak-alerts?limit=5"
```

---

## 🐍 Method 2: Native Python Deployment (Faster Builds)

This method doesn't use Docker and can build faster.

### Step 1: Configure Build Settings

In Render Dashboard:
- **Environment**: Select **"Python 3"**
- **Build Command**: 
  ```bash
  cd backend && pip install -r requirements.txt
  ```
- **Start Command**: 
  ```bash
  cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
  ```

### Step 2: Set Environment Variables

Same as Method 1, but also add:
- `PYTHON_VERSION`: `3.11.0`

### Step 3: Deploy

Click **"Create Web Service"** and Render will deploy using the native Python buildpack.

---

## 🔧 Configuration Best Practices

### 1. Update CORS Origins for Production

⚠️ Never use `CORS_ORIGINS=*` in production!

Update to your frontend URL:
```
CORS_ORIGINS=https://your-frontend.vercel.app,https://yourdomain.com
```

### 2. Set Proper Log Level

For production:
```
LOG_LEVEL=WARNING
```

For development/debugging:
```
LOG_LEVEL=DEBUG
```

### 3. Monitor Your Service

Render provides:
- **Logs**: Real-time logs in dashboard
- **Metrics**: CPU, Memory, Request volume
- **Alerts**: Set up notifications for downtime

### 4. Use Secrets for Sensitive Data

If you add API keys or database URLs later:
- Use Render's **"Environment Variables"** (encrypted at rest)
- Never commit secrets to your repository

---

## 📊 Monitoring Your Deployment

### Access Logs

In Render Dashboard:
1. Go to your service
2. Click **"Logs"** tab
3. View real-time logs

You'll see startup logs:
```
================================================================================
Starting CheckMyPHC Insights API v1.0.0
Output Directory: /data/outputs
Data Directory: /data/source
Log Level: INFO
CORS Origins: *
================================================================================
```

### Health Checks

Render automatically monitors `/health` endpoint:
- **Healthy**: Green indicator
- **Unhealthy**: Red indicator (service will restart automatically)

### Performance Metrics

Monitor in Dashboard:
- **Response Time**: Should be <200ms
- **Memory Usage**: ~100-200MB typical
- **CPU Usage**: Low (spikes during requests)

---

## 🚨 Troubleshooting

### Issue 1: Build Fails - "requirements.txt not found"

**Solution**: Ensure `requirements.txt` is in the correct directory.

Update **Docker Context** in Render settings:
- If Dockerfile is at `backend/Dockerfile`: Set context to `./backend`
- If Dockerfile is at root: Set context to `.`

### Issue 2: Service Starts but Health Check Fails

**Solution**: Check data files are accessible.

Verify in logs:
```bash
# In Render Dashboard → Logs, look for:
FileNotFoundError: [Errno 2] No such file or directory: '/data/outputs/outbreak_alerts.json'
```

Fix: Ensure data files are copied in Dockerfile or use Render Disks.

### Issue 3: Port Binding Error

**Solution**: Render provides `$PORT` environment variable.

Ensure your startup command uses it:
```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

✅ Your code already handles this correctly!

### Issue 4: Free Tier Service Spins Down

**Behavior**: Free tier services sleep after 15 minutes of inactivity.
- First request after sleep: ~30 seconds cold start
- Subsequent requests: Normal speed

**Solutions**:
1. Upgrade to **Starter plan** ($7/mo) for always-on service
2. Use a service like [UptimeRobot](https://uptimerobot.com/) to ping every 5 minutes
3. Accept cold starts for low-traffic applications

### Issue 5: CORS Errors from Frontend

**Solution**: Update `CORS_ORIGINS` environment variable:

```
CORS_ORIGINS=https://your-frontend-url.vercel.app,https://localhost:3000
```

Restart service after changing environment variables.

---

## 🔐 Security Checklist

Before going to production:

- [ ] Update `CORS_ORIGINS` to specific domain(s)
- [ ] Set `DEBUG=False`
- [ ] Use `LOG_LEVEL=WARNING` or `INFO`
- [ ] Review exposed endpoints (all are read-only ✅)
- [ ] Set up HTTPS (Render provides this automatically ✅)
- [ ] Configure rate limiting (see below)
- [ ] Enable DDoS protection (Render provides basic protection ✅)
- [ ] Review data file permissions (use read-only mounts ✅)

### Optional: Add Rate Limiting

Add to `requirements.txt`:
```
slowapi==0.1.9
```

Add to `app/main.py`:
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Then add to endpoints:
@app.get("/api/v1/outbreak-alerts")
@limiter.limit("60/minute")
async def outbreak_alerts(...):
    ...
```

---

## 💰 Pricing

### Free Tier
- ✅ 750 hours/month
- ✅ Spins down after 15 min inactivity
- ✅ 512MB RAM
- ✅ 0.5 CPU
- ✅ Great for testing

### Starter Plan ($7/month)
- ✅ Always-on
- ✅ 512MB RAM
- ✅ 0.5 CPU
- ✅ Custom domains
- ✅ Better performance

### Standard Plan ($25/month)
- ✅ 2GB RAM
- ✅ 1 CPU
- ✅ Higher throughput
- ✅ Priority support

**Recommendation**: Start with **Free** for testing, upgrade to **Starter** for production.

---

## 🔄 Continuous Deployment

Render automatically redeploys when you push to your connected branch:

```bash
# Make changes
git add .
git commit -m "Update API endpoint"
git push origin main

# Render automatically:
# 1. Detects push
# 2. Rebuilds Docker image
# 3. Deploys new version
# 4. Zero-downtime deployment
```

### Configure Auto-Deploy

In Render Dashboard:
1. Go to your service → **"Settings"**
2. **"Auto-Deploy"**: Toggle **ON**
3. Select branch: `main`

### Manual Deploys

Prefer manual control?
1. **"Auto-Deploy"**: Toggle **OFF**
2. Deploy manually: Click **"Manual Deploy"** → **"Deploy latest commit"**

---

## 🌐 Custom Domain Setup

Once deployed, you can use a custom domain:

### Step 1: Add Domain in Render

1. Go to service → **"Settings"** → **"Custom Domains"**
2. Click **"Add Custom Domain"**
3. Enter your domain: `api.yourdomain.com`

### Step 2: Configure DNS

Add a CNAME record in your DNS provider:

| Type | Name | Value |
|------|------|-------|
| CNAME | `api` | `your-service-name.onrender.com` |

### Step 3: Wait for SSL Certificate

Render automatically provisions a free SSL certificate (Let's Encrypt).
- Usually takes 1-5 minutes

### Step 4: Update CORS Origins

Update environment variable:
```
CORS_ORIGINS=https://api.yourdomain.com,https://yourdomain.com
```

---

## 📈 Scaling Your Backend

### Vertical Scaling (More Resources)

Upgrade your plan:
- **Starter**: 512MB RAM, 0.5 CPU
- **Standard**: 2GB RAM, 1 CPU
- **Pro**: 4GB RAM, 2 CPU

### Horizontal Scaling (Multiple Instances)

Render Pro plans support:
- **Load balancing** across multiple instances
- **Auto-scaling** based on traffic

For high traffic:
1. Upgrade to **Pro** plan ($85/mo per instance)
2. Configure instance count: 2-10 instances
3. Render automatically load balances

---

## 🧪 Testing Your Deployed API

Once deployed, test all endpoints:

```bash
# Set your API URL
export API_URL="https://your-service-name.onrender.com"

# Health check
curl $API_URL/health

# Outbreak alerts
curl "$API_URL/api/v1/outbreak-alerts?limit=5"

# Underserved PHCs
curl "$API_URL/api/v1/underserved?top_n=3"

# Alerts feed
curl "$API_URL/api/v1/alerts-feed?limit=10"

# Telecom advice
curl "$API_URL/api/v1/telecom-advice?state=Lagos"
```

### Load Testing

For production readiness:

```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Test 1000 requests, 10 concurrent
ab -n 1000 -c 10 $API_URL/api/v1/outbreak-alerts

# Look for:
# - Requests per second: >100
# - Time per request: <100ms
# - Failed requests: 0
```

---

## 📚 Additional Resources

- **Render Documentation**: https://render.com/docs
- **Render Status**: https://status.render.com/
- **FastAPI Deployment**: https://fastapi.tiangolo.com/deployment/
- **Your API Docs**: `https://your-service.onrender.com/docs`

---

## ✅ Deployment Checklist

Use this checklist when deploying:

### Pre-Deployment
- [ ] Code pushed to GitHub
- [ ] Data files available (in repo or cloud storage)
- [ ] Environment variables documented
- [ ] Tests passing locally (`pytest -v`)
- [ ] Dockerfile builds successfully (`docker build -t test .`)

### During Deployment
- [ ] Render service created
- [ ] Environment variables configured
- [ ] Health check path set (`/health`)
- [ ] Build completed successfully
- [ ] Service shows "Live" status

### Post-Deployment
- [ ] Health check passes (`curl /health`)
- [ ] API documentation accessible (`/docs`)
- [ ] All endpoints tested
- [ ] Logs showing no errors
- [ ] CORS configured for frontend
- [ ] Custom domain configured (if applicable)
- [ ] Monitoring set up

### Production Readiness
- [ ] CORS_ORIGINS updated (not `*`)
- [ ] DEBUG set to False
- [ ] LOG_LEVEL set appropriately
- [ ] Rate limiting configured (optional)
- [ ] Backup strategy for data files
- [ ] Incident response plan documented

---

## 🎉 Quick Start Summary

**5-Minute Deployment** (assumes code is on GitHub):

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Select your repository
4. Configure:
   - **Environment**: Docker
   - **Dockerfile Path**: `./backend/Dockerfile`
   - **Health Check**: `/health`
5. Add environment variables (see Step 3 in Method 1)
6. Click **"Create Web Service"**
7. Wait ~5 minutes for build
8. Test: `curl https://your-service.onrender.com/health`

**Your API is live!** 🚀

---

## 📞 Support

- **Render Support**: support@render.com
- **Render Community**: https://community.render.com/
- **Your API Logs**: Render Dashboard → Your Service → Logs

---

**Last Updated**: 2025-11-08
**Version**: 1.0.0
**Status**: Production Ready ✅
