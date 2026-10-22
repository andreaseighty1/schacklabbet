import { type Chess, type Color } from "chess.js";
import { cannotMate } from "../../supabase/functions/chess-room/material";
export { cannotMate } from "../../supabase/functions/chess-room/material";

export function timeoutOutcome(game: Chess, loser: Color) {
  const winner = loser === "w" ? "b" : "w";
  const draw = cannotMate(game, winner);
  const result = draw ? "1/2-1/2" : winner === "w" ? "1-0" : "0-1";
  const text = draw
    ? "Remi – tiden tog slut och motståndaren kan inte sätta schackmatt"
    : `${winner === "w" ? "Vit" : "Svart"} vinner på tid – ${loser === "w" ? "vits" : "svarts"} tid är slut`;
  game.setHeader("Result", result);
  game.setHeader("Termination", "time forfeit");
  return text;
}
