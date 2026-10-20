import { isAssistance, voiceUrl, type VoiceClip } from "./clips";

export interface VoiceState {
  enabled: boolean;
  assistanceAllowed: boolean;
  active: VoiceClip | null;
  last: VoiceClip | null;
  status: "idle" | "loading" | "playing";
  error: string;
}

/** One channel, no queue. A new request always cancels the previous clip. */
export class VoicePlayer {
  private state: VoiceState = {
    enabled: false,
    assistanceAllowed: true,
    active: null,
    last: null,
    status: "idle",
    error: "",
  };
  private audio: HTMLAudioElement | null = null;
  private generation = 0;
  private listeners = new Set<() => void>();

  constructor(
    private createAudio: () => HTMLAudioElement = () => new Audio(),
  ) {}

  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private update(change: Partial<VoiceState>) {
    this.state = { ...this.state, ...change };
    this.listeners.forEach((listener) => listener());
  }
  private release() {
    ++this.generation;
    if (!this.audio) return;
    this.audio.onended = null;
    this.audio.onerror = null;
    this.audio.pause();
    this.audio.removeAttribute("src");
    this.audio.load();
    this.audio = null;
  }
  stop = () => {
    this.release();
    this.update({ active: null, status: "idle", error: "" });
  };
  reset = () => {
    this.stop();
    this.update({ last: null });
  };
  setEnabled = (enabled: boolean) => {
    if (!enabled) this.reset();
    this.update({ enabled });
  };
  setAssistanceAllowed = (allowed: boolean) => {
    if (allowed === this.state.assistanceAllowed) return;
    if (!allowed && this.state.last && isAssistance(this.state.last))
      this.reset();
    this.update({ assistanceAllowed: allowed });
  };
  canPlay = (clip: VoiceClip) =>
    this.state.assistanceAllowed || !isAssistance(clip);

  /** Manual listening is also an explicit choice to turn the voice on. */
  listen = (clip: VoiceClip) => {
    if (!this.canPlay(clip)) return;
    this.setEnabled(true);
    this.play(clip);
  };
  repeat = () => {
    if (this.state.last) this.play(this.state.last);
  };
  play = (clip: VoiceClip) => {
    if (!this.state.enabled || !this.canPlay(clip)) return;
    this.release();
    const generation = this.generation;
    this.update({ active: clip, last: clip, status: "loading", error: "" });
    const fail = () => {
      if (generation !== this.generation) return;
      this.release();
      this.update({
        active: null,
        status: "idle",
        error:
          "Ljudet kunde inte spelas. Du kan läsa texten och försöka lyssna igen.",
      });
    };
    try {
      const audio = this.createAudio();
      this.audio = audio;
      audio.preload = "none";
      audio.src = voiceUrl(clip);
      audio.onended = () => {
        if (generation !== this.generation) return;
        this.release();
        this.update({ active: null, status: "idle" });
      };
      audio.onerror = fail;
      void audio
        .play()
        .then(() => {
          if (generation === this.generation)
            this.update({ status: "playing" });
        })
        .catch(fail);
    } catch {
      fail();
    }
  };
}
