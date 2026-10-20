import { useEffect, useState, useSyncExternalStore } from "react";
import { VoicePlayer } from "./player";

export function useVoice() {
  const [player] = useState(() => new VoicePlayer());
  const state = useSyncExternalStore(player.subscribe, player.getSnapshot);
  useEffect(() => () => player.reset(), [player]);
  return { player, state };
}

export type Voice = ReturnType<typeof useVoice>;
