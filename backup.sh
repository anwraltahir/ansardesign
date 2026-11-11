#!/bin/bash
# ====================================================================
# Ansar Al-Sunna Sudan - Smart Design Platform Backup Script
# Domain: design.ansaralsuna.net
# ====================================================================

set -e

# Configuration
PROJECT_DIR="/var/www/ansar-smart-design"
BACKUP_DIR="/var/backups/ansar-design"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME=${PGDATABASE:-"ansar_design_db"}
DB_USER=${PGUSER:-"postgres"}
RETENTION_DAYS=30

echo "🚀 Starting backup process for Ansar Smart Design Platform at $(date)..."

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# 1. Backup PostgreSQL Database
if command -v pg_dump &> /dev/null; then
    echo "📦 Creating PostgreSQL dump: $DB_NAME..."
    pg_dump -U "$DB_USER" -d "$DB_NAME" -F c -b -v -f "$BACKUP_DIR/db_${DB_NAME}_${TIMESTAMP}.dump"
    echo "✅ Database dump completed."
else
    echo "⚠️ pg_dump not found or PostgreSQL running remotely. Backing up local store file..."
    if [ -f "$PROJECT_DIR/data/local_database_store.json" ]; then
        cp "$PROJECT_DIR/data/local_database_store.json" "$BACKUP_DIR/local_store_${TIMESTAMP}.json"
    fi
fi

# 2. Backup Uploads Directory (Sheikhs, Mosques, Calligraphy, Logos, Designs)
if [ -d "$PROJECT_DIR/uploads" ]; then
    echo "🖼️ Archiving uploaded media files..."
    tar -czf "$BACKUP_DIR/uploads_${TIMESTAMP}.tar.gz" -C "$PROJECT_DIR" uploads
    echo "✅ Uploads archive created: uploads_${TIMESTAMP}.tar.gz"
fi

# 3. Clean up backups older than retention days
echo "🧹 Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -type f -mtime +$RETENTION_DAYS -exec rm -f {} \;

echo "🎉 Backup completed successfully! Files stored in $BACKUP_DIR"
