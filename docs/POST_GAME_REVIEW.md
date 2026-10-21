# Kort efteranalys

Efter ett avslutat parti kan eleven manuellt starta **Upptäck ett drag**. Högst de senaste åtta egna dragen granskas med Stockfish 19 lite single WASM, Expert-inställning (Skill 20, MultiPV 1, maximalt djup 15 och 1 000 ms per sökning). Varje icke-terminalt drag behöver två sökningar, en före och en efter. Datorns hastighet påverkar nått djup; 1 000 ms är en sökbudget, inte en utlovad total väntetid. Progress visar granskade egna drag. Inga externa analysanrop görs.

Samma EngineSession-protokoll används som för spelmotorn men i en separat session. Full draghistorik följer med för upprepning, rockad och en passant. Endast exakta poäng utan upperbound/lowerbound accepteras. PV-continuationen måste vara laglig i sin helhet och dess första drag måste matcha bestmove. Saknad giltig bedömning ger ett begripligt fel och möjlighet att försöka igen. Färdig, stoppad eller avmonterad analys släpper sin Worker. Sena svar kan inte ändra UI.

## Urval och begränsningar

Centipawn-bedömningar avser spelaren på drag. Därför är uppskattad förlust `före.cp + efter.cp`, eftersom motståndaren är på drag efter elevens drag. Två korta sökningar kan bedöma olika; detta är ett försiktigt urval av exempel, ingen fullständig facitbedömning.

- Båda sökningarna måste ha nått minst djup 8 för poängbaserad återkoppling.
- Ett drag med uppskattad förlust högst 40 cp kan väljas som positivt exempel. Faktisk schackmatt får alltid visas som positivt exempel.
- Högst ett förbättringstips visas: största uppskattade förlust minst 180 cp, före-bedömning strikt mellan −500 och +800 cp, och annat föreslaget drag än det spelade. Detta undviker fokus på redan kraftigt avgjorda ställningar.
- Mattavstånd omvandlas aldrig till cp. Remislut poängsätts inte som misstag. Därmed kan verkliga misstag eller bra drag saknas i denna korta genomgång.
- Cp är motorns positionsvärde, inte ett säkert antal förlorade pjäser/bönder. Vi visar inga exakthetstal, Elo, topplistepoäng eller påståenden om bevisat materialtapp. Motståndarens möjliga svar återges som ett verifierat lagligt drag.
- Om inget säkert exempel hittats framgår det. Avsaknad av tips betyder inte att alla drag var bäst.

## Prova förslaget

Övningsbrädet är en separat kopia av ställningen före elevens drag. Instruktionen är uttryckligen att prova datorns förslag, inklusive eventuellt förvandlingsval. Andra lagliga drag får neutral återkoppling, eftersom alla alternativ inte granskats. Eleven kan upprepa försöket. PGN, slutresultat, klocka, vunna partier och lektions-/passframsteg ändras inte. Rutnamn och lagliga hjälprutor fungerar som i lektionerna. Efteranalysen har textinstruktioner; inga ännu oinspelade ljud används.

Genomgången finns bara efter avslutat parti, även i tävlingsprofil. En färdig genomgång bevaras vid sidbyte under samma besök och knyts till partiets ID. Omladdning kräver en ny analys. Pågående analys avbryts fortfarande vid sidbyte. Automatisk helanalys ingår inte.

## Träningstips efter analysen

När ett förbättringsexempel finns kan en befintlig kort lektion föreslås. Orsaken är konkret och bygger på den verifierade ställningen: förvandling, föreslagen rockad, sättet att komma ur schack, möjlig motståndarcapture eller vilken pjäs som ingick i motorförslaget. Att ta schackaren verifieras mot ställningens verkliga angripare; ett kungsslag på en annan pjäs beskrivs som att flytta kungen. En passant använder bondens faktiska slagruta.

Förslaget är en tematisk repetition, inte en diagnos av elevens kunskaper eller ett påstående att en viss lektion ensam förklarar positionsförlusten. Utan förbättringsexempel ges inget personligt tips. Vi använder ingen historisk färdighetsprofil eller ny serverlagring. Eleven kan öppna lektionen, få samma skäl återgivet, göra uppgiften med befintlig röst och återvända till samma analys utan ny motorsökning. Öppnande räknas inte som lösning. Vanliga framstegsregler gäller efter faktisk lösning, även vid repetition av en redan avklarad lektion. Partiets PGN, resultat och klocka ändras inte.

## Inställningar

Färgvalet ligger under Inställningar i huvudmenyn. Sidan visar en förhandsvisning och samlar val för bräde/pjäser, rutnamn i partier respektive lektioner och röst. Inställningarna använder de befintliga lokala sparnycklarna. Rösten förblir av vid omladdning. Skaparnamnet ligger kvar i sidfoten.

## Pekskärm

Eleven kan trycka först på pjäsen och sedan på destinationen i parti, lektion och analys. Ingen hover eller dragning krävs. Musdragning och tangentbord fungerar fortsatt. `touch-action: manipulation` på rutorna tillåter panorering/nypzoom och minskar dubbeltryckszoom. `any-pointer: coarse` ger vanliga knappar/länkar i navigationen minst 44 × 44 px tryckyta även på hybriddatorer med både mus/styrplatta och pekskärm. Små mobilrutor följer brädets tillgängliga bredd. Playwright har en särskild elevdatorprofil med 1366 × 768 och pekskärm, utöver desktop och mobil. Fysisk kontroll på skolans egna enheter återstår.
