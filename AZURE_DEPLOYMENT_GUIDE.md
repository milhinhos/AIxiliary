# AIxiliary - Azure Production Deployment Guide

Complete step-by-step guide for deploying AIxiliary to Azure production environment.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Phase 1: Azure Infrastructure Setup](#phase-1-azure-infrastructure-setup)
- [Phase 2: Database Configuration](#phase-2-database-configuration)
- [Phase 3: Backend Deployment](#phase-3-backend-deployment)
- [Phase 4: Frontend Deployment](#phase-4-frontend-deployment)
- [Phase 5: Security Hardening](#phase-5-security-hardening)
- [Phase 6: Monitoring Setup](#phase-6-monitoring-setup)
- [Phase 7: Post-Deployment Testing](#phase-7-post-deployment-testing)
- [Troubleshooting](#troubleshooting)
- [Cost Estimation](#cost-estimation)

---

## Prerequisites

### Required Tools
- Azure CLI 2.50+ (`az --version`)
- Node.js 18+ (`node --version`)
- Git (`git --version`)
- PostgreSQL client (`psql --version`)
- Azure subscription with permissions to create resources

### Required Accounts
- Azure subscription (pay-as-you-go or enterprise)
- OpenAI API key with GPT-4 access
- Microsoft Azure AD application (already created with IDs in README)
- Custom domain (optional, recommended)

### Install Azure CLI (if not installed)

```bash
# Linux
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# macOS
brew update && brew install azure-cli

# Windows
# Download from: https://aka.ms/installazurecliwindows
```

### Login to Azure

```bash
# Login
az login

# List subscriptions
az account list --output table

# Set active subscription
az account set --subscription "Your-Subscription-Name-or-ID"

# Verify current subscription
az account show
```

---

## Phase 1: Azure Infrastructure Setup

### Step 1.1: Set Environment Variables

```bash
# Configuration variables
export RESOURCE_GROUP="aixiliary-prod-rg"
export LOCATION="westeurope"  # Choose: westeurope, eastus, northeurope, etc.
export APP_NAME="aixiliary"   # Must be globally unique - change if taken
export BACKEND_APP_NAME="${APP_NAME}-backend"
export FRONTEND_APP_NAME="${APP_NAME}-frontend"

# Database configuration
export DB_SERVER_NAME="${APP_NAME}-db-server"
export DB_ADMIN_USER="aixiliaryadmin"
export DB_ADMIN_PASSWORD="$(openssl rand -base64 24 | tr -d '=+/' | cut -c1-20)!1Aa"
export DB_NAME="aixiliary_db"

# Generate session secret
export SESSION_SECRET="$(openssl rand -hex 32)"

# Save these to a secure file
cat > deployment-config.txt <<EOF
RESOURCE_GROUP=$RESOURCE_GROUP
BACKEND_APP_NAME=$BACKEND_APP_NAME
FRONTEND_APP_NAME=$FRONTEND_APP_NAME
DB_SERVER_NAME=$DB_SERVER_NAME
DB_ADMIN_USER=$DB_ADMIN_USER
DB_ADMIN_PASSWORD=$DB_ADMIN_PASSWORD
SESSION_SECRET=$SESSION_SECRET
EOF

echo "✓ Configuration saved to deployment-config.txt (KEEP THIS SECURE!)"
```

### Step 1.2: Create Resource Group

```bash
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION \
  --tags Environment=Production Application=AIxiliary

echo "✓ Resource group created: $RESOURCE_GROUP"
```

### Step 1.3: Create App Service Plan

```bash
# Create Linux App Service Plan (Premium tier)
az appservice plan create \
  --name "${APP_NAME}-plan" \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku P1V2 \
  --is-linux

echo "✓ App Service Plan created"
```

**Pricing Options:**
- **B1** (Basic): ~€10-15/month - Development/Testing only
- **P1V2** (Premium): ~€60-80/month - Production (Recommended)
- **P2V2** (Premium): ~€120-160/month - High traffic

### Step 1.4: Create PostgreSQL Database

```bash
# Create PostgreSQL Flexible Server
az postgres flexible-server create \
  --name $DB_SERVER_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --admin-user $DB_ADMIN_USER \
  --admin-password "$DB_ADMIN_PASSWORD" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 14 \
  --storage-size 32 \
  --public-access 0.0.0.0-255.255.255.255 \
  --yes

echo "✓ PostgreSQL server created"

# Create database
az postgres flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name $DB_SERVER_NAME \
  --database-name $DB_NAME

echo "✓ Database created: $DB_NAME"

# Get connection string
export DB_HOST="${DB_SERVER_NAME}.postgres.database.azure.com"
export DATABASE_URL="postgresql://${DB_ADMIN_USER}@${DB_SERVER_NAME}:${DB_ADMIN_PASSWORD}@${DB_HOST}:5432/${DB_NAME}?sslmode=require"

echo "Database URL: $DATABASE_URL"
```

### Step 1.5: Create Redis Cache

```bash
# Create Redis Cache for sessions
az redis create \
  --name "${APP_NAME}-redis" \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Basic \
  --vm-size c0 \
  --enable-non-ssl-port false

echo "✓ Redis Cache created"

# Get Redis connection details (takes a few minutes to provision)
sleep 60  # Wait for Redis to be ready

REDIS_KEY=$(az redis list-keys \
  --name "${APP_NAME}-redis" \
  --resource-group $RESOURCE_GROUP \
  --query primaryKey -o tsv)

export REDIS_HOST="${APP_NAME}-redis.redis.cache.windows.net"
export REDIS_URL="rediss://:${REDIS_KEY}@${REDIS_HOST}:6380"

echo "✓ Redis connection string obtained"
```

### Step 1.6: Create Storage Account

```bash
# Create storage account for Excel exports
export STORAGE_NAME="${APP_NAME}storage"  # Lowercase, no hyphens

az storage account create \
  --name $STORAGE_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS \
  --kind StorageV2 \
  --allow-blob-public-access false

echo "✓ Storage account created"

# Get storage connection string
export STORAGE_CONNECTION=$(az storage account show-connection-string \
  --name $STORAGE_NAME \
  --resource-group $RESOURCE_GROUP \
  --query connectionString -o tsv)

# Create blob container for exports
az storage container create \
  --name "aixiliary-exports" \
  --account-name $STORAGE_NAME \
  --connection-string "$STORAGE_CONNECTION"

echo "✓ Storage container created"
```

### Step 1.7: Create Application Insights

```bash
# Create Application Insights for monitoring
az monitor app-insights component create \
  --app "${APP_NAME}-insights" \
  --location $LOCATION \
  --resource-group $RESOURCE_GROUP \
  --kind web \
  --application-type web

echo "✓ Application Insights created"

# Get instrumentation key
export APPINSIGHTS_KEY=$(az monitor app-insights component show \
  --app "${APP_NAME}-insights" \
  --resource-group $RESOURCE_GROUP \
  --query instrumentationKey -o tsv)

echo "Instrumentation Key: $APPINSIGHTS_KEY"
```

---

## Phase 2: Database Configuration

### Step 2.1: Apply Database Schema

```bash
# Navigate to backend directory
cd backend

# Apply schema to database
psql "$DATABASE_URL" -f database/schema.sql

echo "✓ Database schema applied"

# Verify tables were created
psql "$DATABASE_URL" -c "\dt"
```

### Step 2.2: Test Database Connection

```bash
# Test connection
psql "$DATABASE_URL" -c "SELECT version();"

# Check tables
psql "$DATABASE_URL" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"

echo "✓ Database connection verified"
```

---

## Phase 3: Backend Deployment

### Step 3.1: Create Backend Web App

```bash
# Create Web App for backend
az webapp create \
  --name $BACKEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --plan "${APP_NAME}-plan" \
  --runtime "NODE:18-lts"

echo "✓ Backend Web App created"

# Get backend URL
export BACKEND_URL="https://${BACKEND_APP_NAME}.azurewebsites.net"
echo "Backend URL: $BACKEND_URL"
```

### Step 3.2: Configure Backend Environment Variables

**IMPORTANT:** You need your Microsoft and OpenAI credentials. Get them from:
- Microsoft Azure AD: Application ID, Client Secret, Tenant ID (from README lines 57-58)
- OpenAI: API key from platform.openai.com

```bash
# Set your API keys here
export MICROSOFT_CLIENT_ID="bca6a641-b7ae-46ca-a752-93d58aeeb111"  # From README
export MICROSOFT_TENANT_ID="82a7b152-bdca-42b8-9844-87aa3e811166"  # From README
export MICROSOFT_CLIENT_SECRET="YOUR_CLIENT_SECRET_HERE"  # From Azure portal
export OPENAI_API_KEY="YOUR_OPENAI_API_KEY_HERE"  # From OpenAI platform
export FRONTEND_URL="https://victorious-hill-02222ae03.3.azurestaticapps.net"  # Or use Azure Static Web App URL later

# Configure all environment variables
az webapp config appsettings set \
  --name $BACKEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    NODE_ENV="production" \
    PORT="8080" \
    SESSION_SECRET="$SESSION_SECRET" \
    DATABASE_URL="$DATABASE_URL" \
    USE_DATABASE="true" \
    REDIS_URL="$REDIS_URL" \
    USE_REDIS="true" \
    MICROSOFT_CLIENT_ID="$MICROSOFT_CLIENT_ID" \
    MICROSOFT_CLIENT_SECRET="$MICROSOFT_CLIENT_SECRET" \
    MICROSOFT_TENANT_ID="$MICROSOFT_TENANT_ID" \
    MICROSOFT_REDIRECT_URI="${BACKEND_URL}/auth/callback" \
    OPENAI_API_KEY="$OPENAI_API_KEY" \
    FRONTEND_URL="$FRONTEND_URL" \
    APPINSIGHTS_INSTRUMENTATIONKEY="$APPINSIGHTS_KEY" \
    STORAGE_CONNECTION_STRING="$STORAGE_CONNECTION" \
    STORAGE_CONTAINER_NAME="aixiliary-exports"

echo "✓ Backend environment variables configured"
```

### Step 3.3: Update Microsoft Azure AD Redirect URI

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Find your AIxiliary app (ID: bca6a641-b7ae-46ca-a752-93d58aeeb111)
4. Click **Authentication** → **Add a platform** or edit existing
5. Add production redirect URI:
   ```
   https://YOUR_BACKEND_APP.azurewebsites.net/auth/callback
   ```
6. Under **Implicit grant and hybrid flows**, enable:
   - ✓ Access tokens
   - ✓ ID tokens
7. Click **Save**

### Step 3.4: Deploy Backend Code

```bash
# Make deployment script executable
chmod +x deploy-azure.sh

# Deploy backend
./deploy-azure.sh $BACKEND_APP_NAME

echo "✓ Backend deployed successfully"

# Test backend health
curl "${BACKEND_URL}/health"
```

**Alternative: Deploy via Git**

```bash
# Configure Git deployment
az webapp deployment source config-local-git \
  --name $BACKEND_APP_NAME \
  --resource-group $RESOURCE_GROUP

# Get Git URL
GIT_URL=$(az webapp deployment source show \
  --name $BACKEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query repoUrl -o tsv)

# Add Azure as remote and push
cd backend
git init
git add .
git commit -m "Initial backend deployment"
git remote add azure $GIT_URL
git push azure main

cd ..
```

### Step 3.5: Configure Backend Logging

```bash
# Enable application logging
az webapp log config \
  --name $BACKEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --application-logging filesystem \
  --level information \
  --web-server-logging filesystem

echo "✓ Logging enabled"

# View live logs
az webapp log tail \
  --name $BACKEND_APP_NAME \
  --resource-group $RESOURCE_GROUP
```

---

## Phase 4: Frontend Deployment

### Step 4.1: Build Frontend

```bash
cd frontend

# Update frontend API endpoint
cat > .env.production <<EOF
VITE_API_URL=$BACKEND_URL
VITE_ENVIRONMENT=production
EOF

# Install dependencies
npm install

# Build for production
npm run build

echo "✓ Frontend built successfully"
```

### Step 4.2: Option A - Deploy to Azure Blob Storage (Recommended - Simpler)

This is the **simplest and most reliable** option - just upload static files to blob storage.

```bash
# Set variables (if not already set)
export STORAGE_NAME="aixiliarystorage"  # From Step 1.6
export RESOURCE_GROUP="aixiliary-prod-rg"

# Enable static website hosting
az storage blob service-properties update \
  --account-name $STORAGE_NAME \
  --static-website \
  --404-document index.html \
  --index-document index.html

# Upload frontend build
az storage blob upload-batch \
  --source dist \
  --destination '$web' \
  --account-name $STORAGE_NAME \
  --overwrite

echo "✓ Files uploaded to blob storage"

# Get website URL
FRONTEND_URL=$(az storage account show \
  --name $STORAGE_NAME \
  --resource-group $RESOURCE_GROUP \
  --query "primaryEndpoints.web" -o tsv | sed 's:/*$::')

echo "Frontend URL: $FRONTEND_URL"
```

**Or use the automated deployment script:**

```bash
cd frontend
chmod +x deploy-to-azure.sh
./deploy-to-azure.sh $STORAGE_NAME $BACKEND_APP_NAME
```

### Step 4.3: Option B - Deploy to Azure Static Web Apps (Advanced)

**Note:** This option requires GitHub/Azure DevOps integration. Use Option A if you want a simpler deployment.

**Manual deployment (no source control):**

```bash
# Create Static Web App without source control
az staticwebapp create \
  --name $FRONTEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Free

# Get deployment token
DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
  --name $FRONTEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query properties.apiKey -o tsv)

# Install Static Web Apps CLI
npm install -g @azure/static-web-apps-cli

# Deploy built files
swa deploy ./dist \
  --deployment-token $DEPLOYMENT_TOKEN \
  --env production

# Get static web app URL
FRONTEND_URL=$(az staticwebapp show \
  --name $FRONTEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query defaultHostname -o tsv)

echo "Frontend URL: https://$FRONTEND_URL"
```

**With GitHub integration (requires Personal Access Token):**

```bash
# 1. Create GitHub PAT: https://github.com/settings/tokens
# 2. Select scope: 'repo' (Full control of private repositories)
# 3. Copy the token

export GITHUB_TOKEN="ghp_your_token_here"
export GITHUB_REPO_URL="https://github.com/YOUR_USERNAME/AIxiliary"

# Create Static Web App with GitHub integration
az staticwebapp create \
  --name $FRONTEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --source "$GITHUB_REPO_URL" \
  --branch main \
  --app-location "frontend" \
  --output-location "dist" \
  --token $GITHUB_TOKEN \
  --sku Free

# Get static web app URL
FRONTEND_URL=$(az staticwebapp show \
  --name $FRONTEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query defaultHostname -o tsv)

echo "Frontend URL: https://$FRONTEND_URL"
```

### Step 4.4: Update Backend with Frontend URL

```bash
# Update FRONTEND_URL in backend config
az webapp config appsettings set \
  --name $BACKEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings FRONTEND_URL="$FRONTEND_URL"

# Restart backend
az webapp restart \
  --name $BACKEND_APP_NAME \
  --resource-group $RESOURCE_GROUP

echo "✓ Backend updated with frontend URL"
```

---

## Phase 5: Security Hardening

### Step 5.1: Configure HTTPS Only

```bash
# Enforce HTTPS on backend
az webapp update \
  --name $BACKEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --https-only true

echo "✓ HTTPS enforced"
```

### Step 5.2: Configure CORS

```bash
# Configure CORS to only allow frontend origin
az webapp cors add \
  --name $BACKEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --allowed-origins "$FRONTEND_URL"

# Remove default CORS (allows all)
az webapp cors remove \
  --name $BACKEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --allowed-origins "*" || true

echo "✓ CORS configured"
```

### Step 5.3: Configure Firewall Rules (Optional)

```bash
# Restrict PostgreSQL access to only App Service IPs
# Get App Service outbound IPs
OUTBOUND_IPS=$(az webapp show \
  --name $BACKEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query outboundIpAddresses -o tsv)

# Add firewall rules for each IP
IFS=',' read -ra IP_ARRAY <<< "$OUTBOUND_IPS"
for ip in "${IP_ARRAY[@]}"; do
  az postgres flexible-server firewall-rule create \
    --resource-group $RESOURCE_GROUP \
    --name $DB_SERVER_NAME \
    --rule-name "AppService-${ip//./}" \
    --start-ip-address "$ip" \
    --end-ip-address "$ip"
done

echo "✓ Firewall rules configured"
```

### Step 5.4: Enable Managed Identity

```bash
# Enable system-assigned managed identity
az webapp identity assign \
  --name $BACKEND_APP_NAME \
  --resource-group $RESOURCE_GROUP

echo "✓ Managed identity enabled"
```

---

## Phase 6: Monitoring Setup

### Step 6.1: Configure Alerts

```bash
# Create action group for alerts
az monitor action-group create \
  --name "${APP_NAME}-alerts" \
  --resource-group $RESOURCE_GROUP \
  --short-name "AIx Alert" \
  --email-receiver \
    name="admin" \
    email-address="YOUR_EMAIL@example.com" \
    use-common-alert-schema

# Create alert rule for high CPU
az monitor metrics alert create \
  --name "${APP_NAME}-high-cpu" \
  --resource-group $RESOURCE_GROUP \
  --scopes "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/${RESOURCE_GROUP}/providers/Microsoft.Web/sites/${BACKEND_APP_NAME}" \
  --condition "avg Percentage CPU > 80" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action "${APP_NAME}-alerts"

# Create alert for high memory
az monitor metrics alert create \
  --name "${APP_NAME}-high-memory" \
  --resource-group $RESOURCE_GROUP \
  --scopes "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/${RESOURCE_GROUP}/providers/Microsoft.Web/sites/${BACKEND_APP_NAME}" \
  --condition "avg MemoryPercentage > 85" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action "${APP_NAME}-alerts"

echo "✓ Monitoring alerts configured"
```

### Step 6.2: Set Up Log Analytics

```bash
# Create Log Analytics workspace
az monitor log-analytics workspace create \
  --resource-group $RESOURCE_GROUP \
  --workspace-name "${APP_NAME}-logs" \
  --location $LOCATION

# Get workspace ID
WORKSPACE_ID=$(az monitor log-analytics workspace show \
  --resource-group $RESOURCE_GROUP \
  --workspace-name "${APP_NAME}-logs" \
  --query customerId -o tsv)

echo "Log Analytics Workspace ID: $WORKSPACE_ID"
```

---

## Phase 7: Post-Deployment Testing

### Step 7.1: Health Check Tests

```bash
# Test backend health endpoint
echo "Testing backend health..."
curl -f "${BACKEND_URL}/health" || echo "❌ Backend health check failed"

# Test database connection
echo "Testing database connection..."
psql "$DATABASE_URL" -c "SELECT 1;" || echo "❌ Database connection failed"

# Test Redis connection
echo "Testing Redis connection..."
redis-cli -h $REDIS_HOST -p 6380 -a $REDIS_KEY --tls PING || echo "❌ Redis connection failed"

echo "✓ All health checks passed"
```

### Step 7.2: End-to-End Test

```bash
# Open frontend in browser
echo "Open this URL in your browser: $FRONTEND_URL"

# Manual test checklist:
echo "
Manual Testing Checklist:
1. ✓ Frontend loads successfully
2. ✓ Click 'Sign in with Microsoft' - OAuth flow works
3. ✓ After login, redirected to /auth/success then main app
4. ✓ Upload test files or provide OneDrive folder ID
5. ✓ Process files - check document classification works
6. ✓ Download Excel export - verify format and data
7. ✓ Check Application Insights for telemetry
8. ✓ Review logs in Azure Portal
"
```

### Step 7.3: Performance Test

```bash
# Install Apache Bench (optional)
# sudo apt-get install apache2-utils

# Simple load test (100 requests, 10 concurrent)
ab -n 100 -c 10 "${BACKEND_URL}/health"

echo "✓ Performance test completed"
```

---

## Troubleshooting

### Common Issues

#### 1. Backend Not Starting

```bash
# Check logs
az webapp log tail --name $BACKEND_APP_NAME --resource-group $RESOURCE_GROUP

# Check environment variables
az webapp config appsettings list --name $BACKEND_APP_NAME --resource-group $RESOURCE_GROUP

# Restart app
az webapp restart --name $BACKEND_APP_NAME --resource-group $RESOURCE_GROUP
```

#### 2. Database Connection Fails

```bash
# Test connection manually
psql "$DATABASE_URL" -c "SELECT version();"

# Check firewall rules
az postgres flexible-server firewall-rule list \
  --resource-group $RESOURCE_GROUP \
  --name $DB_SERVER_NAME

# Verify connection string
echo $DATABASE_URL
```

#### 3. OAuth Redirect Issues

- Verify redirect URI in Azure AD matches exactly: `${BACKEND_URL}/auth/callback`
- Check `FRONTEND_URL` environment variable is set correctly
- Clear browser cookies and try again
- Check CORS settings allow frontend origin

#### 4. Excel Export Fails

```bash
# Check storage account access
az storage container list --account-name $STORAGE_NAME --auth-mode login

# Verify storage connection string
az webapp config appsettings list --name $BACKEND_APP_NAME --resource-group $RESOURCE_GROUP | grep STORAGE
```

### Get Support

```bash
# View all resources
az resource list --resource-group $RESOURCE_GROUP --output table

# Check deployment status
az webapp deployment list --name $BACKEND_APP_NAME --resource-group $RESOURCE_GROUP

# Download logs
az webapp log download --name $BACKEND_APP_NAME --resource-group $RESOURCE_GROUP
```

---

## Cost Estimation

### Monthly Costs (EUR, West Europe region)

| Resource | SKU | Cost |
|----------|-----|------|
| App Service Plan | P1V2 | €60-80 |
| PostgreSQL Database | Standard_B1ms | €20-30 |
| Redis Cache | Basic C0 | €15-20 |
| Storage Account | Standard LRS | €2-5 |
| Application Insights | Pay-as-you-go | €5-15 |
| Static Web App | Free tier | €0 |
| **Total Estimated** | | **€100-150/month** |

**Cost Optimization Tips:**
- Use **B1/B2 tiers** for development/staging (~€20-30/month)
- Enable **auto-scaling** for App Service Plan
- Use **Reserved Instances** for 30-40% discount (1-year commitment)
- Monitor usage with **Cost Management + Billing**

---

## Maintenance

### Regular Tasks

```bash
# Update backend
cd backend
git pull
./deploy-azure.sh $BACKEND_APP_NAME

# Update frontend
cd frontend
npm run build
az staticwebapp deploy --name $FRONTEND_APP_NAME --resource-group $RESOURCE_GROUP

# Backup database
pg_dump "$DATABASE_URL" > backup-$(date +%Y%m%d).sql

# Rotate secrets (every 90 days)
# - Regenerate SESSION_SECRET
# - Rotate Microsoft Client Secret in Azure AD
# - Update environment variables
```

### Monitoring Dashboards

- **Application Insights**: https://portal.azure.com → Your App Insights resource
- **Log Analytics**: https://portal.azure.com → Log Analytics workspace
- **Cost Management**: https://portal.azure.com → Cost Management + Billing

---

## Rollback Procedure

If deployment fails:

```bash
# View deployment history
az webapp deployment list --name $BACKEND_APP_NAME --resource-group $RESOURCE_GROUP

# Rollback to previous deployment
az webapp deployment slot swap \
  --name $BACKEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --slot staging \
  --target-slot production

# Or redeploy previous version
git log --oneline
git checkout <previous-commit-hash>
./deploy-azure.sh $BACKEND_APP_NAME
```

---

## Success Indicators

Your deployment is successful when:

✅ Backend health endpoint returns 200 OK
✅ Frontend loads and displays login page
✅ Microsoft OAuth login flow completes
✅ File processing extracts data correctly
✅ Excel exports download successfully
✅ Application Insights shows telemetry
✅ Logs appear in Log Analytics
✅ No errors in Application Insights exceptions

---

**Congratulations!** 🎉 Your AIxiliary application is now running in Azure production!

For questions or issues, refer to the main README.md or create an issue on GitHub.
