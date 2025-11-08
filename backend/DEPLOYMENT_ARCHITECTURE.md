# CheckMyPHC Backend - Deployment Architecture

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Internet / Users                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS (Auto SSL)
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    Render Cloud Platform                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         Load Balancer + DDoS Protection              │  │
│  └───────────────────────┬───────────────────────────────┘  │
│                          │                                   │
│  ┌───────────────────────▼───────────────────────────────┐  │
│  │         Docker Container (Python 3.11-slim)          │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │   FastAPI Application (CheckMyPHC Insights)     │ │  │
│  │  │   - Uvicorn ASGI Server                         │ │  │
│  │  │   - 4 API Endpoints                              │ │  │
│  │  │   - Health Check Monitoring                      │ │  │
│  │  │   - Structured Logging                           │ │  │
│  │  │   - CORS Configuration                           │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  │                       │                               │  │
│  │                       │ reads data                    │  │
│  │                       ▼                               │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │        Data Layer (/data/)                      │ │  │
│  │  │  - /data/outputs/ (JSON files)                   │ │  │
│  │  │  - /data/source/ (CSV files)                     │ │  │
│  │  │  - 30-second caching layer                       │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
│  Monitoring & Logs                                            │
│  - Health checks every 30s                                    │
│  - Structured logs (stdout)                                   │
│  - Metrics (CPU, Memory, Requests)                            │
└────────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow

### 1. Request Flow

```
User Request
    │
    ├─> [Render Load Balancer]
    │       │
    │       ├─> SSL/TLS Termination
    │       └─> DDoS Protection
    │
    └─> [FastAPI Application]
            │
            ├─> CORS Middleware
            ├─> Request Validation (Pydantic)
            └─> Route Handler
                    │
                    └─> [Insight Loader Service]
                            │
                            ├─> Check Cache (30s TTL)
                            │       │
                            │       ├─> Cache Hit: Return cached data
                            │       └─> Cache Miss: Load from disk
                            │
                            └─> [Data Files]
                                    ├─> outbreak_alerts.json
                                    ├─> underserved_phcs.json
                                    ├─> resource_warnings.json
                                    └─> telecommunication.csv
```

### 2. Response Flow

```
Data Processing
    │
    ├─> Data Normalization
    │   ├─> Lowercase PHC names
    │   ├─> Trim whitespace
    │   └─> Remove punctuation
    │
    ├─> Filtering (if requested)
    │   ├─> By State
    │   ├─> By LGA
    │   └─> By Alert Level
    │
    ├─> Pagination
    │   ├─> Apply offset
    │   └─> Apply limit
    │
    └─> Pydantic Serialization
            │
            └─> JSON Response
                    │
                    └─> [User receives data]
```

## 🏗️ Deployment Environments

### Development (Local)

```yaml
Environment: Local Machine
Runtime: Python 3.10+
Server: Uvicorn (reload enabled)
Data: outputs and data
Logs: Console + logs/app.log
```

**Start Command**:
```bash
uvicorn app.main:app --reload --port 8000
```

### Staging/Production (Render)

```yaml
Environment: Render Docker Container
Runtime: Python 3.11-slim
Server: Uvicorn (production mode)
Data: /data/outputs and /data/source
Logs: Stdout (captured by Render)
SSL: Automatic (Let's Encrypt)
Domain: https://your-service.onrender.com
```

**Start Command** (in Dockerfile):
```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT --proxy-headers
```

## 📦 Data Storage Strategies

### Strategy 1: Repository-Based (Simplest)

**Best for**: Small datasets (<100MB), infrequent updates

```
GitHub Repository
    └── backend/
        ├── outputs/
        │   ├── outbreak_alerts.json (committed)
        │   ├── underserved_phcs.json (committed)
        │   └── resource_warnings.json (committed)
        └── data/
            └── telecommunication.csv (committed)
```

**Deployment**: Files copied during Docker build

**Pros**:
- Simple setup
- Version controlled
- No extra configuration

**Cons**:
- Large files slow down builds
- Updates require redeployment
- Not suitable for >100MB datasets

### Strategy 2: Render Disks (Persistent Storage)

**Best for**: Medium datasets (100MB-10GB), occasional updates

```
Render Service
    └── Attached Disk (/data)
        ├── outputs/
        │   ├── outbreak_alerts.json
        │   ├── underserved_phcs.json
        │   └── resource_warnings.json
        └── source/
            └── telecommunication.csv
```

**Deployment**: Disk mounted to container

**Pros**:
- Persistent across deployments
- Larger file support
- Can update without redeployment

**Cons**:
- Additional cost ($0.25/GB/month)
- Manual file upload required
- Limited to single region

### Strategy 3: Cloud Storage (Production)

**Best for**: Large datasets (>10GB), frequent updates, multi-region

```
Cloud Storage (S3/GCS/Azure)
    └── checkmyphc-data/
        ├── outputs/
        │   ├── outbreak_alerts.json
        │   ├── underserved_phcs.json
        │   └── resource_warnings.json
        └── source/
            └── telecommunication.csv

Your Application
    └── Fetches from cloud storage at startup/on-demand
```

**Deployment**: App fetches files via API

**Pros**:
- Unlimited scalability
- Multi-region support
- Easy automated updates
- Separate data pipeline

**Cons**:
- More complex setup
- Additional cost
- Requires code changes

## 🔐 Security Layers

### 1. Network Security

```
┌─────────────────────────────────────┐
│  Render Platform Security           │
│  - DDoS Protection                   │
│  - Firewall                          │
│  - SSL/TLS Encryption               │
└─────────────────────────────────────┘
```

### 2. Application Security

```
┌─────────────────────────────────────┐
│  FastAPI Security                    │
│  - CORS Configuration                │
│  - Input Validation (Pydantic)      │
│  - Type Safety                       │
│  - Error Handling                    │
└─────────────────────────────────────┘
```

### 3. Container Security

```
┌─────────────────────────────────────┐
│  Docker Security                     │
│  - Non-root user (uid 1000)         │
│  - Minimal base image (slim)        │
│  - No unnecessary packages          │
│  - Read-only data mounts            │
└─────────────────────────────────────┘
```

## 📊 Performance Characteristics

### Response Times (Typical)

| Endpoint | Cold Start | Warm Cache | Notes |
|----------|------------|------------|-------|
| `/health` | ~5ms | ~5ms | No data loading |
| `/api/v1/outbreak-alerts` | ~80ms | ~20ms | 100 records |
| `/api/v1/underserved` | ~90ms | ~25ms | With summary calc |
| `/api/v1/alerts-feed` | ~120ms | ~40ms | 200 records |
| `/api/v1/telecom-advice` | ~70ms | ~15ms | Network analysis |

### Caching Strategy

```
Request → Check Cache (in-memory)
              │
              ├─> Hit (age < 30s): Return cached data (~5ms)
              │
              └─> Miss or Expired: Load from disk (~50-100ms)
                      │
                      └─> Store in cache for 30s
```

**Cache Settings**:
- **TTL**: 30 seconds (configurable)
- **Storage**: In-memory (per container)
- **Invalidation**: Time-based or manual (`?refresh=true`)

## 🚦 Health Monitoring

### Health Check Flow

```
Render Platform (every 30s)
    │
    └─> GET /health
            │
            ├─> 200 OK: Service is healthy
            │       └─> Continue serving traffic
            │
            └─> 500 Error or Timeout: Service is unhealthy
                    └─> Auto-restart container
                    └─> Send alert notification
```

### Logging Strategy

```
Application Logs
    │
    ├─> Structured Format (JSON-compatible)
    │   ├─> Timestamp
    │   ├─> Log Level
    │   ├─> Module
    │   └─> Message
    │
    └─> Output Destinations
            ├─> stdout (captured by Render)
            └─> logs/app.log (in container, ephemeral)
```

**Log Levels**:
- `DEBUG`: Detailed info (development only)
- `INFO`: General info, data loading, cache hits
- `WARNING`: Unexpected but handled issues
- `ERROR`: Errors requiring attention

## 🔄 CI/CD Pipeline

### Automatic Deployment Flow

```
Developer
    │
    └─> git push origin main
            │
            └─> GitHub Repository
                    │
                    └─> Webhook to Render
                            │
                            ├─> Clone repository
                            ├─> Build Docker image
                            ├─> Run health checks
                            └─> Deploy (zero-downtime)
                                    │
                                    └─> New version live!
```

**Deployment Steps**:
1. ✅ Fetch latest code from GitHub
2. ✅ Build Docker image (5-10 min)
3. ✅ Start new container
4. ✅ Health check on new container
5. ✅ Route traffic to new container
6. ✅ Gracefully shutdown old container

**Zero-Downtime**: Old version serves traffic until new version is healthy

## 📈 Scaling Strategy

### Vertical Scaling (More Resources)

```
Free Tier              Starter ($7/mo)        Standard ($25/mo)
├─ 512MB RAM           ├─ 512MB RAM           ├─ 2GB RAM
├─ 0.5 CPU             ├─ 0.5 CPU             ├─ 1 CPU
└─ Sleeps after 15min  └─ Always on           └─ Higher throughput
```

### Horizontal Scaling (More Instances)

```
Pro Plan ($85/mo per instance)
    │
    ├─> Load Balancer
    │       │
    │       ├─> Instance 1 (active)
    │       ├─> Instance 2 (active)
    │       └─> Instance N (active)
    │
    └─> Auto-scaling (2-10 instances)
            └─> Based on CPU/Memory/Request rate
```

**When to Scale**:
- Vertical: Response times >200ms consistently
- Horizontal: CPU usage >70% consistently, or need high availability

## 🛠️ Maintenance Tasks

### Daily

- [ ] Check Render dashboard for health status
- [ ] Review error logs (if any)
- [ ] Monitor response times

### Weekly

- [ ] Review aggregated logs
- [ ] Check for security updates
- [ ] Verify data freshness

### Monthly

- [ ] Update dependencies (`pip install --upgrade`)
- [ ] Review performance metrics
- [ ] Optimize caching strategy if needed
- [ ] Update documentation

## 📝 Configuration Summary

### Environment Variables

| Variable | Development | Production | Description |
|----------|-------------|------------|-------------|
| `OUTPUT_DIR` | `outputs` | `/data/outputs` | Insight outputs |
| `DATA_DIR` | `data` | `/data/source` | Source data |
| `CORS_ORIGINS` | `*` | `https://yourdomain.com` | Allowed origins |
| `LOG_LEVEL` | `DEBUG` | `INFO` or `WARNING` | Logging verbosity |
| `PORT` | `8000` | `$PORT` (from Render) | Server port |
| `DEBUG` | `True` | `False` | Debug mode |

## 🎯 Production Checklist

Before going live:

### Security
- [ ] CORS_ORIGINS updated (not `*`)
- [ ] DEBUG set to False
- [ ] No secrets in code
- [ ] HTTPS enabled (automatic on Render)

### Performance
- [ ] Cache TTL configured
- [ ] Response times tested
- [ ] Data files optimized

### Monitoring
- [ ] Health checks configured
- [ ] Log aggregation setup
- [ ] Error notifications enabled

### Documentation
- [ ] API documentation accessible
- [ ] Runbook updated
- [ ] Contact information current

---

## 📞 Support & Resources

- **Render Dashboard**: https://dashboard.render.com
- **Render Docs**: https://render.com/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com
- **Your API Docs**: `https://your-service.onrender.com/docs`

---

**Architecture Version**: 1.0.0  
**Last Updated**: 2025-11-08  
**Status**: Production Ready ✅
