import {
  mkdir,
  copyFile,
  readdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
const root = path.resolve("node_modules/stockfish");
const files = await readdir(path.join(root, "bin"));
await mkdir("public/engine", { recursive: true });
for (const ext of ["js", "wasm"]) {
  const file = files.find((f) => f === `stockfish-19-lite-single.${ext}`);
  if (!file) throw new Error(`Stockfish lite single .${ext} saknas`);
  await copyFile(
    path.join(root, "bin", file),
    path.join("public/engine", file),
  );
}
await copyFile(path.join(root, "Copying.txt"), "public/engine/COPYING.txt");
for (const [file, expected] of [
  [
    "stockfish-js-19.0.1-source.tar.gz",
    "990a305ec413c84cf7ea0baa3726b90b2efa9efed02de02a9895b50ecc6c0607",
  ],
  [
    "nn-61e7af4bb97d.nnue",
    "61e7af4bb97d51eeeb25d322916f86513b5cd3a827ce189c98c6e31946f99e5b",
  ],
]) {
  const actual = createHash("sha256")
    .update(await readFile(path.join("public/licenses", file)))
    .digest("hex");
  if (actual !== expected)
    throw new Error(`Källkodsfilens kontrollsumma stämmer inte: ${file}`);
}
await writeFile(
  "public/engine/SOURCE.txt",
  "Stockfish.js 19.0.1, GPL-3.0. Unmodified npm binaries.\nCorresponding source: ../licenses/stockfish-js-19.0.1-source.tar.gz\nNetwork: ../licenses/nn-61e7af4bb97d.nnue\nUpstream: https://github.com/nmrugg/stockfish.js/tree/v19.0.1\nBuild: emscripten 6.0.9; node build.js --single-threaded --lite -f\n",
);
if (process.env.VITE_CUSTOM_DOMAIN) {
  const domain = process.env.VITE_CUSTOM_DOMAIN;
  if (
    !/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/i.test(domain) ||
    !domain.includes(".")
  )
    throw new Error("Ogiltig egen domän.");
  await writeFile("public/CNAME", `${domain}\n`);
} else {
  await import("node:fs/promises").then((fs) =>
    fs.rm("public/CNAME", { force: true }),
  );
}
