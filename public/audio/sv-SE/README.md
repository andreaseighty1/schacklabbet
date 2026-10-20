# Röstfiler för Schacklabbet

Lägg de färdiga MP3-filerna direkt i denna mapp. Exempel: `lesson-rook-intro.mp3`. Exakta filnamn och manus finns i `docs/audio/ROSTMANUS.md` i repositoryt. Börja med P1; P2 är nästa omgång och P3 avser ännu inte byggda funktioner.

Alla 25 P1-filer har levererats lokalt med rätt filnamn och är inte tomma. Lyssningsgranskning och publicering återstår. Frontend har ännu ingen inkopplad ljudspelare. Filerna ska kopplas till rätt händelser med tydliga kontroller för Röst på/av, Lyssna, Stoppa och Lyssna igen. Rösten ska vara av från början. Text och bräde ska fortsätta fungera utan ljud.

Manuset och språkstödet under `docs/audio/` är underlag för fortsatt arbete, inte kontrollerade transkriptioner av inspelningarna. Rutnamn skrivs med bokstav, exempelvis `F fyra` och `G fem`. Språket ska vara begripligt för elever i årskurs 4.

Använd inga hemliga ElevenLabs-nycklar i denna mapp eller i frontend. Spelaren ska använda färdiga lokala filer, inte anropa en rösttjänst med elevdata.
