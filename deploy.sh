#!/bin/bash

# Stop on error
set -e

echo "🚀 Starting Deployment on Ubuntu 22.04..."

# 1. Update System
echo "📦 Updating system packages..."
sudo apt-get update && sudo apt-get upgrade -y

# 2. Install Docker & Docker Compose
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    sudo apt-get install -y ca-certificates curl gnupg lsb-release
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
else
    echo "✅ Docker already installed."
fi

# 3. Setup Permissions
echo "🔑 Configuring permissions..."
# Add current user to docker group
sudo usermod -aG docker $USER
# Create directories if they don't exist (assuming we are in project root)
mkdir -p docker/postgres-data docker/minio-data docker/redis-data
# Set permissions for Airflow (UID 50000)
sudo chown -R 50000:0 docker/postgres-data docker/minio-data docker/redis-data

# 4. Build and Run
echo "🏗️ Building and Starting Services..."
cd docker
# Create .env if not exists (copy example or warn)
if [ ! -f .env ]; then
    echo "⚠️ .env file not found in docker/ directory! Please create it before running."
    exit 1
fi

# Increase virtual memory for Elasticsearch/Redis if needed (optional but good practice)
sudo sysctl -w vm.max_map_count=262144

docker compose build
docker compose up -d

echo "✅ Deployment Complete!"
echo "📊 Dashboard: http://$(curl -s ifconfig.me)"
echo "📝 MLflow: http://$(curl -s ifconfig.me):5000"
echo "🌬️ Airflow: http://$(curl -s ifconfig.me):8080"
