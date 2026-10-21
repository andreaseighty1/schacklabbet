import { useId } from "react";
import type { Color, PieceSymbol } from "chess.js";
import { Piece } from "./Piece";

function ScenePiece({
  x,
  y,
  type,
  color = "w",
}: {
  x: number;
  y: number;
  type: PieceSymbol;
  color?: Color;
}) {
  return (
    <svg x={x - 27} y={y - 33} width="54" height="62" viewBox="0 0 80 80">
      <Piece type={type} color={color} />
    </svg>
  );
}

/** Small, decorative movement diagrams. Playable positions remain owned by chess.js. */
export function LessonArt({ lesson }: { lesson: string }) {
  const id = useId();
  const sand = ["bishop", "mate-queen"].includes(lesson);
  const pawn = lesson.startsWith("pawn-") || lesson === "en-passant";
  const rule = lesson.startsWith("check-");
  const question = lesson === "checkmate" || lesson === "stalemate";
  const arrow = question
    ? "M226 86V86"
    : lesson === "pawn-black"
      ? "M94 75V130"
      : lesson === "pawn-capture" || lesson === "en-passant"
        ? "M105 161L138 130"
        : pawn
          ? `M94 161V${lesson === "pawn-double" ? 86 : 130}`
          : lesson === "queen"
            ? "M105 163 218 50"
            : lesson === "king" || lesson === "check-escape"
              ? "M150 174H182"
              : lesson === "check-capture"
                ? "M138 161V130"
                : lesson === "check-block"
                  ? "M63 161 138 86"
                  : lesson === "rook"
                    ? "M94 161V49"
                    : lesson === "bishop"
                      ? "M105 163 218 50"
                      : lesson === "knight"
                        ? "M106 174H182V139"
                        : lesson === "castle"
                          ? "M103 158Q138 103 178 158"
                          : lesson === "mate-rook"
                            ? "M65 174H254"
                            : "M226 116V97";
  return (
    <svg
      className="lesson-scene"
      viewBox="0 0 320 220"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${id}-wash`} x2="1" y2="1">
          <stop stopColor={sand ? "#f4eddf" : "#eaf0df"} />
          <stop offset="1" stopColor={sand ? "#e6d8bd" : "#cad9bc"} />
        </linearGradient>
        <marker
          id={`${id}-arrow`}
          markerWidth="6"
          markerHeight="6"
          refX="4"
          refY="3"
          orient="auto"
        >
          <path
            d="M1 1 4 3 1 5"
            fill="none"
            stroke="#b18b45"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>
      </defs>
      <rect width="320" height="220" fill={`url(#${id}-wash)`} />
      <circle
        cx="274"
        cy="31"
        r="77"
        fill="none"
        stroke="#ffffff"
        opacity=".35"
      />
      <circle
        cx="274"
        cy="31"
        r="94"
        fill="none"
        stroke="#ffffff"
        opacity=".25"
      />
      <rect
        x="24"
        y="23"
        width="272"
        height="180"
        rx="11"
        fill="#36513b"
        opacity=".13"
      />
      <rect
        x="24"
        y="15"
        width="272"
        height="184"
        rx="10"
        fill={sand ? "#ac9674" : "#7f9b76"}
      />
      {Array.from({ length: 24 }, (_, i) => {
        const col = i % 6,
          row = Math.floor(i / 6);
        return (
          <rect
            key={i}
            x={28 + col * 44}
            y={20 + row * 44}
            width="44"
            height="44"
            fill={
              (row + col) % 2
                ? sand
                  ? "#c4b28f"
                  : "#adc29c"
                : sand
                  ? "#f4ead3"
                  : "#e9efda"
            }
          />
        );
      })}
      {lesson === "mate-rook" && (
        <>
          <path
            d="M270 158V68"
            stroke="#ba7761"
            strokeWidth="2"
            strokeDasharray="4 5"
          />
          <circle cx="270" cy="42" r="24" fill="#c77c5e" opacity=".18" />
          <ScenePiece x={270} y={42} type="k" color="b" />
          <ScenePiece x={182} y={86} type="k" />
        </>
      )}
      {lesson === "mate-queen" && (
        <>
          <circle cx="270" cy="42" r="23" fill="#c77c5e" opacity=".18" />
          <ScenePiece x={270} y={42} type="k" color="b" />
          <ScenePiece x={182} y={130} type="k" />
        </>
      )}
      {question && (
        <>
          <circle
            cx="270"
            cy="42"
            r="23"
            fill={lesson === "checkmate" ? "#c77c5e" : "#8caa7c"}
            opacity=".22"
          />
          <ScenePiece x={270} y={42} type="k" color="b" />
          <ScenePiece x={lesson === "checkmate" ? 226 : 182} y={86} type="q" />
          <ScenePiece x={182} y={130} type="k" />
        </>
      )}
      {rule && (
        <>
          <path
            d="M138 62V150"
            stroke="#b4634c"
            strokeWidth="3"
            strokeDasharray="4 5"
          />
          <ScenePiece
            x={138}
            y={lesson === "check-capture" ? 130 : 42}
            type="r"
            color="b"
          />
          <ScenePiece x={138} y={174} type="k" />
          {lesson === "check-block" && <ScenePiece x={50} y={174} type="b" />}
        </>
      )}
      <path
        d={arrow}
        stroke="#f9f2d5"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity=".65"
      />
      <path
        d={arrow}
        stroke="#b18b45"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        markerEnd={`url(#${id}-arrow)`}
      />
      {lesson === "rook" && <ScenePiece x={94} y={174} type="r" />}
      {lesson === "bishop" && <ScenePiece x={94} y={174} type="b" />}
      {lesson === "knight" && (
        <>
          <circle
            cx="182"
            cy="130"
            r="18"
            stroke="#b18b45"
            fill="none"
            strokeDasharray="3 4"
            opacity=".7"
          />
          <ScenePiece x={94} y={174} type="n" />
        </>
      )}
      {lesson === "castle" && (
        <>
          <ScenePiece x={94} y={174} type="k" />
          <ScenePiece x={226} y={174} type="r" />
        </>
      )}
      {lesson === "mate-rook" && <ScenePiece x={50} y={174} type="r" />}
      {lesson === "mate-queen" && <ScenePiece x={226} y={130} type="q" />}
      {pawn && (
        <>
          <ScenePiece
            x={94}
            y={lesson === "pawn-black" ? 64 : 174}
            type="p"
            color={lesson === "pawn-black" ? "b" : "w"}
          />
          {lesson === "pawn-capture" && (
            <ScenePiece x={138} y={130} type="p" color="b" />
          )}
          {lesson === "en-passant" && (
            <ScenePiece x={138} y={174} type="p" color="b" />
          )}
          {lesson === "pawn-promotion" && <ScenePiece x={94} y={86} type="q" />}
        </>
      )}
      {lesson === "queen" && <ScenePiece x={94} y={174} type="q" />}
      {lesson === "king" && <ScenePiece x={138} y={174} type="k" />}
      <path
        d="m289 189 3 5 5 2-5 2-3 5-2-5-5-2 5-2Z"
        fill="#fffaf0"
        opacity=".85"
      />
    </svg>
  );
}
