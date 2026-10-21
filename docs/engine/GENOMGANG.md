# Motorgenomgång – 20 oktober 2026

Schacklabbet använder oförändrad Stockfish.js 19.0.1 Lite single-threaded. Ändringarna gäller appens motorkoppling, inte Stockfishs binärer eller schackreglerna. Källkod och licens följer fortsatt med publiceringen.

## Åtgärder

- En lyckad sökning lämnar motorn redo för nästa drag. Nytt parti, avslutat parti och byte från spelrummet frigör den. Tillägg den 21 oktober: i ett parti på tid fortsätter motorn vid sidbyte så att datorns klocka inte förbrukas av navigationen. Avbrott, fel och timeout dödar alltid den berörda motorn; nästa försök får en ny instans. Gamla callbacks kan inte påverka nästa sökning.
- Startställning och hela draghistoriken skickas med UCI `position … moves …`. Det bevarar informationen om upprepade ställningar, även från sparad PGN och annan startställning. Detta följer [Stockfishs rekommendation för position-kommandot](https://official-stockfish.github.io/docs/stockfish-wiki/UCI-Protocol-and-Stockfish-Commands.html#position).
- Datorns drag och experttips delar en kanal. Nivåbyte rensar hashminnet så att djup ledtrådsanalys inte påverkar nybörjarmotorns nästa sökning. Sökminnet är fortfarande 16 MB; det är inte ett mått på hela processens minnesåtgång.
- Nybörjarval jämför bara en komplett kandidatgrupp från samma sökdjup. Halvfärdiga grupper, gränsvärden och ogiltiga drag används inte för jämförelsen. Om jämförbara kandidater saknas används motorns lagliga bestmove.

## Lokal mätning

En första mätning med den tidigare kopplingen gav 232–283 ms till redo och 249–299 ms till svar över sex nybörjarsökningar i Node på denna Windows-dator. Uppstarten dominerade tiden.

Ett reproducerbart prov av den nya sessionskoden jämför därefter en ny motor per sökning med en kvarvarande motor. Tre öppningsställningar analyseras två gånger vardera. Båda alternativen verifierar att svaren är lagliga.

| Mått                              | Ny motor varje sökning | Återanvänd motor |
| --------------------------------- | ---------------------: | ---------------: |
| Motorstarter för sex sökningar    |                      6 |                1 |
| Median för sökning 2–6            |                 264 ms |           6,6 ms |
| Första sökningen, inklusive start |               294,5 ms |         257,5 ms |

Rådata, miljö och nivåprov finns i [benchmark-node.json](benchmark-node.json). Kör om med `npm run benchmark:engine` i Node 24+. Mätningen omfattar inte webbläsarstart, nätverk, skolans datorer eller elevers upplevda väntetid. Senare sökningar kan även dra nytta av sparad analys. Talen är exempel från en lokal körning, inte generella prestandalöften.

## Nivågranskning

Alla fem nivåer gav lagliga svar i öppningsprovet. Ett separat prov med verklig WASM kontrollerar bland annat matt i ett på Nybörjare, Lätt och Expert, återanvändning efter experttips och omstart efter avbrott.

Nivåerna behåller sina tidigare gränser för skicklighet, sökdjup, söktid och kandidatvariation. Att en sökning svarar fortare säger inget om lämplig svårighetsgrad för en elev. Nivåerna har inga uppmätta Elo-värden. Före en pedagogisk omkalibrering behövs elevtester: kan en ny elev skapa hot, hinna se vad som hände, vinna ibland och förstå varför? Prov på enklare elevdatorer återstår också.

## Kontroller

Enhetstester täcker historik/upprepning, PGN-startställning/förvandling, lagliga resultat, kandidatgrupper, återanvändning, nivåbyte, överlappning, avbrott, sena callbacks, timeout, startfel och motorfel i vila. Webbläsartester kontrollerar den verkliga motorns antal starter, historikkommandon, experttips, sidbyte, nytt parti och ett avsiktligt försenat svar från ett avbrutet parti. Körresultat för CI och publicering dokumenteras i utvecklingsloggen.

[Actions-körning 39493724428](https://github.com/andreaseighty1/schacklabbet/actions/runs/39493724428) passerade med 77 enhetstester, verklig WASM-kontroll, 34 webbläsartester, bygge och publicering. Den byggda versionen verifierades därefter på den publika domänen.
