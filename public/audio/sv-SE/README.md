# Röstfiler för Schacklabbet

Lägg de färdiga MP3-filerna direkt i denna mapp. Exempel: `lesson-rook-intro.mp3`. Exakta filnamn och manus finns i `docs/audio/ROSTMANUS.md` i repositoryt. Börja med P1; P2 är nästa omgång och P3 avser ännu inte byggda funktioner.

Alla 25 P1-filer är inkopplade i ljudspelaren och ingår i webbplatsens bygge. Röst på/av, Lyssna, Stoppa och Lyssna igen styr en gemensam uppspelning utan överlappning. Rösten är av när sidan öppnas eller laddas om. Text och bräde fungerar även utan ljud. Pedagogisk lyssningsgranskning med målgruppen återstår; teknisk avkodning och uppspelning kontrolleras separat.

Manuset och språkstödet under `docs/audio/` är underlag för fortsatt arbete, inte kontrollerade transkriptioner av inspelningarna. Rutnamn skrivs med bokstav, exempelvis `F fyra` och `G fem`. Språket ska vara begripligt för elever i årskurs 4.

Använd inga hemliga ElevenLabs-nycklar i denna mapp eller i frontend. Spelaren ska använda färdiga lokala filer, inte anropa en rösttjänst med elevdata.
