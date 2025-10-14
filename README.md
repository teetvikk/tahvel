# Tahvel - Kooliandmete baasikeskkond

Täismahus koolijuhtimissüsteemi andmebaas realistlike andmetega, sisaldades **≥2 000 000 rida** kohaloleku tabelis.

## 💻 Keskkonnad

- **Host masin**: Alpine Linux virtuaalmasin
- **Docker Engine**: Alpine Linuxis (mitte Docker Desktop)
- **Konteinrid**: Alpine Linux (seeder, phpMyAdmin) + Debian (MariaDB)
- **Runtime**: Bun (TypeScript/JavaScript) Alpine konteineris

## �📋 Projekti kirjeldus

See projekt sisaldab:
- **MariaDB andmebaasi** koolijuhtimissüsteemi jaoks
- **Realistlikke andmeid** Eesti koolidele (nimed, linnad, ained)
- **Suurandmete genereerimise skripti** (Bun/TypeScript Alpine konteineris)
- **phpMyAdmin** andmebaaside haldamiseks
- **Docker Compose** keskkonna lihtsaks käivitamiseks

## 🎯 Andmemahud

| Tabel | Kirjete arv | Kirjeldus |
|-------|-------------|-----------|
| **attendance** | **~2 000 000+** | **Põhitabel** - õpilaste kohalolekud tundides |
| submissions | ~960 000 | Õpilaste esitatud ülesanded |
| grades | ~864 000 | Hinnetulemused |
| lessons | ~150 000 | Tunnid (klassidele jaotatud) |
| class_memberships | ~50 000 | Õpilaste kuuluvused klassidesse |
| users | ~52 000 | Õpilased (~50k) ja õpetajad (~2k) |
| assignments | ~30 000 | Kodutööd ja ülesanded |
| classes | 1 000 | Klassid |
| schools | 50 | Koolid |
| subjects | 20 | Õppeained |

**Kogumaht: üle 3 miljoni kirje**

## 🏗️ Andmebaasi struktuur

### Lookup-tabelid
- `schools` - Eesti koolid
- `subjects` - Õppeained (eesti keeles)

### Põhitabelid
- `users` - Kasutajad (õpilased, õpetajad)
- `classes` - Klassid
- `class_memberships` - Õpilaste kuuluvused klassidesse
- `lessons` - Tunnid
- `assignments` - Ülesanded
- `submissions` - Esitatud tööd
- `grades` - Hinded
- `attendance` - Kohalolekud (**2M+ rida**)

### Suhted
```
schools → classes → class_memberships → users (students)
                  → lessons → attendance → users (students)
                           → assignments → submissions → grades
subjects → lessons, assignments
users (teachers) → lessons, assignments
```

## 🔧 Eeldused

### Alpine Linux virtuaalmasinas
- **Docker Engine** installitud
- **Docker Compose** installitud
- **Git** (projekti allalaadimiseks)
- Vaba kettaruum: ~5GB
- RAM: vähemalt 4GB (soovitatav 8GB)

### Docker installimine Alpine Linuxis (kui pole veel)
```sh
# Uuenda package list
apk update

# Installi Docker ja Docker Compose
apk add docker docker-compose

# Käivita Docker teenus
rc-update add docker boot
service docker start

# Lisa oma kasutaja docker gruppi
addgroup $USER docker

# Installi Git
apk add git
```

### Konteinerites (automaatselt)
- **Alpine Linux** - seeder konteineri base (Bun runtime)
- **Debian Linux** - MariaDB konteiner
- **Alpine Linux** - phpMyAdmin konteiner

### 🏗️ Arhitektuur
```
┌─────────────────────────────────────────┐
│  HOST MASIN (Alpine Linux VM)           │
│  ┌───────────────────────────────────┐  │
│  │  Docker Engine                    │  │
│  │  ┌────────────────────────┐       │  │
│  │  │ Konteiner 1: MariaDB   │       │  │
│  │  │ OS: Debian Linux       │       │  │
│  │  └────────────────────────┘       │  │
│  │  ┌────────────────────────┐       │  │
│  │  │ Konteiner 2: Seeder    │       │  │
│  │  │ OS: Alpine Linux + Bun │       │  │
│  │  └────────────────────────┘       │  │
│  │  ┌────────────────────────┐       │  │
│  │  │ Konteiner 3: phpMyAdmin│       │  │
│  │  │ OS: Alpine Linux       │       │  │
│  │  └────────────────────────┘       │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## 🚀 Käivitamine nullist

### Kiire kontroll (valikuline)

Kontrolli, kas kõik eeldused on täidetud:

```sh
chmod +x setup-alpine.sh
./setup-alpine.sh
```

### 1. Projekti allalaadimine (Alpine Linux VM-s)

```sh
git clone https://github.com/teetvikk/tahvel.git
cd tahvel
```

### 2. Dockeri konteinrite käivitamine

```sh
docker-compose up -d
```

See käivitab:
- **MariaDB** konteiner (Debian-based, port 3306)
- **phpMyAdmin** (Alpine-based, http://localhost:8080)
- **Seeder** konteiner (Bun on Alpine Linux)

Konteinrid käivituvad automaatselt ja MariaDB healthcheck tagab, et teenused ootavad andmebaasi valmimist.

### 3. Andmebaasi skeemi kontrollimine

Andmebaasi skeem laetakse automaatselt `dump.sql` failist. Kontrolli phpMyAdmini kaudu:

- Ava brauseris: http://localhost:8080
- Kasutaja: `student`
- Parool: `Passw0rd`
- Vali andmebaas: `tahvel`

### 4. Seemneskripti käivitamine

Docker healthcheck tagab, et andmebaas on valmis. Käivita seemneskript:

```sh
docker exec -it tahvel_seeder bun install
docker exec -it tahvel_seeder bun run seed.ts
```

**⏱️ Oodatav kestus: 10-20 minutit** (sõltub riistvarast)

Skript:
1. Genereerib realistlikud andmed fikseeritud seemnete abil
2. Sisestab partiidena (5000 rida korraga)
3. Keelab indeksid sisestuse ajaks
4. Taastab indeksid pärast täitmist
5. Kuvab kokkuvõtte

### 5. Tulemuste kontrollimine

Pärast skripti lõpetamist näed kokkuvõtet:

```
========================================
DATABASE STATISTICS
========================================

schools              : 50
subjects             : 20
users                : 52,000
classes              : 1,000
class_memberships    : 50,000
lessons              : 150,000
attendance           : 2,000,000+
assignments          : 30,000
submissions          : ~960,000
grades               : ~864,000

========================================
```

## 📊 Andmete ehtsus ja terviklus

### ✅ Ehtsus
- **Eesti nimed**: Kasutatud on tüüpilised eesti ees- ja perenimed (Jaan, Mart, Anne, Kati, Tamm, Saar jne)
- **Eesti linnad**: Tallinn, Tartu, Pärnu, Narva jt
- **Eesti koolid**: Realistlikud nimed (nt "Tallinn Gümnaasium", "Tartu Keskkool")
- **Eesti õppeained**: Matemaatika, Eesti keel, Füüsika, Bioloogia jne
- **Realistlikud e-kirjad**: `eesnimi.perenimi@kool.ee`, `eesnimi.perenimi@opilane.ee`
- **Mõistlikud kuupäevad**: Tunnid 2023-2025, hinded viimase 60 päeva jooksul
- **Tööpäevad ja kellaajad**: Tunnid toimuvad 8:00-16:00 vahel

### ✅ Terviklus
- **Võõrvõtmed kehtivad**: Kõik suhted on õiged (õpilased on klassides, tunnid toimuvad klassidega, hinded kuuluvad esitustele)
- **Ei ole orvukirjeid**: Iga kirje viitab olemasolevatele kirjetele
- **Unikaalsuspiirangud täidetud**: Kasutajanimed, e-kirjad, tundide ajad on unikaalsed
- **Loogiline järjekord**: Õpilane saab kohal olla ainult oma klassi tunnis, esitada oma klassi ülesandeid
- **Proportsioonid mõistlikud**:
  - ~30 õpilast klassi kohta (50k õpilast / 1k klassi)
  - ~150 tundi klassi kohta (õppeaasta jooksul)
  - ~20 õpilast tunnis → 20 × 150k tunni = 3M võimalikku kohalolekut, genereeritud 2M
  - ~80% ülesannete esitamise määr
  - ~90% esituste hindamise määr

### 🔁 Reprodutseeritavus
- Fikseeritud seeme: `faker.seed(12345)`
- Käivitades skripti uuesti, genereeritakse **täpselt samad andmed**
- Garanteeritud ühesugune tulemus erinevatel süsteemidel

## 🛠️ Tehniline info

### Docker & Alpine Linux
- **Seeder konteiner**: Alpine Linux + Bun runtime
  - Base image: `oven/bun:1.1-alpine` (~90MB)
  - Lisatud tööriistad: `mysql-client` (debugging jaoks)
  - Bun on kiire TypeScript/JavaScript runtime (asendab Node.js)
- **MariaDB konteiner**: Debian-based MariaDB 11.4
  - Automaatne skeem laadimine `/docker-entrypoint-initdb.d/`
  - Healthcheck tagab andmebaasi valmiduse
- **phpMyAdmin konteiner**: Apache + PHP Alpine basil

### Docker Compose funktsioonid
- **Healthcheck**: MariaDB konteiner teatab valmidusest
- **Service dependencies**: Seeder ja phpMyAdmin ootavad andmebaasi
- **Named volumes**: Andmed säilivad konteineri taaskäivitamisel
- **Custom network**: Konteinrid suhtlevad omavahel `tahvel_network` võrgus

### Optimeerimised suurandmete jaoks
1. **Partiipõhine sisestus**: 5000 rida korraga (mitte rida-real)
2. **Indeksite haldus**: Keelab mass-sisestuse ajal, taastab hiljem
3. **Foreign Key kontrolli ajutine väljalülitamine**
4. **Autocommit väljalülitamine**: Kasutatakse käsitsi tehinguid
5. **Unique checks väljalülitamine sisestuse ajal**

### MariaDB konfiguratsiooni parameetrid
```yaml
--max_allowed_packet=256M        # Lubab suuri päringuid
--innodb_buffer_pool_size=1G     # Puhverdab andmeid
--innodb_log_file_size=256M      # Suurem tehingute logi
```

### Andmebaasi kasutaja
- **Kasutaja**: `student`
- **Parool**: `Passw0rd`
- **Õigused**: Täielik juurdepääs `tahvel` andmebaasile

## 📁 Failide struktuur

```
tahvel/
├── dump.sql              # Andmebaasi skeem (MariaDB SQL)
├── seed.ts               # Seemneskript (Bun/TypeScript)
├── package.json          # Sõltuvused (npm/bun)
├── docker-compose.yml    # Dockeri konfiguratsioon (Alpine compatible)
├── Dockerfile            # Seeder konteineri konfiguratsioon (Alpine base)
├── .env                  # Keskkonnamuutujad
├── .gitignore            # Ignoreeritavad failid (Alpine/Linux)
├── .dockerignore         # Dockeri build exclusions
├── setup-alpine.sh       # Alpine Linux eelkontrolli skript
└── README.md             # See fail
```

**Kõik failid on Alpine Linux-ga ühilduvad!** ✅

## 🔍 Kasulikud päringud

### Kontrolli andmemahte
```sql
SELECT 
    table_name AS 'Tabel',
    table_rows AS 'Kirjeid (ligikaudne)',
    ROUND(data_length / 1024 / 1024, 2) AS 'Andmed (MB)'
FROM information_schema.tables
WHERE table_schema = 'tahvel'
ORDER BY table_rows DESC;
```

### Kontrolli võõrvõtmeid
```sql
SELECT 
    table_name,
    constraint_name,
    referenced_table_name
FROM information_schema.key_column_usage
WHERE table_schema = 'tahvel' 
  AND referenced_table_name IS NOT NULL;
```

### Näite päringud
```sql
-- Kohaloleku statistika
SELECT status, COUNT(*) as count 
FROM attendance 
GROUP BY status;

-- Hinnete jaotus
SELECT grade_value, COUNT(*) as count 
FROM grades 
WHERE grade_value IS NOT NULL 
GROUP BY grade_value 
ORDER BY grade_value;

-- Kõige aktiivsemad õpetajad
SELECT u.first_name, u.last_name, COUNT(l.id) as lessons_count
FROM users u
JOIN lessons l ON l.teacher_id = u.id
WHERE u.role = 'teacher'
GROUP BY u.id
ORDER BY lessons_count DESC
LIMIT 10;
```

## 🐛 Debugging Alpine konteinris

### Logi konteinri sisse
```sh
# Seeder konteiner (Alpine + Bun)
docker exec -it tahvel_seeder sh

# MariaDB konteiner (Debian, seega bash)
docker exec -it tahvel_mariadb bash

# phpMyAdmin konteiner (Alpine)
docker exec -it tahvel_phpmyadmin sh
```

### Käsitsi andmebaasi ühendus konteinerist
```sh
# Seeder konteineris (mysql-client on juba installitud)
docker exec -it tahvel_seeder mysql -h mariadb -u student -pPassw0rd tahvel
```

### Kontrolli Bun versiooni
```sh
docker exec -it tahvel_seeder bun --version
```

### Vaata konteineri logisid
```sh
docker logs tahvel_mariadb
docker logs tahvel_seeder
docker logs tahvel_phpmyadmin
```

### Kontrolli Docker Engine staatust (Alpine host)
```sh
# Kontrolli Docker teenuse staatust
rc-service docker status

# Vaata jooksvaid konteinereid
docker ps

# Vaata kõiki konteinereid (sh peatatud)
docker ps -a
```

## 🧹 Puhastamine

### Andmete kustutamine (skeem jääb alles)
```sql
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE attendance;
TRUNCATE TABLE grades;
TRUNCATE TABLE submissions;
TRUNCATE TABLE assignments;
TRUNCATE TABLE lessons;
TRUNCATE TABLE class_memberships;
TRUNCATE TABLE classes;
TRUNCATE TABLE users;
TRUNCATE TABLE subjects;
TRUNCATE TABLE schools;
SET FOREIGN_KEY_CHECKS = 1;
```

### Konteinrite peatamine
```sh
docker-compose down
```

### Konteinrite ja andmete kustutamine
```sh
docker-compose down -v
```

### Image'de kustutamine
```sh
# Vaata image'sid
docker images | grep tahvel

# Kustuta seeder image
docker rmi tahvel-seeder

# Kustuta kõik kasutamata image'd
docker image prune -a
```

## ❓ Probleemide lahendamine

### Probleem: "Connection refused" viga
**Lahendus**: Docker healthcheck peaks seda vältima, aga kui ikka esineb, kontrolli:
```sh
# Kontrolli konteineri staatust
docker ps -a | grep tahvel

# Kontrolli MariaDB logisid
docker logs tahvel_mariadb

# Kontrolli võrku
docker network inspect tahvel_tahvel_network
```

### Probleem: "Out of memory" viga
**Lahendus**: Suurenda Alpine Linux VM-i RAM-i eraldust (virtualiseerimise tarkvaras: VirtualBox/VMware/Hyper-V → vähemalt 4GB).

### Probleem: Skript jookseb väga aeglaselt
**Lahendus**: See on normaalne. 2M+ rea sisestamine võtab aega. Jälgi progressi konsoolis.

### Probleem: Alpine konteineris "command not found"
**Lahendus**: Alpine Linux kasutab `apk` package manager'it. Vajadusel installi:
```sh
docker exec -it tahvel_seeder apk add --no-cache <package-name>
```
**NB!** See käivitad ALPINE HOST masinas, aga käsk täidetakse konteineris!

### Probleem: "Docker daemon not running"
**Lahendus**: 
```sh
# Käivita Docker teenus
rc-service docker start

# Kontrolli staatust
rc-service docker status

# Lisa Docker automaatkäivitusse
rc-update add docker boot
```

### Probleem: "Permission denied" docker käskudel
**Lahendus**:
```sh
# Lisa oma kasutaja docker gruppi
sudo addgroup $USER docker

# Logi välja ja sisse, või käivita
newgrp docker
```

### Probleem: Duplikaatide vead (UNIQUE constraint)
**Lahendus**: Kustuta andmed ja käivita uuesti:
```sh
docker exec -it tahvel_mariadb mysql -ustudent -pPassw0rd tahvel -e "SET FOREIGN_KEY_CHECKS=0; TRUNCATE attendance; TRUNCATE grades; TRUNCATE submissions; TRUNCATE assignments; TRUNCATE lessons; TRUNCATE class_memberships; TRUNCATE classes; TRUNCATE users; TRUNCATE subjects; TRUNCATE schools; SET FOREIGN_KEY_CHECKS=1;"
docker exec -it tahvel_seeder bun run seed.ts
```

## ❓ KKK (Korduma Kippuvad Küsimused)

### Miks on kolm Alpine Linuxi kihti (host + konteinrid)?
- **Host Alpine**: Sinu virtuaalmasin, kus jookseb Docker Engine
- **Konteineri Alpine**: Isoleeritud keskkonnad (seeder, phpMyAdmin)
Iga konteiner on eraldatud, kuigi nad kõik kasutavad Alpine Linuxi. See on normaalne Docker arhitektuur!

### Kas ma pean oskama Alpine Linuxi käske?
Jah, põhilised Alpine käsud on kasulikud:
- `apk` - package manager (nagu `apt` Debian/Ubuntu-s)
- `rc-service` - teenuste haldus
- `rc-update` - autostart haldus
- `sh` - Alpine default shell (mitte bash!)

### Mis on Bun ja miks mitte Node.js?
Bun on kiire, moodne JavaScript/TypeScript runtime. Alpine image on väiksem (~90MB vs ~500MB) ja Bun on kiirem kui Node.js. Ideaalne suurandmete töötlemiseks!

### Kas Docker Desktop on vaja?
**EI!** Sinu Alpine VM kasutab **Docker Engine** (native Linux Docker). Docker Desktop on ainult Windowsi/macOS-i jaoks. Alpine Linuxis jookseb "päris" Docker!

## 📝 Litsents

See projekt on õppeotstarbeline demonstratsioon.

## 👤 Autor

**teetvikk** - [GitHub](https://github.com/teetvikk)

---

**Valmis kasutamiseks!** 🚀
