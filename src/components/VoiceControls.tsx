import { RotateCcw, Square, Volume2, VolumeX } from "lucide-react";
import { clipLabel, type VoiceClip } from "../audio/clips";
import type { Voice } from "../audio/useVoice";

export function VoiceControls({ voice }: { voice: Voice }) {
  const { player, state } = voice;
  return (
    <div className="voice-controls" role="group" aria-label="Röstkontroller">
      <button
        className="voice-toggle"
        aria-pressed={state.enabled}
        title={state.enabled ? "Stäng av rösten" : "Slå på rösten"}
        onClick={() => player.setEnabled(!state.enabled)}
      >
        {state.enabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
        Röst {state.enabled ? "på" : "av"}
      </button>
      <button
        className="icon-button"
        aria-label="Stoppa uppläsningen"
        title="Stoppa"
        disabled={!state.active}
        onClick={player.stop}
      >
        <Square size={16} />
      </button>
      <button
        className="icon-button"
        aria-label="Lyssna igen"
        title="Lyssna igen"
        disabled={!state.enabled || !state.last}
        onClick={player.repeat}
      >
        <RotateCcw size={17} />
      </button>
    </div>
  );
}

export function ListenButton({
  voice,
  clip,
  label = "Lyssna",
}: {
  voice: Voice;
  clip: VoiceClip | null;
  label?: string;
}) {
  if (!clip || !voice.player.canPlay(clip)) return null;
  return (
    <button
      className="text-button listen-button"
      onClick={() => voice.player.listen(clip)}
    >
      <Volume2 size={17} /> {label}
    </button>
  );
}

export function PlaybackControls({
  voice,
  clip,
  label,
}: {
  voice: Voice;
  clip: VoiceClip | null;
  label: string;
}) {
  return (
    <div
      className="playback-controls"
      role="group"
      aria-label="Lyssna på texten"
    >
      <ListenButton voice={voice} clip={clip} label={label} />
      <button
        className="text-button"
        disabled={!voice.state.active}
        onClick={voice.player.stop}
      >
        <Square size={15} /> Stoppa
      </button>
      <button
        className="text-button"
        disabled={!voice.state.enabled || !voice.state.last}
        onClick={voice.player.repeat}
      >
        <RotateCcw size={16} /> Lyssna igen
      </button>
      <button
        className="text-button"
        disabled={!voice.state.enabled}
        onClick={() => voice.player.setEnabled(false)}
      >
        Stäng av rösten
      </button>
    </div>
  );
}

export function VoiceStatus({ voice }: { voice: Voice }) {
  const { active, status, error } = voice.state;
  return (
    <p
      className={`voice-status ${error ? "voice-error" : ""}`}
      role="status"
      aria-live="polite"
    >
      {error ||
        (active
          ? `${status === "playing" ? "Spelar" : "Laddar röst"}: ${clipLabel(active)}`
          : "")}
    </p>
  );
}
