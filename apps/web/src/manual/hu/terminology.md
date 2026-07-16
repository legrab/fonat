# Fonat fogalomtár

Ez az oldal a tanári felületen és a csomagformátumban használt kifejezéseket egységesen magyarázza. Az angol név ott szerepel, ahol külső dokumentációban vagy tartalomcsomagban találkozhatsz vele.

## Munkatér és hozzáférés

| Magyar kifejezés | Angol/domain név | Jelentés                                                                            |
| ---------------- | ---------------- | ----------------------------------------------------------------------------------- |
| Munkatér         | Workspace        | Egy telepítés tanári adatai, tartalmai, tervei és eredményei.                       |
| Admin            | Admin            | Fiókokat, funkciókapcsolókat és munkatér-visszaállítást kezelő rögzített szerep.    |
| Tanári fiók      | Teacher account  | Bejelentkezett felhasználó, aki tartalmat tervez és tanulói munkát értékel.         |
| Szerep           | Role             | Rögzített jogosultsági csoport, például admin vagy tanár. Nem egyedi engedélylista. |
| Munkamenet       | Session          | A szerveren nyilvántartott bejelentkezés. A Kilépés érvényteleníti.                 |

## Szervezet és órarend

| Kifejezés                    | Angol/domain név             | Jelentés és különbség                                                                     |
| ---------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------- |
| Tantárgy                     | Subject                      | A tanítás tág területe, például matematika.                                               |
| Kurzus                       | Course                       | Egy konkrét tanítási keret: tantárgy, csoportok, tanulók, helyszín és időzóna kapcsolata. |
| Tanulói profil               | Learner Profile              | A tanuló megjelenített neve/álneve, jelvénye és tanári kontextusa.                        |
| Tanulócsoport                | Learner Group                | Tanévre vagy más szervezési egységre szóló csoport, például 8. a.                         |
| Beiratkozás                  | Enrollment                   | Időben érvényes kapcsolat egy tanuló és egy csoport között.                               |
| Névsor                       | Roster                       | Egy csoport vagy kurzus adott időpontra feloldott tanulói köre.                           |
| Kifejezett hozzáadás/kizárás | Explicit inclusion/exclusion | A csoport névsorától eltérő, kurzusszintű kivétel. Teljes szerkesztése még tervezett.     |
| Tanítási helyszín            | Teaching Location            | Terem vagy más hely, ahol a kurzus/óra zajlik.                                            |
| Órarendi bejegyzés           | Timetable entry              | Kurzus, hely és idő ismétlődő vagy konkrét kapcsolata.                                    |
| Felülírás                    | Override                     | Az alapértéktől eltérő beállítás egy konkrét órára vagy döntésre.                         |

## Könyvtár és tudáskapcsolatok

| Kifejezés      | Angol/domain név      | Jelentés                                                                                                 |
| -------------- | --------------------- | -------------------------------------------------------------------------------------------------------- |
| Könyvtár       | Library               | A kereshető tanári tartalomgyűjtemény.                                                                   |
| Csomópont      | Node                  | Közös technikai boríték a fogalmakhoz és tananyagforrásokhoz.                                            |
| Fogalom        | Concept               | Tanulási tartalom vagy képesség, amelyhez definíció, feladat és bizonyíték kapcsolható.                  |
| Tananyagforrás | Resource              | Markdown tananyag, külső hivatkozás vagy támogatott vizuális forrás.                                     |
| Gyűjtemény     | Collection            | Tartalmak kézi csoportosítása. A teljes szerkesztő még tervezett.                                        |
| Tulajdonos     | Owner                 | Jelzi, hogy egy tartalom csomaghoz vagy tanárhoz tartozik.                                               |
| Csomagtartalom | Package-owned content | Importált, eredeti formájában védett tartalom. Módosításhoz tanári másolat szükséges.                    |
| Tanári másolat | Teacher fork          | Csomagtartalomból létrehozott, önállóan módosítható változat. A teljes fork-munkafolyamat még tervezett. |

### Kapcsolatok

A **Kapcsolat (Relation)** két könyvtári elem közötti, típussal ellátott összeköttetés.

- **előfeltétele (requires):** a forráselem megértéséhez szükséges a célelem;
- **lefed (covers):** egy forrás érdemben foglalkozik a célfogalommal;
- **alternatívája (alternative-to):** hasonló tanulási célt más módon szolgál;
- **kiterjeszti (extends):** a forráselem továbbépíti a célelemet.

## Tartalomállapot és előzmények

| Kifejezés                                             | Jelentés                                                                              |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Piszkozat (draft)                                     | Módosítható, tanári munkaállapot; még nem használható minden kézbesítésben.           |
| Közzétett (published)                                 | Ellenőrzött, kiválasztható tartalom.                                                  |
| Archivált (archived)                                  | Új munkához nem ajánlott, de történeti hivatkozások miatt megőrzött tartalom.         |
| Revízió (revision)                                    | Közzétett tartalom számozott állapota. A teljes revíziókezelés még részben tervezett. |
| Rögzített revízió (pinned revision)                   | Egy terv által szándékosan választott pontos tartalomváltozat.                        |
| Megváltoztathatatlan pillanatkép (immutable snapshot) | A kézbesítéskor lemásolt tartalom, amelyet későbbi szerkesztés nem ír át.             |
| Egyidejűségi ütközés (optimistic conflict)            | Más mentett az általad megnyitott változat óta; újratöltés és összevetés szükséges.   |

## Gyakorlófeladatok

A **Gyakorlófeladat (Exercise)** újrahasznosítható feladat, nem azonos a **Kiosztással (Assignment)**. A kiosztás egy vagy több gyakorlófeladatot ad egy kurzusnak.

| Típus                                   | Mire való?                                         |
| --------------------------------------- | -------------------------------------------------- |
| Kifejtős / magyarázat (manual response) | Szabad válasz, tanári értékeléssel.                |
| Egyszeres választás (single choice)     | Legalább két lehetőség, pontosan egy helyes.       |
| Többszörös választás (multiple choice)  | Legalább két lehetőség, egy vagy több helyes.      |
| Igaz / hamis (boolean)                  | Egy állítás kanonikus igazságértékkel.             |
| Számérték (numeric)                     | Várt szám, tolerancia és opcionális mértékegység.  |
| Elfogadott szöveg (accepted text)       | Rövid válasz egy vagy több elfogadott változattal. |

- **Feladatszöveg (prompt):** amit a tanuló lát és megválaszol.
- **Megoldás/magyarázat (solution):** helyes megoldás vagy tanári magyarázat.
- **Válaszlehetőség (option):** stabil azonosítójú válasz egy választós feladatban.
- **Elfogadott válasz:** automatikusan helyesnek tekintett érték vagy szöveg.
- **Tolerancia:** a várt szám körül elfogadott abszolút eltérés.
- **Normalizálás:** pontos vagy szóköz-/kisbetű-tűrő szöveg-összehasonlítás.
- **Nehézség:** 1–5 közötti tanári becslés.
- **Várt idő:** a megoldás tervezett percei.
- **Értékelési szempont (rubric):** kifejtős válasz kézi értékelését segítő leírás.
- **Bizonyítékpolitika:** mennyi tanulási bizonyítékot őrizzen a munkafolyamat.

## Tervezés és tanítás

| Kifejezés                          | Jelentés                                                                    |
| ---------------------------------- | --------------------------------------------------------------------------- |
| Éves terv (Annual Plan)            | Kurzus tanévi tanulási szakaszai és lefedettsége.                           |
| Tanulási szakasz (Phase)           | Időben rendezett tervrész, fogalmakkal és órákkal.                          |
| Óraterv (Lesson)                   | Konkrét, sorrendbe állított tanári és tanulói tevékenységek.                |
| Óravázlat (Lesson Blueprint)       | Új órák alapértelmezett helyei és elvárásai; teljes szerkesztése tervezett. |
| Elrendezés (Lesson Layout)         | Megjelenési/nyomtatási szerkezet; teljes szerkesztése tervezett.            |
| Tevékenység/dia (Activity/slide)   | Az óra egy szerkeszthető lépése.                                            |
| Diagnosztika                       | Közzétételt blokkoló hiba vagy javítást javasló jelzés.                     |
| Előfeltétel                        | Olyan fogalom, amelyre egy másik tartalom épít.                             |
| Tanítási profil (Teaching Profile) | Pedagógiai alapbeállítások rétege; teljes szerkesztése tervezett.           |

## Bemutatás és élő óra

- **Bemutató mód (Presentation Mode):** tanári vezérlő az óra lejátszásához.
- **Kivetített nézet (projected view):** csak tanulóbiztos tartalom; nem mutat tanári jegyzetet vagy rejtett megoldást.
- **Órafuttatás (Lesson Run):** egy óraterv konkrét aktív, szüneteltetett vagy befejezett alkalma.
- **Szünet és kilépés:** megőrzi a folytatható állapotot.
- **Folytatás:** visszatér a szüneteltetett futtatáshoz.
- **Befejezés:** lezárja az alkalmat; nem azonos a kilépéssel.
- **Élő munkamenet (live session):** rövid kóddal elérhető tanulói válaszadás.
- **Csatlakozási kód:** az adott élő alkalom rövid kódja.
- **Résztvevő:** az adott élő alkalomhoz tartozó vendég vagy tanuló.
- **Felfedés (reveal):** tanári döntés az eredmény/megoldás láthatóvá tételéről.
- **Válaszállapot:** beérkezett válaszok száma és állapota.
- **Rangsor (leaderboard):** adatvédelmi szempontból biztonságos, opcionális összesítés.

## Kiosztás, beadás és bizonyíték

| Kifejezés                               | Jelentés                                                                                       |
| --------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Kiosztás (Assignment)                   | Gyakorlófeladatok célzott, határidős kiadása.                                                  |
| Tanulói piszkozat                       | Szerveren mentett, még be nem adott válasz.                                                    |
| Beadás (Submission)                     | Egy próbálkozás megváltoztathatatlan pillanatképe.                                             |
| Próbálkozás (attempt)                   | Beadás sorszámozott változata.                                                                 |
| Visszaküldött (returned)                | Javítást kérő tanári döntés.                                                                   |
| Újrabeadott (resubmitted)               | Visszaküldés után létrejött új próbálkozás.                                                    |
| Elfogadott (accepted)                   | Tanár által lezárt próbálkozás.                                                                |
| Visszajelzés kiadása                    | Szabály arról, mikor látható a tanári/automatikus visszajelzés.                                |
| Tanulási bizonyíték (Learning Evidence) | Megoldásból, javításból vagy megfigyelésből származó, forrással ellátott jel.                  |
| Bizonyosság (confidence)                | A tanuló saját magabiztossági jelzése.                                                         |
| Támaszhasználat (scaffold use)          | Segítség vagy lépésenkénti támasz használatának nyoma.                                         |
| Megállapítás (Finding)                  | Bizonyítékból származó, magyarázott tanári jelzés; nem ír át automatikusan jegyet vagy tervet. |
| Jegybejegyzés (Grade Entry)             | Hivatalos érték, forrással és rögzítési idővel.                                                |

## Felmérés

| Kifejezés                               | Jelentés                                                                               |
| --------------------------------------- | -------------------------------------------------------------------------------------- |
| Felmérési sablon (Assessment Blueprint) | Kurzushoz tartozó követelményhelyek és pontok.                                         |
| Követelményhely (slot)                  | Egy fogalomhoz és pontértékhez illesztendő feladat helye.                              |
| Forrásszűrő                             | Meghatározza, milyen tartalomból választhat a generálás; bővített változata tervezett. |
| Hiány (shortfall)                       | Nincs a feltételnek megfelelő közzétett feladat; a Fonat nem lazít csendben.           |
| A/B változat                            | Egyenértékű követelményhelyekből determinisztikusan összeállított változat.            |
| Kézbesítés (Delivery)                   | Egy tanuló stabil, megváltoztathatatlan felmérési példánya.                            |
| Automatikus értékelés                   | Támogatott feladattípusok szabályalapú ellenőrzése.                                    |
| Kézi felülbírálás                       | Tanári százalék, kötelező indokkal.                                                    |
| Újraértékelés (regrade)                 | Értékelési szabály változásának előnézete és alkalmazása; teljes felülete tervezett.   |

## Csomagok és opcionális funkciók

- **Tartalomcsomag (content package):** nem végrehajtható, sémával ellenőrzött oktatási tartalom.
- **Import/alkalmazás:** ellenőrzött csomag munkatérbe helyezése; teljes ZIP-folyamata tervezett.
- **Frissítés:** csomag új verziójának hatásvizsgálata és alkalmazása; részben tervezett.
- **Projekt (Project):** elkülönített, több kihívást összekapcsoló funkció.
- **Funkciókapcsoló (feature flag):** admin által kapcsolható képesség; kikapcsoláskor az adat megmarad.
