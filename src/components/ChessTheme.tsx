import { useEffect, useId, useState } from "react";

export type ChessTheme = "classic" | "green";
const key = "schacklabbet.chess-theme.v1";

export function useChessTheme() {
  const [theme, setTheme] = useState<ChessTheme>(() => {
    try {
      return localStorage.getItem(key) === "green" ? "green" : "classic";
    } catch {
      return "classic";
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, theme);
    } catch {
      /* The choice still works for this visit. */
    }
  }, [theme]);
  return [theme, setTheme] as const;
}

export function ChessThemePicker({
  theme,
  onChange,
}: {
  theme: ChessTheme;
  onChange: (theme: ChessTheme) => void;
}) {
  const id = useId();
  return (
    <div className="chess-theme-picker">
      <label htmlFor={id}>Bräde och pjäser</label>
      <select
        id={id}
        value={theme}
        onChange={(event) =>
          onChange(event.target.value === "green" ? "green" : "classic")
        }
      >
        <option value="classic">Klassiskt trä · vita och bruna</option>
        <option value="green">Grönt · ljusa och mörkgröna</option>
      </select>
    </div>
  );
}
