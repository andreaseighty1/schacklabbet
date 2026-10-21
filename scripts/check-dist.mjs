import { readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
const index = await readFile("dist/index.html", "utf8");
const base = process.env.VITE_BASE_PATH || "/";
for (const path of [...index.matchAll(/(?:src|href)="([^"]+)"/g)].map(
  (m) => m[1],
)) {
  if (path.startsWith("http")) continue;
  assert.ok(path.startsWith(base), `Fel base path för ${path}`);
  await stat(`dist/${path.slice(base.length)}`);
}
const wasm = await readFile("dist/engine/stockfish-19-lite-single.wasm");
assert.ok(WebAssembly.validate(wasm), "WASM måste vara giltig");
for (const file of [
  "stockfish-19-lite-single.js",
  "stockfish-19-lite-single.wasm",
]) {
  const built = await readFile(`dist/engine/${file}`),
    original = await readFile(`node_modules/stockfish/bin/${file}`);
  assert.equal(
    createHash("sha256").update(built).digest("hex"),
    createHash("sha256").update(original).digest("hex"),
  );
}
for (const path of [
  "engine/COPYING.txt",
  "engine/SOURCE.txt",
  "licenses/stockfish-js-19.0.1-source.tar.gz",
  "licenses/nn-61e7af4bb97d.nnue",
])
  assert.ok((await stat(`dist/${path}`)).size > 0);
const voiceManifest = JSON.parse(
  await readFile("docs/audio/manifest.json", "utf8"),
);
const voiceClips = voiceManifest.clips.filter((clip) =>
  ["P1", "SKOLA"].includes(clip.priority),
);
for (const clip of voiceClips) {
  const file = `audio/sv-SE/${clip.id}.mp3`;
  const original = await readFile(`public/${file}`);
  assert.ok(original.length > 0, `Tom röstfil: ${file}`);
  const built = await readFile(`dist/${file}`);
  assert.equal(
    createHash("sha256").update(built).digest("hex"),
    createHash("sha256").update(original).digest("hex"),
    `Ändrad röstfil: ${file}`,
  );
}
console.log(
  `PASS: statiska resursvägar (${base}), oförändrad motor, giltig WASM, GPL-källfiler och ${voiceClips.length} oförändrade röstfiler.`,
);
