import { Chess } from "chess.js";
import type { Exercise } from "../content";

type AuthoredStep = {
  move: string;
  instruction: string;
  hint: string;
  reply?: string;
  response?: string;
};

/** SAN is used only by the author. Pupils see Swedish instructions and squares. */
function lesson(options: {
  id: string;
  title: string;
  group: string;
  description: string;
  success: string;
  takeaway: string;
  fen?: string;
  opening?: string[];
  orientation?: "w" | "b";
  source?: Exercise["source"];
  line: AuthoredStep[];
}): Exercise {
  const game = new Chess(options.fen);
  for (const move of options.opening ?? []) game.move(move);
  const fen = game.fen();
  const steps = options.line.map((step) => {
    const move = game.move(step.move);
    const solutions = [`${move.from}${move.to}${move.promotion ?? ""}`];
    const reply = step.reply ? game.move(step.reply) : undefined;
    return {
      instruction: step.instruction,
      hint: step.hint,
      solutions,
      reply: reply
        ? {
            move: `${reply.from}${reply.to}${reply.promotion ?? ""}`,
            explanation: step.response!,
          }
        : undefined,
    };
  });
  return {
    id: options.id,
    category: "school",
    title: options.title,
    tag: `${options.group} · ${steps.length > 5 ? "8" : steps.length > 2 ? "5" : "3"} min`,
    description: options.description,
    fen,
    steps,
    solutions: steps[0].solutions,
    hint: steps[0].hint,
    success: options.success,
    takeaway: options.takeaway,
    orientation: options.orientation,
    source: options.source,
  };
}

const foundation: Exercise[] = [
  lesson({
    id: "opening-centre",
    title: "Ta plats i mitten",
    group: "En bra start",
    description:
      "Mitten av brädet är D4, E4, D5 och E5. Pjäser som når mitten får ofta fler möjligheter. Här provar vi en vanlig start, inte det enda rätta sättet att spela.",
    takeaway: "Ta plats i mitten och låt fler pjäser hjälpa till.",
    success:
      "Bonden på E4 tar plats i mitten och springaren på F3 hotar E5. Två pjäser samarbetar redan!",
    line: [
      {
        move: "e4",
        instruction:
          "Flytta bonden från E2 till E4. Då öppnar du också vägen för löparen och damen.",
        hint: "Bonden står på sin startruta och får gå två steg.",
        reply: "e5",
        response:
          "Svart spelar bonden från E7 till E5 och tar också plats i mitten.",
      },
      {
        move: "Nf3",
        instruction:
          "Utveckla springaren från G1 till F3. Att utveckla betyder att få ut en pjäs så att den kan hjälpa till.",
        hint: "F3 är ett springarhopp från G1. Därifrån når springaren E5.",
      },
    ],
  }),
  lesson({
    id: "opening-develop",
    title: "Låt pjäserna komma med",
    group: "En bra start",
    opening: ["e4", "e5", "Nf3", "Nc6"],
    description:
      "Flytta gärna ut springare och löpare tidigt. Att flytta samma pjäs om och om igen kan ge motståndaren tid att få ut fler pjäser.",
    takeaway: "Utveckla flera pjäser, skydda mitten och förbered rockad.",
    success:
      "Nu har du fått ut både en löpare och två springare. Du är redo att undersöka om du kan göra rockad i ett senare drag.",
    line: [
      {
        move: "Bc4",
        instruction:
          "Flytta löparen från F1 till C4. Den får en fri diagonal och lämnar plats för rockad.",
        hint: "Följ F1, E2, D3, C4.",
        reply: "Bc5",
        response: "Svart utvecklar också sin löpare, från F8 till C5.",
      },
      {
        move: "Nc3",
        instruction:
          "Låt den andra springaren komma med. Flytta från B1 till C3.",
        hint: "Springaren på B1 kan hoppa till C3 och hjälpa till med mitten.",
      },
    ],
  }),
  lesson({
    id: "castle-long",
    title: "Rockad åt andra hållet",
    group: "Kungens säkerhet",
    fen: "4k3/8/8/8/8/8/8/R3K3 w Q - 0 1",
    description:
      "Du kan också göra lång rockad. Samma säkerhetsregler gäller som för kort rockad. Kungen och tornet får inte ha flyttat, vägen ska vara fri och kungen får inte stå i, passera eller landa i schack.",
    takeaway: "Vid lång rockad flyttar kungen två rutor mot A-tornet.",
    success:
      "Lång rockad! Kungen står på C1 och tornet på D1. Tornet flyttades automatiskt.",
    line: [
      {
        move: "O-O-O",
        instruction: "Gör lång rockad genom att flytta kungen från E1 till C1.",
        hint: "Du flyttar kungen. Tornet från A1 följer med till D1.",
      },
    ],
  }),
  lesson({
    id: "piece-values",
    title: "Är bytet värt det?",
    group: "Tänk före draget",
    fen: "7k/8/8/8/2r5/3B4/8/K7 w - - 0 1",
    description:
      "Som enkel hjälp räknar vi bonde 1, springare och löpare ungefär 3, torn 5 och dam 9. Värdena är ungefärliga. Kungens säkerhet och vad som händer efteråt är viktigare än att bara räkna.",
    takeaway: "Räkna vad du tar och vad du kan förlora efteråt.",
    success:
      "Du tog ett torn med löparen och ingen svart pjäs kan ta löparen direkt. Titta alltid efter motståndarens svar innan du väljer ett slag.",
    line: [
      {
        move: "Bxc4",
        instruction:
          "Ta tornet på C4 med löparen på D3. Kontrollera först om svart kan ta tillbaka.",
        hint: "Svarts kung på H8 är för långt bort för att ta löparen på C4.",
      },
    ],
  }),
  {
    id: "thinking-routine",
    category: "school",
    title: "Din tankepaus före draget",
    tag: "Matchvana · 2 min",
    fen: "4r2k/8/8/8/8/8/P7/4K3 w - - 0 1",
    solutions: [],
    description:
      "Du vill flytta bonden, men först tittar du på hela brädet. Vad behöver du ta hand om direkt här?",
    hint: "Följ svarts torn från E8 ned till E1. Vad står där?",
    success:
      "Skydda kungen först! Fråga sedan: Vad hotar motståndaren? Kan jag ge schack, ta något säkert eller skapa ett hot? Kontrollera till sist att din pjäs står säkert efter draget.",
    takeaway: "Schack först. Se hotet. Välj en idé. Kontrollera svaret.",
    question: {
      choices: [
        { label: "Min kung står i schack", correct: true, feedback: "" },
        {
          label: "Jag måste alltid flytta en bonde först",
          correct: false,
          feedback:
            "Det finns ingen sådan regel. Här hotar tornet din kung, så det måste du ordna först.",
        },
        {
          label: "Jag ska ta svarts kung",
          correct: false,
          feedback:
            "I schack tar man aldrig kungen. Din egen kung är hotad. Undersök E-linjen.",
        },
      ],
    },
  },
  {
    id: "match-clock",
    category: "school",
    title: "Spela lugnt med klocka",
    tag: "Matchvana · 2 min",
    fen: new Chess().fen(),
    solutions: [],
    description:
      "Spelarna har varsin tid. Din tid går när det är din tur. På ett riktigt bräde trycker du på klockan med samma hand som du flyttade med. I Schacklabbet växlar klockan automatiskt. Vad är en bra vana?",
    hint: "Klockan gör inte ett snabbt misstag bättre. Du behöver både tänka och hålla lite koll på tiden.",
    success:
      "Bra! Ta en kort tankepaus och titta på tiden ibland. Öva gärna med 10 minuter var när du känner dig redo. En tävlingsarrangör kan välja ett annat upplägg.",
    takeaway:
      "Tänk före draget. På riktigt bräde: flytta, släpp och tryck på klockan.",
    question: {
      choices: [
        {
          label: "Flytta direkt utan att se motståndarens hot",
          correct: false,
          feedback:
            "Då kan du missa ett hot. Du får använda din tid för att tänka.",
        },
        {
          label: "Tänka efter och titta på tiden ibland",
          correct: true,
          feedback: "",
        },
        {
          label: "Trycka på klockan innan jag har flyttat",
          correct: false,
          feedback:
            "Gör först ditt drag. Tryck sedan på klockan. I appen sköts det automatiskt.",
        },
      ],
    },
    source: {
      title: "FIDE:s schackregler, artikel 6",
      url: "https://handbook.fide.com/chapter/e012023",
    },
  },
  {
    id: "match-fair-play",
    category: "school",
    title: "En bra kompis vid brädet",
    tag: "Matchvana · 2 min",
    fen: new Chess().fen(),
    solutions: [],
    description:
      "Ni spelar på ett riktigt bräde. Du tror att ett drag inte var tillåtet, men ni är inte överens. Vad gör du?",
    hint: "En ledare eller domare kan hjälpa er att reda ut vad som hände.",
    success:
      "Be lugnt om hjälp och tacka efter partiet, oavsett resultat. På riktigt bräde gäller normalt rörd pjäs: rör du en egen pjäs för att flytta den måste du flytta den om det finns ett lagligt drag. I appens övningar får du välja en pjäs och sedan ändra dig.",
    takeaway: "Visa respekt. Fråga en ledare när ni är osäkra.",
    question: {
      choices: [
        {
          label: "Flytta tillbaka flera pjäser utan att fråga",
          correct: false,
          feedback:
            "Då blir det svårare att reda ut ställningen. Låt pjäserna stå och be om hjälp.",
        },
        {
          label: "Be en ledare eller domare om hjälp",
          correct: true,
          feedback: "",
        },
        {
          label: "Säga att jag vinner utan att fråga någon",
          correct: false,
          feedback: "Låt en ledare eller domare hjälpa er med reglerna.",
        },
      ],
    },
    source: {
      title: "FIDE:s schackregler, artikel 4 och 12",
      url: "https://handbook.fide.com/chapter/e012023",
    },
  },
  {
    id: "draw-agreement",
    category: "school",
    title: "Remi är också ett resultat",
    tag: "Matchvana · 2 min",
    fen: "7k/8/8/8/8/8/8/K7 w - - 0 1",
    solutions: [],
    description:
      "Bara kungarna finns kvar. De får aldrig stå intill varandra. Kan någon av spelarna sätta schackmatt?",
    hint: "En ensam kung kan inte ge schack utan att själv hamna på en otillåten ruta.",
    success:
      "Det blir remi, alltså oavgjort. Två ensamma kungar kan inte sätta matt. Remi kan också bli aktuellt vid patt, upprepning eller en överenskommelse om tävlingens regler tillåter det. I appen avgörs vissa remiorsaker automatiskt.",
    takeaway: "Att förstå när det är remi är en del av att kunna schack.",
    question: {
      choices: [
        { label: "Nej, partiet blir remi", correct: true, feedback: "" },
        {
          label: "Ja, kungen får ta den andra kungen",
          correct: false,
          feedback:
            "Kungen får aldrig flytta till en hotad ruta, och man tar aldrig motståndarens kung.",
        },
      ],
    },
  },
];

const tactics: Exercise[] = [
  lesson({
    id: "tactic-knight-fork",
    title: "Gaffel med springaren",
    group: "Smarta drag",
    fen: "4k3/1r6/8/8/4N3/8/8/6K1 w - - 0 1",
    description:
      "En gaffel hotar två pjäser samtidigt. Här kan springaren ge schack och samtidigt hota tornet. Kungen måste komma undan först.",
    takeaway: "Leta efter en ruta där springaren når två viktiga pjäser.",
    success:
      "Springaren hotade både kungen och tornet från D6. När kungen gick undan kunde du ta tornet. Det är en gaffel!",
    line: [
      {
        move: "Nd6+",
        instruction:
          "Hoppa från E4 till D6. Undersök vilka två svarta pjäser springaren hotar därifrån.",
        hint: "Från D6 når springaren både E8 och B7.",
        reply: "Kd7",
        response:
          "Svart flyttar kungen från E8 till D7 för att komma ur schacken. Vi provar det svaret här.",
      },
      {
        move: "Nxb7",
        instruction:
          "Nu är det vits tur igen. Ta tornet på B7 med springaren på D6.",
        hint: "Tornet är kvar på B7. Springaren kan nå dit i ett hopp.",
      },
    ],
  }),
  lesson({
    id: "tactic-pawn-fork",
    title: "En liten bonde med dubbla hot",
    group: "Smarta drag",
    fen: "7k/8/3n1b2/8/4P3/8/8/6K1 w - - 0 1",
    description:
      "Även en bonde kan göra en gaffel. Den hotar en ruta snett framåt åt varje håll. Här kan svart rädda en av två pjäser, men den andra blir kvar.",
    takeaway: "Små pjäser kan skapa stora hot.",
    success:
      "Bonden på E5 hotade både D6 och F6. När löparen gick undan tog du springaren. Kontrollera alltid båda rutorna som en bonde hotar.",
    line: [
      {
        move: "e5",
        instruction:
          "Flytta bonden från E4 till E5 och hota både springaren och löparen.",
        hint: "En vit bonde på E5 tar på D6 eller F6.",
        reply: "Bg7",
        response:
          "I vårt exempel räddar svart löparen genom att flytta från F6 till G7.",
      },
      {
        move: "exd6",
        instruction: "Ta den kvarvarande springaren på D6 med bonden på E5.",
        hint: "Bonden tar en ruta snett framåt.",
      },
    ],
  }),
  lesson({
    id: "tactic-pin",
    title: "Bindning: pjäsen måste skydda kungen",
    group: "Smarta drag",
    fen: "4k3/p2n4/8/8/8/8/8/3R1BK1 w - - 0 1",
    description:
      "En pjäs är bunden till kungen om den inte får flytta undan eftersom kungen då hamnar i schack. Här kan löparen binda springaren på D7.",
    takeaway:
      "Se om en pjäs står mellan din långskjutande pjäs och motståndarens kung.",
    success:
      "Springaren kunde inte lämna diagonalen: kungen stod bakom. Du tog springaren med löparen. Tornet på D1 skyddar din löpare på D7.",
    line: [
      {
        move: "Bb5",
        instruction:
          "Flytta löparen från F1 till B5. Följ diagonalen mot springaren på D7 och kungen på E8.",
        hint: "Från B5 går diagonalen via C6 och D7 till E8.",
        reply: "a6",
        response:
          "Svart flyttar bonden från A7 till A6 och hotar löparen. Springaren står fortfarande bunden på D7.",
      },
      {
        move: "Bxd7+",
        instruction:
          "Ta springaren på D7 med löparen på B5. Se hur ditt torn skyddar D7.",
        hint: "Löparen går via C6 till D7. Tornet på D1 försvarar löparen där.",
      },
    ],
  }),
  lesson({
    id: "tactic-skewer",
    title: "Spett: vad gömmer sig bakom kungen?",
    group: "Smarta drag",
    fen: "4q3/8/4k3/8/8/8/8/R5K1 w - - 0 1",
    description:
      "Ett spett hotar en viktig pjäs med en annan pjäs bakom. Här kan du ge schack med tornet. När kungen flyttar undan blir damen bakom synlig.",
    takeaway: "Titta längs hela linjen, även bakom den första pjäsen.",
    success:
      "Tornet gav schack längs E-linjen. När kungen gick åt sidan kunde du ta damen bakom. Det kallas ett spett.",
    line: [
      {
        move: "Re1+",
        instruction:
          "Flytta tornet från A1 till E1 och ge schack längs E-linjen.",
        hint: "Kungen på E6 och damen på E8 står på samma linje.",
        reply: "Kf6",
        response:
          "I det här exemplet flyttar kungen från E6 till F6. Nu är vägen till damen fri.",
      },
      {
        move: "Rxe8",
        instruction: "Ta damen på E8 med tornet på E1.",
        hint: "Tornet kan gå hela vägen upp när E-linjen är fri.",
      },
    ],
  }),
  lesson({
    id: "tactic-discovered",
    title: "Avdragsschack: öppna vägen",
    group: "Smarta drag",
    fen: "4k3/8/8/3q4/8/8/4B3/4R1K1 w - - 0 1",
    description:
      "Avdragsschack uppstår när du flyttar undan en pjäs och öppnar vägen för en annan pjäs som ger schack. Pjäsen du flyttar kan samtidigt skapa ett nytt hot.",
    takeaway: "Två pjäser kan skapa hot tillsammans i ett enda drag.",
    success:
      "Löparen öppnade E-linjen så att tornet gav schack. Samtidigt hotade löparen damen på D5. När kungen gick undan kunde du ta damen.",
    line: [
      {
        move: "Bc4+",
        instruction:
          "Flytta löparen från E2 till C4. Vilken av dina pjäser ger nu schack?",
        hint: "Tornet på E1 får en fri väg till kungen på E8.",
        reply: "Kf8",
        response:
          "Svart flyttar kungen från E8 till F8. Det är ett sätt att svara på schacken.",
      },
      {
        move: "Bxd5",
        instruction: "Ta damen på D5 med löparen på C4.",
        hint: "D5 ligger en ruta snett från C4.",
      },
    ],
  }),
  lesson({
    id: "tactic-defender",
    title: "Ta bort försvararen",
    group: "Kombinationer",
    fen: "3r4/2kq4/8/6B1/8/8/8/3R2K1 w - - 0 1",
    description:
      "Tornet på D8 försvarar damen på D7. Ibland är det smart att först ta bort den pjäs som försvarar en annan. Räkna alltid på motståndarens svar.",
    takeaway: "Fråga: Vem försvarar pjäsen jag vill ta?",
    success:
      "Löparen tog bort tornet som försvarade damen. I svaret vi provade gick kungen undan, och då kunde ditt torn ta damen. Om damen i stället hade tagit löparen på D8 kunde ditt torn ha tagit damen där.",
    line: [
      {
        move: "Bxd8+",
        instruction: "Ta tornet på D8 med löparen på G5. Det ger också schack.",
        hint: "Följ diagonalen G5, F6, E7, D8.",
        reply: "Kb7",
        response:
          "Här provar vi att svart flyttar kungen från C7 till B7. Tornet som skyddade damen är borta.",
      },
      {
        move: "Rxd7+",
        instruction: "Ta damen på D7 med tornet på D1.",
        hint: "D-linjen är fri fram till damen.",
      },
    ],
  }),
  lesson({
    id: "tactic-sacrifice",
    title: "Ett offer öppnar vägen",
    group: "Kombinationer",
    fen: "7k/5B2/5K2/8/4Q3/8/8/R7 w - - 0 1",
    description:
      "Ett offer betyder att du låter motståndaren ta en pjäs för att få något viktigare. Här kan damen locka ut kungen så att tornet ger matt. Offra inte utan att undersöka svaret!",
    takeaway:
      "Ett offer behöver en tydlig idé och noggrann kontroll av svaren.",
    success:
      "Du offrade damen, men fick schackmatt. Kungen på F6 täcker G6 och G7, löparen täcker G8 och tornet täcker H-linjen. Alla tre behövdes!",
    line: [
      {
        move: "Qh7+",
        instruction:
          "Flytta damen från E4 till H7 och ge schack. Undersök varför svart måste ta damen.",
        hint: "Damen ger schack längs H-linjen. G8 hotas av både damen och löparen.",
        reply: "Kxh7",
        response:
          "Svarts enda lagliga svar är att ta damen med kungen från H8 till H7.",
      },
      {
        move: "Rh1#",
        instruction: "Flytta tornet från A1 till H1 och ge schackmatt.",
        hint: "Tornet täcker H-linjen. Din kung och löpare täcker G6, G7 och G8.",
      },
    ],
  }),
  lesson({
    id: "tactic-mate-two",
    title: "Tänk två drag: stäng och sätt matt",
    group: "Räkna framåt",
    fen: "7k/8/5K2/8/8/8/8/R7 w - - 0 1",
    description:
      "Du gör ett drag, svart svarar, och sedan gör du ett drag till. Först stänger du kungens väg mot mitten. Sedan ger tornet schack från sidan.",
    takeaway: "Tänk på ditt drag, motståndarens svar och ditt nästa drag.",
    success:
      "Kungen på F7 stänger G8 och G7. Efter svarts enda drag till H7 ger tornet matt längs H-linjen. Du planerade två egna drag!",
    line: [
      {
        move: "Kf7",
        instruction:
          "Flytta kungen från F6 till F7 och stäng vägen mot G8 och G7.",
        hint: "Din kung ger inte schack. Svart måste ändå göra ett lagligt drag.",
        reply: "Kh7",
        response: "Svarts enda lagliga drag är kungen från H8 till H7.",
      },
      {
        move: "Rh1#",
        instruction: "Flytta tornet från A1 till H1 och ge schackmatt.",
        hint: "Din kung täcker G8, G7 och G6. Tornet täcker H-linjen.",
      },
    ],
  }),
];

const openings: Exercise[] = [
  lesson({
    id: "opening-italian",
    title: "Italienskt parti: ut med pjäserna",
    group: "Kända öppningar",
    description:
      "En öppning är början av ett parti. I italienskt parti får du ut springaren och löparen tidigt. Här visar vi en vanlig följd. Svart kan välja andra svar i ett riktigt parti.",
    takeaway: "Lär dig idén: mitten, utveckling och en trygg kung.",
    success:
      "Du spelade en start i italienskt parti. Bonden hjälper mitten, springaren hotar E5 och löparen blickar mot F7. Fortsätt utveckla och undersök när rockad passar.",
    line: [
      {
        move: "e4",
        instruction: "Börja med bonden från E2 till E4.",
        hint: "Öppna vägen för löparen på F1.",
        reply: "e5",
        response: "Svart svarar med bonden från E7 till E5.",
      },
      {
        move: "Nf3",
        instruction: "Flytta springaren från G1 till F3 och hota bonden på E5.",
        hint: "Utveckla en pjäs samtidigt som du skapar ett hot.",
        reply: "Nc6",
        response:
          "Svart utvecklar springaren från B8 till C6 och försvarar E5.",
      },
      {
        move: "Bc4",
        instruction:
          "Flytta löparen från F1 till C4. Nu har ni nått italienskt parti.",
        hint: "Löparen går via E2 och D3 till C4.",
      },
    ],
  }),
  lesson({
    id: "opening-spanish",
    title: "Spanskt parti: undersök försvararen",
    group: "Kända öppningar",
    opening: ["e4", "e5", "Nf3", "Nc6"],
    description:
      "Spanskt parti kallas också Ruy Lopez. Löparen går till B5 och hotar springaren som försvarar E5. Det betyder inte att du alltid ska ta springaren direkt.",
    takeaway: "Ett hot kan vara användbart även när du inte tar pjäsen direkt.",
    success:
      "Du provade en vanlig spansk uppställning. Löparen gick undan när bonden hotade den, och du fick kungen i säkerhet. Förstå planen innan du lär dig fler varianter.",
    line: [
      {
        move: "Bb5",
        instruction:
          "Flytta löparen från F1 till B5 och hota springaren på C6.",
        hint: "Diagonalen F1–B5 är fri efter att E-bonden har flyttat.",
        reply: "a6",
        response: "Svart flyttar bonden från A7 till A6 och hotar löparen.",
      },
      {
        move: "Ba4",
        instruction: "Behåll löparen genom att flytta från B5 till A4.",
        hint: "A4 ligger en ruta snett bakåt från B5.",
        reply: "Nf6",
        response: "Svart utvecklar springaren från G8 till F6 och hotar E4.",
      },
      {
        move: "O-O",
        instruction: "Gör kort rockad: flytta kungen från E1 till G1.",
        hint: "Löparen och springaren har lämnat vägen fri. Kontrollera att kungens väg är säker.",
      },
    ],
  }),
  lesson({
    id: "opening-queens-gambit",
    title: "Damgambit: utmana mitten",
    group: "Kända öppningar",
    description:
      "I en gambit erbjuder man en bonde för att få andra möjligheter. I damgambit utmanar C-bonden svarts bonde i mitten. Svart behöver inte ta den erbjudna bonden.",
    takeaway:
      "En öppning handlar om planer, inte om att motståndaren måste följa ditt manus.",
    success:
      "Du provade damgambit med ett svar där svart försvarar D5. C-bonden utmanar mitten och springaren på C3 hjälper till. Svart kan också välja att ta C-bonden i sitt andra drag.",
    line: [
      {
        move: "d4",
        instruction: "Flytta bonden från D2 till D4 och ta plats i mitten.",
        hint: "D-bonden får gå två steg från sin startruta.",
        reply: "d5",
        response: "Svart svarar med bonden från D7 till D5.",
      },
      {
        move: "c4",
        instruction: "Flytta bonden från C2 till C4. Den hotar bonden på D5.",
        hint: "En bonde på C4 kan ta på D5.",
        reply: "e6",
        response:
          "Här försvarar svart D5 med bonden från E7 till E6 i stället för att ta på C4.",
      },
      {
        move: "Nc3",
        instruction:
          "Utveckla springaren från B1 till C3 och hjälp till med mitten.",
        hint: "Springaren på C3 når D5 och E4.",
      },
    ],
  }),
  lesson({
    id: "opening-black",
    title: "En bra start när du spelar svart",
    group: "Kända öppningar",
    orientation: "b",
    opening: ["e4"],
    description:
      "Vit börjar, men svart kan också ta plats i mitten och utveckla sina pjäser. Här provar du samma lugna grundidéer från svarts sida.",
    takeaway: "Även svart behöver mitten, utveckling och en trygg kung.",
    success:
      "Du fick ut båda springarna. Brädet är vänt, men reglerna är samma. Nästa gång kan vit välja andra drag: kontrollera alltid de nya hoten.",
    line: [
      {
        move: "e5",
        instruction: "Svara med bonden från E7 till E5.",
        hint: "Svarta bönder går mot lägre radnummer.",
        reply: "Nf3",
        response:
          "Vit utvecklar springaren från G1 till F3 och hotar din bonde på E5.",
      },
      {
        move: "Nc6",
        instruction: "Flytta springaren från B8 till C6 och försvara E5.",
        hint: "Springaren på C6 skyddar bonden på E5.",
        reply: "Bc4",
        response: "Vit flyttar löparen från F1 till C4. Den riktar sig mot F7.",
      },
      {
        move: "Nf6",
        instruction:
          "Utveckla den andra springaren från G8 till F6. Nu hotar du E4.",
        hint: "F6 är ett springarhopp från G8.",
      },
    ],
  }),
];

const traps: Exercise[] = [
  lesson({
    id: "trap-scholars-mate",
    title: "Skolmatt: förstå hotet",
    group: "Fällor och försvar",
    opening: ["e4", "e5", "Bc4", "Nc6", "Qh5", "Nf6"],
    description:
      "Skolmatt är en tidig matt där dam och löpare samarbetar mot F7. Det fungerar bara om svart missar hotet. Vi lär oss mönstret för att kunna se och försvara oss mot det.",
    takeaway: "Damen och löparen kan samarbeta mot samma ruta.",
    success:
      "Damen på F7 ger matt och skyddas av löparen på C4. Svart kunde ha försvarat sig tidigare. Snabba mattfällor ersätter inte utveckling och kungens säkerhet.",
    line: [
      {
        move: "Qxf7#",
        instruction:
          "Ta bonden på F7 med damen på H5. Kontrollera varför kungen inte får ta damen.",
        hint: "Löparen på C4 skyddar F7 via D5 och E6.",
      },
    ],
  }),
  lesson({
    id: "trap-defend-scholars",
    title: "Stoppa skolmatt",
    group: "Fällor och försvar",
    orientation: "b",
    opening: ["e4", "e5", "Bc4", "Nc6", "Qh5"],
    description:
      "Du spelar svart. Vits dam och löpare hotar att ta F7 med matt. Din springare på C6 skyddar E5, så du kan nu jaga bort damen utan att förlora E-bonden direkt.",
    takeaway: "Se det konkreta hotet innan du utvecklar en ny pjäs.",
    success:
      "Bonden på G6 stoppade damens väg från H5. När damen flyttade till F3 fanns ett nytt hot mot F7. Springaren på F6 ställde sig i vägen. Kontrollera alltid hoten igen efter motståndarens svar.",
    line: [
      {
        move: "g6",
        instruction:
          "Flytta bonden från G7 till G6. Den stoppar damens diagonal och hotar damen på H5.",
        hint: "G6 ligger mellan H5 och F7.",
        reply: "Qf3",
        response:
          "Vit flyttar damen från H5 till F3. Nu hotar damen F7 längs F-linjen.",
      },
      {
        move: "Nf6",
        instruction:
          "Flytta springaren från G8 till F6 och ställ den i vägen för damen.",
        hint: "Springaren på F6 blockerar F-linjen mellan F3 och F7.",
      },
    ],
  }),
  lesson({
    id: "trap-back-rank",
    title: "Se upp för sista raden",
    group: "Fällor och försvar",
    fen: "6k1/5ppp/8/8/8/8/3R1PPP/3r2K1 w - - 0 1",
    description:
      "En kung bakom sina egna bönder kan sakna flyktrutor. Här hotar svarts torn din kung längs första raden. Börja med att rädda kungen, även om du gärna vill anfalla.",
    takeaway:
      "Kontrollera om din kung har en säker flyktruta och vilka linjer motståndaren når.",
    success:
      "Ditt torn tog den hotande pjäsen och tog bort schacken. Innan du anfaller behöver du undersöka hoten mot din egen sista rad.",
    line: [
      {
        move: "Rxd1",
        instruction:
          "Ta svarts torn på D1 med tornet på D2 och ta bort hotet längs första raden.",
        hint: "Svarts torn står en ruta under ditt torn. Du kan ta det direkt.",
      },
    ],
  }),
];

const endings: Exercise[] = [
  lesson({
    id: "ending-ladder",
    title: "Två torn bygger en stege",
    group: "Slutspel",
    fen: "7k/8/8/8/8/8/R7/1R4K1 w - - 0 1",
    description:
      "Två torn kan turas om att stänga rader för kungen. Det ena spärrar vägen medan det andra ger schack. Här provar vi slutet av en sådan trappstegsmatt.",
    takeaway: "Låt tornen arbeta på varsin rad och håll dem säkra från kungen.",
    success:
      "Tornet på A7 stängde sjunde raden. Det andra tornet gav schack på åttonde raden. Kungen hade ingen väg ut: matt!",
    line: [
      {
        move: "Ra7",
        instruction: "Flytta tornet från A2 till A7 och stäng sjunde raden.",
        hint: "Tornet på A7 spärrar alla rutor på rad 7.",
        reply: "Kg8",
        response:
          "Svart flyttar kungen från H8 till G8. Den kan inte gå ner till sjunde raden.",
      },
      {
        move: "Rb8#",
        instruction: "Flytta det andra tornet från B1 till B8 och ge matt.",
        hint: "Tornet på A7 stänger vägen nedåt. Tornet på B8 ger schack från sidan.",
      },
    ],
  }),
  lesson({
    id: "ending-rook-king",
    title: "Kung och torn samarbetar",
    group: "Slutspel",
    fen: "8/8/5k2/8/3K4/8/8/R7 w - - 0 1",
    description:
      "Tornet spärrar en rad och gör kungens område mindre. Din kung kommer närmare och hjälper till. Här provar vi en längre väg till matt; svart kan välja andra vägar i ett riktigt parti.",
    takeaway:
      "Spärra av, för fram kungen och minska området. Jaga inte bara med schackar.",
    success:
      "Tornet flyttade sin spärr från femte raden till kanten medan kungen kom närmare. Till slut stängde din kung flyktrutorna och tornet gav matt på åttonde raden.",
    line: [
      {
        move: "Ra5",
        instruction:
          "Flytta tornet från A1 till A5. Det stänger femte raden för svarts kung.",
        hint: "Håll tornet långt från motståndarens kung så att det inte kan tas.",
        reply: "Kg6",
        response:
          "Svart går från F6 till G6. Tornet hindrar kungen från att gå till rad 5.",
      },
      {
        move: "Ke5",
        instruction: "Flytta kungen från D4 till E5. Kungen ska hjälpa tornet.",
        hint: "E5 är säkert. Kungarna står inte intill varandra.",
        reply: "Kf7",
        response: "Svart går från G6 till F7.",
      },
      {
        move: "Ra6",
        instruction:
          "Flytta tornet från A5 till A6 och gör området mindre igen.",
        hint: "Nu spärrar tornet sjätte raden.",
        reply: "Kg7",
        response:
          "Svart går från F7 till G7 och är kvar ovanför tornets spärr.",
      },
      {
        move: "Kf5",
        instruction: "Flytta kungen från E5 till F5 och kom närmare.",
        hint: "F5 ligger två rader från svarts kung på G7 och är säkert.",
        reply: "Kh7",
        response: "Svart går från G7 till H7.",
      },
      {
        move: "Kf6",
        instruction:
          "Flytta kungen från F5 till F6. Den är nu redo att stänga vägen ned från kanten.",
        hint: "Kungen på F6 täcker E7, F7 och G7.",
        reply: "Kg8",
        response: "Svart går från H7 till G8.",
      },
      {
        move: "Ra7",
        instruction: "Flytta tornet från A6 till A7 och spärra sjunde raden.",
        hint: "Svart får nu hålla sig på åttonde raden.",
        reply: "Kf8",
        response: "I exemplet går svart från G8 till F8, mitt emot din kung.",
      },
      {
        move: "Ra8#",
        instruction: "Flytta tornet från A7 till A8 och ge schackmatt.",
        hint: "Tornet täcker åttonde raden och din kung täcker E7, F7 och G7.",
      },
    ],
  }),
  lesson({
    id: "ending-queen-king",
    title: "Dam och kung: undvik patt",
    group: "Slutspel",
    fen: "7k/8/8/8/1Q2K3/8/8/8 w - - 0 1",
    description:
      "Damen kan spärra kungens väg medan din egen kung kommer närmare. Lämna motståndaren ett lagligt drag tills du är redo att ge matt. Annars kan det bli patt.",
    takeaway:
      "Stäng vägen, hjälp till med kungen och kontrollera att det inte blir patt.",
    success:
      "Damen höll kungen vid kanten medan din kung kom närmare. Sedan kunde damen ge matt på G7, skyddad av kungen. En dam på F7 i sista steget hade i stället gjort det till patt.",
    line: [
      {
        move: "Qe7",
        instruction:
          "Flytta damen från B4 till E7. Den spärrar sjunde raden men lämnar svart en väg på åttonde raden.",
        hint: "Flytta inte för nära kungen. Svart måste fortfarande ha ett lagligt drag.",
        reply: "Kg8",
        response: "Svart går från H8 till G8. Sjunde raden är stängd av damen.",
      },
      {
        move: "Kf4",
        instruction: "Flytta kungen från E4 till F4 för att komma närmare.",
        hint: "Damen håller sin spärr medan kungen närmar sig.",
        reply: "Kh8",
        response: "Svart går tillbaka från G8 till H8.",
      },
      {
        move: "Kf5",
        instruction: "Flytta kungen från F4 till F5.",
        hint: "Du behöver inte ge schack i varje drag.",
        reply: "Kg8",
        response: "Svart går från H8 till G8 igen.",
      },
      {
        move: "Kf6",
        instruction: "Flytta kungen från F5 till F6. Nu skyddar den G7.",
        hint: "Det sista mattdraget behöver stöd av kungen.",
        reply: "Kh8",
        response: "Svart går från G8 till H8. Nu är dina pjäser redo.",
      },
      {
        move: "Qg7#",
        instruction:
          "Flytta damen från E7 till G7 och ge matt. Flytta inte till F7: då blir det patt.",
        hint: "Kungen på F6 skyddar damen på G7.",
      },
    ],
  }),
  lesson({
    id: "ending-opposition",
    title: "Kungarna och den viktiga turen",
    group: "Slutspel",
    fen: "8/4k3/8/4K3/4P3/8/8/8 w - - 0 1",
    description:
      "I bondeslutspel behöver kungen hjälpa bonden framåt. När kungarna står mitt emot varandra med en ruta emellan kan den som måste flytta behöva släppa fram den andra. Det kallas opposition.",
    takeaway:
      "Kungens plats och vem som är på drag kan avgöra ett bondeslutspel.",
    success:
      "När svart gick åt sidan kunde din kung gå fram på andra sidan och hjälpa bonden. Det här var ett exempel på hur opposition kan ge plats; fler kungdrag är möjliga i ett riktigt parti.",
    line: [
      {
        move: "Kd5",
        instruction:
          "Flytta kungen från E5 till D5. Här provar vi en väg runt svarts kung.",
        hint: "D5 är säkert och håller din kung framför bonden.",
        reply: "Kd7",
        response:
          "Svart flyttar kungen från E7 till D7. Kungarna står nu mitt emot varandra med D6 emellan.",
      },
      {
        move: "e5",
        instruction:
          "Låt bonden gå från E4 till E5. Kungarna står kvar och nu måste svart flytta.",
        hint: "Bonden kan göra ett väntedrag när vägen är fri.",
        reply: "Kc7",
        response:
          "I exemplet går svart från D7 till C7 och lämnar plats på E-sidan.",
      },
      {
        move: "Ke6",
        instruction: "Flytta kungen från D5 till E6 och hjälp bonden framåt.",
        hint: "E6 ligger en ruta snett framför D5 och hotas inte av kungen på C7.",
      },
    ],
  }),
  lesson({
    id: "ending-passed-pawn",
    title: "Fribonden behöver hjälp",
    group: "Slutspel",
    fen: "7k/8/4KP2/8/8/8/8/8 w - - 0 1",
    description:
      "En fribonde har inga motståndar-bönder framför sig på sin egen eller någon av grannlinjerna. Kungen kan hjälpa den att nå sista raden.",
    takeaway: "Undersök vägen till förvandling och hjälp fribonden med kungen.",
    success:
      "Din kung skyddade F7 och bonden nådde F8. Den blev en dam. Kontrollera nu hur du kan sätta matt utan att det blir patt.",
    line: [
      {
        move: "f7",
        instruction:
          "Flytta bonden från F6 till F7. Din kung på E6 skyddar den där.",
        hint: "Svarts kung på H8 kan inte nå F7 i ett steg.",
        reply: "Kg7",
        response:
          "Svart går från H8 till G7, men får inte ta bonden eftersom din kung skyddar F7.",
      },
      {
        move: "f8=Q+",
        instruction: "Flytta bonden från F7 till F8 och välj dam.",
        hint: "Välj dam i rutan som öppnas. I den här övningen tränar vi just det valet.",
      },
    ],
  }),
  lesson({
    id: "ending-underpromotion",
    title: "Välj torn och undvik patt",
    group: "Extra klurigt",
    fen: "8/k1P5/2K5/8/8/8/8/8 w - - 0 1",
    description:
      "Du måste inte välja dam vid förvandling. Här skulle en dam på C8 stänga alla svarts flyktrutor utan att ge schack. Då blir det patt. Kan ett torn ge svart en ruta att flytta till?",
    takeaway:
      "Välj den pjäs som ställningen behöver. En dam är inte alltid bäst.",
    success:
      "Med ett torn på C8 kan svart gå till A6. Det blev inte patt, och du kan fortsätta spela med kung och torn. En dam på C8 hade gjort partiet till remi direkt.",
    line: [
      {
        move: "c8=R",
        instruction:
          "Flytta bonden från C7 till C8 och välj torn för att undvika patt.",
        hint: "Tornet stänger åttonde raden men lämnar A6 fri. Din kung täcker B6 och B7.",
      },
    ],
  }),
];

const opera = [
  "e4",
  "e5",
  "Nf3",
  "d6",
  "d4",
  "Bg4",
  "dxe5",
  "Bxf3",
  "Qxf3",
  "dxe5",
  "Bc4",
  "Nf6",
  "Qb3",
  "Qe7",
  "Nc3",
  "c6",
  "Bg5",
  "b5",
  "Nxb5",
  "cxb5",
  "Bxb5+",
  "Nbd7",
  "O-O-O",
  "Rd8",
  "Rxd7",
  "Rxd7",
  "Rd1",
  "Qe6",
  "Bxd7+",
  "Nxd7",
];
const immortal = [
  "e4",
  "e5",
  "f4",
  "exf4",
  "Bc4",
  "Qh4+",
  "Kf1",
  "b5",
  "Bxb5",
  "Nf6",
  "Nf3",
  "Qh6",
  "d3",
  "Nh5",
  "Nh4",
  "Qg5",
  "Nf5",
  "c6",
  "g4",
  "Nf6",
  "Rg1",
  "cxb5",
  "h4",
  "Qg6",
  "h5",
  "Qg5",
  "Qf3",
  "Ng8",
  "Bxf4",
  "Qf6",
  "Nc3",
  "Bc5",
  "Nd5",
  "Qxb2",
  "Bd6",
  "Bxg1",
  "e5",
  "Qxa1+",
  "Ke2",
  "Na6",
  "Nxg7+",
  "Kd8",
];
const masters: Exercise[] = [
  lesson({
    id: "master-opera",
    title: "Morphys operaparti: damen visar vägen",
    group: "Mästarnas idéer",
    opening: opera,
    description:
      "Paris 1858: Paul Morphy spelade vit mot hertigen av Braunschweig och greve Isouard, som hjälptes åt med svart. Här provar du de sista dragen. Se hur torn och löpare samarbetar.",
    takeaway: "Utvecklade pjäser kan samarbeta även när en större pjäs offras.",
    success:
      "Du spelade operapartiets berömda avslutning! Damen lockade bort springaren från D7, och tornet gav matt på D8 med hjälp av löparen. Offret fungerade tack vare den konkreta mattplanen.",
    source: {
      title: "Operapartiet, Morphy 1858",
      url: "https://www.chess.com/terms/opera-game-chess",
    },
    line: [
      {
        move: "Qb8+",
        instruction:
          "Flytta damen från B3 till B8 och ge schack. Se vad som händer om springaren tar damen.",
        hint: "Springaren på D7 kan ta damen på B8. Då lämnar den D7.",
        reply: "Nxb8",
        response:
          "Springaren går från D7 till B8 och tar damen, precis som i den kända avslutningen.",
      },
      {
        move: "Rd8#",
        instruction: "Flytta tornet från D1 till D8 och ge schackmatt.",
        hint: "Löparen på G5 skyddar D8 längs diagonalen F6 och E7.",
      },
    ],
  }),
  lesson({
    id: "master-immortal",
    title: "Det odödliga partiet: tre pjäser hjälps åt",
    group: "Mästarnas idéer",
    opening: immortal,
    description:
      "London 1851: Adolf Anderssen spelade vit mot Lionel Kieseritzky. Du får prova den kända avslutningen med dam, springare och löpare. I gamla partier kan en berömd avslutning också innehålla misstag tidigare i spelet.",
    takeaway:
      "Räkna på hela fortsättningen. En stark kombination behöver flera samarbetande pjäser.",
    success:
      "Löparen satte matt på E7! Springarna på D5 och G7 hjälpte till att stänga flyktrutorna. Damen offrade sig för att få bort springaren från G8 och göra avslutningen möjlig.",
    source: {
      title: "Det odödliga partiet, Anderssen–Kieseritzky 1851",
      url: "https://www.chess.com/terms/immortal-game-chess",
    },
    line: [
      {
        move: "Qf6+",
        instruction:
          "Flytta damen från F3 till F6 och ge schack. I den kända fortsättningen tar svart damen.",
        hint: "Damen ger schack mot kungen på D8 längs diagonalen E7.",
        reply: "Nxf6",
        response:
          "Springaren från G8 tar damen på F6. Nu är det vits tur att avsluta.",
      },
      {
        move: "Be7#",
        instruction: "Flytta löparen från D6 till E7 och ge schackmatt.",
        hint: "Löparen på E7 hotar D8. Springarna hjälper till att täcka kungens flyktrutor.",
      },
    ],
  }),
];

const practice: Exercise[] = [
  lesson({
    id: "practice-white-fork",
    title: "Hitta själv: hota kung och dam",
    group: "Pröva själv",
    fen: "2k5/3q4/8/8/2N5/8/8/6K1 w - - 0 1",
    description:
      "Nu får du hitta idén själv. Gör en gaffel med springaren så att du ger schack och samtidigt hotar damen. Ledtråden finns om du behöver den.",
    takeaway: "Börja med att undersöka schackar som också hotar något annat.",
    success:
      "Du hittade en gaffel! Springaren på B6 hotade kungen på C8 och damen på D7. Efter kungens svar kunde du ta damen.",
    line: [
      {
        move: "Nb6+",
        instruction: "Hitta springarhoppet som hotar både kungen och damen.",
        hint: "Från B6 når en springare både C8 och D7.",
        reply: "Kb8",
        response:
          "Här flyttar svart kungen från C8 till B8 för att komma ur schacken.",
      },
      {
        move: "Nxd7+",
        instruction: "Följ upp din idé och vinn damen.",
        hint: "Springaren kan ta damen på D7.",
      },
    ],
  }),
  lesson({
    id: "practice-black-fork",
    title: "Hitta själv: en gaffel för svart",
    group: "Pröva själv",
    orientation: "b",
    fen: "6k1/8/8/4n3/8/8/1R6/4K3 b - - 0 1",
    description:
      "Du spelar svart. Hitta ett springarhopp som ger schack och hotar tornet. Brädet är vänt, men springaren hoppar som vanligt.",
    takeaway: "Samma schackidéer fungerar för båda färgerna.",
    success:
      "Springaren på D3 hotade kungen på E1 och tornet på B2. Du kunde ta tornet efter att kungen gått undan.",
    line: [
      {
        move: "Nd3+",
        instruction: "Hitta svarts gaffel med springaren.",
        hint: "Undersök D3. Kan springaren nå både E1 och B2 därifrån?",
        reply: "Kd2",
        response: "Vit flyttar kungen från E1 till D2.",
      },
      {
        move: "Nxb2",
        instruction: "Fortsätt genom att vinna tornet.",
        hint: "Tornet står på B2 och din springare står på D3.",
      },
    ],
  }),
  lesson({
    id: "practice-mate-two",
    title: "Hitta själv: planera matt i två",
    group: "Pröva själv",
    fen: "7k/8/5K2/8/8/8/8/2R5 w - - 0 1",
    description:
      "Hitta en plan som ger matt på ditt andra drag. Först behöver kungen hjälpa till. Svart gör ett drag mellan dina två drag.",
    takeaway: "Ett lugnt drag kan vara början på en tvingande mattplan.",
    success:
      "Kungen stängde G8 och G7. Svart fick bara ett svar, och sedan satte tornet matt. Du tänkte hela vägen fram!",
    line: [
      {
        move: "Kf7",
        instruction: "Vilket kungdrag förbereder matt med tornet?",
        hint: "Kungen behöver täcka G8, G7 och G6 från samma ruta.",
        reply: "Kh7",
        response: "Svarts enda lagliga drag är från H8 till H7.",
      },
      {
        move: "Rh1#",
        instruction: "Hitta nu det avslutande torndraget.",
        hint: "Ge schack längs H-linjen.",
      },
    ],
  }),
  lesson({
    id: "practice-back-rank",
    title: "Hitta själv: matt på sista raden",
    group: "Pröva själv",
    fen: "6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1",
    description:
      "Svarts bönder stänger kungens väg framåt. Hitta ett torndrag som ger schackmatt direkt.",
    takeaway: "En kung bakom sina bönder kan behöva en säker flyktruta.",
    success:
      "Tornet gav matt längs åttonde raden. Svarts egna bönder stängde F7, G7 och H7, så kungen kunde inte komma undan.",
    line: [
      {
        move: "Ra8#",
        instruction: "Hitta matt i ett drag utan att flytta din kung.",
        hint: "Vilken rad står svarts kung på? Kan tornet nå den raden?",
      },
    ],
  }),
];

export const curriculumLessons = [
  ...foundation,
  ...tactics,
  ...openings,
  ...traps,
  ...endings,
  ...masters,
  ...practice,
];
export const curriculumSections = [
  {
    title: "6. Spela ett genomtänkt parti",
    description: "Mitten, utveckling, pjäsbyten och goda vanor inför en match.",
    ids: foundation.map((e) => e.id),
    track: "foundation" as const,
  },
  {
    title: "1. Smarta drag och kombinationer",
    description:
      "Gaffel, bindning, spett och avdragsschack. Prova idén och motståndarens svar.",
    ids: tactics.map((e) => e.id),
    track: "advanced" as const,
  },
  {
    title: "2. Kända öppningar",
    description:
      "Förstå planerna i italienskt parti, spanskt parti och damgambit. Prova också att spela svart.",
    ids: openings.map((e) => e.id),
    track: "advanced" as const,
  },
  {
    title: "3. Fällor och försvar",
    description:
      "Känn igen skolmatt och hot längs sista raden. Lär dig hur du försvarar dig.",
    ids: traps.map((e) => e.id),
    track: "advanced" as const,
  },
  {
    title: "4. Ta hand om slutspelet",
    description:
      "Samarbeta med kungen, sätt matt och hjälp en bonde till sista raden.",
    ids: endings.map((e) => e.id),
    track: "advanced" as const,
  },
  {
    title: "5. Prova mästarnas idéer",
    description:
      "Spela avslutningarna i två berömda partier. Förklaringar och källor finns i lektionerna.",
    ids: masters.map((e) => e.id),
    track: "advanced" as const,
  },
  {
    title: "6. Pröva själv",
    description:
      "Använd det du har lärt dig. Här får du hitta dragen själv, med ledtrådar om du vill.",
    ids: practice.map((e) => e.id),
    track: "advanced" as const,
  },
];
