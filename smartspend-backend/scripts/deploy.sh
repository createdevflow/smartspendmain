#!/bin/bash
set -e

echo "🚀 Starting SmartSpend Deployment..."

# 1. Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# 2. Rebuild the application containers
echo "🏗️ Building Docker images..."
docker-compose build

# 3. Apply Prisma migrations
echo "🗄️ Applying database migrations..."
docker-compose run --rm api npx prisma migrate deploy

# 4. Restart services with zero downtime (if using swarm) or rolling restart
echo "🔄 Restarting services..."
docker-compose up -d

# 5. Clean up unused images
echo "🧹 Cleaning up old images..."
docker image prune -f

echo "✅ Deployment successful!"
