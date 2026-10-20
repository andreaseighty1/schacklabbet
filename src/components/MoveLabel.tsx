import type { Move } from "chess.js";
import { describeMove } from "../chess/moveDescription";

export function MoveLabel({ move }: { move: Move | undefined }) {
  if (!move) return <div className="move-description">—</div>;
  const { action, route, result } = describeMove(move);
  return (
    <div className="move-description">
      <span className="move-action">{action}</span>
      <small className="move-route">{route}</small>
      {result && <strong className="move-result">{result}</strong>}
    </div>
  );
}
