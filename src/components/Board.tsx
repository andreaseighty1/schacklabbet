import { useRef } from "react";
import { type Chess, type Square, type Color, type Move } from "chess.js";
import { Piece } from "./Piece";
import { kingSquare, pieceNames } from "../chess/model";
export function Board({
  game,
  orientation = "w",
  selected = null,
  legal = [],
  last,
  threatened = [],
  highlight = [],
  onSquare,
  disabled = false,
  showSquareNames = false,
}: {
  game: Chess;
  orientation?: Color;
  selected?: Square | null;
  legal?: Square[];
  last?: Move;
  threatened?: Square[];
  highlight?: Square[];
  onSquare: (square: Square, from?: Square) => void;
  disabled?: boolean;
  showSquareNames?: boolean;
}) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const files = (orientation === "w" ? "abcdefgh" : "hgfedcba").split("");
  const ranks =
    orientation === "w" ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
  const check = game.isCheck() ? kingSquare(game, game.turn()) : undefined;
  return (
    <div className="board-frame">
      <div
        className={`board ${showSquareNames ? "with-square-names" : ""}`}
        role="group"
        aria-label="Schackbräde. Använd piltangenter för att flytta fokus och Enter för att välja pjäs och destination."
      >
        {ranks.flatMap((rank, row) =>
          files.map((file, col) => {
            const square = `${file}${rank}` as Square;
            const p = game.get(square);
            const dark = ("abcdefgh".indexOf(file) + rank) % 2 === 0;
            const isLegal = legal.includes(square);
            const danger = threatened.includes(square);
            const index = row * 8 + col;
            return (
              <button
                key={square}
                ref={(el) => {
                  buttons.current[index] = el;
                }}
                type="button"
                className={`square ${dark ? "dark" : "light"} ${last && (last.from === square || last.to === square) ? "last" : ""} ${selected === square ? "selected" : ""} ${check === square ? "check" : ""} ${highlight.includes(square) ? "hinted" : ""}`}
                aria-label={`${square}${p ? `, ${p.color === "w" ? "vit" : "svart"} ${pieceNames[p.type]}` : ", tom ruta"}${isLegal ? ", möjligt drag" : ""}${danger ? ", kan slås" : ""}${check === square ? ", schack" : ""}`}
                aria-pressed={selected === square}
                aria-disabled={disabled}
                tabIndex={index === 0 ? 0 : -1}
                onFocus={(e) => {
                  buttons.current.forEach((b) => {
                    if (b) b.tabIndex = -1;
                  });
                  e.currentTarget.tabIndex = 0;
                }}
                draggable={Boolean(p && !disabled)}
                onDragStart={(e) => {
                  if (disabled) {
                    e.preventDefault();
                    return;
                  }
                  e.dataTransfer.setData("text/plain", square);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(e) => {
                  if (!disabled) e.preventDefault();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const from = e.dataTransfer.getData("text/plain");
                  if (!disabled && /^[a-h][1-8]$/.test(from))
                    onSquare(square, from as Square);
                }}
                onClick={() => {
                  if (!disabled) onSquare(square);
                }}
                onKeyDown={(e) => {
                  const delta: Record<string, number> = {
                    ArrowLeft: -1,
                    ArrowRight: 1,
                    ArrowUp: -8,
                    ArrowDown: 8,
                  };
                  if (e.key in delta) {
                    e.preventDefault();
                    const next = index + delta[e.key];
                    if (
                      next >= 0 &&
                      next < 64 &&
                      (Math.abs(delta[e.key]) === 8 ||
                        Math.floor(next / 8) === row)
                    )
                      buttons.current[next]?.focus();
                  }
                }}
              >
                {showSquareNames && (
                  <span className="square-name" aria-hidden="true">
                    {square.toUpperCase()}
                  </span>
                )}
                {col === 0 && <span className="rank-label">{rank}</span>}
                {row === 7 && <span className="file-label">{file}</span>}
                {p && <Piece type={p.type} color={p.color} />}
                {isLegal && <span className={p ? "capture-dot" : "move-dot"} />}
                {danger && <span className="danger-mark">!</span>}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}
