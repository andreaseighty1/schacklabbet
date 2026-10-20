import { Chess } from "chess.js";
import assert from "node:assert/strict";
import { EngineSession, enginePosition, levels } from "../src/chess/engine.ts";
import { nodeEnginePort } from "./node-engine-port.mjs";

const apply = (game, move) =>
  game.move({
    from: move.slice(0, 2),
    to: move.slice(2, 4),
    promotion: move[4],
  });
const round = (value) => Math.round(value * 10) / 10;
const median = (values) =>
  [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const scenarios = [
  "1. e4 *",
  "1. e4 e5 2. Nf3 *",
  "1. e4 e5 2. Nf3 Nc6 3. Bb5 *",
];
let freshWorkers = 0,
  reusedWorkers = 0;
const warm = new EngineSession(() => {
  reusedWorkers++;
  return nodeEnginePort();
});
const samples = [];
try {
  for (let i = 0; i < 6; i++) {
    const game = new Chess();
    game.loadPgn(scenarios[i % scenarios.length]);
    const position = enginePosition(game);
    const fresh = new EngineSession(() => {
      freshWorkers++;
      return nodeEnginePort();
    });
    let freshMs;
    try {
      const start = performance.now();
      const move = await fresh.search(
        position,
        0,
        new AbortController().signal,
      );
      freshMs = round(performance.now() - start);
      apply(new Chess(game.fen()), move);
    } finally {
      fresh.reset();
    }
    const start = performance.now();
    const move = await warm.search(position, 0, new AbortController().signal);
    const reusedMs = round(performance.now() - start);
    apply(new Chess(game.fen()), move);
    samples.push({ pgn: scenarios[i % scenarios.length], freshMs, reusedMs });
  }
} finally {
  warm.reset();
}
assert.equal(freshWorkers, 6);
assert.equal(reusedWorkers, 1);
const levelChecks = [];
const engine = new EngineSession(nodeEnginePort);
try {
  for (const [level, config] of levels.entries()) {
    engine.reset();
    const game = new Chess();
    game.loadPgn("1. e4 e5 2. Nf3 Nc6 3. Bb5 *");
    const start = performance.now();
    const move = await engine.search(
      enginePosition(game),
      level,
      new AbortController().signal,
    );
    apply(game, move);
    levelChecks.push({
      name: config.name,
      skill: config.skill,
      maxDepth: config.depth,
      searchBudgetMs: config.time,
      totalIncludingStartupMs: round(performance.now() - start),
      move,
      legal: true,
    });
  }
} finally {
  engine.reset();
}
console.log(
  JSON.stringify(
    {
      environment: {
        runtime: process.version,
        platform: process.platform,
        architecture: process.arch,
        browser: false,
      },
      limits:
        "Lokalt Node/WASM-prov med sex öppningssökningar. Första återanvända sökningen inkluderar uppstart. Ingen mätning på elevdator, ingen Elo-kalibrering och ingen generell hastighetsgaranti.",
      workers: { fresh: freshWorkers, reused: reusedWorkers },
      medianFollowingFirstMs: {
        fresh: median(samples.slice(1).map((sample) => sample.freshMs)),
        reused: median(samples.slice(1).map((sample) => sample.reusedMs)),
      },
      samples,
      levelChecks,
    },
    null,
    2,
  ),
);
