# Utvecklingsplan

## Levererat i första implementationen

- [x] React, TypeScript, Vite, ESLint, Prettier och tester.
- [x] Grafisk identitet, egen logotyp, favicon, SVG-pjäser och responsiv navigation.
- [x] Fullständig schackregelmotor, båda spelarfärgerna, förvandlingsval och korrekt slutorsak.
- [x] Fem parametriserade Stockfish-nivåer i lokal Worker med timeout och avbrytning.
- [x] Möjliga drag, lagliga hot, valfria förhandsvarningar och stegvisa ledtrådar.
- [x] Tre stödprofiler, ångra där det är tillåtet, vänd brädet och ge upp.
- [x] Lokal sparning, full historik, PGN och efterföljande genomspelning.
- [x] Fyra lektioner, två verifierade mattproblem och faktabaserade lokala framsteg.
- [x] Enkel träningsväg inför tävling: rockad, mattproblem, självständigt parti.
- [x] GitHub Actions för kontroller, Pages och valfri egen domän.
- [x] Supabase API och tillåten anonym registrering kontrollerade mot användarens projekt.

## Kvalitet före första publika godkännande

- [ ] Genomförd visuell QA i desktop och mobil; verktygspolicyn blockerade lokal browseråtkomst under utvecklingen.
- [ ] Godkända Playwright-flöden med verklig browser-Worker i GitHub Actions.
- [ ] Kontrollera spelet med målgruppen och kalibrera de två lättaste nivåerna.
- [ ] Slutligt verifierad GitHub Pages-publicering och DNS när subdomänen skapats.

## Fas 2 – pedagogik

- [ ] Bonde, dam, kung, schack, patt, en passant och fler korta lektioner.
- [ ] Fler kuraterade uppgifter, alternativa korrekta lösningar och flerstegsproblem.
- [ ] Motorbaserad efteranalys med dokumenterade gränser för misstag och materialtapp.
- [ ] Personliga träningsförslag utifrån riktiga analysresultat.
- [ ] Sammanhållet 5–15-minuterspass med återkoppling och sparad passhistorik.
- [ ] Valfri schackklocka, verkliga tidsavslut och återställning.

## Fas 3 – multiplayer

- [ ] Databasmigrationer, RLS-policyer och kort lagringstid.
- [ ] Anonym klientinloggning, privat kodlobby och säkert kodskydd.
- [ ] Servervaliderade drag och atomisk versionskontroll.
- [ ] Realtime, återanslutning, återupptagning och ge upp på servern.
- [ ] Tvåanvändartester, obehörighetstester och samtidighetsprov innan UI aktiveras.

## Fas 4 – vidare kvalitet

- [ ] Användartester med elever och lärare.
- [ ] Granskning av färgkontrast, skärmläsare och fullständig tangentbordshantering.
- [ ] Prestandaprov på enklare elevdatorer.
- [ ] Bestäm om stöd för flera lokala spelprofiler behövs på delade datorer.
