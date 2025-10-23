#!/usr/bin/env bash
set -euo pipefail

# Load environment variables from root .env
ENV_FILE="$(dirname "$0")/../.env"
if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs)
else
    echo "❌ .env file not found at $ENV_FILE"
    exit 1
fi

# Derive variables
MINIO_ALIAS="dodon"
SCHEME="http"

# Convert MINIO_USE_SSL to lowercase and check
if [ "$(echo "$MINIO_USE_SSL" | tr '[:upper:]' '[:lower:]')" = "true" ]; then
    SCHEME="https"
fi

# Build URL with or without port
if [ -n "${MINIO_PORT}" ]; then
    MINIO_URL="$SCHEME://$MINIO_ENDPOINT:$MINIO_PORT"
else
    MINIO_URL="$SCHEME://$MINIO_ENDPOINT"
fi

echo "✅ Using MinIO URL: $MINIO_URL"
echo "🪣 Bucket: $MINIO_BUCKET"

# Add MinIO alias
mc alias set "$MINIO_ALIAS" "$MINIO_URL" "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY" --api S3v4

# Create bucket (ignore if exists)
mc mb "$MINIO_ALIAS/$MINIO_BUCKET" || true

# Set bucket to private
mc anonymous set none "$MINIO_ALIAS/$MINIO_BUCKET"

# Optional: tag the bucket
mc tag set "$MINIO_ALIAS/$MINIO_BUCKET" "env=dev&project=${MINIO_BUCKET}"

# Verify
mc ls "$MINIO_ALIAS/$MINIO_BUCKET"

echo "✅ MinIO bucket setup complete."
