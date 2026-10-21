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

Genomgången finns bara efter avslutat parti, även i tävlingsprofil. Den sparas inte vid sidbyte/omladdning. Inga personliga träningsrekommendationer eller automatisk helanalys ingår ännu.

## Pekskärm

Eleven kan trycka först på pjäsen och sedan på destinationen i parti, lektion och analys. Ingen hover eller dragning krävs. Musdragning och tangentbord fungerar fortsatt. `touch-action: manipulation` på rutorna tillåter panorering/nypzoom och minskar dubbeltryckszoom. `any-pointer: coarse` ger vanliga knappar/länkar i navigationen minst 44 × 44 px tryckyta även på hybriddatorer med både mus/styrplatta och pekskärm. Små mobilrutor följer brädets tillgängliga bredd. Playwright har en särskild elevdatorprofil med 1366 × 768 och pekskärm, utöver desktop och mobil. Fysisk kontroll på skolans egna enheter återstår.
