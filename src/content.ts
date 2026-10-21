export interface Exercise {
  id: string;
  category: "school" | "challenge";
  title: string;
  tag: string;
  description: string;
  fen: string;
  solutions: string[];
  orientation?: "w" | "b";
  question?: {
    choices: { label: string; correct: boolean; feedback: string }[];
  };
  hint: string;
  success: string;
  tryAgain?: string;
}
const existingExercises: Exercise[] = [
  {
    id: "rook",
    category: "school",
    title: "Raka vägen med tornet",
    tag: "Pjäserna · 2 min",
    description:
      "Tornet går rakt, längs rader och linjer. Flytta tornet från a1 till a7 och ta den svarta bonden.",
    fen: "7k/p7/8/8/8/8/7K/R7 w - - 0 1",
    solutions: ["a1a7"],
    hint: "Tornet kan gå många rutor uppåt om vägen är fri.",
    success: "Precis! Tornet går rakt och kan ta en pjäs där det landar.",
  },
  {
    id: "bishop",
    category: "school",
    title: "Löparens diagonaler",
    tag: "Pjäserna · 2 min",
    description:
      "Löparen går snett. Det kallas diagonalt. Den stannar alltid på samma färg. Ta bonden på G5 med löparen.",
    fen: "7k/8/8/6p1/8/8/3B4/K7 w - - 0 1",
    solutions: ["d2g5"],
    hint: "Följ diagonalen från d2: e3, f4, g5.",
    success: "Snyggt! Löparen följde sin diagonal hela vägen till g5.",
  },
  {
    id: "knight",
    category: "school",
    title: "Springarens hemliga hopp",
    tag: "Pjäserna · 3 min",
    description:
      "Springaren går två rutor åt ett håll och en åt sidan. Den kan hoppa över andra pjäser. Ta bonden på f5.",
    fen: "7k/8/8/5p2/3N4/8/8/K7 w - - 0 1",
    solutions: ["d4f5"],
    hint: "Från d4: två rutor till höger och en ruta upp.",
    success: "Rätt! Springaren hoppade i ett L från d4 till f5.",
  },
  {
    id: "castle",
    category: "school",
    title: "Kungen i säkerhet",
    tag: "Reglerna · 3 min",
    description:
      "Rockad flyttar både kung och torn. Ingen av dem får ha flyttat. Rutorna mellan dem ska vara tomma. Kungen får inte stå i, passera eller landa i schack. Gör kort rockad: flytta kungen från E1 till G1.",
    fen: "4k3/8/8/8/8/8/8/4K2R w K - 0 1",
    solutions: ["e1g1"],
    hint: "Flytta kungen två rutor mot tornet. Tornet följer automatiskt med.",
    success:
      "Du gjorde rockad! Kungen står på g1 och tornet har flyttat till f1.",
  },
  {
    id: "mate-rook",
    category: "challenge",
    title: "Stäng den sista vägen",
    tag: "Matt i ett · Lätt",
    description:
      "Svarts kung står vid kanten. Nu är det vits tur. Hitta ett torndrag som ger schackmatt.",
    fen: "7k/5K2/8/8/8/8/8/R7 w - - 0 1",
    solutions: ["a1h1"],
    hint: "Din kung täcker g8 och g7. Ge schack längs h-linjen.",
    success:
      "Schackmatt! Tornet täcker h-linjen och din kung stänger flyktvägarna.",
  },
  {
    id: "mate-queen",
    category: "challenge",
    title: "Damens sista drag",
    tag: "Matt i ett · Lätt",
    description:
      "Damen och kungen kan samarbeta. Nu är det vits tur. Hitta ett drag som ger schackmatt.",
    fen: "7k/8/5KQ1/8/8/8/8/8 w - - 0 1",
    solutions: ["g6g7"],
    hint: "Ställ damen precis framför kungen. Din egen kung måste försvara henne.",
    success:
      "Matt! Damen på g7 täcker flyktrutorna och är försvarad av kungen på f6.",
  },
];

const pawnLessons: Exercise[] = [
  {
    id: "pawn-forward",
    category: "school",
    title: "Bonden går framåt",
    tag: "Bonden · 1 min",
    description:
      "En bonde går en ruta rakt fram till en tom ruta. Den kan inte gå bakåt. Här spelar du vit. Flytta bonden från D3 till D4.",
    fen: "7k/8/8/8/8/3P4/8/K7 w - - 0 1",
    solutions: ["d3d4"],
    hint: "Välj bonden på D3. Rutan D4 är precis framför den.",
    success:
      "Rätt! Bonden gick en ruta framåt. Den måste gå till en tom ruta när den går rakt fram.",
  },
  {
    id: "pawn-double",
    category: "school",
    title: "Bondens första dubbelsteg",
    tag: "Bonden · 1 min",
    description:
      "Från sin startruta får bonden välja mellan en och två rutor framåt. Båda rutorna måste vara tomma om den går två steg. Flytta bonden från D2 till D4.",
    fen: "7k/8/8/8/8/8/3P4/K7 w - - 0 1",
    solutions: ["d2d4"],
    hint: "D3 och D4 är tomma. Bonden står kvar på sin startruta D2.",
    success:
      "Två steg! Bonden får göra dubbelsteget från sin startruta. Den kan inte hoppa över en pjäs.",
  },
  {
    id: "pawn-capture",
    category: "school",
    title: "Bonden tar snett",
    tag: "Bonden · 2 min",
    description:
      "Bonden går rakt fram men tar en motståndarpjäs en ruta snett framåt. Bonden på D5 blockerar vägen rakt fram. Ta i stället bonden på E5 med din bonde på D4.",
    fen: "7k/8/8/3pp3/3P4/8/8/K7 w - - 0 1",
    solutions: ["d4e5"],
    hint: "E5 ligger en ruta snett framför D4. Där står en svart bonde som du får ta.",
    success:
      "Precis! Din bonde tog snett framåt. Den svarta bonden på D5 står kvar: en bonde kan inte ta rakt fram.",
  },
  {
    id: "pawn-black",
    category: "school",
    title: "Framåt för svart",
    tag: "Bonden · 1 min",
    orientation: "b",
    description:
      "Nu är det svarts tur och du spelar svart. Svarta bönder går mot rad 1. Brädet är vänt så att dina pjäser är närmast dig. Flytta bonden från D6 till D5.",
    fen: "7k/8/3p4/8/8/8/8/K7 b - - 0 1",
    solutions: ["d6d5"],
    hint: "För svart går radnumren nedåt: från rad 6 till rad 5. Välj D6 och sedan D5.",
    success:
      "Bra! Den svarta bonden gick framåt mot rad 1. Vita bönder går åt andra hållet, mot rad 8.",
  },
  {
    id: "pawn-promotion",
    category: "school",
    title: "Bonden blir en ny pjäs",
    tag: "Bonden · 2 min",
    description:
      "När bonden når sista raden ska den bytas till en dam, ett torn, en löpare eller en springare i samma färg. Det kallas förvandling. Flytta bonden från A7 till A8 och välj en ny pjäs.",
    fen: "7k/P7/8/8/8/8/5K2/8 w - - 0 1",
    solutions: ["a7a8q", "a7a8r", "a7a8b", "a7a8n"],
    hint: "A8 är sista raden för en vit bonde. Efter flytten får du välja vilken av de fyra pjäserna bonden ska bli.",
    success:
      "Du förvandlade bonden! Alla fyra valen är tillåtna. Du får välja en dam även om din första dam finns kvar på brädet.",
  },
];

const pieceLessons: Exercise[] = [
  {
    id: "queen",
    category: "school",
    title: "Damen går rakt och snett",
    tag: "Pjäserna · 2 min",
    description:
      "Damen kan gå rakt som ett torn och snett som en löpare. Den får gå flera rutor om vägen är fri, men inte hoppa över pjäser. Ta bonden på G5 med damen på D2.",
    fen: "7k/8/8/6p1/8/8/3Q4/K7 w - - 0 1",
    solutions: ["d2g5"],
    hint: "Följ den sneda vägen från D2: E3, F4, G5.",
    success:
      "Rätt! Damen tog bonden på G5. Den kan gå både rakt och snett, men får inte byta riktning mitt i draget.",
  },
  {
    id: "king",
    category: "school",
    title: "Kungen tar ett säkert steg",
    tag: "Pjäserna · 2 min",
    description:
      "Kungen går en ruta åt valfritt håll, men aldrig till en ruta som motståndaren hotar. Svarts torn hotar rutorna längs D-linjen. Flytta kungen från E1 till den säkra rutan E2. Kungarna får inte stå intill varandra.",
    fen: "3r3k/8/8/8/8/8/P7/4K3 w - - 0 1",
    solutions: ["e1e2"],
    hint: "E2 är en ruta framför kungen. D2 är hotad av tornet, så dit får kungen inte gå.",
    success:
      "Kungen står säkert på E2! Den måste alltid undvika hotade rutor. I schack tar man aldrig kungen: spelet slutar vid schackmatt.",
  },
];

const ruleLessons: Exercise[] = [
  {
    id: "check-escape",
    category: "school",
    title: "Schack: flytta kungen",
    tag: "Skydda kungen · 2 min",
    description:
      "Schack betyder att kungen är hotad. Då måste du skydda den direkt. Svarts torn på E8 hotar din kung på E1. Flytta kungen till F1, där tornet inte når den.",
    fen: "4r2k/8/8/8/8/8/P7/4K3 w - - 0 1",
    solutions: ["e1f1"],
    hint: "Tornet hotar E-linjen. F1 ligger bredvid kungen och utanför den linjen.",
    success:
      "Du kom ur schacken! Ett sätt är att flytta kungen till en säker ruta. Du får inte göra ett drag som lämnar din kung i schack.",
  },
  {
    id: "check-capture",
    category: "school",
    title: "Schack: ta den hotande pjäsen",
    tag: "Skydda kungen · 2 min",
    description:
      "Du kan ibland komma ur schack genom att ta pjäsen som hotar kungen. Svarts torn på E2 ger schack. Tornet är inte skyddat. Ta det med kungen på E1.",
    fen: "7k/8/8/8/8/8/4r3/R3K3 w - - 0 1",
    solutions: ["e1e2"],
    hint: "Kungen får ta en pjäs en ruta bort om rutan inte hotas av någon annan motståndarpjäs.",
    success:
      "Hotet är borta! Du tog tornet med kungen. Det gick eftersom ingen annan svart pjäs hotade rutan E2.",
  },
  {
    id: "check-block",
    category: "school",
    title: "Schack: ställ en pjäs emellan",
    tag: "Skydda kungen · 2 min",
    description:
      "Ibland kan en annan pjäs skydda kungen genom att ställa sig i vägen. Tornet på E8 ger schack längs E-linjen. Flytta löparen från C1 till E3 så att den stoppar tornets väg till kungen.",
    fen: "4r2k/8/8/8/8/8/8/2B1K3 w - - 0 1",
    solutions: ["c1e3"],
    hint: "Löparen går snett från C1 via D2 till E3. Då hamnar den mellan tornet och kungen.",
    success:
      "Löparen skyddar kungen! Mot schack kan du ibland flytta kungen, ta den hotande pjäsen eller ställa något emellan. En springares hopp går inte att stoppa genom att ställa en pjäs i vägen.",
  },
  {
    id: "checkmate",
    category: "school",
    title: "Vad betyder schackmatt?",
    tag: "Reglerna · 2 min",
    orientation: "b",
    description:
      "Nu är det svarts tur. Svarts kung på H8 är i schack. Den kan inte fly, ta damen eller få hjälp av en annan pjäs. Vad betyder det för partiet?",
    fen: "7k/6Q1/5K2/8/8/8/8/8 b - - 0 1",
    solutions: [],
    hint: "Damen ger schack och den vita kungen skyddar damen. Svart har inget lagligt drag som tar bort schacken.",
    success:
      "Det är schackmatt och vit vinner! Schackmatt betyder att kungen är i schack och att inget lagligt drag kan rädda den. Kungen står kvar på brädet.",
    question: {
      choices: [
        { label: "Schackmatt – vit vinner", correct: true, feedback: "" },
        {
          label: "Patt – det blir oavgjort",
          correct: false,
          feedback:
            "Vid patt är kungen inte i schack. Här hotar damen kungen på H8. Titta igen.",
        },
        {
          label: "Svart får hoppa över sin tur",
          correct: false,
          feedback:
            "Man får inte hoppa över sin tur. När kungen är i schack måste ett lagligt drag ta bort hotet.",
        },
      ],
    },
  },
  {
    id: "stalemate",
    category: "school",
    title: "Patt: ingen kan vinna",
    tag: "Reglerna · 2 min",
    orientation: "b",
    description:
      "Nu är det svarts tur. Kungen på H8 är inte i schack, men svart har inget lagligt drag. Vad händer med partiet?",
    fen: "7k/5Q2/5K2/8/8/8/8/8 b - - 0 1",
    solutions: [],
    hint: "Kungen står säkert på H8. Men G8, G7 och H7 är hotade, och svart har inga andra pjäser att flytta.",
    success:
      "Det är patt! Den som är på drag har inget lagligt drag och kungen är inte i schack. Partiet slutar remi, alltså oavgjort. Ingen vinner.",
    question: {
      choices: [
        {
          label: "Vit vinner för att svart inte kan flytta",
          correct: false,
          feedback:
            "För schackmatt måste kungen också vara i schack. Här hotas inte rutan H8.",
        },
        {
          label: "Svart måste flytta till en hotad ruta",
          correct: false,
          feedback:
            "Kungen får aldrig gå till en hotad ruta. När inget lagligt drag finns måste vi se om kungen är i schack.",
        },
        { label: "Patt – partiet blir oavgjort", correct: true, feedback: "" },
      ],
    },
  },
];

const extraLessons: Exercise[] = [
  {
    id: "en-passant",
    category: "school",
    title: "Extra: en passant",
    tag: "Extra regel · 3 min",
    description:
      "Svart har precis flyttat sin bonde två rutor, från D7 till D5, bredvid din bonde på E5. Just nu får du ta den som om den bara gått till D6. Flytta från E5 till D6. Det kallas en passant och måste göras direkt i nästa drag.",
    fen: "7k/8/8/3pP3/8/8/8/K7 w - d6 0 2",
    solutions: ["e5d6"],
    hint: "Din bonde landar på den tomma rutan D6. Den svarta bonden tas bort från D5.",
    success:
      "Du gjorde en passant! Din bonde står på D6 och bonden på D5 är borta. Om du väljer ett annat drag försvinner chansen att ta just den bonden på det här sättet.",
  },
];

export const tacticsLessons: Exercise[] = [
  {
    id: "spot-threat",
    category: "school",
    title: "Vem hotar damen?",
    tag: "Upptäck hot · 2 min",
    fen: "k7/8/2n5/4Q3/8/8/8/7K w - - 0 1",
    description:
      "Nu är det vits tur. Din dam står på E5. Vilken svart pjäs kan ta damen om du låter henne stå kvar? Välj ett svar under brädet.",
    solutions: [],
    hint: "Följ springarens hopp från C6: två rutor åt ett håll och en åt sidan. Kan den nå E5?",
    success:
      "Springaren på C6 hotar damen! Den kan hoppa till E5. Titta efter motståndarens hot innan du väljer ditt drag.",
    question: {
      choices: [
        { label: "Springaren på C6", correct: true, feedback: "" },
        {
          label: "Kungen på A8",
          correct: false,
          feedback:
            "Kungen går bara en ruta. A8 ligger för långt från E5. Titta på den andra svarta pjäsen.",
        },
        {
          label: "Ingen pjäs hotar damen",
          correct: false,
          feedback:
            "En springare kan hoppa över andra pjäser. Följ hoppet från C6 och undersök E5 igen.",
        },
      ],
    },
  },
  {
    id: "rescue-rook",
    category: "school",
    title: "Rädda tornet",
    tag: "Rädda en pjäs · 2 min",
    fen: "r6k/8/8/8/8/8/8/R6K w - - 0 1",
    description:
      "Svarts torn på A8 hotar ditt torn på A1. Rädda ditt torn så att svart inte kan ta det direkt efter ditt drag. Du kan flytta undan eller ta pjäsen som hotar. Det finns flera lösningar.",
    solutions: ["a1a8", "a1b1", "a1c1", "a1d1", "a1e1", "a1f1", "a1g1"],
    hint: "På A-linjen kan svarts torn fortfarande nå ditt torn. Undersök en annan linje, eller ta tornet på A8.",
    success:
      "Ditt torn kan inte tas direkt! Du kan rädda en pjäs genom att flytta undan eller ta pjäsen som hotar, om din egen pjäs står säkert efteråt.",
    tryAgain:
      "Svarts torn kan fortfarande ta ditt torn. Prova att flytta ditt torn åt sidan, eller ta tornet på A8.",
  },
  {
    id: "rescue-queen",
    category: "school",
    title: "Rädda damen",
    tag: "Rädda en pjäs · 2 min",
    fen: "k7/8/2n5/4Q3/8/8/8/7K w - - 0 1",
    description:
      "Springaren på C6 hotar din dam på E5. Flytta damen till en ruta där ingen svart pjäs kan ta henne direkt efteråt. Titta efter både springarens hopp och kungens närmaste rutor. Det finns flera lösningar.",
    solutions: [
      "e5d6",
      "e5c7",
      "e5e6",
      "e5e8",
      "e5f6",
      "e5g7",
      "e5h8",
      "e5f5",
      "e5g5",
      "e5h5",
      "e5f4",
      "e5g3",
      "e5h2",
      "e5e4",
      "e5e3",
      "e5e2",
      "e5e1",
      "e5c3",
      "e5b2",
      "e5a1",
      "e5d5",
      "e5c5",
      "e5b5",
    ],
    hint: "Damen kan till exempel flytta rakt nedåt längs E-linjen. Kontrollera om springaren eller kungen kan nå rutan du väljer.",
    success:
      "Damen kom undan hotet! Ingen svart pjäs kan ta henne direkt på den nya rutan. Efter en flytt behöver du undersöka hoten igen.",
    tryAgain:
      "Damen kan fortfarande tas direkt. Titta efter springarens hopp och rutorna intill den svarta kungen. Prova en annan ruta för damen.",
  },
  {
    id: "rescue-knight",
    category: "school",
    title: "Rädda svarts springare",
    tag: "Spela svart · 2 min",
    orientation: "b",
    fen: "7k/8/5n2/4P3/8/5K2/8/8 b - - 0 1",
    description:
      "Nu spelar du svart. Vits bonde på E5 hotar din springare på F6. Flytta springaren så att ingen vit pjäs kan ta den direkt efteråt. Se också upp för den vita kungen på F3. Det finns flera lösningar.",
    solutions: ["f6d7", "f6e8", "f6g8", "f6h7", "f6h5", "f6d5"],
    hint: "Springaren hoppar i ett L. E4 och G4 ligger intill vits kung. Undersök en annan landningsruta.",
    success:
      "Springaren står säkert efter hoppet! Bonden når den inte längre, och den står inte intill vits kung. Även när du spelar svart behöver du leta efter motståndarens hot.",
    tryAgain:
      "Springaren kan fortfarande tas. Den vita kungen hotar rutorna precis intill sig, och bonden tar snett framåt. Prova en annan ruta för springaren.",
  },
  {
    id: "safe-capture",
    category: "school",
    title: "Ta en pjäs – men se upp",
    tag: "Undersök ett slag · 2 min",
    fen: "6k1/7r/8/8/2p5/3B4/8/K7 w - - 0 1",
    description:
      "Din löpare på D3 kan ta bonden på C4 eller tornet på H7. Ta den pjäs som löparen kan ta utan att själv kunna tas direkt efteråt. Titta på svarts kung innan du väljer.",
    solutions: ["d3c4"],
    hint: "Kungen på G8 skyddar tornet på H7. Vem skyddar bonden på C4?",
    success:
      "Du tog bonden på C4! Ingen svart pjäs kan ta löparen direkt där. Tornet på H7 var skyddat av kungen. Undersök motståndarens svar innan du tar en pjäs.",
    tryAgain:
      "Uppgiften är att ta en pjäs och behålla löparen. Tornet på H7 skyddas av kungen. Prova att ta en annan pjäs.",
  },
];

export const exercises: Exercise[] = [
  ...pawnLessons,
  ...existingExercises.filter((e) =>
    ["rook", "bishop", "knight"].includes(e.id),
  ),
  ...pieceLessons,
  ...ruleLessons.slice(0, 3),
  existingExercises.find((e) => e.id === "castle")!,
  ...ruleLessons.slice(3),
  ...tacticsLessons,
  ...extraLessons,
  ...existingExercises.filter((e) => e.category === "challenge"),
];

export const schoolSections = [
  {
    title: "1. Lär känna bonden",
    description: "Fem små steg. Börja med att gå framåt.",
    ids: pawnLessons.map((e) => e.id),
  },
  {
    title: "2. Upptäck de andra pjäserna",
    description: "Rakt, snett eller ett hopp? Lär dig hur varje pjäs går.",
    ids: ["rook", "bishop", "knight", "queen", "king"],
  },
  {
    title: "3. Skydda kungen och förstå slutet",
    description: "Lär dig schack, rockad och skillnaden mellan matt och patt.",
    ids: [
      "check-escape",
      "check-capture",
      "check-block",
      "castle",
      "checkmate",
      "stalemate",
    ],
  },
  {
    title: "4. Upptäck hot och rädda pjäser",
    description:
      "Se vad motståndaren hotar. Undersök en säker flytt eller ett slag.",
    ids: tacticsLessons.map((e) => e.id),
  },
  {
    title: "5. En extra regel",
    description: "Ta den här när du känner dig trygg med bönderna.",
    ids: extraLessons.map((e) => e.id),
  },
];
