import type { Color, PieceSymbol } from "chess.js";
export function Piece({
  type,
  color,
  className = "",
}: {
  type: PieceSymbol;
  color: Color;
  className?: string;
}) {
  const fill = color === "w" ? "#fff9eb" : "#233f3b";
  const stroke = color === "w" ? "#425951" : "#102d29";
  return (
    <svg
      className={`piece ${className}`}
      viewBox="0 0 80 80"
      aria-hidden="true"
    >
      <g
        fill={fill}
        stroke={stroke}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {type === "p" && (
          <>
            <circle cx="40" cy="24" r="10" />
            <path d="M34 34h12l-2 10 9 17H27l9-17z" />
            <path d="M29 57h22v7H29z" />
          </>
        )}
        {type === "r" && (
          <>
            <path d="M23 14h9v9h5v-9h7v9h5v-9h9v20l-9 6 4 22H27l4-22-8-6z" />
            <path d="M26 33h30M31 42h18M26 58h28" />
          </>
        )}
        {type === "n" && (
          <>
            <path d="M23 61c-1-15 9-24 22-31l-12 2-7 7-10-8 15-18 11-2 8 5c15 12 15 30 11 45z" />
            <path d="m32 14 1-8 11 7M29 22l-3 4M38 38c-7 8-8 13-7 21" />
            <circle cx="42" cy="22" r="2" fill={stroke} />
          </>
        )}
        {type === "b" && (
          <>
            <path d="M40 9c-4 8-15 15-15 24 0 8 7 12 11 15l-8 14h24l-8-14c4-3 11-7 11-15 0-9-11-16-15-24z" />
            <path d="m44 22-8 13M30 45h20M27 58h26" />
            <circle cx="40" cy="9" r="3" />
          </>
        )}
        {type === "q" && (
          <>
            <path d="m21 25 10 11 9-16 9 16 10-11-8 25 3 12H26l3-12z" />
            <circle cx="20" cy="21" r="4" />
            <circle cx="40" cy="15" r="4" />
            <circle cx="60" cy="21" r="4" />
            <path d="M29 49h22M27 58h26" />
          </>
        )}
        {type === "k" && (
          <>
            <path d="M40 9v16M33 16h14M27 60l4-15c-19-12-8-29 6-17l3 5 3-5c14-12 25 5 6 17l4 15z" />
            <path d="M31 45h18M28 57h24" />
          </>
        )}
        <path d="M24 62h32l4 9H20z" />
        <path
          d="M29 67h22"
          stroke={color === "w" ? "#e0d8be" : "#57736a"}
          strokeWidth="2"
        />
      </g>
    </svg>
  );
}
