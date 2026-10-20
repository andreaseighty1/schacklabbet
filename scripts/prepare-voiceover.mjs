import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";

const root = "docs/audio";
const manifest = JSON.parse(
  await readFile(path.join(root, "manifest.json"), "utf8"),
);
assert.equal(manifest.schemaVersion, 1);
assert.equal(manifest.defaultVoiceEnabled, false);
assert.equal(manifest.playbackRequiresUserChoice, true);
const ids = new Set();
for (const clip of manifest.clips) {
  assert.match(clip.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.ok(!ids.has(clip.id), `Duplicerat filnamn: ${clip.id}`);
  ids.add(clip.id);
  assert.ok(["P1", "P2", "P3"].includes(clip.priority));
  assert.ok(["current", "planned"].includes(clip.phase));
  assert.ok(clip.text.trim().length > 0 && clip.trigger.trim().length > 0);
  assert.ok(
    clip.phase !== "planned" || clip.priority === "P3",
    "Kommande funktioner får inte ingå i första inspelningsomgången",
  );
  assert.ok(
    !/[a-h][1-8]\b/.test(clip.text),
    "Rutor ska skrivas med uttalsvänliga ord i inspelningsmanuset",
  );
}
const content = await readFile("src/content.ts", "utf8");
const exerciseIds = [...content.matchAll(/\bid:\s*"([^"]+)"/g)].map(
  (m) => m[1],
);
for (const id of exerciseIds) {
  for (const cue of ["intro", "hint", "success"])
    assert.equal(
      manifest.clips.filter((c) => c.lessonId === id && c.cue === cue).length,
      1,
      `Saknar en unik ${cue} för ${id}`,
    );
}
for (const clip of manifest.clips.filter((c) => c.lessonId))
  assert.ok(exerciseIds.includes(clip.lessonId));

const lines = [
  "# Schacklabbet – röstmanus för ElevenLabs",
  "",
  "Det här är ett inspelningsunderlag. Ljuduppspelning är ännu inte inkopplad i appen och inga ljudfiler har genererats.",
  "",
  "## Börja här",
  "",
  "Gör först ett röstprov med `start-welcome.mp3`, `lesson-knight-intro.mp3` och `game-player-check.mp3`. När röst och uttal känns rätt, fortsätt med P1. P2 kan göras därefter. Vänta med P3: funktionerna för klocka och multiplayer är ännu inte implementerade.",
  "",
  "Varje textfil i `elevenlabs-input/` innehåller endast orden som ska sägas. Ladda upp eller klistra in innehållet i ElevenLabs och spara ljudet med samma basnamn, men ändelsen `.mp3`. Exempel: `lesson-rook-intro.txt` → `lesson-rook-intro.mp3`.",
  "",
  "## Röstregi",
  "",
  "- Svenska, varm och lugn vuxen röst. Tala tydligt till elever omkring nio till tolv år, utan att låta barnslig.",
  "- Naturligt och uppmuntrande, med korta pauser mellan tankarna. Varningar ska låta eftertänksamma, inte alarmerande.",
  "- Samma röst och ungefär samma ljudnivå i alla filer. Ingen musik, ljudeffekter, extra hälsningsfras eller påhittad avslutning.",
  "- Leverera MP3, en replik per fil. Inga inledande eller avslutande långa tystnader och inga avklippta ord.",
  "- Läs endast själva manustexten. Läs inte upp filnamn, prioritet, användning eller inspelningsnoteringar.",
  "",
  "## Uttal",
  "",
  "Rutnamn är utskrivna för uppläsning: `a ett`, `be två`, `se tre`, `de fyra`, `e fem`, `eff sex`, `ge sju`, `hå åtta`. Säg bokstaven och siffran tydligt, med en liten paus. Exempel: `ge sju` betyder rutan `g7`, inte ordet ”gesju”.",
  "",
  "Använd ”dam”, ”springare”, ”löpare”, ”torn”, ”bonde” och ”kung” konsekvent. ”Remi” betyder oavgjort. ”Patt” är en särskild remiorsak. Kontrollera uttalet av ”Schacklabbet”, ”rockad” och ”remi” i röstproven.",
  "",
  "## Eleven styr rösten",
  "",
  "- Rösten är av vid första besöket. Inget ljud startar automatiskt när sidan öppnas.",
  "- En tydlig kontroll växlar mellan **Röst av** och **Röst på**. Att stänga av stoppar pågående uppläsning direkt och tar bort väntande repliker.",
  "- Lektioner har **Lyssna**, **Stoppa** och **Lyssna igen**. Ett stopp ändrar inte spelläget och ”Lyssna igen” börjar från början.",
  "- Röstvalet kan sparas lokalt på samma sätt som andra inställningar. Ett sparat på-läge får inte tvinga fram ljud vid omladdning; eleven ska kunna välja när uppspelning börjar.",
  "- Spela högst ett klipp åt gången. Ett nytt manuellt klipp ersätter det föregående. Sidbyte, nytt parti och avstängning avbryter tidigare ljud.",
  "- Läs inte upp något vid varje klick på en pjäs eller varje omrendering. Turmeddelanden och belöningar får inte upprepas. Slutresultat har företräde framför ”din tur” och ”schack”.",
  "- Tävlingsprofilen får inga talade tips eller hotvarningar. Röst får inte bli en väg runt avstängda hjälpmedel.",
  "- Röst är en egen inställning, separat från eventuella framtida dragljud. All viktig information finns också i text.",
  "",
  "## Fasta repliker och varierande information",
  "",
  "Vi spelar in hela, naturliga repliker. Vi spelar inte in alla tänkbara kombinationer av pjäs, färg och ruta. Vid ett konkret slaghot läser första versionen därför den generella varningen och visar exakt angripare och rutor i text och på brädet. Samma sak gäller motorförslag, spelkoder och positionsbundna ledtrådar.",
  "",
  "## Leverans",
  "",
  "Lägg färdiga ljudfiler i `public/audio/sv-SE/`, eller skicka dem samlade i en ZIP med oförändrade filnamn. P1 räcker för första omgången. MP3-filerna ska ligga direkt i mappen, utan ytterligare undermappar.",
  "",
  "Inga ElevenLabs-nycklar eller elevuppgifter behövs i frontend. Inspelade filer kommer att hämtas från samma webbplats som spelet.",
  "",
];

const counts = {};
for (const priority of ["P1", "P2", "P3"]) {
  const clips = manifest.clips.filter((c) => c.priority === priority);
  counts[priority] = clips.length;
  const folder = path.join(root, "elevenlabs-input", priority.toLowerCase());
  await mkdir(folder, { recursive: true });
  const expected = new Set(clips.map((c) => `${c.id}.txt`));
  for (const filename of await readdir(folder))
    assert.ok(
      expected.has(filename),
      `Gammalt eller främmande manus i paketet: ${filename}`,
    );
  lines.push(
    `## ${priority} – ${priority === "P1" ? "första inspelningsomgången" : priority === "P2" ? "fler spelhändelser och belöningar" : "framtida funktioner – vänta med inspelning"} (${clips.length} filer)`,
    "",
  );
  for (const clip of clips) {
    await writeFile(
      path.join(folder, `${clip.id}.txt`),
      `${clip.text}\n`,
      "utf8",
    );
    lines.push(
      `### ${clip.id}.mp3`,
      "",
      `**Användning:** ${clip.trigger}.`,
      "",
      clip.text,
      "",
    );
    if (clip.notes)
      lines.push(`**Notering – läses inte upp:** ${clip.notes}`, "");
  }
}
await writeFile(path.join(root, "ROSTMANUS.md"), lines.join("\n"), "utf8");
await writeFile(
  path.join(root, "expected-files.txt"),
  manifest.clips.map((c) => `${c.priority}\t${c.id}.mp3`).join("\n") + "\n",
  "utf8",
);
const firstBatch = manifest.clips.filter((clip) => clip.priority === "P1");
const firstLines = [
  "# Schacklabbet – första röstomgången (25 MP3-filer)",
  "",
  "Börja med tre prov: `start-welcome.mp3`, `lesson-knight-intro.mp3` och `game-player-check.mp3`. Lyssna på tonläge, tempo och rutnamn innan du gör resten.",
  "",
  "Välj en varm, lugn svensk vuxenröst, tydlig för nio till tolv år. Samma röst och ljudnivå i alla filer. Ingen bakgrundsmusik eller extra text. Läs endast repliken under varje filnamn, inte rubriken eller användningsinformationen.",
  "",
  "I ZIP-paketets mapp `p1/` finns en ren textfil per klipp. I repositoryt ligger samma filer under `docs/audio/elevenlabs-input/p1/`. Byt bara ändelse från `.txt` till `.mp3` när du sparar ljudet. Använd filnamnen exakt. Leverera de 25 MP3-filerna i en ZIP, eller lägg dem i `public/audio/sv-SE/`.",
  "",
  "Rutnamn skrivs med uttal: `de fyra` = d4, `eff fem` = f5, `ge sju` = g7, `hå-linjen` = h-linjen. Säg bokstav och siffra tydligt. Säg bokstaven L som ”ell”.",
  "",
  "Rösten kommer att vara av från början. Eleven får Röst på/av samt Lyssna, Stoppa och Lyssna igen. Inget ljud startar automatiskt när sidan öppnas. Ljudspelaren kopplas in när MP3-filerna levererats.",
  "",
];
for (const clip of firstBatch) {
  firstLines.push(
    `## ${clip.id}.mp3`,
    "",
    `**Användning – läses inte upp:** ${clip.trigger}.`,
    "",
    clip.text,
    "",
  );
}
await writeFile(path.join(root, "P1-MANUS.md"), firstLines.join("\n"), "utf8");
await writeFile(
  path.join(root, "P1-FILNAMN.txt"),
  firstBatch.map((clip) => `${clip.id}.mp3`).join("\n") + "\n",
  "utf8",
);
console.log(
  `Röstpaket klart: ${manifest.clips.length} manus. ${Object.entries(counts)
    .map(([p, n]) => `${p}: ${n}`)
    .join(
      ", ",
    )}. Alla ${exerciseIds.length} övningar har intro, ledtråd och återkoppling.`,
);
