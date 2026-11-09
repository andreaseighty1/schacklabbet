import { readFileSync, writeFileSync } from "node:fs";
import { Chess } from "chess.js";
import { format } from "prettier";
import { isGoal, uci } from "../src/daily/model.ts";

// Composed positions and our own explanations. No imported annotations.
const own = {
  kind: "authored",
  label: "Schacklabbets egen uppgift",
  license: "© 2026 42 Improbable Owls & Andreas Jonsson",
  credit: "42 Improbable Owls & Andreas Jonsson",
};
function position(pieces, turn = "w", rights = "-") {
  const board = new Chess();
  board.clear();
  for (const [square, code] of Object.entries(pieces))
    board.put({ color: code[0], type: code[1] }, square);
  const parts = board.fen().split(" ");
  parts[1] = turn;
  parts[2] = rights;
  return parts.join(" ");
}
function task(
  id,
  title,
  theme,
  pieces,
  goal,
  instruction,
  hints,
  success,
  takeaway,
  options = {},
) {
  return {
    id,
    revision: 1,
    title,
    theme,
    fen: position(pieces, options.turn, options.rights),
    goal,
    instruction,
    hints,
    success,
    takeaway,
    source: own,
    ...options,
  };
}
const main = [
  task(
    "roof",
    "Stäng sista raden",
    "Schackmatt",
    { a8: "bk", a6: "wk", h1: "wr" },
    { kind: "mate", ownMoves: 1 },
    "Gör schackmatt i ett drag.",
    [
      "Tornet kan stänga en hel rad.",
      "Din kung hjälper till med flyktrutorna.",
      "Leta efter ett tornschack på rad 8.",
    ],
    "Tornet ger schack längs rad 8. Din kung hindrar flykten till A7 och B7.",
    "Vid matt måste kungen både vara hotad och sakna ett lagligt sätt att komma undan.",
  ),
  task(
    "pawn-queen",
    "Liten pjäs, stort fynd",
    "Slå en pjäs",
    { a1: "wk", h8: "bk", e4: "wp", d5: "bq" },
    { kind: "capture", square: "d5", piece: "q" },
    "Ta svarts dam med bonden.",
    [
      "Bonden tar snett framåt.",
      "Titta på bonden på E4.",
      "Vilken pjäs står snett framför bonden?",
    ],
    "Bonden från E4 tar damen på D5!",
    "En bonde går rakt fram men tar en ruta snett framåt.",
  ),
  task(
    "knight-fork",
    "Två hot på en gång",
    "Gaffel",
    { a1: "wk", e8: "bk", e4: "wn", b7: "bq" },
    { kind: "fork", piece: "n", targets: ["e8", "b7"] },
    "Flytta springaren så att den hotar både kungen på E8 och damen på B7.",
    [
      "En springare kan hota två pjäser samtidigt. Det kallas gaffel.",
      "Springaren på E4 hoppar två rutor åt ett håll och en åt sidan.",
      "Prova att sikta på D6.",
    ],
    "Från D6 hotar springaren både E8 och B7. Kungen måste först komma undan schacken.",
    "Leta efter två hot som samma pjäs kan skapa.",
  ),
  task(
    "bishop-road",
    "Hela diagonalen",
    "Löparen",
    { a1: "wk", h7: "bk", g2: "wb", a8: "br" },
    { kind: "capture", square: "a8", piece: "r" },
    "Ta det svarta tornet med löparen.",
    [
      "Löparen följer diagonaler.",
      "Följ de ljusa rutorna från G2.",
      "Diagonalen går genom F3, E4, D5, C6 och B7.",
    ],
    "Löparen gick längs hela diagonalen till A8 och tog tornet.",
    "Titta längs hela diagonalen, även när målet är långt bort.",
  ),
  task(
    "king-safe",
    "Kungen behöver en utväg",
    "Ur schack",
    { e1: "wk", h8: "bk", e8: "br", a1: "wr" },
    { kind: "escape" },
    "Du är i schack. Flytta kungen till en säker ruta.",
    [
      "Tornet hotar din kung längs E-linjen.",
      "Kungen får gå en ruta, men aldrig till en hotad ruta.",
      "Undersök D1 och F1. Det finns fler rätta svar.",
    ],
    "Kungen lämnade tornets linje och står säkert.",
    "När kungen är i schack måste nästa drag ta bort hotet.",
  ),
  task(
    "castle-safe",
    "Två pjäser i ett drag",
    "Rockad",
    { e1: "wk", h1: "wr", e8: "bk" },
    { kind: "castle" },
    "Gör kort rockad. Välj kungen och flytta den två rutor åt höger.",
    [
      "Vid rockad flyttas både kung och torn.",
      "Inga pjäser får stå mellan kungen och tornet.",
      "Flytta kungen från E1 till G1.",
    ],
    "Kungen hamnade på G1 och tornet på F1.",
    "Rockad kräver bland annat att kung och torn inte har flyttats och att kungen inte går genom schack.",
    { rights: "K" },
  ),
  task(
    "promotion",
    "Bonden når fram",
    "Förvandling",
    { a1: "wk", h6: "bk", b7: "wp" },
    { kind: "promotion" },
    "Förvandla bonden till en pjäs som kan fortsätta partiet utan remi.",
    [
      "Bonden förvandlas när den når sista raden.",
      "Välj en pjäs som kan hjälpa kungen att sätta matt senare.",
      "Flytta B7 till B8 och välj dam eller torn.",
    ],
    "Din bonde blev en starkare pjäs!",
    "Du får välja dam, torn, löpare eller springare. Här skulle ensam löpare eller springare ge remi.",
  ),
  task(
    "pawn-diagonal",
    "Svarts bonde hittar rätt",
    "Bonden",
    { a1: "wk", h8: "bk", e5: "bp", d4: "wq" },
    { kind: "capture", square: "d4", piece: "q" },
    "Ta vits dam med den svarta bonden.",
    [
      "Svarta bönder går mot lägre radnummer.",
      "Bonden tar en ruta snett framåt.",
      "Bonden på E5 kan ta på D4.",
    ],
    "Svarts bonde tog damen på D4.",
    "Kontrollera åt vilket håll bönderna går när du byter färg.",
    { turn: "b" },
  ),
  task(
    "rook-capture",
    "Leta längs linjen",
    "Tornet",
    { a1: "wk", h8: "bk", c2: "wr", c7: "bq" },
    { kind: "capture", square: "c7", piece: "q" },
    "Ta den svarta damen med tornet.",
    [
      "Tornet går rakt längs linjer och rader.",
      "Det är fritt mellan C2 och C7.",
      "Följ C-linjen uppåt.",
    ],
    "Tornet hittade damen på samma linje.",
    "Kontrollera långa linjer innan du bestämmer dig.",
  ),
  task(
    "queen-diagonal",
    "Damens sneda väg",
    "Damen",
    { a1: "wk", h8: "bk", c2: "wq", g6: "br" },
    { kind: "capture", square: "g6", piece: "r" },
    "Ta det svarta tornet med damen.",
    [
      "Damen kan gå både rakt och diagonalt.",
      "D2 är inte på samma diagonal som tornet. Börja på C2.",
      "Följ C2–D3–E4–F5–G6.",
    ],
    "Damen tog tornet på G6 längs diagonalen.",
    "Damen förenar tornets raka vägar och löparens diagonaler.",
  ),
  task(
    "knight-jump",
    "Hoppa över kön",
    "Springaren",
    { a1: "wk", h8: "bk", d4: "wn", c5: "wp", d5: "wp", e5: "wp", f5: "bq" },
    { kind: "capture", square: "f5", piece: "q" },
    "Ta damen med springaren. Bönderna står i vägen för andra pjäser.",
    [
      "Springaren får hoppa över pjäser.",
      "Från D4 kan den nå F5.",
      "Två rutor åt höger och en uppåt.",
    ],
    "Springaren hoppade över till F5 och tog damen.",
    "Springaren är den enda pjäsen som kan hoppa över andra pjäser.",
  ),
  task(
    "black-safe",
    "Svarts kung i schack",
    "Ur schack",
    { a1: "wk", e8: "bk", e1: "wr", h8: "br" },
    { kind: "escape" },
    "Flytta svarts kung till en säker ruta.",
    [
      "Tornet hotar längs E-linjen.",
      "Kungen behöver lämna den linjen.",
      "Undersök D8 och F8. Flera svar fungerar.",
    ],
    "Kungen kom undan tornets schack.",
    "En kung får aldrig stå kvar i schack.",
    { turn: "b" },
  ),
  task(
    "bishop-black",
    "Svarts långa diagonal",
    "Löparen",
    { h1: "wk", a8: "bk", b7: "bb", g2: "wr" },
    { kind: "capture", square: "g2", piece: "r" },
    "Ta vits torn med den svarta löparen.",
    [
      "Löparen byter aldrig färg på rutorna.",
      "Följ diagonalen från B7.",
      "Vägen går via C6, D5, E4 och F3.",
    ],
    "Löparen tog tornet på G2.",
    "Titta också bakåt längs diagonalerna när du letar efter hot.",
    { turn: "b" },
  ),
  task(
    "rook-fork",
    "Tornet hotar åt två håll",
    "Gaffel",
    { h1: "wk", e8: "bk", h5: "wr", b5: "bq", f4: "wp" },
    { kind: "fork", piece: "r", targets: ["e8", "b5"] },
    "Flytta tornet så att det hotar både kungen på E8 och damen på B5.",
    [
      "Tornet kan hota längs en rad och en linje samtidigt.",
      "Tornet behöver stå på E-linjen.",
      "Undersök rutan E5.",
    ],
    "Tornet på E5 ger schack och hotar damen på B5. Bonden på F4 skyddar tornet.",
    "Leta efter en ruta där två linjer möts.",
  ),
  task(
    "en-passant",
    "Ta i förbifarten",
    "En passant",
    { a1: "wk", h8: "bk", e5: "wp", d5: "bp" },
    { kind: "capture", square: "d6", piece: "p" },
    "Svart har just flyttat bonden från D7 till D5. Ta den i förbifarten.",
    [
      "Det speciella slaget heter en passant.",
      "Din bonde står bredvid bonden som tog två steg.",
      "Flytta E5 till D6. Bonden på D5 tas bort.",
    ],
    "Bonden från E5 tog på D6. Bonden på D5 försvann.",
    "En passant får bara göras direkt efter motståndarens dubbelsteg.",
    { ep: "d6" },
  ),
  task(
    "queen-mate",
    "Damen och kungen samarbetar",
    "Schackmatt",
    { c7: "wk", a8: "bk", e1: "wq" },
    { kind: "mate", ownMoves: 1 },
    "Sätt matt i ett drag. Din kung hjälper till med flyktrutorna.",
    [
      "Kungen på C7 stänger rutorna B7 och B8.",
      "Damen kan stänga hela A-linjen.",
      "Undersök A1 eller A5. Båda kan fungera.",
    ],
    "Damen satte matt med hjälp av kungen!",
    "Damen kan stänga en hel linje medan kungen hindrar flykten åt sidan.",
  ),
  task(
    "underpromotion",
    "Alltid dam?",
    "Undvik patt",
    { c6: "wk", a7: "bk", c7: "wp" },
    { kind: "promotion" },
    "Förvandla bonden utan att partiet slutar i remi.",
    [
      "Patt är remi: kungen är inte i schack men inga lagliga drag finns.",
      "En dam skulle stänga för många rutor här.",
      "Prova ett torn när bonden når C8.",
    ],
    "Tornet lämnar ett lagligt drag åt svart. Med dam hade det blivit patt.",
    "Välj förvandlingspjäs efter ställningen. Dam är inte alltid rätt.",
  ),
  task(
    "black-knight",
    "Gaffeln från andra sidan",
    "Gaffel",
    { e1: "wk", h7: "bk", e5: "bn", b2: "wq" },
    { kind: "fork", piece: "n", targets: ["e1", "b2"] },
    "Flytta svarts springare så att den hotar kungen på E1 och damen på B2.",
    [
      "En gaffel skapar två hot samtidigt.",
      "Springaren kan hoppa till en ruta nära D-linjen.",
      "Undersök D3.",
    ],
    "Springaren på D3 ger schack och hotar damen på B2.",
    "Springarens hopp är lika användbara från båda sidor av brädet.",
    { turn: "b" },
  ),
];
const ep = main.find((p) => p.id === "en-passant");
ep.fen = ep.fen
  .split(" ")
  .map((x, i) => (i === 3 ? "d6" : x))
  .join(" ");
delete ep.ep;

const selected = JSON.parse(
  readFileSync("docs/daily/selected-lichess.json", "utf8"),
);
const crosscheck = JSON.parse(
  readFileSync("docs/daily/lichess-crosscheck.json", "utf8").replace(
    /^\uFEFF/,
    "",
  ),
);
for (const source of selected.selected) {
  const original = crosscheck.puzzles.find((p) => p.id === source.id);
  if (!original) throw new Error("Missing primary source");
  const game = new Chess();
  game.loadPgn(original.pgn);
  if (
    game.fen() !== source.fen ||
    original.solution.join(" ") !== source.answer ||
    game.history().length !== original.initialPly + 1
  )
    throw new Error("Source mismatch: " + source.id);
  source.gameUrl = original.gameUrl;
}
const real = selected.selected.map((p, i) => ({
  id: `lichess-${p.id}`,
  revision: 1,
  title: [
    "Stäng flyktvägen",
    "En dam hittar sista raden",
    "Två hotfulla torn",
    "Kungen vid kanten",
    "Tornet och kungen",
    "Sista raden avgör",
    "Tornets långa väg",
    "Bonden hann fram – men…",
    "Hitta mattlinjen",
    "Ett enda torn räcker",
  ][i],
  theme: "Från ett riktigt parti",
  fen: p.fen,
  goal: { kind: "mate", ownMoves: 1 },
  instruction: "Hitta schackmatt i ett drag.",
  hints: [
    "Leta efter schackar med ditt torn eller din dam.",
    "Vilka rutor kan kungen fly till? Ditt drag måste stänga dem.",
    "Titta på linjen eller raden vid kanten där kungen står.",
  ],
  success:
    "Schackmatt! Kungen är hotad och har inget lagligt sätt att komma undan.",
  takeaway: "Kontrollera både schacken och alla kungens flyktvägar.",
  mainline: [p.answer],
  source: {
    kind: "lichess",
    label: `Lichess – problem ${p.id}`,
    url: `https://lichess.org/training/${p.id}`,
    gameUrl: p.gameUrl,
    license: "CC0-1.0",
    credit: "Lichess öppna problemdatabas. Svensk förklaring: Schacklabbet.",
    story:
      "Ställningen kommer från ett riktigt nätparti. Vi har valt ut ett kort avslut att undersöka.",
    originalFen: p.originalFen,
    setupMove: p.setupMove,
  },
}));
const opera =
  "e4 e5 Nf3 d6 d4 Bg4 dxe5 Bxf3 Qxf3 dxe5 Bc4 Nf6 Qb3 Qe7 Nc3 c6 Bg5 b5 Nxb5 cxb5 Bxb5+ Nbd7 O-O-O Rd8 Rxd7 Rxd7 Rd1 Qe6 Bxd7+ Nxd7";
const immortal =
  "e4 e5 f4 exf4 Bc4 Qh4+ Kf1 b5 Bxb5 Nf6 Nf3 Qh6 d3 Nh5 Nh4 Qg5 Nf5 c6 g4 Nf6 Rg1 cxb5 h4 Qg6 h5 Qg5 Qf3 Ng8 Bxf4 Qf6 Nc3 Bc5 Nd5 Qxb2 Bd6 Bxg1 e5 Qxa1+ Ke2 Na6 Nxg7+ Kd8";
function historical(
  id,
  title,
  prefix,
  line,
  url,
  story,
  hints,
  success,
  takeaway,
) {
  const game = new Chess();
  for (const san of prefix.split(" ")) game.move(san);
  return {
    id,
    revision: 1,
    title,
    theme: "Mästarnas idéer",
    fen: game.fen(),
    goal: { kind: "mate", ownMoves: (line.length + 1) / 2 },
    instruction: `Gör schackmatt i ${line.length === 1 ? "ett drag" : "högst två av dina egna drag"}.`,
    mainline: line,
    hints,
    success,
    takeaway,
    source: {
      kind: "historical",
      label: title,
      url,
      license:
        "Historiska partifakta; svensk förklaring © 2026 42 Improbable Owls & Andreas Jonsson",
      credit: "Historiskt partiprotokoll. Förklaring: Schacklabbet.",
      story,
    },
  };
}
const operaUrl = "https://www.chess.com/terms/opera-game-chess";
const immortalUrl = "https://www.chess.com/terms/immortal-game-chess";
const historic = [
  historical(
    "opera-last",
    "Morphys sista tornschack",
    `${opera} Qb8+ Nxb8`,
    ["d1d8"],
    operaUrl,
    "Paris 1858: Paul Morphy spelade vit mot hertigen av Braunschweig och greve Isouard, som hjälptes åt med svart. Här börjar vi precis före det sista draget.",
    [
      "Tornet och löparen hjälper varandra.",
      "Löparen på G5 skyddar D8.",
      "Kan tornet nå D8?",
    ],
    "Tornet satte matt på D8! Löparen skyddar tornet.",
    "Pjäser som samarbetar kan bli starkare än många ensamma pjäser.",
  ),
  historical(
    "immortal-last",
    "Tre pjäser hjälps åt",
    `${immortal} Qf6+ Nxf6`,
    ["d6e7"],
    immortalUrl,
    "London 1851: Adolf Anderssen spelade vit mot Lionel Kieseritzky. Detta är sista ställningen före den berömda mattbilden i Det odödliga partiet.",
    [
      "Springarna stänger flera flyktrutor.",
      "Löparen kan ge schack längs en diagonal.",
      "Undersök E7 med löparen på D6.",
    ],
    "Löparen satte matt på E7 med hjälp av springarna!",
    "En bra mattplan kan behöva flera samarbetande pjäser.",
  ),
];
const extras = [
  historical(
    "opera-two",
    "Operapartiet: räkna ett steg till",
    opera,
    ["b3b8", "d7b8", "d1d8"],
    operaUrl,
    "I Morphys operaparti i Paris 1858 lockades springaren bort med ett damoffer. Vi visar den spelade fortsättningen när den passar dina drag. Andra korrekta mattlösningar godkänns också.",
    [
      "Vad hindrar tornet från att sätta matt på D8?",
      "Springaren på D7 behöver lockas bort.",
      "Damen kan ge schack på B8.",
    ],
    "Du hittade en mattplan! I partiet gick damen till B8, springaren tog på B8 och tornet satte matt på D8.",
    "Räkna också på motståndarens svar innan du offrar en pjäs.",
  ),
  historical(
    "immortal-two",
    "Det odödliga partiet: damoffret",
    immortal,
    ["f3f6", "g8f6", "d6e7"],
    immortalUrl,
    "Anderssen–Kieseritzky, London 1851. Den kända avslutningen innehåller ett damoffer och ett löparschack. Andra korrekta mattlösningar godkänns också.",
    [
      "Vilken pjäs hindrar löparen från att sätta matt på E7?",
      "Springaren på G8 kan lockas bort med schack.",
      "Undersök damens schack på F6.",
    ],
    "Du hittade en mattplan! I partiet gick damen till F6, springaren tog på F6 och löparen satte matt på E7.",
    "Ett offer fungerar först när hela fortsättningen håller.",
  ),
  task(
    "extra-black-castle",
    "Rockad från svarts sida",
    "Rockad",
    { e8: "bk", a8: "br", e1: "wk" },
    { kind: "castle" },
    "Gör lång rockad med svart.",
    [
      "Kungen går två rutor mot tornet.",
      "Tornet på A8 flyttar till D8.",
      "Flytta kungen från E8 till C8.",
    ],
    "Svarts kung gick till C8 och tornet till D8.",
    "Lång rockad har samma grundkrav som kort rockad.",
    { turn: "b", rights: "q" },
  ),
  task(
    "extra-black-promotion",
    "Svarts sista steg",
    "Förvandling",
    { h5: "wk", a6: "bk", g2: "bp" },
    { kind: "promotion" },
    "Förvandla svarts bonde utan att partiet slutar i remi.",
    [
      "Svart förvandlar på rad 1.",
      "En ensam löpare eller springare räcker inte till matt.",
      "Flytta G2 till G1 och välj dam eller torn.",
    ],
    "Bonden nådde sista raden och blev en ny pjäs.",
    "Svart och vit har samma fyra val vid förvandling.",
    { turn: "b" },
  ),
  task(
    "extra-bishop-fork",
    "Löparens två hot",
    "Gaffel",
    { a1: "wk", h8: "bk", f8: "wb", h6: "bq", h5: "wn" },
    { kind: "fork", piece: "b", targets: ["h8", "h6"] },
    "Flytta löparen så att den hotar både kungen på H8 och damen på H6.",
    [
      "Löparen kan hota åt två håll längs diagonaler.",
      "Leta efter mötet mellan kungens och damens diagonaler.",
      "Undersök G7.",
    ],
    "Löparen på G7 hotar både kungen och damen.",
    "Gafflar kan göras med fler pjäser än springaren.",
  ),
  task(
    "extra-king-capture",
    "Kungen kan också ta",
    "Ur schack",
    { e1: "wk", h8: "bk", e2: "br" },
    { kind: "capture", square: "e2", piece: "r" },
    "Du är i schack. Ta tornet med kungen om rutan är säker.",
    [
      "En kung får ta en oskyddad pjäs.",
      "Kontrollera om svart skyddar E2.",
      "Den svarta kungen är långt borta.",
    ],
    "Kungen tog det oskyddade tornet och kom ur schack.",
    "Ta bara med kungen om målrutan inte är hotad.",
  ),
  task(
    "extra-pawn-fork",
    "Den lilla gaffeln",
    "Gaffel",
    { a1: "wk", h8: "bk", d4: "wp", c4: "wp", c6: "br", e6: "bq" },
    { kind: "fork", piece: "p", targets: ["c6", "e6"] },
    "Flytta bonden så att den hotar både tornet på C6 och damen på E6.",
    [
      "Bonden hotar två diagonala rutor framför sig.",
      "Den behöver stå på samma rad strax under pjäserna.",
      "Undersök D5.",
    ],
    "Bonden på D5 hotar både C6 och E6.",
    "Även en bonde kan skapa en gaffel.",
  ),
  task(
    "extra-block",
    "Löparen skyddar kungen",
    "Slå bort schacken",
    { e1: "wk", h8: "bk", h5: "wb", e8: "br" },
    { kind: "capture", square: "e8", piece: "r" },
    "Du är i schack. Ta den pjäs som hotar kungen med din löpare.",
    [
      "Du behöver inte alltid flytta kungen för att komma ur schack.",
      "Följ diagonalen från H5.",
      "Löparen kan nå E8.",
    ],
    "Löparen tog tornet. Nu är din kung inte längre i schack.",
    "Schack kan stoppas genom att ta den hotande pjäsen.",
  ),
  task(
    "extra-knight-mate",
    "Springaren stänger dörren",
    "Schackmatt",
    { a1: "wk", h8: "bk", g8: "br", g7: "bp", h7: "bp", g5: "wn" },
    { kind: "mate", ownMoves: 1 },
    "Sätt matt med springaren i ett drag.",
    [
      "Svarts egna pjäser står i vägen för kungen.",
      "Springaren kan hoppa förbi skyddet.",
      "Undersök F7.",
    ],
    "Springaren gav matt medan svarts egna pjäser stängde flykten.",
    "En instängd kung kan vara sårbar för springarschack.",
  ),
  task(
    "extra-queen-fork",
    "Damens dubbla hot",
    "Gaffel",
    { a1: "wk", h8: "bk", d1: "wq", b7: "br" },
    { kind: "fork", piece: "q", targets: ["h8", "b7"] },
    "Flytta damen så att den hotar både kungen på H8 och tornet på B7.",
    [
      "Damen kombinerar raka vägar och diagonaler.",
      "Sök på diagonalen mot H8.",
      "Undersök H1.",
    ],
    "Damen hotar två pjäser samtidigt. Kungen behöver först svara på schacken.",
    "En gaffel med schack tvingar motståndaren att ta hand om kungen först.",
  ),
];
function compile(puzzle) {
  const game = new Chess(puzzle.fen),
    learner = game.turn();
  if (game.isGameOver()) throw new Error(`${puzzle.id}: terminal start`);
  const other = game.fen().split(" ");
  other[1] = learner === "w" ? "b" : "w";
  other[3] = "-";
  if (new Chess(other.join(" ")).isCheck())
    throw new Error(`${puzzle.id}: opponent already in check`);
  if (puzzle.goal.kind === "escape" && !game.isCheck())
    throw new Error(`${puzzle.id}: expected check`);
  if (puzzle.goal.kind !== "mate") {
    const moves = {};
    for (const move of game.moves({ verbose: true })) {
      game.move(move);
      if (isGoal(game, move, puzzle.goal)) moves[uci(move)] = { done: true };
      game.undo();
    }
    if (!Object.keys(moves).length)
      throw new Error(`${puzzle.id}: no solution`);
    return { ...puzzle, tree: { moves } };
  }
  const cache = new Map();
  function wins(remaining) {
    if (game.isCheckmate()) return game.turn() !== learner;
    if (game.isDraw() || remaining <= 0) return false;
    const key = game.fen() + "|" + remaining;
    if (cache.has(key)) return cache.get(key);
    const ours = game.turn() === learner;
    let result = !ours;
    // Checking moves first speeds the proof without excluding quiet moves.
    const moves = game
      .moves({ verbose: true })
      .sort((a, b) => Number(/[+#]/.test(b.san)) - Number(/[+#]/.test(a.san)));
    for (const move of moves) {
      game.move(move);
      const ok = wins(remaining - (ours ? 1 : 0));
      game.undo();
      if (ours ? ok : !ok) {
        result = ours;
        break;
      }
    }
    cache.set(key, result);
    return result;
  }
  function tree(remaining) {
    if (game.isCheckmate()) return { done: true };
    const ours = game.turn() === learner,
      moves = {};
    for (const move of game.moves({ verbose: true })) {
      game.move(move);
      const next = remaining - (ours ? 1 : 0);
      if (!ours || wins(next)) moves[uci(move)] = tree(next);
      game.undo();
    }
    return { moves };
  }
  if (!wins(puzzle.goal.ownMoves))
    throw new Error(`${puzzle.id}: no forced mate`);
  const result = { ...puzzle, tree: tree(puzzle.goal.ownMoves) };
  let node = result.tree;
  for (const move of puzzle.mainline ?? []) {
    node = node.moves?.[move];
    if (!node) throw new Error(`${puzzle.id}: recorded line invalid`);
  }
  return result;
}
const compiled = [...main, ...real, ...historic, ...extras].map((p) => {
  process.stdout.write(`Checking ${p.id}\n`);
  return compile(p);
});
const calendar = {};
// Fixed editorial order; extending the bank never reassigns a published date.
const order = [];
for (let i = 0; i < 10; i++) {
  order.push(main[i].id, real[i].id);
  if (main[i + 10]) order.push(main[i + 10].id);
  else order.push(historic[i - 8].id);
}
if (new Set(order).size !== 30) throw new Error("Expected 30 distinct days");
for (let i = 0; i < 30; i++)
  calendar[new Date(Date.UTC(2026, 10, 9 + i)).toISOString().slice(0, 10)] =
    order[i];
compiled.find((p) => p.id === "opera-last").extraId = "opera-two";
compiled.find((p) => p.id === "immortal-last").extraId = "immortal-two";
for (const [id, extraId] of [
  ["castle-safe", "extra-black-castle"],
  ["promotion", "extra-black-promotion"],
  ["bishop-road", "extra-bishop-fork"],
  ["king-safe", "extra-king-capture"],
  ["pawn-queen", "extra-pawn-fork"],
  ["black-safe", "extra-block"],
  ["roof", "extra-knight-mate"],
  ["queen-mate", "extra-queen-fork"],
])
  compiled.find((p) => p.id === id).extraId = extraId;
for (const [path, data] of [
  ["src/daily/catalog.v1.json", compiled],
  ["src/daily/calendar.v1.json", calendar],
]) {
  const value = await format(JSON.stringify(data), { parser: "json" });
  if (process.argv.includes("--check")) {
    if (readFileSync(path, "utf8") !== value)
      throw new Error(`Regenerate ${path}`);
  } else writeFileSync(path, value);
}
console.log("Verified 30 scheduled puzzles and 10 optional extras.");
