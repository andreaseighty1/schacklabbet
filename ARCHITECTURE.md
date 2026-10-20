# Arkitektur

## Implementerat

React 19, strikt TypeScript, Vite och vanlig CSS. Appen är statisk; ingen Node-server behövs i produktion. Sidor väljs med URL-fragment, exempelvis `#school`, för att undvika 404 vid omladdning på GitHub Pages.

- `src/App.tsx`: navigation, spel- och övningsflöden, inställningar och visning. `Modal` fångar tangentbordsfokus och återför det när dialogen stängs.
- `src/components/Board.tsx`: presentation och inmatning. Visar bara de destinationsrutor som regelmotorn levererar. Piltangenter flyttar fokus, Enter väljer. Drag och släpp använder samma anropsväg som klick.
- `src/components/Piece.tsx`: egna SVG-pjäser. Alla färger och typer har samma formgrammatik.
- `src/chess/model.ts`: centrala regeloperationer, korrekt avslutsorsak, UCI-validering, fångade pjäser, riskkontroll och PGN-resultat.
- `src/chess/engine.ts`: UCI, styrkeinställningar, kandidatval och worker-livscykel.
- `src/content.ts`: fyra lektioner och två mattproblem, med FEN, lösningsdrag, ledtråd och konkret återkoppling.
- `src/storage.ts`: versionskontroll och validering av lagrade data; idempotent bokföring av avslutade partier.
- `src/supabase.ts`: läser enbart offentliga Auth-inställningar på begäran. Ingen databas, autentisering eller multiplayerlogik finns ännu.

En enda chess.js-instans äger det aktiva partiets fullständiga historik. Alla drag, även motorns, valideras där. React renderar en ny revision efter en godkänd ändring. Vid granskning skapas en separat instans från historiken; granskningen ändrar inte partiet. UI-komponenter implementerar inte schackregler.

## Hot och pedagogisk precision

Hotmarkeringar bygger på motståndarens **lagliga slag**, inte bara geometriskt angripna rutor. För en hypotetisk motståndartur skapas en kopia av positionen med rätt tur; en passant-rätt tas bort om turen byts. Bundna pjäser får därmed inte skapa falska slaghot. En passant räknas på den fångade bondens ruta, som skiljer sig från slagrutan.

Modellen skiljer även ut geometriskt försvar via `isAttacked`. Det är inte en statisk bytesanalys och presenteras inte som att pjäsen är säker. UI säger bara att ett lagligt slag finns, och förklarar uttryckligen att detta inte innebär en säker förlust. Förhandsvarningen provar elevens drag i en kopia och kontrollerar lagliga omedelbara slag mot den flyttade pjäsen, inklusive en passant. Eleven kan fortsätta ändå.

Ledtråd 1 är generell, ledtråd 2 hänvisar till en konkret pjäs i aktuell ställning och ledtråd 3 frågar motorn. Ingen påhittad strategisk förklaring eller absolut bäst-drag-garanti ges.

## Motor

Stockfish.js **19.0.1**, `stockfish-19-lite-single.js` och motsvarande WASM. Varje sökning har en egen klassisk Worker och 16 MB hash. Den körs utan SharedArrayBuffer och kräver inte cross-origin isolation. Båda filerna ligger under samma `BASE_URL/engine/`. Bygget kopierar bara den lätta enkeltrådade varianten.

UCI-handshake: `uci` → `uciok` → styrkeinställningar → `isready` → `readyok` → `position fen` → `go`. Fel, timeout (15 sekunder), navigation, nytt parti och ångra avslutar worker. En FEN-kontroll och avbrytning förhindrar sena motorsvar från att ändra en annan position.

| Nivå      | Skill | Djupstak | Tidstak | MultiPV |
| --------- | ----: | -------: | ------: | ------: |
| Nybörjare |     0 |        3 |  180 ms |       5 |
| Lätt      |     2 |        5 |  240 ms |       3 |
| Medel     |     6 |        8 |  400 ms |       1 |
| Svår      |    12 |       11 |  650 ms |       1 |
| Expert    |    20 |       15 | 1000 ms |       1 |

Nybörjare väljer mellan analyserade kandidater inom 250 centipawn från förstavalet, Lätt inom 120. Mattprioritering bevaras. Denna avgränsning undviker kända mycket stora tapp bland kandidaterna, men en grund analys garanterar inte ett säkert drag. Nivåerna har olika parametrar; deras praktiska styrka är inte ELO-kalibrerad och behöver provas med målgruppen.

## Lokal datamodell

`schacklabbet.game.v1`: version, PGN med full historik, färg, nivå, profil, slutmarkering och slumpmässigt parti-ID. FEN ensam räcker inte eftersom upprepning, ångra och granskning behöver historik.

`schacklabbet.progress.v1`: slutförda övnings-ID:n, avslutade partier, vinster och bokförda parti-ID:n. Samma avslut räknas bara en gång, även vid omladdning och React Strict Mode. Ogiltig lokal data ger ett synligt meddelande. Nekad lagring ger en varning; partiet kan fortsätta i minnet.

Inga elevidentiteter lagras. Medaljer bygger bara på genomförda övningar och verkliga avslutsresultat. Att ge upp räknas som avslutat parti men aldrig som vinst.

## Planerad multiplayer och säkerhet

Ännu inte implementerat. Följande är designkrav för nästa etapp, inte befintliga säkerhetsgarantier:

- Anonym Supabase Auth, och spelaridentitet hämtad från verifierad JWT.
- `games`: servergenererad kryptografisk kod, deltagar-ID:n, serverägd PGN/FEN, version, status, tidsstämplar och slutorsak.
- Inga direkta klientskrivningar till auktoritativa spelfält. RLS tillåter bara deltagare att läsa ett privat parti.
- Edge Function validerar medlemskap, färg, tur, regelriktighet och avslutsstatus. Bara dragets från/till/förvandling accepteras från klienten.
- Atomisk versionskontroll i en databasfunktion förhindrar att samtidiga drag skriver över varandra. Full historik bevaras för upprepningsregeln.
- Realtime meddelar uppdateringar; den bestämmer inte vilka drag som är giltiga. Återanslutning läser senaste serverversionen.
- Kodförfrågningar begränsas och ger generiska fel; inga offentliga spellistor eller fri chatt.
- Avslutade eller övergivna partier städas efter högst 7 dagar, med en serverstyrd schemalagd rutin.
- Integrationsprov krävs med två användare, en utomstående, fel tur, olagligt drag, parallella anrop och avbruten anslutning.

Anslutningskontrollen verifierar bara API-adress, publishable-nyckel och om anonyma inloggningar är tillåtna. Den kan inte bekräfta GitHub-integration eller administrativa databasinställningar.
