export interface Exercise {
  id: string;
  category: "school" | "challenge";
  title: string;
  tag: string;
  description: string;
  fen: string;
  solutions: string[];
  hint: string;
  success: string;
}
export const exercises: Exercise[] = [
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
      "Löparen rör sig diagonalt och stannar alltid på samma färg. Ta bonden på g5 med löparen.",
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
      "Rockad flyttar både kung och torn. Ingen av dem får ha flyttat och kungen får inte stå i, passera eller landa i schack. Gör kort rockad: flytta kungen från e1 till g1.",
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
      "Svarts kung står vid kanten. Hitta ett torndrag som ger schackmatt. Vit drar.",
    fen: "7k/5K2/8/8/8/8/8/R7 w - - 0 1",
    solutions: ["a1h1"],
    hint: "Din kung täcker g8 och g7. Ge schack längs h-linjen.",
    success:
      "Schackmatt! Tornet täcker h-linjen och din kung stänger flyktvägarna.",
  },
  {
    id: "mate-queen",
    category: "challenge",
    title: "Drottningens sista drag",
    tag: "Matt i ett · Lätt",
    description:
      "Damen och kungen kan samarbeta. Sätt matt i ett drag. Vit drar.",
    fen: "7k/8/5KQ1/8/8/8/8/8 w - - 0 1",
    solutions: ["g6g7"],
    hint: "Ställ damen precis framför kungen. Din egen kung måste försvara henne.",
    success:
      "Matt! Damen på g7 täcker flyktrutorna och är försvarad av kungen på f6.",
  },
];
