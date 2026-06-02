#!/bin/bash
set -e

echo "Changing to repo directory..."
cd "$(dirname "$0")"

echo "Pulling latest code..."
git pull origin main

echo "Building Docker image..."
docker build -t arbiter-service:latest ./service

echo "Restarting containers..."
docker rm -f arbiter1 arbiter2 arbiter3 || true

docker run -d --restart unless-stopped --name arbiter1 -p 4001:4000 --env-file service/.env arbiter-service:latest
docker run -d --restart unless-stopped --name arbiter2 -p 4002:4000 --env-file service/.env arbiter-service:latest
docker run -d --restart unless-stopped --name arbiter3 -p 4003:4000 --env-file service/.env arbiter-service:latest

echo "Deploy complete."