import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import manifest from "../../docs/audio/fortsattning-manifest.json";
import available from "../audio/learning-available.json";
import { learningClip, isAssistance } from "../audio/clips";
import { curriculumLessons } from "./curriculum";

describe("fortsättningens inspelningspaket", () => {
  it("har unika, rena manus för varje uppdrag, ledtråd och motståndarsvar", () => {
    expect(new Set(manifest.clips.map((c) => c.id)).size).toBe(
      manifest.clips.length,
    );
    for (const lesson of curriculumLessons) {
      const cues = ["intro", "success"];
      if (lesson.steps)
        for (const [i, step] of lesson.steps.entries()) {
          if (i > 0) cues.push(`step-${i + 1}`);
          cues.push(`hint-${i + 1}`);
          if (step.reply) cues.push(`reply-${i + 1}`);
        }
      else cues.push("hint");
      const clips = manifest.clips.filter((c) => c.lessonId === lesson.id);
      expect(new Set(clips.map((c) => c.cue))).toEqual(new Set(cues));
      for (const clip of clips) {
        expect(clip.text).not.toMatch(/\b[A-H][1-8]\b/);
        expect(
          readFileSync(
            `docs/audio/elevenlabs-input/fortsattning/${clip.id}.txt`,
            "utf8",
          ),
        ).toBe(`${clip.text}\n`);
      }
    }
  });
  it("aktiverar bara levererade inspelningar och blockerar dem i tävlingsläget", () => {
    for (const clip of manifest.clips) {
      const delivered = existsSync(`public/audio/sv-SE/${clip.id}.mp3`);
      expect(learningClip(clip.lessonId, clip.cue)).toBe(
        delivered ? clip.id : null,
      );
      expect(isAssistance(`learning-${clip.lessonId}-${clip.cue}`)).toBe(true);
    }
    for (const id of available)
      expect(manifest.clips.some((c) => c.id === id)).toBe(true);
    expect(learningClip("constructor", "intro")).toBeNull();
  });
});
