#!/bin/sh
# Alpine Linux startup script for Tahvel project

set -e  # Exit on error

echo "=========================================="
echo "Tahvel Docker Environment - Alpine Linux"
echo "=========================================="
echo ""

# Function to print colored output
print_ok() { echo "✅ $1"; }
print_warn() { echo "⚠️  $1"; }
print_error() { echo "❌ $1"; }
print_info() { echo "ℹ️  $1"; }

# Check Alpine Linux version
print_info "Kontrollin Alpine Linux versiooni..."
if [ -f /etc/alpine-release ]; then
    ALPINE_VERSION=$(cat /etc/alpine-release)
    print_ok "Alpine Linux $ALPINE_VERSION"
else
    print_warn "Ei ole Alpine Linux või versioon ei ole leitav"
fi
echo ""

# Check if Docker is installed
print_info "Kontrollin Docker installatsiooni..."
if command -v docker >/dev/null 2>&1; then
    DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
    print_ok "Docker on installitud (versioon $DOCKER_VERSION)"
else
    print_error "Docker ei ole installitud!"
    echo "    Installi käsuga: apk add docker docker-compose"
    exit 1
fi
echo ""

# Check if Docker is running
print_info "Kontrollin Docker teenuse staatust..."
if rc-service docker status >/dev/null 2>&1; then
    print_ok "Docker teenus jookseb"
else
    print_warn "Docker teenus ei jookse"
    echo "    Käivitan Docker teenuse..."
    if rc-service docker start; then
        print_ok "Docker teenus käivitatud edukalt"
    else
        print_error "Docker teenuse käivitamine ebaõnnestus"
        echo "    Proovi käsuga: sudo rc-service docker start"
        exit 1
    fi
fi
echo ""

# Check if user is in docker group
print_info "Kontrollin kasutaja õigusi..."
if groups | grep -q docker; then
    print_ok "Kasutaja on docker grupis"
else
    print_warn "Kasutaja ei ole docker grupis"
    echo "    Lisa käsuga: sudo addgroup \$USER docker"
    echo "    Seejärel: newgrp docker (või logi välja/sisse)"
fi
echo ""

# Check if docker-compose is installed
print_info "Kontrollin Docker Compose installatsiooni..."
if command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_VERSION=$(docker-compose --version | cut -d' ' -f4 | cut -d',' -f1)
    print_ok "Docker Compose on installitud (versioon $COMPOSE_VERSION)"
else
    print_error "Docker Compose ei ole installitud!"
    echo "    Installi käsuga: apk add docker-compose"
    exit 1
fi
echo ""

# Check disk space
print_info "Kontrollin kettaruumi..."
DISK_SPACE=$(df -h . | awk 'NR==2 {print $4}')
print_ok "Vaba kettaruum: $DISK_SPACE"
echo ""

# Check if required files exist
print_info "Kontrollin projekti faile..."
REQUIRED_FILES="docker-compose.yml Dockerfile dump.sql seed.ts package.json .env"
MISSING_FILES=""

for file in $REQUIRED_FILES; do
    if [ -f "$file" ]; then
        print_ok "Leitud: $file"
    else
        print_error "Puudub: $file"
        MISSING_FILES="$MISSING_FILES $file"
    fi
done

if [ -n "$MISSING_FILES" ]; then
    echo ""
    print_error "Mõned vajalikud failid puuduvad:$MISSING_FILES"
    exit 1
fi

echo ""
echo "=========================================="
print_ok "Kõik eeldused on täidetud!"
echo "=========================================="
echo ""
echo "📝 Järgmised sammud:"
echo ""
echo "1️⃣  Käivita Docker konteinrid:"
echo "    docker-compose up -d"
echo ""
echo "2️⃣  Oota ~10-30 sekundit, siis kontrolli:"
echo "    docker ps"
echo ""
echo "3️⃣  Installi sõltuvused seeder konteineris:"
echo "    docker exec -it tahvel_seeder bun install"
echo ""
echo "4️⃣  Käivita seemneskript (võtab 10-20 min):"
echo "    docker exec -it tahvel_seeder bun run seed.ts"
echo ""
echo "5️⃣  Ava brauser:"
echo "    phpMyAdmin: http://localhost:8080"
echo "    Kasutaja: student"
echo "    Parool: Passw0rd"
echo ""
echo "=========================================="
