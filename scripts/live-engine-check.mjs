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
  console.log(
    "PASS: verklig Stockfish 19 WASM – lagliga drag, full historik, återanvändning, experttips, avbrott/återstart och matt i ett på tre nivåer.",
  );
} finally {
  engine.reset();
}
