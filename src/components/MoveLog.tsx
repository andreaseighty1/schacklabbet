import { useEffect, useId, useRef, useState } from "react";
import type { Move } from "chess.js";
import { Swords } from "lucide-react";
import { MoveLabel } from "./MoveLabel";

export function MoveLog({ moves }: { moves: Move[] }) {
  const [details, setDetails] = useState(false);
  const id = useId();
  const list = useRef<HTMLDivElement>(null);
  const followLatest = useRef(true);
  useEffect(() => {
    if (followLatest.current && list.current)
      list.current.scrollTop = list.current.scrollHeight;
  }, [moves.length, details]);
  return (
    <>
      <div className="move-log-heading">
        <h3>
          <Swords size={17} /> Partiets drag{" "}
          <span className="move-count">{moves.length}</span>
        </h3>
        <button
          className="text-button move-log-details"
          aria-expanded={details}
          aria-controls={id}
          disabled={!moves.length}
          onClick={() => setDetails((value) => !value)}
        >
          {details ? "Färre detaljer" : "Fler detaljer"}
        </button>
      </div>
      <div
        id={id}
        ref={list}
        className={`move-table move-log ${details ? "" : "is-concise"}`}
        role="region"
        aria-label="Draglista"
        tabIndex={0}
        onScroll={(event) => {
          const node = event.currentTarget;
          followLatest.current =
            node.scrollHeight - node.scrollTop - node.clientHeight < 24;
        }}
      >
        <div className="move-table-head">
          <span>#</span>
          <span>Vit</span>
          <span>Svart</span>
        </div>
        {!moves.length ? (
          <p className="moves-empty">Inget drag ännu. Vit börjar.</p>
        ) : (
          Array.from({ length: Math.ceil(moves.length / 2) }, (_, index) => (
            <div className="move-pair" key={index}>
              <span>{index + 1}.</span>
              <MoveLabel move={moves[index * 2]} />
              <MoveLabel move={moves[index * 2 + 1]} />
            </div>
          ))
        )}
      </div>
    </>
  );
}
