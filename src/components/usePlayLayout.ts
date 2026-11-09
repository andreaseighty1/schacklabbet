import { useEffect, useState } from "react";

type Preferences = { compact: boolean | null; sidebarHidden: boolean | null };
const key = "schacklabbet.layout.v1";
function readPreferences(): Preferences {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? "null");
    return {
      compact: typeof saved?.compact === "boolean" ? saved.compact : null,
      sidebarHidden:
        typeof saved?.sidebarHidden === "boolean" ? saved.sidebarHidden : null,
    };
  } catch {
    return { compact: null, sidebarHidden: null };
  }
}
function useMedia(query: string) {
  const [matches, setMatches] = useState(() => matchMedia(query).matches);
  useEffect(() => {
    const media = matchMedia(query);
    const update = () => setMatches(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);
  return matches;
}
export function usePlayLayout(boardView: boolean) {
  const [preferences, setPreferences] = useState(readPreferences);
  const narrow = useMedia("(max-width: 1100px)");
  const short = useMedia("(min-width: 691px) and (max-height: 800px)");
  const compact = boardView && (preferences.compact ?? short);
  const drawer = narrow || (preferences.sidebarHidden ?? compact);
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(preferences));
    } catch {
      /* The layout still works without storage. */
    }
  }, [preferences]);
  return {
    compact,
    drawer,
    narrow,
    toggleCompact: () =>
      setPreferences((value) => ({ ...value, compact: !compact })),
    toggleSidebar: () =>
      setPreferences((value) => ({ ...value, sidebarHidden: !drawer })),
  };
}
