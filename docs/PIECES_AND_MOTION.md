# Pjäser och rörelser

Skulpterade pjäser är förvalt. Inställningar → Pjäsernas utseende växlar mellan de nya bilderna och de tidigare tecknade SVG-pjäserna. Brädets färger väljs separat. De skulpterade pjäserna är elfenbensvita och valnötsbruna på båda brädena; de tecknade pjäsernas färger följer brädtemat.

Tolv separata bilder skapades med det inbyggda Imagegen-verktyget med det tidigare stilprovet som referens. De ligger i `public/pieces/sculpted-v1/`, med exempelvis `wk.png` för vit kung och `bn.png` för svart springare. Bilderna har transparent alfakanal och samma kvadratiska bildyta, gemensam baslinje och olika pjässtorlekar. Originalen har kopierats oförändrade från verktygets utdata. Hela uppsättningen är cirka 8,5 MB. Exakta promptar, referens och originalfilnamn finns i `PIECE_ASSETS.json`. Ingen separat bild-API-nyckel eller CLI användes.

Den gemensamma Piece-komponenten använder samma uppsättning i partier, lektioner, förhandsvisningar och val av ny pjäs vid bondeförvandling. Om en enskild bild misslyckas används en tecknad reserv utan att brädet eller spellogiken påverkas. Byggkontrollen verifierar alla tolv PNG-filer och oförändrade filer i publiceringspaketet.

Glidande förflyttningar är förval och kan stängas av i Inställningar. Valen sparas lokalt som `schacklabbet.visuals.v1`. Datorns `prefers-reduced-motion` har företräde och stänger av rörelser även om elevens sparade val är på.

Brädet visar först det bekräftade schacktillståndet. Ett dekorativt lager flyttar sedan den gamla pjäsbilden på 240 ms och släpper fram slutbilden när den landar. Lagret fångar inga klick och finns inte i tillgänglighetsträdet. Det ändrar inga drag, klockor, ledtrådar eller resultat. Rockad flyttar både kung och torn, bondeförvandling visar bonden under färden, och angränsande steg bakåt i en partigenomgång animeras också. Inläsning, större hopp i historiken, nytt parti, ändrad orientering och byte av pjästyp visas direkt. Snabbt inkommande drag eller aktiverad minskad rörelse avbryter föregående animation och återställer den dolda slutpjäsen. Avmontering städar bort alla överlägg.

Verifiering omfattar rena positionsprov för drag, slag, en passant, rockad, bondeförvandling och genomgång bakåt. Webbläsarprov kontrollerar riktiga animationslägen, lagrens klickgenomsläpp, slutpositioner, aktiv ändring av minskad rörelse, sparat avstängt val, saknad bild och nya drag i kompisparti. Skulpterade bilder och stilbyte provas separat från den befintliga SVG-palettkontrollen.
