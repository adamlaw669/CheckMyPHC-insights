# Deployment Fix Summary

## Issue
After deployment to Render, the application was experiencing an error where the backend couldn't access the JSON files in the `outputs` directory. The console showed:

```
API error, using mock data: 
code: "ERR_BAD_REQUEST"
message: "Underserved PHCs file not found: outputs/underserved_phcs.json"
status: 404
```

## Root Cause
The issue was caused by a **mismatch between the file paths in the Docker container and the environment variable configuration**:

1. **Dockerfile Issue**: The original Dockerfile only copied the `app` directory, but not the `data` and `outputs` directories containing the required JSON and CSV files.

2. **Path Configuration Mismatch**: The `render.yaml` file was setting environment variables:
   - `OUTPUT_DIR=/data/outputs`
   - `DATA_DIR=/data/source`
   
   But these directories didn't exist in the container since they were never copied.

## Changes Made

### 1. Updated Dockerfile (`/workspace/backend/Dockerfile`)

**Added directory copying:**
```dockerfile
# Copy data and outputs directories (required for insights)
COPY data ./data
COPY outputs ./outputs
```

**Fixed permissions:**
```dockerfile
# Create non-root user for security
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app && \
    chmod -R 755 /app/data /app/outputs
```

### 2. Updated render.yaml (`/workspace/backend/render.yaml`)

**Fixed environment variable paths:**
```yaml
envVars:
  - key: OUTPUT_DIR
    value: outputs  # Changed from /data/outputs
  - key: DATA_DIR
    value: data     # Changed from /data/source
```

These now match the relative paths where files are copied in the Dockerfile (relative to `/app` working directory).

### 3. Created .dockerignore (`/workspace/backend/.dockerignore`)

Created a comprehensive `.dockerignore` file to:
- Exclude unnecessary files from the Docker build
- Ensure `data` and `outputs` directories are included
- Reduce image size by excluding development files

## How It Works Now

1. **Docker Build**: When the Docker image is built:
   - Copies `app/` to `/app/app/`
   - Copies `data/` to `/app/data/`
   - Copies `outputs/` to `/app/outputs/`
   - Sets working directory to `/app`

2. **Runtime**: When the app runs:
   - Environment variables point to relative paths: `outputs` and `data`
   - Python resolves these relative to the working directory `/app`
   - Full paths become `/app/outputs` and `/app/data`
   - Files are found successfully ✅

## File Structure in Container

```
/app/
├── app/                    # Application code
│   ├── main.py
│   ├── api/
│   ├── core/
│   └── services/
├── data/                   # CSV source files
│   ├── telecommunication.csv
│   ├── inclusivity.csv
│   └── ...
├── outputs/                # Generated insights JSON files
│   ├── outbreak_alerts.json
│   ├── underserved_phcs.json
│   ├── resource_warnings.json
│   └── metrics_summary.csv
└── logs/                   # Application logs
```

## Testing

Pre-deployment checks all pass:
```bash
cd /workspace/backend
bash pre-deployment-check.sh
```

Results:
- ✓ All required files present
- ✓ All JSON data files found
- ✓ CSV data files found
- ✓ Dockerfile properly configured
- ✓ render.yaml properly configured

## Deployment Steps

To deploy the fixes:

1. **Commit the changes:**
   ```bash
   git add backend/Dockerfile backend/render.yaml backend/.dockerignore
   git commit -m "Fix: Include data and outputs directories in Docker container"
   git push
   ```

2. **Render will automatically deploy** (if auto-deploy is enabled in render.yaml)

3. **Manual deploy option:**
   - Go to Render Dashboard
   - Select your service
   - Click "Manual Deploy" → "Deploy latest commit"

4. **Verify the deployment:**
   - Check the build logs for any errors
   - Test the API health endpoint: `https://your-api-url.onrender.com/health`
   - Test data endpoints: `https://your-api-url.onrender.com/api/v1/underserved`

## Expected Result

After redeployment:
- ✅ Backend will successfully load JSON files
- ✅ Frontend will receive real data instead of falling back to mocks
- ✅ No more "file not found" errors in console
- ✅ Application will work correctly

## Additional Notes

### Frontend Fallback Behavior
The frontend has a built-in fallback mechanism that uses mock data when the API fails. This is why the app didn't completely crash, but showed "using mock data" warnings.

### Environment Variables
The following environment variables are now correctly set in `render.yaml`:
- `OUTPUT_DIR=outputs` (relative path)
- `DATA_DIR=data` (relative path)

These work because the Dockerfile sets `WORKDIR /app`, making relative paths resolve correctly.

### Docker Compose
Note: The `docker-compose.yml` uses different paths with volume mounts:
```yaml
volumes:
  - ./outputs:/data/outputs:ro
  - ./data:/data/source:ro
```

And environment variables:
```yaml
environment:
  - OUTPUT_DIR=/data/outputs
  - DATA_DIR=/data/source
```

This is correct for local development with Docker Compose, but for production deployment on Render (which uses the Dockerfile directly), we use the relative paths.

## Summary

**Problem**: Data files not included in Docker container
**Solution**: Updated Dockerfile to copy `data` and `outputs` directories, fixed paths in render.yaml
**Status**: ✅ Ready for deployment
