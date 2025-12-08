#!/bin/bash

# AIxiliary Backend - Azure Deployment Script
# Usage: ./deploy-azure.sh [backend-app-name]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend app name is provided
if [ -z "$1" ]; then
  echo -e "${RED}Error: Backend app name is required${NC}"
  echo "Usage: ./deploy-azure.sh [backend-app-name]"
  exit 1
fi

BACKEND_APP_NAME=$1

echo -e "${GREEN}Starting deployment to Azure Web App: ${BACKEND_APP_NAME}${NC}"

# Step 1: Install dependencies
echo -e "${YELLOW}Step 1: Installing dependencies...${NC}"
npm install

# Step 2: Run TypeScript build
echo -e "${YELLOW}Step 2: Building TypeScript...${NC}"
npm run build

# Step 3: Create deployment package
echo -e "${YELLOW}Step 3: Creating deployment package...${NC}"
mkdir -p deploy-temp
cp -r dist deploy-temp/
cp package*.json deploy-temp/
cp ecosystem.config.js deploy-temp/
cp -r database deploy-temp/
cd deploy-temp

# Step 4: Install production dependencies only
echo -e "${YELLOW}Step 4: Installing production dependencies...${NC}"
npm install --omit=dev

# Step 5: Create deployment zip
echo -e "${YELLOW}Step 5: Creating deployment archive...${NC}"
zip -r ../deploy.zip ./*

cd ..
rm -rf deploy-temp

# Step 6: Deploy to Azure
echo -e "${YELLOW}Step 6: Deploying to Azure...${NC}"
az webapp deployment source config-zip \
  --resource-group aixiliary-prod-rg \
  --name $BACKEND_APP_NAME \
  --src deploy.zip

# Clean up
rm deploy.zip

# Step 7: Restart the app
echo -e "${YELLOW}Step 7: Restarting application...${NC}"
az webapp restart \
  --name $BACKEND_APP_NAME \
  --resource-group aixiliary-prod-rg

echo -e "${GREEN}✓ Deployment completed successfully!${NC}"
echo -e "${GREEN}Backend URL: https://${BACKEND_APP_NAME}.azurewebsites.net${NC}"

# Step 8: Show logs
echo -e "${YELLOW}Fetching deployment logs...${NC}"
az webapp log tail \
  --name $BACKEND_APP_NAME \
  --resource-group aixiliary-prod-rg \
  --lines 50
