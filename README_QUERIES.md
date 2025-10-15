# SELECT Päringud - Kasutusjuhend

## � Ülevaade

`SELECT.sql` sisaldab 6 keerukat SQL päringut, mis demonstreerivad realistlikke kasutusjuhtumeid kooli infosüsteemis. Päringud kasutavad JOIN-e, agregeerimist, filtreerimist ja sorteerimist.

---

## 🚀 Kuidas käivitada

### Alpine Linux / Linux / macOS

```bash
docker exec -i tahvel_mariadb mysql -ustudent -pPassw0rd tahvel < SELECT.sql > tulemus.txt
```

### Windows PowerShell

```powershell
Get-Content SELECT.sql | docker exec -i tahvel_mariadb mysql -ustudent -pPassw0rd tahvel > tulemus.txt
```

---

## 📁 Väljundfail

**Failinimi:** `tulemus.txt`

Sisaldab kõigi 6 päringu tulemusi tabelina, koos:
- ✅ Veerupäistega
- ✅ Andmeridade
- ✅ Päringustatistikaga (X rows in set)

---

## 📊 Päringud ja nende eesmärgid

### 1️⃣ Lähinädala kodutööd
**Eesmärk:** Näidata õpetajale ja õpilastele, millised kodutööd tuleb esitada järgmise 7 päeva jooksul.

**Kasutatud tehnikad:**
- `WHERE` + `BETWEEN` + `DATE_ADD()`
- `JOIN` (4 tabelit: assignments, subjects, classes, users)
- `ORDER BY` + `LIMIT`

**Väljund:**
- Kodutöö pealkiri
- Õppeaine
- Klass
- Õpetaja nimi
- Tähtaeg

---

### 2️⃣ Puudunud õpilased viimase nädala jooksul
**Eesmärk:** Aidata klassijuhatajal jälgida õpilaste hiljutisi puudumisi.

**Kasutatud tehnikad:**
- `JOIN` (4 tabelit: attendance, users, lessons, classes)
- `WHERE` + `DATE_SUB()`
- `ORDER BY` mitme veeru järgi

**Väljund:**
- Õpilase nimi
- Klass
- Tunni kuupäev
- Tunni teema

---

### 3️⃣ Iga klassi õpilaste arv
**Eesmärk:** Näidata administraatorile, mitu õpilast igas klassis on.

**Kasutatud tehnikad:**
- `LEFT JOIN` (classes + class_memberships)
- `GROUP BY` + `COUNT()`
- `ORDER BY DESC`

**Väljund:**
- Klassi nimi
- Õpilaste arv

---

### 4️⃣ Õpetajate töökoormus viimase kuu jooksul
**Eesmärk:** Aruandlus õpetajate töökoormuse kohta viimase 30 päeva jooksul.

**Kasutatud tehnikad:**
- `JOIN` (lessons + users)
- `WHERE` + `DATE_SUB()`
- `GROUP BY` + `HAVING`
- `COUNT()` agregaatfunktsioon

**Väljund:**
- Õpetaja nimi
- Antud tundide arv

---

### 5️⃣ Hindamata esitamised
**Eesmärk:** Näidata õpetajatele, millised esitatud tööd ootavad veel hindamist.

**Kasutatud tehnikad:**
- `LEFT JOIN` + `WHERE IS NULL` (leia esitamised ilma hinneteta)
- `JOIN` (submissions, users, assignments, grades)
- `ORDER BY` mitme veeru järgi

**Väljund:**
- Esitamise ID
- Õpilase nimi
- Kodutöö pealkiri
- Esitamise aeg
- Tähtaeg

---

### 6️⃣ Ainete keskmised hinded
**Eesmärk:** Anda ülevaade, millistes ainetes on õpilaste tulemused paremad.

**Kasutatud tehnikad:**
- `JOIN` (4 tabelit: grades, submissions, assignments, subjects)
- `CASE WHEN` (konverteeri tekst numbriteks)
- `CAST()` + `AVG()` + `ROUND()`
- `GROUP BY` + `HAVING`

**Väljund:**
- Õppeaine nimi
- Keskmine hinne (2 komakohta)

---

## 🔍 Näidistulemused

Vaata faili **`tulemus.txt`** peale käivitamist.

---

## ⚙️ Tehnilised detailid

### Andmestik
- **Allikas:** `seed.ts` skript genereerib 2M+ rida andmeid
- **Reprodutseeritavus:** Faker seed `12345` tagab identsed tulemused
- **Suurus:** ~50 kooli, 2000 õpetajat, 50,000 õpilast, 1.2M+ attendance kirjet

### Kuupäevad
Päringud kasutavad dünaamilisi kuupäevi:
- `NOW()` - praegune aeg
- `CURDATE()` - praegune kuupäev
- `DATE_ADD()` / `DATE_SUB()` - suhtelised kuupäevad

⚠️ **Tulemused muutuvad päevast päeva**, sest andmestik on genereeritud vahemikus 2023-2025.

### Jõudlus
- **Indexid:** Kõik FK-d on indekseeritud (`dump.sql`)
- **UNIQUE constraintid:** Väldivad duplikaate
- **Batch inserts:** 5000 rida korraga

---

## 📖 Kasutusjuhud

| Kasutaja | Päring | Kasutusjuht |
|----------|--------|-------------|
| **Õpilane** | #1, #5 | Vaata tähtaegu, kontrolli esitamisi |
| **Õpetaja** | #1, #2, #4, #5 | Töökoormuse planeerimine, puudumiste jälgimine |
| **Klassijuhataja** | #2, #3 | Klassi monitooring |
| **Aineõpetaja** | #6 | Õpitulemuste analüüs |
| **Administraator** | #3, #4, #6 | Aruandlus, ressursside planeerimine |

---

## 🛠️ Troubleshooting

### ❌ "No such container"
```bash
# Kontrolli konteinerite nimesid
docker ps

# Kasuta õiget nime
docker exec -i <container_name> mysql -ustudent -pPassw0rd tahvel < SELECT.sql > tulemus.txt
```

### ❌ "Access denied"
Veendu, et kasutad õigeid credentiale:
- **Kasutaja:** `student`
- **Parool:** `Passw0rd`
- **Andmebaas:** `tahvel`

### ❌ "Empty set" tulemused
Kui päringud ei tagasta andmeid:
```bash
# Kontrolli, kas seed on käivitatud
docker compose logs seeder

# Käivita seed uuesti
docker compose restart seeder
```

---

## 📚 Seotud failid

- **`SELECT.sql`** - 6 SQL päringut
- **`dump.sql`** - Andmebaasi struktuur
- **`seed.ts`** - Andmete genereerimisskript
- **`tulemus.txt`** - Päringute väljund (genereeritakse)
- **`docker-compose.yml`** - Keskkonna konfiguratsioon

---

## ✅ Kiirkäivitamine

```bash
# 1. Käivita Docker konteinerid
docker compose up -d

# 2. Oota, kuni seed lõpeb
docker compose logs -f seeder

# 3. Jooksuta päringud
docker exec -i tahvel_mariadb mysql -ustudent -pPassw0rd tahvel < SELECT.sql > tulemus.txt

# 4. Vaata tulemusi
cat tulemus.txt
# või
less tulemus.txt
```

---

**Küsimused?** Vaata `README.md` või `SETUP_EXAMPLES.md`
