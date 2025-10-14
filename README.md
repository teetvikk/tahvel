# Tahvel - Kooliandmete baasikeskkond

Täismahus koolijuhtimissüsteemi andmebaas realistlike andmetega, sisaldades **≥2 000 000 rida** kohaloleku tabelis.

## 📋 Projekti kirjeldus

See projekt sisaldab:
- **MariaDB andmebaasi** koolijuhtimissüsteemi jaoks
- **Realistlikke andmeid** Eesti koolidele (nimed, linnad, ained)
- **Suurandmete genereerimise skripti** (Bun/TypeScript)
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

- **Docker Desktop** (Windows: https://docs.docker.com/desktop/install/windows-install/)
- **Docker Compose** (kaasas Docker Desktopiga)
- Vaba kettaruum: ~5GB
- RAM: vähemalt 4GB (soovitatav 8GB)

## 🚀 Käivitamine nullist

### 1. Projekti allalaadimine

```powershell
git clone https://github.com/teetvikk/tahvel.git
cd tahvel
```

### 2. Dockeri konteinrite käivitamine

```powershell
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

```powershell
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
├── dump.sql              # Andmebaasi skeem
├── seed.ts               # Seemneskript (Bun/TypeScript)
├── package.json          # Sõltuvused
├── docker-compose.yml    # Dockeri konfiguratsioon
├── Dockerfile            # Seeder konteineri konfiguratsioon
├── .env                  # Keskkonnamuutujad
├── .gitignore           # Ignoreeritavad failid
└── README.md            # See fail
```

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
```powershell
# Seeder konteiner (Alpine + Bun)
docker exec -it tahvel_seeder sh

# MariaDB konteiner
docker exec -it tahvel_mariadb bash

# phpMyAdmin konteiner
docker exec -it tahvel_phpmyadmin sh
```

### Käsitsi andmebaasi ühendus Alpine konteineris
```sh
# Seeder konteineris
docker exec -it tahvel_seeder mysql -h mariadb -u student -pPassw0rd tahvel
```

### Kontrolli Bun versiooni
```powershell
docker exec -it tahvel_seeder bun --version
```

### Vaata konteineri logisid
```powershell
docker logs tahvel_mariadb
docker logs tahvel_seeder
docker logs tahvel_phpmyadmin
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
```powershell
docker-compose down
```

### Konteinrite ja andmete kustutamine
```powershell
docker-compose down -v
```

### Image'de kustutamine (Alpine konteiner jm)
```powershell
# Vaata image'sid
docker images | findstr tahvel

# Kustuta seeder image
docker rmi tahvel-seeder
```

## ❓ Probleemide lahendamine

### Probleem: "Connection refused" viga
**Lahendus**: Docker healthcheck peaks seda vältima, aga kui ikka esineb, kontrolli:
```powershell
# Kontrolli konteineri staatust
docker ps -a | findstr tahvel

# Kontrolli MariaDB logisid
docker logs tahvel_mariadb
```

### Probleem: "Out of memory" viga
**Lahendus**: Suurenda Docker Desktopi RAM-i eraldust (Settings → Resources → Memory → vähemalt 4GB).

### Probleem: Skript jookseb väga aeglaselt
**Lahendus**: See on normaalne. 2M+ rea sisestamine võtab aega. Jälgi progressi konsoolis.

### Probleem: Alpine konteineris "command not found"
**Lahendus**: Alpine Linux kasutab `apk` package manager'it. Vajadusel installi:
```sh
docker exec -it tahvel_seeder apk add --no-cache <package-name>
```

### Probleem: Duplikaatide vead (UNIQUE constraint)
**Lahendus**: Kustuta andmed ja käivita uuesti:
```powershell
docker exec -it tahvel_mariadb mysql -ustudent -pPassw0rd tahvel -e "SET FOREIGN_KEY_CHECKS=0; TRUNCATE attendance; TRUNCATE grades; TRUNCATE submissions; TRUNCATE assignments; TRUNCATE lessons; TRUNCATE class_memberships; TRUNCATE classes; TRUNCATE users; TRUNCATE subjects; TRUNCATE schools; SET FOREIGN_KEY_CHECKS=1;"
docker exec -it tahvel_seeder bun run seed.ts
```

## 📝 Litsents

See projekt on õppeotstarbeline demonstratsioon.

## 👤 Autor

**teetvikk** - [GitHub](https://github.com/teetvikk)

---

**Valmis kasutamiseks!** 🚀
