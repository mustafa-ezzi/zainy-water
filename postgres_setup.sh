#!/bin/bash

# PostgreSQL Podman Setup Script
# Container: zainy-water-postgres
# Password: triplefive
# Data directory: ~/Documents/Containers/zainy-water-postgres

echo "Setting up PostgreSQL container: zainy-water-postgres"

# Create the bind mount directory if it doesn't exist
POSTGRES_DATA_DIR="$HOME/Documents/Containers/zainy-water-postgres"
mkdir -p "$POSTGRES_DATA_DIR"
echo "Created data directory: $POSTGRES_DATA_DIR"

# Check directory permissions
echo "Checking directory permissions..."
ls -la "$POSTGRES_DATA_DIR"
echo "Directory owner: $(stat -c '%U:%G' "$POSTGRES_DATA_DIR")"

# Check if container already exists (including stopped ones)
EXISTING_CONTAINER=$(podman ps -a --filter name=zainy-water-postgres --format "{{.Names}}" 2>/dev/null)
if [ ! -z "$EXISTING_CONTAINER" ]; then
  echo "Container 'zainy-water-postgres' already exists!"
  echo "Current status:"
  podman ps -a --filter name=zainy-water-postgres --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
  
  # Show logs from previous run to help diagnose issues
  echo ""
  echo "Logs from previous container run:"
  echo "================================="
  podman logs zainy-water-postgres 2>/dev/null | tail -20
  echo "================================="
  echo ""
  
  read -p "Do you want to remove the existing container and create a new one? (y/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Stopping and removing existing container..."
    podman stop zainy-water-postgres 2>/dev/null || true
    podman rm zainy-water-postgres 2>/dev/null || true
    echo "Existing container removed."
  else
    echo "Exiting without changes."
    exit 0
  fi
fi

# Run PostgreSQL container with additional troubleshooting options
echo "Starting PostgreSQL container..."
echo "Running command: podman run -d --name zainy-water-postgres -e POSTGRES_PASSWORD=triplefive -p 5432:5432 -v \"$POSTGRES_DATA_DIR\":/var/lib/postgresql/data postgres:15"

CONTAINER_ID=$(podman run -d \
--name zainy-water-postgres \
-e POSTGRES_PASSWORD=triplefive \
-p 5432:5432 \
-v "$POSTGRES_DATA_DIR":/var/lib/postgresql/data:Z \
postgres:15)

# Check if the run command succeeded
if [ $? -eq 0 ]; then
  echo "Container started with ID: $CONTAINER_ID"
  
  # Give container a moment to start
  echo "Waiting 3 seconds for container to initialize..."
  sleep 3
  
  # Check container status
  echo "Checking container status..."
  CONTAINER_STATUS=$(podman ps -a --filter name=zainy-water-postgres --format "{{.Status}}")
  echo "Container status: $CONTAINER_STATUS"
  
  # Show logs regardless of status
  echo ""
  echo "Container logs:"
  echo "==============="
  podman logs zainy-water-postgres 2>&1
  echo "==============="
  echo ""
  
  # Check if container is running
  if podman ps --filter name=zainy-water-postgres --format "{{.Names}}" | grep -q "zainy-water-postgres"; then
    echo "✅ PostgreSQL container 'zainy-water-postgres' is running successfully!"
    echo ""
    echo "Container details:"
    podman ps --filter name=zainy-water-postgres --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
  else
    echo "❌ Container started but then stopped. Check the logs above for error details."
    echo ""
    echo "Common issues and solutions:"
    echo "1. Permission issues: Check if the bind mount directory has correct permissions"
    echo "2. Port conflicts: Another service might be using port 5432"
    echo "3. SELinux: May need to set SELinux context for the directory"
    echo ""
    echo "Debug commands:"
    echo "  Check all containers: podman ps -a"
    echo "  View logs: podman logs zainy-water-postgres"
    echo "  Inspect container: podman inspect zainy-water-postgres"
    exit 1
  fi
else
  echo "❌ Failed to start PostgreSQL container!"
  echo "Check the error messages above."
  exit 1
fi