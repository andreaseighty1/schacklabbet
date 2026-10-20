import { useId } from "react";
export type AchievementKind = "game" | "win" | "explore" | "mate";
export function AchievementArt({
  kind,
  earned,
}: {
  kind: AchievementKind;
  earned: boolean;
}) {
  const id = useId();
  const main = earned ? "#b18a40" : "#a3ac98";
  const dark = earned ? "#826336" : "#829078";
  return (
    <svg
      className={`achievement-art ${earned ? "unlocked" : ""}`}
      viewBox="0 0 140 155"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${id}-metal`} x2="1" y2="1">
          <stop stopColor={earned ? "#fff0bc" : "#edf0e5"} />
          <stop offset=".48" stopColor={earned ? "#e2bf70" : "#d8dfca"} />
          <stop offset="1" stopColor={earned ? "#a9813c" : "#adb99d"} />
        </linearGradient>
        <radialGradient id={`${id}-center`}>
          <stop stopColor={earned ? "#fff9df" : "#f8faef"} />
          <stop offset="1" stopColor={earned ? "#ead29a" : "#e5ebdb"} />
        </radialGradient>
      </defs>
      <ellipse cx="70" cy="142" rx="38" ry="5" fill="#4b6542" opacity=".08" />
      <path
        d="m39 88-8 47 17-9 12 13 9-45M71 95l10 44 12-13 17 9-10-47"
        fill={earned ? "#597d62" : "#cad3c0"}
        stroke={earned ? "#365a45" : "#aebba2"}
        strokeWidth="2"
      />
      <path
        d="m43 96-5 26M96 96l6 26"
        stroke={earned ? "#a4bea0" : "#e6ecdd"}
        strokeWidth="3"
        opacity=".8"
      />
      <circle
        cx="70"
        cy="61"
        r="49"
        fill="#3f563a"
        opacity=".1"
        transform="translate(0 4)"
      />
      <path
        d="M70 9 80 14 91 13 98 22 109 25 112 36 121 43 120 54 125 64 120 74 121 85 112 92 109 103 98 106 91 115 80 114 70 119 60 114 49 115 42 106 31 103 28 92 19 85 20 74 15 64 20 54 19 43 28 36 31 25 42 22 49 13 60 14Z"
        fill={`url(#${id}-metal)`}
        stroke={main}
        strokeWidth="2"
      />
      <circle
        cx="70"
        cy="64"
        r="42"
        fill={`url(#${id}-center)`}
        stroke={main}
        strokeWidth="1.5"
      />
      <circle
        cx="70"
        cy="64"
        r="36"
        fill="none"
        stroke={main}
        strokeDasharray="1 5"
        strokeLinecap="round"
      />
      <g
        stroke={dark}
        strokeWidth="2.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        {kind === "game" && (
          <>
            <path d="M48 84 87 45M51 44l37 39M48 44l6 13 7-7-13-6ZM89 44l-6 13-7-7 13-6ZM45 77l11 11M85 77l-11 11" />
            <path d="m44 89 5-5M91 89l-5-5" />
          </>
        )}
        {kind === "win" && (
          <>
            <path d="M56 45h28v19c0 12-28 12-28 0V45ZM56 48H45v9c0 10 10 12 13 12M84 48h11v9c0 10-10 12-13 12M70 73v12M59 89h22M62 84h16" />
            <path
              d="m70 52 2 5 6 1-5 4 1 6-4-3-5 3 1-6-4-4 6-1Z"
              fill={main}
              strokeWidth="1.4"
            />
          </>
        )}
        {kind === "explore" && (
          <>
            <circle cx="70" cy="64" r="23" />
            <path d="M70 36v7M70 85v7M42 64h7M91 64h7M80 54 75 69 60 75 65 60Z" />
            <path d="m80 54-15 6 10 9Z" fill={main} strokeWidth="1.3" />
            <circle cx="70" cy="64" r="2" fill={dark} />
          </>
        )}
        {kind === "mate" && (
          <>
            <circle cx="65" cy="59" r="17" />
            <path d="m78 72 14 14M61 49v13M56 54h10M54 67h21" />
            <path d="M55 69h19M59 62l-4 6M69 62l5 6" />
          </>
        )}
      </g>
      <path
        d="m31 29 2 5 5 2-5 2-2 5-2-5-5-2 5-2ZM109 92l2 4 4 2-4 1-2 5-1-5-5-1 5-2Z"
        fill={earned ? "#fffbe6" : "#fbfff1"}
      />
    </svg>
  );
}
