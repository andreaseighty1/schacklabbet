import { useId } from "react";
import type { Color, PieceSymbol } from "chess.js";

/** A shared Staunton-inspired silhouette set, drawn for small board squares. */
export function Piece({
  type,
  color,
  className = "",
}: {
  type: PieceSymbol;
  color: Color;
  className?: string;
}) {
  const gradientId = useId();
  const ivory = color === "w";
  const edge = ivory ? "#526154" : "#102e2b";
  const shine = ivory ? "#fffef5" : "#91b8a3";
  return (
    <svg
      className={`piece ${className}`}
      viewBox="0 0 80 80"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="0"
          y1="0"
          x2="1"
          y2=".8"
          gradientUnits="objectBoundingBox"
        >
          <stop offset="0" stopColor={ivory ? "#fffef3" : "#557a6b"} />
          <stop offset=".42" stopColor={ivory ? "#fff5db" : "#2b5147"} />
          <stop offset="1" stopColor={ivory ? "#d1c5a7" : "#132f2c"} />
        </linearGradient>
      </defs>
      <ellipse cx="40" cy="74" rx="23" ry="3" fill="#183b32" opacity=".15" />
      <g
        fill={`url(#${gradientId})`}
        stroke={edge}
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {type === "p" && (
          <>
            <path d="M33 32h14c-4 7-5 12-1 18l7 10H27l7-10c4-6 3-11-1-18Z" />
            <circle cx="40" cy="23" r="10" />
            <path d="M30 35h20v4H30Z" />
            <path
              d="M35 46c1 4-2 9-4 12"
              stroke={shine}
              strokeWidth="2"
              opacity=".55"
            />
          </>
        )}
        {type === "r" && (
          <>
            <path d="M23 14h9v9h5v-9h7v9h5v-9h9v20l-8 6 3 19H27l3-19-7-6Z" />
            <path d="M26 33h29M30 41h20M27 55h26" />
            <path
              d="M33 44v9M27 17v9"
              stroke={shine}
              strokeWidth="2"
              opacity=".55"
            />
          </>
        )}
        {type === "n" && (
          <>
            <path d="M24 59c-1-12 6-23 19-28l-10 1-7 7-10-8 12-17 10-1 3-7 8 9c15 7 18 25 12 44Z" />
            <path d="M48 18c6 9 5 17 1 23M38 36c-7 6-10 14-10 20" fill="none" />
            <path
              d="m30 18-8 11M47 44c-2 5-2 9-1 13"
              fill="none"
              stroke={shine}
              strokeWidth="2"
              opacity=".6"
            />
            <circle cx="40" cy="22" r="2.2" fill={edge} stroke="none" />
            <path d="m23 29 4 1" />
          </>
        )}
        {type === "b" && (
          <>
            <path d="M40 14C34 22 25 26 25 35c0 8 7 12 11 15l-8 10h24l-8-10c4-3 11-7 11-15 0-9-9-13-15-21Z" />
            <path d="m44 25-9 13M30 48h20" />
            <circle cx="40" cy="11" r="4" />
            <path
              d="M31 30c-4 7-2 10 2 13"
              fill="none"
              stroke={shine}
              strokeWidth="2"
              opacity=".6"
            />
          </>
        )}
        {type === "q" && (
          <>
            <path d="m21 25 10 10 9-16 9 16 10-10-8 23 3 12H26l3-12Z" />
            <circle cx="20" cy="21" r="4" />
            <circle cx="40" cy="15" r="4" />
            <circle cx="60" cy="21" r="4" />
            <path d="M29 47h22M28 53h24" />
            <path
              d="m32 39 1 6M31 55h7"
              stroke={shine}
              strokeWidth="2"
              opacity=".65"
            />
          </>
        )}
        {type === "k" && (
          <>
            <path d="M37 7h6v7h7v6h-7v8h-6v-8h-7v-6h7Z" />
            <path d="M28 47c-5-4-10-10-8-16 2-7 12-6 20 2 8-8 18-9 20-2 2 6-3 12-8 16l2 13H26Z" />
            <path d="M28 47h24M28 53h24M40 33v10" />
            <path
              d="M25 32c-2 4 0 7 3 10M31 56h7"
              stroke={shine}
              strokeWidth="2"
              opacity=".65"
            />
          </>
        )}
        <path d="M25 59h30l3 6H22Z" />
        <path d="M22 65h36l4 8H18Z" />
        <path
          d="M26 68h27"
          fill="none"
          stroke={shine}
          strokeWidth="2"
          opacity=".7"
        />
      </g>
    </svg>
  );
}
