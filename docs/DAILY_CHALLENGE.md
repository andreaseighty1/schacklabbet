# Dagens utmaning – version 1

Under **Utmaningar** finns ett dagligt kort före de två tidigare mattproblemen. Ingen spelarklocka, hastighetspoäng, ny elevregistrering eller Supabase-ändring behövs. Uppgifterna har textinstruktioner. Röster kan läggas till med separat manus senare.

## Det första paketet

- 30 fasta kalenderdagar: **9 november–8 december 2026**. Alla med samma appversion och korrekt systemdatum får samma uppgift för den svenska kalenderdagen.
- 18 egna undervisningsställningar: pjäsrörelser och slag, gafflar, schackförsvar, rockad, en passant, förvandling, pattfällan och matt.
- 10 korta mattavslut från verkliga Lichess-partier, fem för vit och fem för svart. Vi har valt enkla ställningar med få pjäser. Problemrating används inte som elevbetyg.
- 2 historiska slutställningar: Morphys operaparti (Paris 1858) och Anderssen–Kieseritzky (London 1851).
- 10 frivilliga extrauppgifter. De två historiska extrauppgifterna börjar ett eget drag tidigare i respektive parti; de övriga är egna tematiska fördjupningar.

Kalendern finns i `src/daily/calendar.v1.json`. Publicerade datum flyttas inte när banken växer. Utanför paketets datum visas en deterministiskt vald uppgift som **Träningsfavorit i repris**. Fyll på banken och lägg till nya uttryckliga datum för nya dagsuppgifter. Detta är ingen obegränsad automatisk problemimport.

## Elevens flöde

Instruktionen säger ”Det är vits tur” eller ”Det är svarts tur”. Brädet vänds till elevens färg och använder samma pjäser, glidningar och valfria rutnamn som övriga appen. Klick, touch, drag och tangentbord fungerar via det gemensamma brädet. Stort bräde och kompakt datorvy behåller uppdrag och hjälp åtkomliga; mobilen använder vanlig vy.

Ett felaktigt försök lämnar ställningen kvar. Tre ledtrådar blir successivt tydligare, med ett konkret godkänt drag i sista ledtråden. I flerstegsuppgifterna visar eleven själv motståndarens svar. Lösningsträdet innehåller alla lagliga försvar, medan gränssnittet visar ett kontrollerat svar per försök, i första hand partiets spelade svar. Detta är inte en full variationsutforskare.

Efter avslut visas förklaring, ”Ta med dig”, uppgiftens källa och en läsbar svensk dragföljd. En analyserad fortsättning skiljs från berättelsen om de faktiskt spelade dragen. En extern källsida öppnas bara om eleven väljer länken. Inga problem eller motordata hämtas från Lichess under elevens träning.

Klarstatus skiljer mellan **Klar**, **Klar med hjälp** och **Lösningen visad**. Att visa lösningen ger ingen självständig klarstatus. Om eleven sedan löser uppgiften räknas den som klar med hjälp. Omstart behåller tidigare hjälp och framsteg. Ingen svit förloras när en dag hoppas över.

Ett öppet problem är bundet till sitt startdatum även över midnatt. Datumkortet uppdateras var 30:e sekund och när sidan återfår fokus. Tidigare ofärdiga försök kan återupptas från kortet. Sparningen är lokal under `schacklabbet.daily.v1`, med validerade datum, innehållsversioner, dragföljder och högst 120 uppgiftsförsök. Den delas inte mellan datorer och är inte en serververifierad topplista. Skadad eller blockerad lagring ger ett begripligt meddelande och hindrar inte träning.

## Källunderlag och rättigheter

Lichess problemexport har [CC0-licens](https://database.lichess.org/#puzzles). Bara faktiska ställningar, drag och problem-id har importerats. Svenska instruktioner och förklaringar är våra egna. Broadcasts och användarkommentarer har inte importerats.

Det begränsade urvalet hittades i en [PGN-omvandlad spegling av Lichess problemexport](https://raw.githubusercontent.com/pwenker/chessli2/main/puzzles/mateIn1.csv). Kopian och urvalsmetoden finns i `docs/daily/lichess-mate-in1-source.csv` och `scripts/select-daily-sources.mjs`; inga programdelar från speglingsprojektet används. `selected-lichess.json` anger ursprung, start-FEN före normalisering och motståndarens inledande drag. Det draget appliceras före elevens startställning.

Alla tio valda id:n korskontrollerades **9 november 2026** via Lichess publika API för kända problem-id:n. `lichess-crosscheck.json` bevarar fulla partiprotokoll, partilänkar, startply och lösningsdrag, utan spelarnamn. Återspelning av protokollen ger exakt samma start-FEN som urvalet. Underlaget behövs bara i utvecklingen.

Historiska ställningar rekonstrueras från de fullständiga dragen fram till uppgiften. Källor: [Operapartiet](https://www.chess.com/terms/opera-game-chess), [Det odödliga partiet](https://www.chess.com/terms/immortal-game-chess), samt [FIDE om Morphy och 1850-talet](https://his.fide.com/2026/07/08/milestones-of-1851-1860-the-first-international-tournament-and-the-meteoric-emergence-of-paul-morphy/). Ingen extern annotering, bild eller färdig förklaring har kopierats. Historiska dragfakta är åtskilda från våra egna texter.

## Verifiera och utöka

Redaktionskällan är `scripts/prepare-daily-content.mjs`. Lägg till ställning, exakt mål, tre ledtrådar, egen förklaring och dokumenterad källa. Lägg därefter in nya kalenderdatum utan att ändra publicerade poster. Ändras en publicerad uppgift materiellt ska dess revision ökas.

```sh
npm run prepare:daily
npm run check:daily
npm test
npm run build
```

Generatorn verifierar legala startställningar, alla mål och de historiska spelade lösningarna, och bevisar matt genom att undersöka alla lagliga svar. En uppgift med ”matt i ett drag” godkänner varje lagligt mattdrag. Matt i två kontrollerar alla försvar och alla vinnande elevdrag inom två egna drag. Övriga uppgifter använder ett uttryckligt delmål, exempelvis att hota två angivna pjäser; de hävdar inte att varje godkänt drag är motorns globalt bästa drag. Gaffelställningarna visar skydd när en dam annars skulle kunna ta angriparen.

`check:daily` körs före publicering och jämför de kontrollerade artefakterna med incheckad JSON. Enhetstester kontrollerar alla 40 ställningar och hela svarsträden, alternativ, hjälphantering, sparning och svensk kalender inklusive sommartidsbyten. Webbläsartester täcker elevflöden på desktop, mobil och touch. Klassrumsprov av språk, svårighet och variation återstår; byt inte ut granskning mot enbart motorutvärdering.
