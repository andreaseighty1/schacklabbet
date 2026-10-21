import { Chess } from "chess.js";
import assert from "node:assert/strict";
import { EngineSession, enginePosition } from "../src/chess/engine.ts";
import { nodeEnginePort } from "./node-engine-port.mjs";

const ports = [];
const engine = new EngineSession(() => {
  const port = nodeEnginePort();
  ports.push(port);
  return port;
});
const signal = () => new AbortController().signal;
const apply = (game, move) =>
  game.move({
    from: move.slice(0, 2),
    to: move.slice(2, 4),
    promotion: move[4],
  });
try {
  const game = new Chess();
  game.move("e4");
  apply(game, await engine.search(enginePosition(game), 0, signal()));
  game.move("Nf3");
  apply(game, await engine.search(enginePosition(game), 0, signal()));
  assert.equal(
    ports.length,
    1,
    "Färdiga sökningar ska återanvända samma motor",
  );
  assert.ok(
    ports[0].commands.some(
      (command) =>
        command.startsWith("position startpos moves e2e4 ") &&
        command.includes("g1f3"),
    ),
  );
  const hint = await engine.search(enginePosition(game), 4, signal());
  apply(game, hint);
  apply(game, await engine.search(enginePosition(game), 0, signal()));
  assert.equal(ports.length, 1);
  assert.equal(
    ports[0].commands.filter(
      (command) => command === "setoption name Clear Hash",
    ).length,
    2,
  );
  const controller = new AbortController();
  const task = engine.search(enginePosition(game), 4, controller.signal);
  const late = ports[0].onmessage;
  const rejected = assert.rejects(task, { name: "AbortError" });
  controller.abort();
  await rejected;
  const next = engine.search(enginePosition(game), 0, signal());
  late?.({ data: "bestmove e2e4" });
  apply(game, await next);
  assert.equal(ports.length, 2, "Avbrott ska ge en ny isolerad motor");
  for (const level of [0, 1, 4]) {
    engine.reset();
    const mate = new Chess("7k/5K2/8/8/8/8/8/R7 w - - 0 1");
    apply(mate, await engine.search(enginePosition(mate), level, signal()));
    assert.ok(mate.isCheckmate(), `Matt i ett ska hittas på nivå ${level}`);
  }
  engine.reset();
  const reviewBoard = new Chess();
  reviewBoard.loadPgn("1. e4 e5 2. Qh5 Nc6 *");
  const before = await engine.analyze(enginePosition(reviewBoard), signal());
  assert.ok(before.depth >= 8);
  assert.equal(before.score.kind, "cp");
  const variation = new Chess(reviewBoard.fen());
  before.pv.forEach((move) => apply(variation, move));
  reviewBoard.move("Qxe5+");
  const after = await engine.analyze(enginePosition(reviewBoard), signal());
  assert.equal(after.score.kind, "cp");
  assert.ok(after.depth >= 8);
  assert.ok(
    before.score.value + after.score.value >= 180,
    "Verklig motor ska upptäcka damförlusten från spelarens perspektiv",
  );
  assert.equal(after.move, "c6e5");
  console.log(
    "PASS: verklig Stockfish 19 WASM – lagliga drag, historik, återanvändning, avbrott, matt samt analys med laglig variant och upptäckt damförlust.",
  );
} finally {
  engine.reset();
}
