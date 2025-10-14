#!/bin/sh
# Simplified Alpine Linux check script for Tahvel project
# This version is more forgiving and focuses on essential checks

echo "=========================================="
echo "Tahvel - Alpine Linux Environment Check"
echo "=========================================="
echo ""

# Check Docker
echo "Kontrollin Docker installatsiooni..."
if command -v docker >/dev/null 2>&1; then
    echo "  ✓ Docker on installitud"
    docker --version
else
    echo "  ✗ Docker puudub - installi: apk add docker"
    exit 1
fi
echo ""

# Check Docker Compose
echo "Kontrollin Docker Compose..."
if command -v docker-compose >/dev/null 2>&1; then
    echo "  ✓ Docker Compose on installitud"
    docker-compose --version
else
    echo "  ✗ Docker Compose puudub - installi: apk add docker-compose"
    exit 1
fi
echo ""

# Check if Docker daemon is running
echo "Kontrollin Docker daemon'i..."
if docker info >/dev/null 2>&1; then
    echo "  ✓ Docker daemon jookseb"
elif docker ps >/dev/null 2>&1; then
    echo "  ✓ Docker jookseb"
else
    echo "  ! Docker daemon ei jookse"
    echo "    Käivita: sudo rc-service docker start"
    echo "    või:     sudo service docker start"
fi
echo ""

# Check required files
echo "Kontrollin projekti faile..."
ALL_GOOD=1
for file in docker-compose.yml Dockerfile dump.sql seed.ts package.json .env; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ $file PUUDUB!"
        ALL_GOOD=0
    fi
done
echo ""

if [ $ALL_GOOD -eq 0 ]; then
    echo "❌ Mõned failid puuduvad! Kontrolli, et oled õiges kaustas."
    exit 1
fi

# Check disk space
echo "Vaba kettaruum:"
df -h . | grep -v Filesystem
echo ""

echo "=========================================="
echo "✅ Põhikontroll läbitud!"
echo "=========================================="
echo ""
echo "Järgmised sammud:"
echo ""
echo "1. docker-compose up -d"
echo "2. docker ps  # kontrolli, et konteinrid jooksevad"
echo "3. docker exec -it tahvel_seeder bun install"
echo "4. docker exec -it tahvel_seeder bun run seed.ts"
echo ""
echo "phpMyAdmin: http://localhost:8080"
echo "Kasutaja: student / Passw0rd"
echo "=========================================="
