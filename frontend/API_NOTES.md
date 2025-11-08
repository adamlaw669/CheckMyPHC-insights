# API Integration Notes

## API Status

**Backend URL**: `https://presight.onrender.com/api/v1`

### Connection Test Results (2025-11-08)

- **Health Endpoint**: `404 Not Found`
- **Outbreak Alerts**: `404 Not Found`

### Current Behavior

The dashboard is configured to gracefully handle API unavailability:

1. **Primary Mode**: Attempts to connect to production API
2. **Fallback Mode**: Uses comprehensive mock data from `mocks/` directory
3. **User Notification**: Yellow banner indicates when mock data is in use
4. **No Errors**: Application continues to function fully

## Mock Data Coverage

All API endpoints have mock data fallbacks:

### 1. Outbreak Alerts
- **File**: `mocks/sample_outbreak_alerts.json`
- **Records**: 8 PHCs across Nigeria
- **Fields**: All required fields including coordinates, alert levels, risk scores

### 2. Underserved PHCs
- **File**: `mocks/sample_underserved_phcs.json`
- **Records**: 5 top underserved PHCs
- **Fields**: Underserved index, resource risk, population data

### 3. Resource Warnings
- **File**: `mocks/sample_resource_warnings.json`
- **Records**: 4 PHCs with resource issues
- **Fields**: Risk scores, warning types, severity levels

### 4. LGA Centroids
- **File**: `mocks/lga_centroids.json`
- **Records**: 20 major LGAs
- **Fields**: Coordinates for geocoding PHCs without lat/lon

## Expected API Endpoints

Based on the prompt requirements, the backend should expose:

### 1. GET /api/v1/outbreak-alerts

**Query Parameters**:
- `limit` (number, default: 100)
- `offset` (number, default: 0)
- `state` (string, optional)
- `lga` (string, optional)
- `level` (string, optional: "Low", "Medium", "High")

**Response Format**:
```json
[
  {
    "id": "phc_001",
    "name": "PHC Name",
    "Name of Primary Health Center": "PHC Name",
    "PHC LGA": "LGA Name",
    "State of PHC": "State Name",
    "shortage_score": 0.85,
    "alert_level": "High",
    "underserved_index": 0.72,
    "lat": 9.0579,
    "lon": 7.4951,
    "malaria_cases": 245,
    "previous_cases": 120,
    "maternal_visits": 89,
    "drug_stock_level": 25
  }
]
```

### 2. GET /api/v1/underserved

**Query Parameters**:
- `top_n` (number, default: 10)
- `state` (string, optional)

**Response Format**:
```json
{
  "summary": {
    "total_phcs": 8,
    "top_n": 10,
    "state_filter": ""
  },
  "data": [
    {
      "id": "phc_004",
      "name": "PHC Name",
      "PHC LGA": "LGA Name",
      "State of PHC": "State Name",
      "underserved_index": 0.88,
      "underserved_flag": true,
      "resource_risk_score": 0.92
    }
  ]
}
```

### 3. GET /api/v1/alerts-feed

**Query Parameters**:
- `limit` (number, default: 200)
- `types` (string, comma-separated: "outbreak,resource,underserved")
- `state` (string, optional)

**Response Format**:
```json
[
  {
    "id": "alert_001",
    "phc": "PHC Name",
    "lga": "LGA Name",
    "state": "State Name",
    "type": "outbreak",
    "level": "High",
    "score": 0.85,
    "message": "Alert description",
    "timestamp": "2025-11-08T12:00:00Z"
  }
]
```

### 4. GET /api/v1/telecom-advice

**Query Parameters**:
- `name` (string, required: PHC name)

**Response Format**:
```json
{
  "phc_name": "PHC Name",
  "preferred_channel": "SMS",
  "telecom_notes": "Limited internet coverage",
  "network_coverage": "Good"
}
```

## Field Name Normalization

The frontend handles inconsistent field naming from the backend:

- **PHC Name**: Checks `name`, `Name of Primary Health Center`, `phc`, `phcName`
- **LGA**: Checks `lga`, `PHC LGA`
- **State**: Checks `state`, `State of PHC`
- **Coordinates**: Checks `lat`/`lon`, `latitude`/`longitude`

This ensures compatibility with various data sources.

## Recommendations for Backend Team

### 1. Endpoint Consistency

Standardize field names across all endpoints:
- Use `name` (not `Name of Primary Health Center`)
- Use `lga` (not `PHC LGA`)
- Use `state` (not `State of PHC`)
- Use `lat`/`lon` (not `latitude`/`longitude`)

### 2. CORS Configuration

Ensure CORS headers allow frontend domain:
```
Access-Control-Allow-Origin: https://your-frontend-domain.com
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

### 3. Health Endpoint

Add a simple health check:
```
GET /health
Response: { "status": "ok", "timestamp": "..." }
```

### 4. Error Responses

Return consistent error format:
```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "status": 404
  }
}
```

### 5. Pagination

For large datasets, include pagination metadata:
```json
{
  "data": [...],
  "pagination": {
    "total": 1000,
    "limit": 100,
    "offset": 0,
    "has_more": true
  }
}
```

## Testing the API

Once the backend is deployed, test with:

```bash
# Health check
curl https://presight.onrender.com/health

# Outbreak alerts
curl "https://presight.onrender.com/api/v1/outbreak-alerts?limit=5"

# Underserved PHCs
curl "https://presight.onrender.com/api/v1/underserved?top_n=10"

# Alerts feed
curl "https://presight.onrender.com/api/v1/alerts-feed?limit=10&types=outbreak"

# Telecom advice
curl "https://presight.onrender.com/api/v1/telecom-advice?name=Garki%20Primary%20Health%20Center"
```

## Switching from Mock to Live Data

Once the backend is live:

1. No code changes needed - the frontend will automatically detect and use the live API
2. The yellow "Using Mock Data" banner will disappear
3. Data will refresh every 5-30 seconds based on the endpoint
4. Simulated alerts will still be tracked in localStorage

## Known Issues

### Issue: 404 on all endpoints

**Status**: Backend not deployed or incorrect base URL

**Workaround**: Mock data provides full functionality for demo

**Fix**: Verify backend deployment and update `NEXT_PUBLIC_API_BASE` in `.env`

### Issue: CORS errors in browser

**Status**: Backend CORS not configured

**Fix**: Backend team should add CORS headers (see recommendations above)

### Issue: Slow API responses

**Status**: Cold start on Render free tier

**Workaround**: First request may take 30-60s to wake up the backend

**Fix**: Consider Render paid tier or add warming pings

## Contact

For backend API questions:
- Check backend README: `/workspace/backend/README.md`
- Review backend API testing guide: `/workspace/backend/API_TESTING_GUIDE.md`
- Contact backend team for deployment status

---

**Last Updated**: 2025-11-08  
**Frontend Version**: 2.0  
**API Version**: v1
