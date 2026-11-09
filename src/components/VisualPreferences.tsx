import { createContext, useEffect, useState } from "react";

export type PieceSet = "sculpted" | "simple";
export type VisualPreferences = { pieceSet: PieceSet; animateMoves: boolean };
const key = "schacklabbet.visuals.v1";
export const VisualContext = createContext<VisualPreferences>({
  pieceSet: "sculpted",
  animateMoves: true,
});

export function useVisualPreferences() {
  const [preferences, setPreferences] = useState<VisualPreferences>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? "null");
      return {
        pieceSet: saved?.pieceSet === "simple" ? "simple" : "sculpted",
        animateMoves: saved?.animateMoves !== false,
      };
    } catch {
      return { pieceSet: "sculpted", animateMoves: true };
    }
  });
  const [reducedMotion, setReducedMotion] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(preferences));
    } catch {
      /* A blocked store should not prevent playing. */
    }
  }, [preferences]);
  return { preferences, setPreferences, reducedMotion };
}
