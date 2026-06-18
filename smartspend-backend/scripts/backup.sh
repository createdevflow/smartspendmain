#!/bin/bash
set -e

# Backup Configuration
BACKUP_DIR="/var/backups/smartspend"
DB_CONTAINER="smartspend-db"
DB_USER="smartspend"
DB_NAME="smartspend"
MINIO_DATA_DIR="./minio_data"
DATE=$(date +%Y-%m-%d_%H-%M-%S)

mkdir -p "$BACKUP_DIR"

echo "💾 Starting SmartSpend Backup: $DATE"

# 1. Backup PostgreSQL Database
echo "📦 Backing up PostgreSQL..."
docker exec -t $DB_CONTAINER pg_dump -U $DB_USER $DB_NAME -F c > "$BACKUP_DIR/db_$DATE.dump"

# 2. Backup MinIO Files (Tarball)
echo "📁 Backing up MinIO storage..."
tar -czf "$BACKUP_DIR/files_$DATE.tar.gz" "$MINIO_DATA_DIR"

# 3. Retain only last 7 days of backups
echo "🧹 Cleaning up backups older than 7 days..."
find "$BACKUP_DIR" -type f -name "*.dump" -mtime +7 -delete
find "$BACKUP_DIR" -type f -name "*.tar.gz" -mtime +7 -delete

echo "✅ Backup completed successfully!"
