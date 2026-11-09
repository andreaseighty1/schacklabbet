import { readFile, writeFile } from "node:fs/promises";
import { Chess } from "chess.js";
const raw = await readFile("docs/daily/lichess-mate-in1-source.csv", "utf8");
// CSV with quoted multiline PGNs, not the native Lichess CSV layout.
const rows = [];
let row = [],
  field = "",
  quoted = false;
for (let i = 0; i < raw.length; i++) {
  const c = raw[i];
  if (c === '"') {
    if (quoted && raw[i + 1] === '"') {
      field += '"';
      i++;
    } else quoted = !quoted;
  } else if (c === "," && !quoted) {
    row.push(field);
    field = "";
  } else if (c === "\n" && !quoted) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
    row = [];
    field = "";
  } else field += c;
}
if (field) {
  row.push(field);
  rows.push(row);
}
const candidates = [];
for (const [pgn] of rows) {
  try {
    const game = new Chess();
    game.loadPgn(pgn);
    const history = game.history({ verbose: true });
    if (history.length !== 2 || !game.isCheckmate()) continue;
    const first = history[0],
      last = history[1];
    const before = new Chess(last.before);
    const pieces = before.board().flat().filter(Boolean).length;
    candidates.push({
      id: /training\/(\w+)/.exec(game.getHeaders().Site)?.[1],
      fen: last.before,
      originalFen: first.before,
      setupMove: first.from + first.to + (first.promotion ?? ""),
      answer: last.from + last.to + (last.promotion ?? ""),
      pieces,
      color: before.turn(),
      themes: game.getHeaders().Themes,
    });
  } catch {
    /* malformed mirror rows are not candidates */
  }
}
candidates.sort((a, b) => a.pieces - b.pieces || a.id.localeCompare(b.id));
const white = candidates.filter((x) => x.color === "w").slice(0, 5),
  black = candidates.filter((x) => x.color === "b").slice(0, 5);
const selected = white.flatMap((x, i) => [x, black[i]]);
await writeFile(
  "docs/daily/selected-lichess.json",
  JSON.stringify(
    {
      upstream: "https://database.lichess.org/#puzzles",
      mirror:
        "https://raw.githubusercontent.com/pwenker/chessli2/main/puzzles/mateIn1.csv",
      license: "CC0-1.0",
      selected,
    },
    null,
    2,
  ) + "\n",
);
console.log(JSON.stringify(selected, null, 2));
