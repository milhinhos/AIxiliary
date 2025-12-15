#!/bin/bash

# AIxiliary Frontend - Azure Blob Storage Deployment Script
# Usage: ./deploy-to-azure.sh [storage-account-name] [backend-app-name]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if storage account name is provided
if [ -z "$1" ]; then
  echo -e "${RED}Error: Storage account name is required${NC}"
  echo "Usage: ./deploy-to-azure.sh [storage-account-name] [backend-app-name]"
  exit 1
fi

STORAGE_NAME=$1
BACKEND_APP_NAME=${2:-""}
RESOURCE_GROUP="aixiliary-prod-rg"

echo -e "${GREEN}Starting frontend deployment to Azure Blob Storage${NC}"

# Step 1: Build frontend
echo -e "${YELLOW}Step 1: Building frontend...${NC}"
npm install
npm run build

# Step 2: Enable static website hosting
echo -e "${YELLOW}Step 2: Enabling static website hosting...${NC}"
az storage blob service-properties update \
  --account-name $STORAGE_NAME \
  --static-website \
  --404-document index.html \
  --index-document index.html

# Step 3: Upload files to blob storage
echo -e "${YELLOW}Step 3: Uploading files to blob storage...${NC}"
az storage blob upload-batch \
  --source dist \
  --destination '$web' \
  --account-name $STORAGE_NAME \
  --overwrite

# Step 4: Get frontend URL
echo -e "${YELLOW}Step 4: Getting frontend URL...${NC}"
FRONTEND_URL=$(az storage account show \
  --name $STORAGE_NAME \
  --resource-group $RESOURCE_GROUP \
  --query "primaryEndpoints.web" -o tsv | sed 's:/*$::')

echo -e "${GREEN}✓ Frontend deployed successfully!${NC}"
echo -e "${GREEN}Frontend URL: $FRONTEND_URL${NC}"

# Step 5: Update backend configuration (if backend app name provided)
if [ ! -z "$BACKEND_APP_NAME" ]; then
  echo -e "${YELLOW}Step 5: Updating backend configuration...${NC}"

  az webapp config appsettings set \
    --name $BACKEND_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --settings FRONTEND_URL="$FRONTEND_URL"

  az webapp cors add \
    --name $BACKEND_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --allowed-origins "$FRONTEND_URL" || true

  az webapp restart \
    --name $BACKEND_APP_NAME \
    --resource-group $RESOURCE_GROUP

  echo -e "${GREEN}✓ Backend updated and restarted${NC}"
fi

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}Visit: $FRONTEND_URL${NC}"
