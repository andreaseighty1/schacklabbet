import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { curriculumLessons } from "../src/learning/curriculum.ts";

const folder = "docs/audio/elevenlabs-input/fortsattning";
await mkdir(folder, { recursive: true });
const words = ["", "ett", "två", "tre", "fyra", "fem", "sex", "sju", "åtta"];
const spoken = (text) =>
  text.replace(
    /\b([A-H])([1-8])\b/g,
    (_, file, rank) => `${file} ${words[Number(rank)]}`,
  );
const clips = [];
function add(exercise, cue, text) {
  clips.push({
    id: `learning-${exercise.id}-${cue}`,
    lessonId: exercise.id,
    cue,
    text: spoken(text),
  });
}
for (const exercise of curriculumLessons) {
  add(
    exercise,
    "intro",
    `${exercise.description}${exercise.steps ? ` ${exercise.steps[0].instruction}` : ""}`,
  );
  if (exercise.steps) {
    for (const [i, step] of exercise.steps.entries()) {
      if (i > 0) add(exercise, `step-${i + 1}`, step.instruction);
      add(exercise, `hint-${i + 1}`, step.hint);
      if (step.reply) add(exercise, `reply-${i + 1}`, step.reply.explanation);
    }
  } else add(exercise, "hint", exercise.hint);
  add(exercise, "success", exercise.success);
}
const manifest = {
  schemaVersion: 1,
  locale: "sv-SE",
  package: "FORTSÄTTNING",
  clips,
};
const available = [];
for (const clip of clips) {
  await writeFile(`${folder}/${clip.id}.txt`, `${clip.text}\n`, "utf8");
  try {
    if ((await stat(`public/audio/sv-SE/${clip.id}.mp3`)).size > 0)
      available.push(clip.id);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
const expected = new Set(clips.map((c) => `${c.id}.txt`));
for (const name of await readdir(folder)) {
  if (!expected.has(name))
    throw new Error(`Främmande manus i fortsättningspaketet: ${name}`);
}
// Only files actually delivered are exposed to the player; no speculative MP3 requests.
await writeFile(
  "src/audio/learning-available.json",
  `${JSON.stringify(available, null, 2)}\n`,
);
await writeFile(
  "docs/audio/fortsattning-manifest.json",
  `${JSON.stringify(manifest, null, 2)}\n`,
);
await writeFile(
  "docs/audio/FORTSATTNING-FILNAMN.txt",
  clips.map((c) => `${c.id}.mp3`).join("\n") + "\n",
);
const lines = [
  "# Fortsättningslektioner – manus för ElevenLabs",
  "",
  `${curriculumLessons.length} nya lektioner, ${clips.length} MP3-filer. ${available.length} filer är levererade. Befintliga 79 ljud behöver inte spelas in igen.`,
  "",
  "Använd samma lugna svenska röst som tidigare. Läs bara repliken under filnamnet. Språket är skrivet för årskurs 4. Rutnamn skrivs F fyra och G fem, utan fonetiska omskrivningar.",
  "",
  "Intro läses när eleven väljer att lyssna. Steg är nästa egna uppdrag, hint är ledtråden för just det steget, reply är det visade motståndarsvaret och success är avslutningen. Numret anger vilket eget drag repliken hör till. Spara med exakt filnamn i public/audio/sv-SE/. Rena texter finns i elevenlabs-input/fortsattning/.",
  "",
  "Lektionerna fungerar med text medan ljuden spelas in. Bygget kopplar bara in MP3-filer som faktiskt finns, även om du levererar ett kapitel i taget. Kör npm run prepare:voiceover efter leverans.",
  "",
];
for (const exercise of curriculumLessons) {
  lines.push(`## ${exercise.title}`, "");
  for (const clip of clips.filter((c) => c.lessonId === exercise.id))
    lines.push(`### ${clip.id}.mp3`, "", clip.text, "");
}
await writeFile("docs/audio/FORTSATTNING-MANUS.md", lines.join("\n"), "utf8");
console.log(
  `Fortsättningspaket: ${curriculumLessons.length} lektioner, ${clips.length} manus, ${available.length} levererade ljud.`,
);
