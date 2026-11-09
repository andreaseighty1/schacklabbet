# Utvecklingsplan

## Aktuell todo – 9 november 2026

- [ ] Bygg Dagens utmaning under Utmaningar enligt [research och genomförandeplan](docs/DAILY_CHALLENGE_PLAN.md): granskad problembank, dagkalender, ledtrådar, alternativa lösningar och lokal klarstatus.
- [ ] Privat klass-/gruppfunktion med topplista, tydliga poängregler och serververifierade resultat. Förslaget nedan är ännu inte implementerat.
- [ ] Engelsk textversion som valbart språk. Tidigare önskemål; inte påbörjad. Röstfilerna översätts inte i detta förslag.
- [ ] De 219 manusreplikerna till fortsättningslektionerna behöver spelas in och levereras. Aktuell genererad ljudlista innehåller 0 av dessa; de tidigare 79 ljuden är inkopplade.
- [ ] Samlat klassrumsprov på skolnätet: samtidiga kompispartier/förstagångsinloggningar, enklare elevdatorer, upplevd nybörjarsvårighet och pedagogisk lyssningsgranskning. Fortsatt tillgänglighetsgranskning ingår i kvalitetsarbetet.
- [ ] Ta ställning till flera lokala elevprofiler om datorerna delas. Detta är ett senare behovsbeslut.

Senast klart: skulpterade pjäser, valbara glidningar, större datorbräde, tät draglogg, förenklad mobilvy och bekräftat byte från tidsatt datorparti till kompisparti. Kompispartiernas klockor/remianbud och daglig gallring av inaktiva anonyma konton är också implementerade. Senaste mobilpubliceringen passerade 279 enhets- och 214 webbläsartester. Researchplanen för dagsutmaningar är klar, men själva funktionen är inte byggd.

## Pedagogikutbyggnad 3 november 2026

- [x] 35 nya lektioner. Schackskolan har nu 57 lektioner: Grunderna 30 och Nästa nivå 27, plus två separata mattutmaningar.
- [x] Flerstegsövningar med val att visa motståndarens svar, omstart, stegvisa ledtrådar och slutförande först efter sista egna draget.
- [x] Öppningsprinciper och matchvanor; gaffel, bindning, spett, avdragsschack, försvarare, offer och matt i två.
- [x] Italienskt parti, spanskt parti, damgambit, öppningsspel för svart samt skolmatt och dess försvar.
- [x] Slutspel med två torn, kung/torn, kung/dam, opposition, fribonde och förvandling utan patt.
- [x] Källbelagda avslutningar från Morphys operaparti och det odödliga partiet, samt fyra uppgifter där eleven hittar idén själv.
- [x] 219 nya inspelningsmanus med filnamn, steg, svar och koordinater skrivna för ElevenLabs. Bara faktiskt levererade ljud aktiveras.
- [ ] Andreas producerar de nya inspelningarna. Lektionerna fungerar med text under tiden.
- [ ] Prova språk, tempo och svårighetsgrad med elever och på deras faktiska datorer.

Se [aktuell lärvägsöversikt](docs/LEARNING_PATH.md). Äldre milstolpar nedan beskriver vad som levererades vid respektive tillfälle.

## Levererat i första implementationen

- [x] React, TypeScript, Vite, ESLint, Prettier och tester.
- [x] Grafisk identitet, egen logotyp, favicon, SVG-pjäser och responsiv navigation.
- [x] Fullständig schackregelmotor, båda spelarfärgerna, förvandlingsval och korrekt slutorsak.
- [x] Fem parametriserade Stockfish-nivåer i lokal Worker med timeout och avbrytning.
- [x] Full motorhistorik, återanvändning mellan färdiga sökningar, säker omstart vid avbrott och rensning av analys vid nivåbyte.
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
- [x] Lokal teknisk motorgenomgång med upprepade WASM-sökningar, mätning av startkostnad och prov av alla fem nivåer. Elevdatorer och faktisk svårighetsgrad återstår.
- [x] GitHub Pages-publicering, DNS, HTTPS och leverans av app-, Worker- och WASM-filer verifierade på subdomänen.

## Fas 2 – pedagogik

- [x] 17 korta lektioner: bonden i fem steg, alla övriga pjäser, tre sätt att komma ur schack, rockad, matt, patt och en passant. Startregler och ordnad lärväg.
- [x] Fem nya övningar om hot, räddning och säkra slag, med samtliga korrekta alternativ i räddningsuppgifterna. Totalt 22 skollektioner och två mattutmaningar.
- [x] Flerstegsproblem med motståndarens svar och fler svårighetsgrader.
- [x] Kort motorbaserad efteranalys av högst åtta egna drag, ett positivt exempel och högst ett förbättringstips att prova på separat bräde. Gränser och begränsningar i docs/POST_GAME_REVIEW.md; ingen fullständig materialtappsanalys.
- [x] Ett relevant repetitionsförslag från efteranalysens granskade förbättringsexempel, med konkret orsak, lektionslänk och återgång till samma analys. Ingen långsiktig färdighetsprofil ännu.
- [x] Nybörjarpass med tre uppdrag, ungefär 10 minuter utan nedräkning, återkoppling, paus/återupptagning och sparad passhistorik.
- [x] Valfri schackklocka (utan tid, 15 eller 10 minuter var), tidsavslut, sparad tid och återställning. Materialbaserad remikontroll; fullständiga ställningsspecifika specialfall återstår, se docs/CLOCK.md.
- [x] Inspelningsmanus med exakta filnamn för de ursprungliga sex övningarna och gemensamma spelhändelser. Ytterligare 39 manus finns för de 13 nya grundlektionerna.
- [x] 79 ljudfiler levererade och inkopplade: 25 P1, 39 SKOLA och 15 TAKTIK.
- [x] Valfria rutnamn direkt på alla rutor, på som standard i lektioner med separat sparat val för partier.
- [ ] Lyssningsgranska P1-, SKOLA- och TAKTIK-filerna med målgruppen och verifiera begriplighet, uttal och ljudnivå. P2 och P3 är senare omgångar.
- [x] Koppla lokal ljuduppspelning med Röst på/av, Lyssna, Stoppa och Lyssna igen. Av vid sidöppning och omladdning, ingen automatisk start och omedelbart stopp vid avstängning.
- [x] Verifiera att tävlingsprofilen blockerar talade tips och hotvarningar även vid upprepning, och att tidigare uppspelning avbryts före nästa klipp. Enhetstester och webbläsartester godkända.

Implementerade klockval: utan klocka som standard, 15 minuter per spelare för lugn introduktion och 10 minuter per spelare för tävlingsträning. De publicerade Schackfyran-regler som kontrollerats är för 2025/26; riksfinalen använder 10 minuter per spelare. Lokala upplägg och kommande säsongsregler kontrolleras mot arrangörens aktuella inbjudan före tävling.

## Fas 3 – multiplayer

- [x] Databasmigrationer, RLS-policyer och 24 timmars giltighet med automatisk gallring.
- [x] Anonym klientinloggning, privat kodlobby och korta sexteckenskoder med skydd mot upprepade försök.
- [x] Servervaliderade drag och atomisk versionskontroll.
- [x] Realtime, återanslutning, återupptagning och ge upp på servern. Första versionen utan klocka.
- [x] Tvåanvändarprov mot riktig Supabase, obehörighetstester och samtidighetsprov. Se docs/MULTIPLAYER.md.
- [ ] Klassrumsprov med två elevdatorer och många samtidiga förstagångsinloggningar på skolans nätverk.
- [x] Remianbud, serverstyrda spelarklockor (5/10/15 minuter), gemensam maxtid och avslut i kompispartier.
- [ ] Eventuell närvaropuls eller tydligare närvarostatus för kompispartier. Återanslutning och nätverksfel hanteras redan.
- [x] Daglig gallringsrutin för inaktiva anonyma Auth-konton utan pågående giltigt parti, med ålders- och aktivitetsgräns samt batchbegränsning. Se docs/SECURITY.md.

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
