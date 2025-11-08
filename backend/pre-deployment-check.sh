#!/bin/bash
# Pre-deployment checklist for Render
# Run this before deploying to catch common issues

set -e

echo "=================================================="
echo "CheckMyPHC Backend - Pre-Deployment Checklist"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check functions
check_passed() {
    echo -e "${GREEN}✓${NC} $1"
}

check_failed() {
    echo -e "${RED}✗${NC} $1"
}

check_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

ERRORS=0

# 1. Check if we're in the backend directory
echo "1. Checking directory structure..."
if [ -f "Dockerfile" ] && [ -f "requirements.txt" ]; then
    check_passed "Dockerfile and requirements.txt found"
else
    check_failed "Dockerfile or requirements.txt not found. Are you in the backend directory?"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 2. Check if app directory exists
echo "2. Checking application structure..."
if [ -d "app" ]; then
    check_passed "app/ directory exists"
    
    if [ -f "app/main.py" ]; then
        check_passed "app/main.py found"
    else
        check_failed "app/main.py not found"
        ERRORS=$((ERRORS + 1))
    fi
else
    check_failed "app/ directory not found"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 3. Check data directories
echo "3. Checking data directories..."
if [ -d "../Backend/Outputs" ]; then
    check_passed "../Backend/Outputs/ directory exists"
    
    # Check for required JSON files
    if [ -f "../Backend/Outputs/outbreak_alerts.json" ]; then
        check_passed "outbreak_alerts.json found"
    else
        check_warning "outbreak_alerts.json not found (may cause runtime errors)"
    fi
    
    if [ -f "../Backend/Outputs/underserved_phcs.json" ]; then
        check_passed "underserved_phcs.json found"
    else
        check_warning "underserved_phcs.json not found (may cause runtime errors)"
    fi
    
    if [ -f "../Backend/Outputs/resource_warnings.json" ]; then
        check_passed "resource_warnings.json found"
    else
        check_warning "resource_warnings.json not found (may cause runtime errors)"
    fi
else
    check_warning "../Backend/Outputs/ directory not found"
    echo "   You'll need to configure data storage on Render"
fi

if [ -d "../Backend/Data" ]; then
    check_passed "../Backend/Data/ directory exists"
    
    if [ -f "../Backend/Data/telecommunication.csv" ]; then
        check_passed "telecommunication.csv found"
    else
        check_warning "telecommunication.csv not found (may cause runtime errors)"
    fi
else
    check_warning "../Backend/Data/ directory not found"
    echo "   You'll need to configure data storage on Render"
fi
echo ""

# 4. Check Python dependencies
echo "4. Checking Python dependencies..."
if command -v python3 &> /dev/null; then
    check_passed "Python 3 is installed"
    python3 --version
else
    check_warning "Python 3 not found (needed for local testing)"
fi
echo ""

# 5. Check Docker
echo "5. Checking Docker (optional for local testing)..."
if command -v docker &> /dev/null; then
    check_passed "Docker is installed"
    docker --version
else
    check_warning "Docker not installed (optional, but useful for local testing)"
fi
echo ""

# 6. Verify requirements.txt
echo "6. Checking requirements.txt..."
if grep -q "fastapi" requirements.txt && grep -q "uvicorn" requirements.txt; then
    check_passed "Core dependencies (fastapi, uvicorn) found"
else
    check_failed "Missing core dependencies in requirements.txt"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 7. Check if tests pass (optional)
echo "7. Running tests (if pytest is installed)..."
if command -v pytest &> /dev/null; then
    if pytest app/tests/ -v --tb=short 2>&1 | grep -q "passed"; then
        check_passed "Tests are passing"
    else
        check_warning "Some tests failed (check output above)"
    fi
else
    check_warning "pytest not installed (skipping test check)"
fi
echo ""

# 8. Check Dockerfile health
echo "8. Checking Dockerfile configuration..."
if grep -q "EXPOSE 8000" Dockerfile; then
    check_passed "Dockerfile exposes port 8000"
else
    check_warning "Dockerfile doesn't explicitly expose port 8000"
fi

if grep -q "uvicorn" Dockerfile; then
    check_passed "Dockerfile uses uvicorn"
else
    check_failed "Dockerfile doesn't use uvicorn"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 9. Check render.yaml
echo "9. Checking render.yaml configuration..."
if [ -f "render.yaml" ]; then
    check_passed "render.yaml found"
    
    if grep -q "healthCheckPath: /health" render.yaml; then
        check_passed "Health check configured"
    else
        check_warning "Health check not configured in render.yaml"
    fi
else
    check_warning "render.yaml not found (optional, but recommended)"
fi
echo ""

# 10. Git check
echo "10. Checking Git status..."
if git rev-parse --git-dir > /dev/null 2>&1; then
    check_passed "Git repository detected"
    
    if [ -n "$(git status --porcelain)" ]; then
        check_warning "You have uncommitted changes"
        echo "   Commit and push your changes before deploying to Render"
    else
        check_passed "No uncommitted changes"
    fi
    
    # Check if remote is set
    if git remote -v | grep -q "origin"; then
        check_passed "Git remote 'origin' is configured"
        echo "   Remote: $(git remote get-url origin)"
    else
        check_warning "No git remote configured"
        echo "   You'll need to push to GitHub for Render deployment"
    fi
else
    check_failed "Not a git repository"
    echo "   Initialize git: git init"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Summary
echo "=================================================="
echo "Summary"
echo "=================================================="

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All critical checks passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Commit and push your code to GitHub"
    echo "2. Log in to Render: https://dashboard.render.com"
    echo "3. Create a new Web Service from your repository"
    echo "4. Use Docker environment and configure environment variables"
    echo "5. Deploy and test your API!"
    echo ""
    echo "See RENDER_DEPLOYMENT_GUIDE.md for detailed instructions."
else
    echo -e "${RED}✗ Found $ERRORS critical issue(s)${NC}"
    echo "Please fix the errors above before deploying."
fi

echo "=================================================="
