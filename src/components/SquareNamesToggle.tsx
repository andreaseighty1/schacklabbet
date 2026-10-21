import { useEffect, useState } from "react";
import { Grid2X2 } from "lucide-react";

/** Lessons and games remember their own display preference; this never changes legal moves. */
export function useSquareNames(scope: "lesson" | "game") {
  const key = `schacklabbet.square-names.${scope}.v1`;
  const [enabled, setEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved === "true" || saved === "false") return saved === "true";
    } catch {
      /* The board also works when local storage is unavailable. */
    }
    return scope === "lesson";
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, String(enabled));
    } catch {
      /* This visit's choice still works without persistence. */
    }
  }, [enabled, key]);
  return [enabled, () => setEnabled((value) => !value)] as const;
}

export function SquareNamesToggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      className="text-button square-names-toggle"
      type="button"
      aria-label="Rutnamn på rutorna"
      aria-pressed={enabled}
      onClick={onToggle}
    >
      <Grid2X2 size={16} aria-hidden="true" /> Rutnamn {enabled ? "på" : "av"}
    </button>
  );
}
