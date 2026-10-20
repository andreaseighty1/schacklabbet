# Utvecklingsplan

## Levererat i första implementationen

- [x] React, TypeScript, Vite, ESLint, Prettier och tester.
- [x] Grafisk identitet, egen logotyp, favicon, SVG-pjäser och responsiv navigation.
- [x] Fullständig schackregelmotor, båda spelarfärgerna, förvandlingsval och korrekt slutorsak.
- [x] Fem parametriserade Stockfish-nivåer i lokal Worker med timeout och avbrytning.
- [x] Möjliga drag, lagliga hot, valfria förhandsvarningar och stegvisa ledtrådar.
- [x] Tre stödprofiler, ångra där det är tillåtet, vänd brädet och ge upp.
- [x] Lokal sparning, full historik, PGN och efterföljande genomspelning.
- [x] Draglista med utskrivna svenska pjäsnamn, från-/tillruta och orden schack/schackmatt. Standardnotation bevaras i PGN.
- [x] Fyra lektioner, två verifierade mattproblem och faktabaserade lokala framsteg.
- [x] Enkel träningsväg inför tävling: rockad, mattproblem, självständigt parti.
- [x] GitHub Actions för kontroller, Pages och valfri egen domän.
- [x] Supabase API och tillåten anonym registrering kontrollerade mot användarens projekt.

## Kvalitet före första publika godkännande

- [ ] Fullständig visuell QA i mobil och på elevdatorer. Publicerad startsida och spelrum har granskats visuellt på desktop efter att Pages-källan rättats.
- [x] Godkända Playwright-flöden för desktop och mobil med verklig browser-Worker i GitHub Actions den 20 oktober 2026.
- [ ] Kontrollera spelet med målgruppen och kalibrera de två lättaste nivåerna.
- [x] GitHub Pages-publicering, DNS, HTTPS och leverans av app-, Worker- och WASM-filer verifierade på subdomänen.

## Fas 2 – pedagogik

- [ ] Bonde, dam, kung, schack, patt, en passant och fler korta lektioner.
- [ ] Fler kuraterade uppgifter, alternativa korrekta lösningar och flerstegsproblem.
- [ ] Motorbaserad efteranalys med dokumenterade gränser för misstag och materialtapp.
- [ ] Personliga träningsförslag utifrån riktiga analysresultat.
- [ ] Sammanhållet 5–15-minuterspass med återkoppling och sparad passhistorik.
- [ ] Valfri schackklocka, verkliga tidsavslut och återställning.
- [x] Inspelningsmanus med exakta filnamn för de sex nuvarande övningarna och gemensamma spelhändelser.
- [x] Första omgångens 25 P1-filer levererade lokalt med rätt filnamn och innehåll större än noll byte.
- [ ] Lyssningsgranska P1-filerna och verifiera begriplighet, uttal och ljudnivå. P2 och P3 är senare omgångar.
- [x] Koppla lokal ljuduppspelning med Röst på/av, Lyssna, Stoppa och Lyssna igen. Av vid sidöppning och omladdning, ingen automatisk start och omedelbart stopp vid avstängning.
- [ ] Verifiera att tävlingsprofilen aldrig läser upp avstängda tips eller hotvarningar och att samtidiga repliker inte överlappar.

Klockförslag: utan klocka som standard, 15 minuter per spelare för lugn introduktion och 10 minuter per spelare för tävlingsträning. De publicerade Schackfyran-regler som kontrollerats är för 2025/26; riksfinalen använder 10 minuter per spelare. Lokala upplägg och kommande säsongsregler kontrolleras mot arrangörens aktuella inbjudan före tävling.

## Fas 3 – multiplayer

- [ ] Databasmigrationer, RLS-policyer och kort lagringstid.
- [ ] Anonym klientinloggning, privat kodlobby och säkert kodskydd.
- [ ] Servervaliderade drag och atomisk versionskontroll.
- [ ] Realtime, återanslutning, återupptagning och ge upp på servern.
- [ ] Tvåanvändartester, obehörighetstester och samtidighetsprov innan UI aktiveras.

### Förslag: privata topplistor

Användaren har önskat en topplista. Föreslagen utformning, ännu inte implementerad:

- Privat klass-/gruppkod och automatiska smeknamn; ingen offentlig lista över identifierbara elever.
- Två separata listor: en matchserie och veckans gemensamma schackutmaningar.
- Föreslaget poängsystem efter avstämning mot Schackfyran: 3 för vinst, 2 för remi och 1 för en spelad förlust. Ospelat parti ger 0. Det ersätter det tidigare egna förslaget 3/1/0 och följer de [publicerade reglerna för 2025/26](https://schack.se/wp-content/uploads/2025/09/Regler-for-Schackfyran-2025-26.pdf). Lika många schemalagda matcher per deltagare ger en rättvisare jämförelse än fria ommatcher.
- Utmaningar: samma uppgifter för alla, fast poäng per löst uppgift och poäng bara en gång. Hjälpmedel sänker inte poängen.
- Antal drag och betänketid får visas som statistik; de avgör inte huvudrankingen. Kortast parti är inte ett tillförlitligt mått på spelstyrka.
- Gruppens poäng börjar om varje vecka eller serie. Egna framsteg och personliga medaljer bevaras separat.
- Resultat, lösningar och poäng verifieras och räknas på servern; inga klientpåstådda vinster eller poäng accepteras. Bestäm regler för delad placering, lika antal matcher och missbruk innan lansering.
- Spar- och gallringsregler för gruppdata behöver beslutas tillsammans med resten av multiplayer-datamodellen.

## Fas 4 – vidare kvalitet

- [ ] Användartester med elever och lärare.
- [ ] Granskning av färgkontrast, skärmläsare och fullständig tangentbordshantering.
- [ ] Prestandaprov på enklare elevdatorer.
- [ ] Bestäm om stöd för flera lokala spelprofiler behövs på delade datorer.
