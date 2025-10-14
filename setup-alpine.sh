#!/bin/sh
# Alpine Linux startup script for Tahvel project

echo "=========================================="
echo "Tahvel Docker Environment - Alpine Linux"
echo "=========================================="

# Check if Docker is installed
if ! command -v docker >/dev/null 2>&1; then
    echo "❌ Docker ei ole installitud!"
    echo "Installi Docker käsuga:"
    echo "  apk add docker docker-compose"
    exit 1
fi

# Check if Docker is running
if ! rc-service docker status >/dev/null 2>&1; then
    echo "⚠️  Docker teenus ei jookse. Käivitan..."
    rc-service docker start
fi

# Check if user is in docker group
if ! groups | grep -q docker; then
    echo "⚠️  Kasutaja ei ole docker grupis!"
    echo "Lisa kasutaja gruppi käsuga:"
    echo "  sudo addgroup \$USER docker"
    echo "  newgrp docker"
fi

# Check if docker-compose is installed
if ! command -v docker-compose >/dev/null 2>&1; then
    echo "❌ Docker Compose ei ole installitud!"
    echo "Installi käsuga:"
    echo "  apk add docker-compose"
    exit 1
fi

echo "✅ Kõik eeldused on täidetud!"
echo ""
echo "Käivita projekt käsuga:"
echo "  docker-compose up -d"
echo ""
echo "Seemneskripti käivitamine:"
echo "  docker exec -it tahvel_seeder bun install"
echo "  docker exec -it tahvel_seeder bun run seed.ts"
echo ""
echo "phpMyAdmin: http://localhost:8080"
echo "=========================================="
