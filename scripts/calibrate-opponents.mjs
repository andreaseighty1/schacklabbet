import { Chess } from "chess.js";
import assert from "node:assert/strict";
import {
  EngineSession,
  enginePosition,
  chooseCandidate,
} from "../src/chess/engine.ts";
import { easyFeedbackMoves } from "../src/chess/fixtures/easy-feedback-game.ts";
import { nodeEnginePort } from "./node-engine-port.mjs";

// Compare selection on identical real Stockfish scores, isolating the policy change.
// This measures permitted mistakes, not Elo or a pupil's chance of winning.
let completed = [],
  batch = new Map(),
  depth = -1,
  completedDepth = -1,
  expected = 0;
const engine = new EngineSession(
  () => {
    const port = nodeEnginePort();
    return {
      get onmessage() {
        return port.onmessage;
      },
      set onmessage(handler) {
        port.onmessage = handler
          ? (event) => {
              const line = String(event.data);
              const info = line.match(
                /^info depth (\d+).*?multipv (\d+).*?score (cp|mate) (-?\d+).*? pv (\S+)/,
              );
              if (info && !/\b(upperbound|lowerbound)\b/.test(line)) {
                const nextDepth = Number(info[1]),
                  slot = Number(info[2]);
                if (nextDepth > depth) {
                  depth = nextDepth;
                  batch = new Map();
                }
                if (nextDepth === depth && slot <= expected)
                  batch.set(slot, {
                    move: info[5],
                    score: Number(info[4]),
                    mate: info[3] === "mate",
                  });
                if (batch.size === expected) {
                  completed = Array.from({ length: expected }, (_, i) =>
                    batch.get(i + 1),
                  );
                  completedDepth = depth;
                }
              }
              handler(event);
            }
          : null;
      },
      get onerror() {
        return port.onerror;
      },
      set onerror(handler) {
        port.onerror = handler;
      },
      postMessage(command) {
        if (command.startsWith("setoption name MultiPV value "))
          expected = Number(command.split(" ").at(-1));
        if (command.startsWith("go ")) {
          completed = [];
          batch = new Map();
          depth = completedDepth = -1;
        }
        port.postMessage(command);
      },
      terminate() {
        port.terminate();
      },
    };
  },
  () => 0.5,
);
function legacy(candidates, level, random) {
  const group = candidates.slice(0, level === 0 ? 5 : 3);
  const best = group[0];
  if (best.mate) return best.move;
  const choices = group.filter(
    (c) => !c.mate && best.score - c.score <= (level === 0 ? 250 : 120),
  );
  return choices[
    Math.min(choices.length - 1, Math.floor(random * choices.length))
  ].move;
}
function distribution(candidates, choose) {
  const bestScore = Math.max(
    ...candidates.filter((c) => !c.mate).map((c) => c.score),
  );
  const counts = new Map();
  for (let i = 0; i < 1000; i++) {
    const move = choose((i + 0.5) / 1000);
    counts.set(move, (counts.get(move) ?? 0) + 1);
  }
  let loss = 0,
    outside = 0;
  for (const [move, count] of counts) {
    const candidate = candidates.find((candidate) => candidate.move === move);
    if (!candidate.mate && Number.isFinite(bestScore))
      loss += ((bestScore - candidate.score) * count) / 1000;
    if (!candidates.slice(0, 3).some((candidate) => candidate.move === move))
      outside += count / 10;
  }
  return {
    distinctMoves: counts.size,
    expectedLossCp: Math.round(loss),
    outsideTopThreePercent: Math.round(outside),
  };
}
const rows = [];
try {
  const verified = new Chess();
  for (const uci of easyFeedbackMoves)
    verified.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci[4],
    });
  assert.ok(verified.isCheckmate());
  for (const moveNumber of [1, 6, 12, 19, 25, 27]) {
    const game = new Chess();
    for (const uci of easyFeedbackMoves.slice(0, moveNumber * 2 - 1))
      game.move({
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        promotion: uci[4],
      });
    for (const level of [0, 1]) {
      engine.reset();
      const chosen = await engine.search(
        enginePosition(game),
        level,
        new AbortController().signal,
      );
      assert.ok(
        game.moves({ verbose: true }).some((move) => move.lan === chosen),
      );
      assert.equal(
        completed.length,
        expected,
        "Real searches must finish a complete comparable batch",
      );
      const before = distribution(completed, (random) =>
        legacy(completed, level, random),
      );
      const after = distribution(completed, (random) =>
        chooseCandidate(completed, level, () => random),
      );
      rows.push({
        beforeBlackMove: moveNumber,
        level: level === 0 ? "Nybörjare" : "Lätt",
        legalMoves: expected,
        completedDepth,
        before,
        after,
      });
    }
  }
  for (const level of ["Nybörjare", "Lätt"]) {
    const samples = rows.filter((row) => row.level === level);
    assert.ok(
      samples.reduce(
        (sum, row) =>
          sum + row.after.expectedLossCp - row.before.expectedLossCp,
        0,
      ) > 0,
      `${level} must permit more inaccuracy on the reported game`,
    );
    assert.ok(
      samples.some((row) => row.after.outsideTopThreePercent > 20),
      `${level} must use the wider move pool in practice`,
    );
  }
  console.log(
    JSON.stringify(
      {
        method:
          "12 real WASM searches from six positions in the supplied game. 1,000 fixed probability samples per search, comparing old/new selection on the same shallow scores. Not an Elo estimate, match win-rate or proof of suitability for pupils.",
        rows,
      },
      null,
      2,
    ),
  );
} finally {
  engine.reset();
}
