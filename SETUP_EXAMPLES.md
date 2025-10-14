# Tahvel - Setup Script Näited

## ✅ EDUKAS VÄLJUND (kõik on OK)

```
==========================================
Tahvel Docker Environment - Alpine Linux
==========================================

ℹ️  Kontrollin Alpine Linux versiooni...
✅ Alpine Linux 3.19.1

ℹ️  Kontrollin Docker installatsiooni...
✅ Docker on installitud (versioon 24.0.7)

ℹ️  Kontrollin Docker teenuse staatust...
✅ Docker teenus jookseb

ℹ️  Kontrollin kasutaja õigusi...
✅ Kasutaja on docker grupis

ℹ️  Kontrollin Docker Compose installatsiooni...
✅ Docker Compose on installitud (versioon 2.23.0)

ℹ️  Kontrollin kettaruumi...
✅ Vaba kettaruum: 15G

ℹ️  Kontrollin projekti faile...
✅ Leitud: docker-compose.yml
✅ Leitud: Dockerfile
✅ Leitud: dump.sql
✅ Leitud: seed.ts
✅ Leitud: package.json
✅ Leitud: .env

==========================================
✅ Kõik eeldused on täidetud!
==========================================

📝 Järgmised sammud:

1️⃣  Käivita Docker konteinrid:
    docker-compose up -d

2️⃣  Oota ~10-30 sekundit, siis kontrolli:
    docker ps

3️⃣  Installi sõltuvused seeder konteineris:
    docker exec -it tahvel_seeder bun install

4️⃣  Käivita seemneskript (võtab 10-20 min):
    docker exec -it tahvel_seeder bun run seed.ts

5️⃣  Ava brauser:
    phpMyAdmin: http://localhost:8080
    Kasutaja: student
    Parool: Passw0rd

==========================================
```

## ⚠️ HOIATUSED (midagi vajab tähelepanu)

```
==========================================
Tahvel Docker Environment - Alpine Linux
==========================================

ℹ️  Kontrollin Alpine Linux versiooni...
✅ Alpine Linux 3.19.1

ℹ️  Kontrollin Docker installatsiooni...
✅ Docker on installitud (versioon 24.0.7)

ℹ️  Kontrollin Docker teenuse staatust...
⚠️  Docker teenus ei jookse
    Käivitan Docker teenuse...
✅ Docker teenus käivitatud edukalt

ℹ️  Kontrollin kasutaja õigusi...
⚠️  Kasutaja ei ole docker grupis
    Lisa käsuga: sudo addgroup $USER docker
    Seejärel: newgrp docker (või logi välja/sisse)

[... jätkub ...]
```

## ❌ VIGA (Docker ei ole installitud)

```
==========================================
Tahvel Docker Environment - Alpine Linux
==========================================

ℹ️  Kontrollin Alpine Linux versiooni...
✅ Alpine Linux 3.19.1

ℹ️  Kontrollin Docker installatsiooni...
❌ Docker ei ole installitud!
    Installi käsuga: apk add docker docker-compose
```

## ❌ VIGA (projekti failid puuduvad)

```
[... eelmised kontrolled ...]

ℹ️  Kontrollin projekti faile...
✅ Leitud: docker-compose.yml
✅ Leitud: Dockerfile
❌ Puudub: dump.sql
❌ Puudub: seed.ts
✅ Leitud: package.json
✅ Leitud: .env

❌ Mõned vajalikud failid puuduvad: dump.sql seed.ts
```

## 🧪 KUIDAS TESTIDA

### 1. Alpine Linux VM-s:

```sh
# Mine projekti kausta
cd tahvel

# Tee skript käivitatavaks
chmod +x setup-alpine.sh

# Kontrolli õigusi (peaksid nägema 'x' tähte)
ls -l setup-alpine.sh
# Väljund: -rwxr-xr-x 1 user user 1234 Oct 14 12:00 setup-alpine.sh
#           ^^^
#           Need x-id näitavad, et fail on executable

# Käivita skript
./setup-alpine.sh
```

### 2. Kui näed ✅ sümboleid:
- Kõik on OK, jätka järgmiste sammudega

### 3. Kui näed ⚠️ sümboleid:
- Midagi vajab parandamist, aga ei ole kriitiline
- Skript jätkab

### 4. Kui näed ❌ sümboleid:
- Kriitiline viga
- Skript peatub
- Järgi ekraanil olevaid juhiseid

## 🔧 LEVINUD PROBLEEMID JA LAHENDUSED

### Probleem 1: "Permission denied"
```sh
./setup-alpine.sh
# sh: ./setup-alpine.sh: Permission denied
```
**Lahendus:**
```sh
chmod +x setup-alpine.sh
./setup-alpine.sh
```

### Probleem 2: "Docker ei ole installitud"
```sh
# Installi Docker ja Docker Compose
sudo apk add docker docker-compose

# Lisa Docker autostart'i
sudo rc-update add docker boot

# Käivita Docker
sudo rc-service docker start
```

### Probleem 3: "Kasutaja ei ole docker grupis"
```sh
# Lisa end docker gruppi
sudo addgroup $USER docker

# Aktiveeri grupp (kaks võimalust):
# Variant 1: Uus session
newgrp docker

# Variant 2: Logi välja ja sisse
exit
# (logi uuesti sisse SSH või terminal)
```

### Probleem 4: "Failid puuduvad"
```sh
# Kontrolli, kas oled õiges kaustas
pwd
# Peaks olema: /home/kasutaja/tahvel või sarnane

ls -la
# Peaksid nägema: docker-compose.yml, dump.sql, seed.ts jne

# Kui ei ole, klooni repo uuesti
git clone https://github.com/teetvikk/tahvel.git
cd tahvel
```

## 📝 TÄIELIK NÄIDE TESTIMISEKS

```sh
# 1. Klooni repo (kui pole veel)
git clone https://github.com/teetvikk/tahvel.git
cd tahvel

# 2. Kontrolli, et failid on olemas
ls -l
# Peaksid nägema: docker-compose.yml, Dockerfile, dump.sql, seed.ts jne

# 3. Tee skript käivitatavaks
chmod +x setup-alpine.sh

# 4. Käivita kontroll
./setup-alpine.sh

# 5. Kui kõik on ✅, siis jätka
docker-compose up -d

# 6. Kontrolli, et konteinrid jooksevad
docker ps
# Peaksid nägema: tahvel_mariadb, tahvel_seeder, tahvel_phpmyadmin

# 7. Seedi andmed
docker exec -it tahvel_seeder bun install
docker exec -it tahvel_seeder bun run seed.ts
```

## 🎯 KOKKUVÕTE

**Skript kontrollib:**
1. ✅ Alpine Linux versioon
2. ✅ Docker installatsioon ja versioon
3. ✅ Docker teenuse staatus
4. ✅ Kasutaja Docker grupi liikmelisus
5. ✅ Docker Compose installatsioon
6. ✅ Vaba kettaruum
7. ✅ Vajalike failide olemasolu

**Kui kõik ✅, saad jätkata!**
**Kui mõni ❌, järgi ekraanil olevaid juhiseid!**
