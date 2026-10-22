import { describe, expect, it, vi } from "vitest";
import manifest from "../../docs/audio/manifest.json";
import { exercises } from "../content";
import { exerciseClip, isAssistance, type VoiceClip } from "./clips";
import { VoicePlayer } from "./player";

class FakeAudio {
  src = "";
  preload = "";
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  play = vi.fn(() => Promise.resolve());
  pause = vi.fn();
  load = vi.fn();
  removeAttribute = vi.fn(() => {
    this.src = "";
  });
}
function setup() {
  const audio: FakeAudio[] = [];
  const factory = vi.fn(() => {
    const next = new FakeAudio();
    audio.push(next);
    return next as unknown as HTMLAudioElement;
  });
  const player = new VoicePlayer(factory);
  return { player, audio, factory };
}

describe("elevstyrd röst", () => {
  it("hämtar inget ljud innan eleven väljer och startar inte genom bara Röst på", () => {
    const { player, factory } = setup();
    player.play("game-player-check");
    player.repeat();
    expect(player.getSnapshot().enabled).toBe(false);
    expect(factory).not.toHaveBeenCalled();
    player.setEnabled(true);
    expect(factory).not.toHaveBeenCalled();
    player.listen("start-welcome");
    expect(factory).toHaveBeenCalledTimes(1);
    expect(player.getSnapshot().active).toBe("start-welcome");
  });

  it("stoppar omedelbart, kan upprepa från början och tömmer vid avstängning", async () => {
    const { player, audio } = setup();
    player.listen("lesson-rook-intro");
    await Promise.resolve();
    expect(player.getSnapshot().status).toBe("playing");
    player.stop();
    expect(audio[0].pause).toHaveBeenCalled();
    expect(audio[0].src).toBe("");
    expect(player.getSnapshot().active).toBeNull();
    player.repeat();
    expect(audio).toHaveLength(2);
    expect(audio[1].src).toBe("/audio/sv-SE/lesson-rook-intro.mp3");
    player.setEnabled(false);
    expect(audio[1].pause).toHaveBeenCalled();
    expect(player.getSnapshot().last).toBeNull();
    player.setEnabled(true);
    player.repeat();
    expect(audio).toHaveLength(2);
  });

  it("ersätter föregående klipp och ignorerar ett sent fel från den gamla uppspelningen", async () => {
    const first = new FakeAudio();
    const second = new FakeAudio();
    let reject!: (error: Error) => void;
    first.play.mockImplementation(
      () =>
        new Promise((_, no) => {
          reject = no;
        }),
    );
    const factory = vi
      .fn()
      .mockReturnValueOnce(first)
      .mockReturnValueOnce(second);
    const player = new VoicePlayer(factory);
    player.listen("lesson-knight-intro");
    const oldError = first.onerror!;
    player.listen("lesson-knight-hint");
    expect(first.pause).toHaveBeenCalled();
    oldError();
    reject(new Error("old request"));
    await vi.waitFor(() => expect(player.getSnapshot().status).toBe("playing"));
    expect(player.getSnapshot().active).toBe("lesson-knight-hint");
    expect(player.getSnapshot().error).toBe("");
  });

  it("ett sent play-svar får inte återstarta ljud efter stopp", async () => {
    const audio = new FakeAudio();
    let resolve!: () => void;
    audio.play.mockImplementation(
      () =>
        new Promise<void>((yes) => {
          resolve = yes;
        }),
    );
    const player = new VoicePlayer(() => audio as unknown as HTMLAudioElement);
    player.listen("start-welcome");
    player.stop();
    resolve();
    await Promise.resolve();
    expect(player.getSnapshot().status).toBe("idle");
    expect(player.getSnapshot().active).toBeNull();
  });

  it("skyddar tävlingsprofilen även från återuppspelning och sena svar", async () => {
    const { player, audio, factory } = setup();
    player.listen("game-player-check");
    player.setAssistanceAllowed(false);
    expect(audio[0].pause).toHaveBeenCalled();
    expect(player.getSnapshot().last).toBeNull();
    player.repeat();
    player.listen("game-move-risk");
    player.play("help-move-piece");
    expect(factory).toHaveBeenCalledTimes(1);
    await Promise.resolve();
    expect(player.getSnapshot().active).toBeNull();
    player.listen("help-audio-controls");
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it("sidbyte tömmer uppspelningen och det gamla klippet går inte att upprepa", () => {
    const { player, audio } = setup();
    player.listen("lesson-castle-intro");
    player.reset();
    player.repeat();
    expect(audio).toHaveLength(1);
    expect(audio[0].pause).toHaveBeenCalled();
    expect(player.getSnapshot().last).toBeNull();
  });

  it("visar ett begripligt fel och tillåter nytt försök", async () => {
    const audio = new FakeAudio();
    audio.play.mockRejectedValueOnce(new Error("blocked"));
    const player = new VoicePlayer(() => audio as unknown as HTMLAudioElement);
    player.listen("start-welcome");
    await vi.waitFor(() =>
      expect(player.getSnapshot().error).toContain("Du kan läsa texten"),
    );
    expect(player.getSnapshot().active).toBeNull();
    player.repeat();
    await Promise.resolve();
    expect(player.getSnapshot().error).toBe("");
    expect(player.getSnapshot().status).toBe("playing");
    audio.onended!();
    expect(player.getSnapshot().active).toBeNull();
    expect(player.getSnapshot().last).toBe("start-welcome");
  });

  it("kopplar exakt de 79 levererade filerna och inga framtida repliker", () => {
    const mapped: (VoiceClip | null)[] = exercises.flatMap((exercise) =>
      (["intro", "hint", "success"] as const).map((cue) =>
        exerciseClip(exercise.id, cue),
      ),
    );
    mapped.push(
      "start-welcome",
      "help-move-piece",
      "help-audio-controls",
      "exercise-try-again",
      "exercise-move-not-allowed",
      "game-player-check",
      "game-move-risk",
    );
    const delivered = manifest.clips
      .filter((clip) => ["P1", "SKOLA", "TAKTIK"].includes(clip.priority))
      .map((clip) => clip.id);
    expect(new Set(mapped.filter((clip) => clip !== null))).toEqual(
      new Set(delivered),
    );
    for (const clip of manifest.clips.filter(
      (clip) => ["SKOLA", "TAKTIK"].includes(clip.priority),
    )) {
      expect(
        exerciseClip(clip.lessonId!, clip.cue as "intro" | "hint" | "success"),
      ).toBe(clip.id);
    }
    expect(exerciseClip("unknown", "intro")).toBeNull();
    expect(exerciseClip("constructor", "intro")).toBeNull();
    expect(isAssistance("game-player-check")).toBe(true);
    expect(isAssistance("help-audio-controls")).toBe(false);
  });
});
