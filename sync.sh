#!/bin/bash

# Set up the node environment
export NVM_DIR=~/.nvm
source ~/.nvm/nvm.sh

echo "Starting deployment process"

# Change directory to where your application is located
cd /home/ubuntu/repositories/BE_dior-analysis-v2/

# RUN DB migration
echo "Run DB Migration"
node run-migration.cjs

# Install all the dependencies
echo "Installing dependencies"
source ~/.bashrc  # Refresh the shell to include updated PATH


npm install

# Build the application
echo "Building application"
npm run build

# Restart the application using PM2
echo "Restarting the application using PM2"
pm2 restart ecosystem.config.js

echo "Deployment process completed"


