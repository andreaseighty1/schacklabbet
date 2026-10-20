# Röstfiler för Schacklabbet

Lägg de färdiga MP3-filerna direkt i denna mapp. Exempel: `lesson-rook-intro.mp3`. Exakta filnamn och manus finns i `docs/audio/ROSTMANUS.md` i repositoryt. Börja med P1; P2 är nästa omgång och P3 avser ännu inte byggda funktioner.

Här finns ännu inga ljudfiler. Frontend har ännu ingen inkopplad ljudspelare. När filerna levererats kopplas de till rätt händelser och får tydliga kontroller för Röst på/av, Lyssna, Stoppa och Lyssna igen. Rösten är av från början. Text och bräde fortsätter fungera utan ljud.

Använd inga hemliga ElevenLabs-nycklar i denna mapp eller i frontend. Spelaren ska använda färdiga lokala filer, inte anropa en rösttjänst med elevdata.
