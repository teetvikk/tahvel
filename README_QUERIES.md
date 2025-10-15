# SELECT Päringute Tulemused

## 📊 Kuidas jooksutada päringuid

```bash
# Alpine Linux VM-is
docker exec -i tahvel_mariadb mysql -ustudent -pPassw0rd tahvel < SELECT.sql > tulemus.txt
```

## 📁 Väljund

Failis `tulemus.txt` on kõigi 6 päringu tulemused:

1. **Lähinädala kodutööd** - Järgmise 7 päeva tähtajad
2. **Puudunud õpilased** - Viimase nädala puudumised
3. **Klasside õpilaste arv** - Statistika klasside kohta
4. **Õpetajate töökoormus** - Viimase 30 päeva tundide arv
5. **Hindamata esitamised** - Ootel tööd
6. **Ainete keskmised hinded** - Õpitulemused aineti

## 🔍 Näidistulemused

Vaata faili `tulemus.txt` või käivita päringud uuesti, et näha värskeid tulemusi.

## ⚙️ Märkused

- Tulemused genereeritakse `seed.ts` skriptiga loodud 2M+ rea andmestiku põhjal
- Faker seed `12345` tagab reprodutseeritavuse
- Kuupäevad on suhtelised (`NOW()`, `CURDATE()`) - tulemused muutuvad päevast päeva
