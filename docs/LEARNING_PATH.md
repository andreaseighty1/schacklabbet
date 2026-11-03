# Schackskolan: grunder och fördjupning

Utbyggnaden den 3 november 2026 ger 57 skollektioner och de två befintliga mattutmaningarna. De 35 nya lektionerna kompletterar den tidigare grundkursen med åtta grund- och matchlektioner samt 27 frivilliga fördjupningslektioner.

## Två lärvägar

**Grunderna (30 lektioner):** bönder, övriga pjäser, schack och kungens säkerhet, rockad åt båda håll, matt/patt, en passant, hot och säkra slag. Därefter mitten, utveckling, ungefärliga pjäsers värden, tankepaus, klocka, respekt vid brädet och remi. Katalogen föreslår nästa oavklarade lektion i den valda lärvägen. Eleven får alltid välja en annan.

**Nästa nivå (27 lektioner):** gafflar, bindning, spett, avdragsschack, ta bort försvararen, offer och matt i två. Italienskt parti, spanskt parti, damgambit och öppningsspel som svart. Skolmatt och dess försvar. Trappstegsmatt, kung och torn, kung och dam, opposition, fribonde och tornförvandling för att undvika patt. Operapartiet och det odödliga partiets kända avslutningar. Fyra avslutande uppgifter där eleven hittar idén själv.

Förkunskaper för Nästa nivå är rekommendationer, inga lås. Lärvägsvalet sparas för besöket i sessionStorage. Tidigare genomförda lektioner, spel och nybörjarpass bevaras. Inga elevkonton eller nya databastabeller behövs.

## Flerstegsövningar

`src/learning/curriculum.ts` innehåller redigerade instruktioner och lagliga schackföljder. De historiska startställningarna byggs från den faktiska dragföljden. Varje steg innehåller tillåtna egna drag, en ledtråd och vid behov ett motståndarsvar med förklaring. Den första lösningen finns även i det äldre Exercise-formatet för kompatibilitet.

`src/learning/session.ts` hanterar början, egna drag, väntan på svar och slutförande. Hela draghistoriken bevaras via PGN; enbart en ny FEN hade tappat den. Felaktiga försök påverkar inte ställningen. Motståndarsvar visas först när eleven trycker på knappen. Brädet är låst under väntan. Förvandlingsvalet valideras som del av draget.

Framsteg räknas efter sista egna draget eller rätt svar på en fråga, aldrig efter bara det första draget i en kombination. Starta om återställer det aktuella brädet, men tar inte bort tidigare framsteg. Pågående flerstegslektioner sparas inte mellan omladdningar; genomförda lektioner sparas som tidigare. Man kan öppna och göra om dem när som helst.

Följderna är pedagogiska exempel, inte ett fullständigt förgreningsträd. Detta framgår i övningen. Där texten hävdar att ett svar är tvingat kontrollerar tester alla lagliga svar. Öppningslektionerna förklarar att andra svar finns. De är ingen bedömning av elevens fria öppningsspel.

## Röst och språk

219 nya repliker i [FORTSATTNING-MANUS.md](audio/FORTSATTNING-MANUS.md), med exakt filnamn och en ren textfil per replik. Rutnamn skrivs F fyra och G fem i manus. Nya schackord förklaras direkt. Alla uppdrag, motståndarsvar och återkoppling finns i text.

`npm run prepare:voiceover` återskapar paketen. Bygg och dev förbereder även fortsättningspaketet. Bara faktiskt levererade, icke tomma MP3-filer aktiveras i `src/audio/learning-available.json`. Man kan leverera kapitelvis. Tills dess finns inga låtsasknappar som hämtar saknade inspelningar. De tidigare 79 ljudfilerna används oförändrat. Samma röst av/på, stopp, upprepning och spärr mot talade hjälpmedel i tävlingsläge gäller.

## Källor och kontroll

Texter och pedagogiska instruktioner är egna. Historiska drag och bakgrund har stämts av mot [operapartiet](https://www.chess.com/terms/opera-game-chess) och [det odödliga partiet](https://www.chess.com/terms/immortal-game-chess). Lektionerna länkar till respektive källa. Det senare använder den välkända avslutningen 22. Qf6+ Nxf6 23. Be7#; inte den felaktiga Nxf7 som förekommer i en annan artikel.

Vardagliga tävlingsvanor har kontrollerats mot [FIDE:s regler, särskilt artiklarna 4 och 6](https://handbook.fide.com/chapter/e012023). För grundträningen har vi även läst [Sveriges Schackförbunds publicerade regler för 2025/26](https://schack.se/schackfyran/regler-schackfyran/) och [regeldokumentet](https://schack.se/wp-content/uploads/2025/09/Regler-for-Schackfyran-2025-26.pdf). De anger 10 minuter per spelare i riksfinalen. Det är den publicerade säsong som kunnat verifieras här; aktuella lokala regler måste kontrolleras inför en faktisk tävling. Webbplatsens namn för detta är fortsatt Matchträning.

Enhetstester spelar alla lektionsföljder och undersöker även gaffelns båda hot, den bundna springarens lagliga drag, avdragets schack, försvaret mot skolmatt, mattavslut och skillnaden mellan patt med dam och fortsatt spel med torn. Webbläsartester provar felaktiga drag, väntan på svar, omstart, sista stegets framsteg, förvandling, båda färgerna, mästarpartier, tangentbordsflikar och små pekskärmslaptops.

Detta är en sammanhängande grundkurs med frivillig fördjupning, inte en fullständig schackencyklopedi eller en garanti för tävlingsresultat. Begriplighet och svårighetsgrad behöver fortfarande provas med riktiga elever. Nya inspelningar produceras av Andreas i ElevenLabs.
