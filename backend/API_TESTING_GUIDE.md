# CheckMyPHC Insights API - Quick Testing Guide

Complete reference for testing all API endpoints with curl commands.

## 🚀 Start the API

```bash
# Option 1: Local development
cd backend
python3 -m uvicorn app.main:app --reload --port 8000

# Option 2: Docker
cd backend
docker-compose up -d
```

## ✅ Health & Status Checks

### Root Endpoint
```bash
curl http://localhost:8000/

# Expected Response:
# {
#   "status": "healthy",
#   "service": "CheckMyPHC Insights API",
#   "version": "1.0.0",
#   "docs": "/docs"
# }
```

### Health Check
```bash
curl http://localhost:8000/health

# Expected Response:
# {
#   "status": "healthy",
#   "service": "CheckMyPHC Insights API",
#   "version": "1.0.0",
#   "timestamp": null
# }
```

### Interactive Documentation
```bash
# Open in browser:
open http://localhost:8000/docs        # Swagger UI
open http://localhost:8000/redoc       # ReDoc
```

## 📊 API Endpoint Tests

### 1. Outbreak Alerts

#### Get all outbreak alerts
```bash
curl "http://localhost:8000/api/v1/outbreak-alerts"
```

#### Get limited results
```bash
curl "http://localhost:8000/api/v1/outbreak-alerts?limit=5"
```

#### Filter by state
```bash
curl "http://localhost:8000/api/v1/outbreak-alerts?state=Taraba"
curl "http://localhost:8000/api/v1/outbreak-alerts?state=Lagos"
```

#### Filter by alert level
```bash
curl "http://localhost:8000/api/v1/outbreak-alerts?level=High"
curl "http://localhost:8000/api/v1/outbreak-alerts?level=Medium"
curl "http://localhost:8000/api/v1/outbreak-alerts?level=Low"
```

#### Filter by LGA
```bash
curl "http://localhost:8000/api/v1/outbreak-alerts?lga=Jalingo"
```

#### Pagination
```bash
curl "http://localhost:8000/api/v1/outbreak-alerts?limit=2&offset=0"
curl "http://localhost:8000/api/v1/outbreak-alerts?limit=2&offset=2"
```

#### Combined filters
```bash
curl "http://localhost:8000/api/v1/outbreak-alerts?state=Taraba&level=High&limit=10"
```

#### Force refresh
```bash
curl "http://localhost:8000/api/v1/outbreak-alerts?refresh=true"
```

**Expected Response Structure:**
```json
{
  "count": 5,
  "limit": 5,
  "offset": 0,
  "data": [
    {
      "name": "jalingo central phc",
      "display_name": "Jalingo Central PHC",
      "lga": "Jalingo",
      "state": "Taraba",
      "shortage_score": 4,
      "alert_level": "High"
    }
  ]
}
```

### 2. Underserved PHCs

#### Get all underserved PHCs
```bash
curl "http://localhost:8000/api/v1/underserved"
```

#### Get with top N summary
```bash
curl "http://localhost:8000/api/v1/underserved?top_n=3"
curl "http://localhost:8000/api/v1/underserved?top_n=10"
```

#### Filter by state
```bash
curl "http://localhost:8000/api/v1/underserved?state=Taraba"
```

#### Combined parameters
```bash
curl "http://localhost:8000/api/v1/underserved?state=Taraba&top_n=5"
```

#### Force refresh
```bash
curl "http://localhost:8000/api/v1/underserved?refresh=true"
```

**Expected Response Structure:**
```json
{
  "summary": {
    "avg_underserved_index": 0.592,
    "top_underserved_phcs": [
      {
        "name": "remote village phc",
        "display_name": "Remote Village PHC",
        "underserved_index": 0.95
      },
      {
        "name": "takum district phc",
        "display_name": "Takum District PHC",
        "underserved_index": 0.82
      }
    ]
  },
  "count": 6,
  "data": [
    {
      "name": "remote village phc",
      "display_name": "Remote Village PHC",
      "lga": "Ardo Kola",
      "state": "Taraba",
      "underserved_index": 0.95,
      "underserved_flag": true
    }
  ]
}
```

### 3. Alerts Feed

#### Get all alerts
```bash
curl "http://localhost:8000/api/v1/alerts-feed"
```

#### Get limited results
```bash
curl "http://localhost:8000/api/v1/alerts-feed?limit=10"
curl "http://localhost:8000/api/v1/alerts-feed?limit=20"
```

#### Filter by alert type
```bash
# Single type
curl "http://localhost:8000/api/v1/alerts-feed?types=outbreak"
curl "http://localhost:8000/api/v1/alerts-feed?types=underserved"
curl "http://localhost:8000/api/v1/alerts-feed?types=resource"

# Multiple types
curl "http://localhost:8000/api/v1/alerts-feed?types=outbreak,resource"
curl "http://localhost:8000/api/v1/alerts-feed?types=outbreak,underserved,resource"
```

#### Filter by state
```bash
curl "http://localhost:8000/api/v1/alerts-feed?state=Taraba"
curl "http://localhost:8000/api/v1/alerts-feed?state=Lagos"
```

#### Combined filters
```bash
curl "http://localhost:8000/api/v1/alerts-feed?types=outbreak,resource&state=Taraba&limit=15"
```

#### Force refresh
```bash
curl "http://localhost:8000/api/v1/alerts-feed?refresh=true"
```

**Expected Response Structure:**
```json
{
  "total": 10,
  "feed": [
    {
      "id": "a1b2c3d4e5f6",
      "phc_name": "remote village phc",
      "display_name": "Remote Village PHC",
      "lga": "Ardo Kola",
      "state": "Taraba",
      "type": "Resource Risk",
      "level": "High",
      "score": 9.2,
      "timestamp": "2025-11-08T12:00:00Z"
    }
  ]
}
```

### 4. Telecom Advice

#### Get all telecom advice
```bash
curl "http://localhost:8000/api/v1/telecom-advice"
```

#### Filter by PHC name
```bash
curl "http://localhost:8000/api/v1/telecom-advice?name=ikeja"
curl "http://localhost:8000/api/v1/telecom-advice?name=jalingo"
curl "http://localhost:8000/api/v1/telecom-advice?name=phc"
```

#### Filter by state
```bash
curl "http://localhost:8000/api/v1/telecom-advice?state=Taraba"
curl "http://localhost:8000/api/v1/telecom-advice?state=Lagos"
```

#### Combined filters
```bash
curl "http://localhost:8000/api/v1/telecom-advice?state=Taraba&name=central"
```

#### Force refresh
```bash
curl "http://localhost:8000/api/v1/telecom-advice?refresh=true"
```

**Expected Response Structure:**
```json
{
  "count": 1,
  "data": [
    {
      "name": "ikeja central phc",
      "display_name": "Ikeja Central PHC",
      "lga": "Ikeja",
      "state": "Lagos",
      "telecom_notes": "4G network available with strong signal",
      "preferred_channel": "WhatsApp"
    }
  ]
}
```

## 🧪 Testing Scenarios

### Test 1: High Priority Outbreak Alerts
```bash
curl "http://localhost:8000/api/v1/outbreak-alerts?level=High" | jq '.'
```

### Test 2: Most Underserved PHCs
```bash
curl "http://localhost:8000/api/v1/underserved?top_n=5" | jq '.summary.top_underserved_phcs'
```

### Test 3: Critical Alerts for a State
```bash
curl "http://localhost:8000/api/v1/alerts-feed?state=Taraba&types=outbreak,resource&limit=20" | jq '.'
```

### Test 4: Poor Network PHCs (SMS only)
```bash
curl "http://localhost:8000/api/v1/telecom-advice" | jq '.data[] | select(.preferred_channel == "SMS")'
```

### Test 5: Dashboard Feed
```bash
curl "http://localhost:8000/api/v1/alerts-feed?limit=100" | jq '.feed[] | {name: .display_name, type: .type, level: .level}'
```

## 🔍 Error Testing

### Test invalid alert level
```bash
curl "http://localhost:8000/api/v1/outbreak-alerts?level=Critical"
# Expected: 400 Bad Request
```

### Test invalid limit
```bash
curl "http://localhost:8000/api/v1/outbreak-alerts?limit=0"
# Expected: 422 Unprocessable Entity
```

### Test negative offset
```bash
curl "http://localhost:8000/api/v1/outbreak-alerts?offset=-1"
# Expected: 422 Unprocessable Entity
```

### Test non-existent endpoint
```bash
curl "http://localhost:8000/api/v1/nonexistent"
# Expected: 404 Not Found
```

## 📋 Complete Test Suite

Run all endpoints in sequence:

```bash
#!/bin/bash
# Test all endpoints

echo "1. Health Check..."
curl -s http://localhost:8000/health | jq '.'

echo -e "\n2. Outbreak Alerts..."
curl -s "http://localhost:8000/api/v1/outbreak-alerts?limit=5" | jq '.'

echo -e "\n3. Underserved PHCs..."
curl -s "http://localhost:8000/api/v1/underserved?top_n=3" | jq '.'

echo -e "\n4. Alerts Feed..."
curl -s "http://localhost:8000/api/v1/alerts-feed?limit=10" | jq '.'

echo -e "\n5. Telecom Advice..."
curl -s "http://localhost:8000/api/v1/telecom-advice" | jq '.'

echo -e "\n✅ All tests completed!"
```

Save as `test_api.sh`, make executable (`chmod +x test_api.sh`), and run.

## 📊 Performance Testing

### Measure response time
```bash
time curl -s "http://localhost:8000/api/v1/outbreak-alerts" > /dev/null
```

### Load testing with ab (Apache Bench)
```bash
ab -n 1000 -c 10 http://localhost:8000/api/v1/outbreak-alerts
```

### Load testing with hey
```bash
hey -n 1000 -c 10 http://localhost:8000/api/v1/outbreak-alerts
```

## 🐛 Debugging

### Enable verbose output
```bash
curl -v "http://localhost:8000/api/v1/outbreak-alerts"
```

### Check response headers
```bash
curl -I "http://localhost:8000/api/v1/outbreak-alerts"
```

### Pretty print JSON
```bash
curl "http://localhost:8000/api/v1/outbreak-alerts" | python3 -m json.tool
# or
curl "http://localhost:8000/api/v1/outbreak-alerts" | jq '.'
```

### Save response to file
```bash
curl "http://localhost:8000/api/v1/outbreak-alerts" > response.json
```

## 📝 Common Query Parameter Combinations

### Outbreak Alerts
```bash
# Most critical alerts
?level=High&limit=10

# State-specific with pagination
?state=Taraba&limit=20&offset=0

# Specific LGA high alerts
?lga=Jalingo&level=High

# Force fresh data
?refresh=true&limit=100
```

### Underserved PHCs
```bash
# Top 5 most underserved
?top_n=5

# State-specific top 10
?state=Taraba&top_n=10

# All with fresh data
?refresh=true
```

### Alerts Feed
```bash
# Only critical outbreak alerts
?types=outbreak&limit=50

# Resource and outbreak alerts for state
?types=outbreak,resource&state=Taraba

# All alerts, limited
?limit=200

# Dashboard view
?limit=100&refresh=false
```

### Telecom Advice
```bash
# Find specific PHC
?name=ikeja

# All PHCs in state
?state=Taraba

# Search by partial name
?name=central
```

## ✅ Verification Checklist

- [ ] Health check returns 200
- [ ] All endpoints return valid JSON
- [ ] Filtering works correctly
- [ ] Pagination respects limits
- [ ] Sorting is correct (by priority)
- [ ] Error responses are appropriate
- [ ] Response times are acceptable (<200ms)
- [ ] Documentation is accessible
- [ ] CORS headers are present (if needed)
- [ ] Cache refresh works

## 🔗 Additional Resources

- **API Documentation**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json
- **README**: ../README.md
- **Operations Guide**: ../RUNBOOK.md

---

**Last Updated**: November 8, 2025  
**API Version**: 1.0.0  
**Status**: Production Ready ✅
