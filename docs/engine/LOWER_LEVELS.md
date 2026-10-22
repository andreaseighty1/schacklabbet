# Nybörjare och Lätt – kalibrering 22 oktober 2026

En spelare upplevde Lätt som för svårt och lämnade ett komplett parti på 43 drag. Alla 86 halvdrag är verifierade med chess.js och slutar i den rapporterade schackmatten. Partiet finns som regressionsexempel i `src/chess/fixtures/easy-feedback-game.ts`.

## Orsak och ändring

Tidigare använde Nybörjare Stockfish-djup 3 och fem kandidatdrag, Lätt djup 5 och tre kandidater. Urvalet tillät bara högst 250 respektive 120 centipawns skillnad mot förstavalet. Det gav liten möjlighet att missa motståndarens misstag.

Nu används:

| Nivå      | UCI-djupstak | Sökbudget | Kandidater   | Slumpningens temperatur | Högsta tillåtna poängskillnad |
| --------- | -----------: | --------: | ------------ | ----------------------: | ----------------------------: |
| Nybörjare |            1 |    300 ms | Alla lagliga |                     450 |                       1200 cp |
| Lätt      |            2 |    300 ms | Alla lagliga |                     180 |                        700 cp |

Drag med bättre bedömning får större sannolikhet genom vikten `exp((poäng − bästa poäng) / temperatur)`. Nybörjare har större spridning och kan göra större misstag. Båda nivåerna kan missa materialvinster och tillåta sämre drag. De gör fortfarande bara lagliga drag. Mattsvar prioriteras som tidigare.

Bedömningar jämförs bara när hela kandidatgruppen från ett och samma djup är färdig. Poängen sorteras före urvalet; en grund MultiPV-uppsättning kan rapportera poäng som inte följer slotarnas ordning. Ofullständiga grupper, gränsbedömningar och olagliga PV-drag används inte för jämförelsen. Om ingen komplett grupp hinner bli klar används ett slumpat lagligt drag, med direkt verifierad matt i ett som undantag. Det förhindrar att en långsam elevdator återgår till förstavalet och därmed spelar starkare.

Medel, Svår och Expert behåller sina tidigare parametrar och dragval. Expertledtrådar och efteranalys använder fortsatt den starka motorn. Stockfish-binärer, regelmotor, sparad PGN, resultat, framsteg och inställningarnas nivå-ID:n ändras inte. Även ett återupptaget parti på Lätt använder den nya dragväljaren efter att sidan laddats om.

## Prov med det rapporterade partiet

Kör `node scripts/calibrate-opponents.mjs`. Provet gör tolv riktiga WASM-sökningar: sex ställningar från partiet på var och en av de två lägsta nivåerna. För varje sökning jämförs tidigare och nytt urval med **samma** grundbedömningar, genom 1 000 fasta sannolikhetspunkter. Det isolerar urvalsregeln; det återskapar inte den gamla motorns djupare sökning och mäter inte partivinster eller Elo.

Den sparade körningen i [opponent-calibration.json](opponent-calibration.json) gav:

| Urval                               | Nybörjare, genomsnittlig skillnad mot bästa cp-poäng | Lätt, samma mått |
| ----------------------------------- | ---------------------------------------------------: | ---------------: |
| Tidigare regel på samma bedömningar |                                                52 cp |            21 cp |
| Ny regel                            |                                               206 cp |           107 cp |

En större skillnad betyder att urvalet tillåter fler och större fel enligt just denna grunda bedömning. I ställningen före svarts 19:e drag gav den tidigare Lätt-regeln ett enda val på provets underlag; den nya gav åtta. Resultaten visar att spelaren får fler chanser i de undersökta ställningarna. En elevs faktiska upplevelse behöver följas upp med nya partier.

Enhetstester täcker nivåordning, spridning, osorterade poäng, hela användarpartiet och en svag reservväg vid ofullständig analys. Verkliga WASM-prov kontrollerar laglighet, enkla mattar, historik, återanvändning och stark efteranalys. Playwright kontrollerar de två lägsta nivåernas faktiska Worker-kommandon och oförändrad sparning efter omladdning, utöver övriga spelflöden.
