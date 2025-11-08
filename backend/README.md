# CheckMyPHC Insights Backend API

Production-ready FastAPI backend service that serves insights data for the CheckMyPHC frontend application. This service reads outputs from the Insight Engine and source CSVs, provides JSON endpoints, and is fully containerized for easy deployment.

## 🎯 Project Purpose

CheckMyPHC Insights API provides RESTful endpoints to access:
- **Outbreak Alerts**: PHCs flagged for resource shortages
- **Underserved Facilities**: PHCs with limited access to healthcare services
- **Resource Warnings**: PHCs at risk of critical resource depletion
- **Telecom Advice**: Preferred communication channels based on network connectivity

## 🏗️ Architecture

```
backend/
├── app/
│   ├── main.py                 # FastAPI application entry point
│   ├── core/
│   │   ├── config.py          # Configuration management
│   │   └── logging.py         # Structured logging setup
│   ├── services/
│   │   └── insight_loader.py  # Data loading and normalization
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints.py   # API route handlers
│   │       ├── schemas.py     # Pydantic models
│   │       └── utils.py       # Utility functions
│   └── tests/
│       ├── conftest.py        # Pytest configuration
│       ├── test_endpoints.py  # Comprehensive test suite
│       └── fixtures/          # Test data
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

## 🚀 Quick Start

### Prerequisites

- Python 3.10 or 3.11
- pip
- Docker (optional, for containerized deployment)

### Local Development Setup

1. **Clone the repository and navigate to backend:**

```bash
cd backend
```

2. **Create and activate virtual environment:**

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

3. **Install dependencies:**

```bash
pip install -r requirements.txt
```

4. **Configure environment:**

```bash
cp .env.example .env
# Edit .env with your configuration
```

5. **Run the development server:**

```bash
uvicorn app.main:app --reload --port 8000
```

6. **Access the API:**

- API: http://localhost:8000
- Interactive Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🧪 Running Tests

Run the comprehensive test suite:

```bash
pytest -v
```

Run with coverage:

```bash
pytest --cov=app --cov-report=html --cov-report=term
```

Run specific test class:

```bash
pytest app/tests/test_endpoints.py::TestOutbreakAlertsEndpoint -v
```

## 🐳 Docker Deployment

### Build and Run with Docker

1. **Build the image:**

```bash
docker build -t checkmyphc-backend .
```

2. **Run the container:**

```bash
docker run -p 8000:8000 \
  -v $(pwd)/../Backend/Outputs:/data/outputs:ro \
  -v $(pwd)/../Backend/Data:/data/source:ro \
  -e OUTPUT_DIR=/data/outputs \
  -e DATA_DIR=/data/source \
  checkmyphc-backend
```

### Using Docker Compose (Recommended)

1. **Start the service:**

```bash
docker-compose up -d
```

2. **View logs:**

```bash
docker-compose logs -f backend
```

3. **Stop the service:**

```bash
docker-compose down
```

## 📡 API Endpoints

### Health Check

```bash
curl http://localhost:8000/
```

**Response:**
```json
{
  "status": "healthy",
  "service": "CheckMyPHC Insights API",
  "version": "1.0.0",
  "docs": "/docs"
}
```

### 1. Outbreak Alerts

Get PHCs flagged for resource shortages with filtering and pagination.

```bash
curl "http://localhost:8000/api/v1/outbreak-alerts?limit=5"
```

**Query Parameters:**
- `state` (optional): Filter by state
- `lga` (optional): Filter by Local Government Area
- `level` (optional): Filter by alert level (Low, Medium, High)
- `limit` (default: 100): Maximum records to return
- `offset` (default: 0): Starting offset for pagination
- `refresh` (default: false): Force reload data from disk

**Response:**
```json
{
  "count": 5,
  "limit": 5,
  "offset": 0,
  "data": [
    {
      "name": "ikeja central phc",
      "display_name": "Ikeja Central PHC",
      "lga": "Ikeja",
      "state": "Lagos",
      "shortage_score": 3,
      "alert_level": "High"
    }
  ]
}
```

**Examples:**

```bash
# Get high priority alerts only
curl "http://localhost:8000/api/v1/outbreak-alerts?level=High"

# Filter by state with pagination
curl "http://localhost:8000/api/v1/outbreak-alerts?state=Taraba&limit=10&offset=0"
```

### 2. Underserved PHCs

Get underserved facilities with summary statistics.

```bash
curl "http://localhost:8000/api/v1/underserved?top_n=3"
```

**Query Parameters:**
- `top_n` (default: 10): Number of top underserved PHCs in summary
- `state` (optional): Filter by state
- `refresh` (default: false): Force reload data from disk

**Response:**
```json
{
  "summary": {
    "avg_underserved_index": 0.67,
    "top_underserved_phcs": [
      {
        "name": "remote village phc",
        "display_name": "Remote Village PHC",
        "underserved_index": 0.95
      }
    ]
  },
  "count": 10,
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

Get unified alerts feed from all sources for dashboard display.

```bash
curl "http://localhost:8000/api/v1/alerts-feed?limit=10&types=outbreak,resource"
```

**Query Parameters:**
- `limit` (default: 200): Maximum alerts to return
- `types` (optional): Comma-separated list (outbreak, underserved, resource)
- `state` (optional): Filter by state
- `refresh` (default: false): Force reload data from disk

**Response:**
```json
{
  "total": 10,
  "feed": [
    {
      "id": "a1b2c3d4e5f6g7h8",
      "phc_name": "ikeja central phc",
      "display_name": "Ikeja Central PHC",
      "lga": "Ikeja",
      "state": "Lagos",
      "type": "Outbreak Alert",
      "level": "High",
      "score": 3.0,
      "timestamp": "2025-11-08T12:00:00Z"
    }
  ]
}
```

**Examples:**

```bash
# Get only outbreak alerts
curl "http://localhost:8000/api/v1/alerts-feed?types=outbreak"

# Get alerts for specific state
curl "http://localhost:8000/api/v1/alerts-feed?state=Taraba&limit=20"
```

### 4. Telecom Advice

Get preferred communication channels based on network connectivity.

```bash
curl "http://localhost:8000/api/v1/telecom-advice?name=ikeja"
```

**Query Parameters:**
- `name` (optional): Filter by PHC name (partial match)
- `state` (optional): Filter by state
- `refresh` (default: false): Force reload data from disk

**Response:**
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

**Channel Selection Logic:**
- **SMS**: For 2G, poor/limited network, or no connectivity
- **WhatsApp**: For 3G/4G, good/strong signal

## ⚙️ Configuration

Configure the application using environment variables. Copy `.env.example` to `.env` and customize:

```bash
# Data directories (relative or absolute paths)
OUTPUT_DIR=../Backend/Outputs
DATA_DIR=../Backend/Data

# CORS configuration (comma-separated origins, or * for all)
CORS_ORIGINS=*

# Logging
LOG_LEVEL=INFO

# Server
PORT=8000
DEBUG=False
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OUTPUT_DIR` | `../Backend/Outputs` | Directory containing insight engine outputs |
| `DATA_DIR` | `../Backend/Data` | Directory containing source data files |
| `CORS_ORIGINS` | `*` | Allowed CORS origins (use specific URLs in production) |
| `LOG_LEVEL` | `INFO` | Logging level (DEBUG, INFO, WARNING, ERROR) |
| `PORT` | `8000` | Server port |
| `DEBUG` | `False` | Enable debug mode |

## 📊 Data Requirements

The API expects the following files:

### Output Files (from Insight Engine)

Located in `OUTPUT_DIR`:

- `outbreak_alerts.json` - Resource shortage alerts
- `underserved_phcs.json` - Underserved facility data
- `resource_warnings.json` - Resource risk warnings

### Source Data Files

Located in `DATA_DIR`:

- `telecommunication.csv` - Network connectivity information

### Data Normalization

All PHC names are automatically normalized for consistent matching:
- Converted to lowercase
- Extra whitespace removed
- Leading/trailing punctuation stripped
- Display names preserved in title case for UI

## 🔒 Security & Production Notes

### CORS Configuration

In production, restrict CORS origins:

```bash
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

### Secrets Management

- Never commit `.env` files
- Use environment variables or secrets management systems
- Rotate credentials regularly

### Rate Limiting

Consider adding rate limiting in production:
- Use FastAPI middleware
- Configure at reverse proxy level (nginx, Traefik)

### Logging

- Logs are written to `logs/app.log` and stdout
- Structured format for easy parsing
- Consider log aggregation tools (ELK stack, Datadog)

## 🧰 Development Tools

### Code Formatting

```bash
# Install black
pip install black

# Format code
black app/

# Check without modifying
black --check app/
```

### Linting

```bash
# Install ruff
pip install ruff

# Run linter
ruff check app/
```

### Type Checking

```bash
# Install mypy
pip install mypy

# Run type checker
mypy app/
```

## 📈 Performance

- **Data Caching**: Files are cached for 30 seconds to reduce disk I/O
- **Response Time**: ~50-100ms for typical requests with fixtures
- **Pagination**: Supports offset-based pagination for large datasets
- **Async Ready**: Built on FastAPI's async foundation

### Performance Tips

1. Use pagination for large result sets
2. Apply filters to reduce data processing
3. Use `refresh=true` sparingly in production
4. Monitor cache hit rates in logs

## 🐛 Troubleshooting

### Common Issues

**Issue: FileNotFoundError for data files**

Solution: Verify `OUTPUT_DIR` and `DATA_DIR` paths in `.env`

```bash
# Check current configuration
curl http://localhost:8000/health
```

**Issue: CORS errors in browser**

Solution: Update `CORS_ORIGINS` to include your frontend URL

```bash
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

**Issue: Tests failing**

Solution: Ensure test fixtures exist and are valid JSON

```bash
# Verify fixtures
ls app/tests/fixtures/
pytest -v --tb=short
```

## 📝 API Versioning

The API uses URL path versioning:

- Current: `/api/v1/...`
- Future versions will be at `/api/v2/...` without breaking v1

## 🤝 Contributing

1. Run tests before committing: `pytest -v`
2. Format code: `black app/`
3. Update documentation for API changes
4. Add tests for new features

## 📄 License

This project is part of CheckMyPHC healthcare monitoring system.

## 📞 Support

For issues and questions:
- Check API documentation: http://localhost:8000/docs
- Review logs: `tail -f logs/app.log`
- Run health check: `curl http://localhost:8000/health`

---

**Built with FastAPI, Pandas, and ❤️ for better healthcare access**
