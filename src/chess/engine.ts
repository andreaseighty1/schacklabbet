import { Chess, DEFAULT_POSITION } from "chess.js";

export const levels = [
  {
    name: "Nybörjare",
    label: "Lugn och förlåtande",
    skill: 0,
    depth: 1,
    time: 300,
    candidates: "all",
  },
  {
    name: "Lätt",
    label: "Enkla hot och fler misstag",
    skill: 2,
    depth: 2,
    time: 300,
    candidates: "all",
  },
  {
    name: "Medel",
    label: "En klurig utmaning",
    skill: 6,
    depth: 8,
    time: 400,
    candidates: 1,
  },
  {
    name: "Svår",
    label: "Tänk ett steg längre",
    skill: 12,
    depth: 11,
    time: 650,
    candidates: 1,
  },
  {
    name: "Expert",
    label: "Sätt dig på prov",
    skill: 20,
    depth: 15,
    time: 1000,
    candidates: 1,
  },
];

export type Candidate = { move: string; score: number; mate: boolean };
export function chooseCandidate(
  candidates: Candidate[],
  level: number,
  random = Math.random,
): string | undefined {
  if (level > 1) return candidates[0]?.move;
  // A shallow MultiPV snapshot can arrive with scores out of slot order.
  // Compare the actual scores, without mutating the stored engine batch.
  const ranked = candidates
    .filter((c) => Number.isFinite(c.score))
    .sort((a, b) => {
      const category = (c: Candidate) => (c.mate ? (c.score > 0 ? 2 : 0) : 1);
      return (
        category(b) - category(a) ||
        (a.mate ? a.score - b.score : b.score - a.score)
      );
    });
  const best = ranked[0];
  if (!best) return;
  if (best.mate) return best.move;
  // Sampling only three near-best moves still creates a very strong opponent.
  // The lower levels deliberately allow inaccuracies and missed material gains.
  const temperature = level === 0 ? 450 : 180;
  const maximumLoss = level === 0 ? 1200 : 700;
  const choices = ranked.filter(
    (c) =>
      !c.mate &&
      Number.isFinite(c.score) &&
      best.score - c.score <= maximumLoss,
  );
  const weights = choices.map((c) =>
    Math.exp((c.score - best.score) / temperature),
  );
  let target =
    Math.max(0, Math.min(1, random())) *
    weights.reduce((sum, weight) => sum + weight, 0);
  for (const [index, candidate] of choices.entries()) {
    target -= weights[index];
    if (target <= 0) return candidate.move;
  }
  return choices.at(-1)?.move ?? best.move;
}

export interface EnginePosition {
  initialFen: string;
  moves: string[];
}
const uciMove = /^[a-h][1-8][a-h][1-8][qrbn]?$/;

/** Copy the full history now, before the live board can change. Also supports PGN SetUp/FEN games. */
export function enginePosition(game: Chess): EnginePosition {
  const history = game.history({ verbose: true });
  return {
    initialFen: history[0]?.before ?? game.fen(),
    moves: history.map(
      (move) => `${move.from}${move.to}${move.promotion ?? ""}`,
    ),
  };
}

export function preparePosition(position: EnginePosition) {
  if (/[\r\n]/.test(position.initialFen))
    throw new Error("Ogiltig motorställning.");
  const board = new Chess(position.initialFen);
  for (const move of position.moves) {
    if (!uciMove.test(move))
      throw new Error("Ogiltigt drag i motorhistoriken.");
    board.move({
      from: move.slice(0, 2),
      to: move.slice(2, 4),
      promotion: move[4],
    });
  }
  const legal = new Set(
    board
      .moves({ verbose: true })
      .map((move) => `${move.from}${move.to}${move.promotion ?? ""}`),
  );
  return {
    command: `position ${position.initialFen === DEFAULT_POSITION ? "startpos" : `fen ${position.initialFen}`}${position.moves.length ? ` moves ${position.moves.join(" ")}` : ""}`,
    board,
    legal,
  };
}

export interface EngineAnalysis {
  move: string;
  /** From the side to move's perspective; positive means an advantage. */
  score: { kind: "cp" | "mate"; value: number };
  depth: number;
  pv: string[];
}

export interface WorkerPort {
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage(message: string): void;
  terminate(): void;
}

/** Keep only successfully completed engines warm. Aborted/failed work always loses its worker. */
export class EngineSession {
  private factory: () => WorkerPort;
  private worker: WorkerPort | null = null;
  private initialized = false;
  private previousLevel: number | null = null;
  private active: { cancel: () => void } | null = null;
  private random: () => number;

  constructor(
    factory: () => WorkerPort = () =>
      new Worker(
        `${import.meta.env.BASE_URL}engine/stockfish-19-lite-single.js`,
      ),
    random: () => number = () => Math.random(),
  ) {
    this.factory = factory;
    this.random = random;
  }

  private drop(worker: WorkerPort) {
    worker.onmessage = null;
    worker.onerror = null;
    worker.terminate();
    if (this.worker === worker) {
      this.worker = null;
      this.initialized = false;
      this.previousLevel = null;
    }
  }

  reset() {
    this.active?.cancel();
    if (this.worker) this.drop(this.worker);
  }

  search(
    position: EnginePosition,
    level: number,
    signal: AbortSignal,
  ): Promise<string> {
    return this.run(position, level, signal).then((result) => result.move);
  }

  async analyze(
    position: EnginePosition,
    signal: AbortSignal,
  ): Promise<EngineAnalysis> {
    const result = await this.run(position, 4, signal);
    if (!result.analysis)
      throw new Error("Motorn hann inte bedöma ställningen. Försök igen.");
    return result.analysis;
  }

  private run(
    position: EnginePosition,
    level: number,
    signal: AbortSignal,
  ): Promise<{ move: string; analysis?: EngineAnalysis }> {
    return new Promise((resolve, reject) => {
      if (signal.aborted) {
        reject(new DOMException("Avbruten", "AbortError"));
        return;
      }
      let prepared: ReturnType<typeof preparePosition>;
      try {
        prepared = preparePosition(position);
      } catch {
        reject(new Error("Schackmotorn kunde inte läsa partiets drag."));
        return;
      }
      if (!prepared.legal.size) {
        reject(new Error("Motorn hittade inget drag."));
        return;
      }
      this.active?.cancel();
      let worker: WorkerPort;
      try {
        worker = this.worker ??= this.factory();
      } catch {
        reject(new Error("Schackmotorn kunde inte laddas. Försök igen."));
        return;
      }
      const index = Number.isInteger(level) && levels[level] ? level : 0;
      const config = levels[index];
      const expected =
        config.candidates === "all"
          ? prepared.legal.size
          : Math.min(Number(config.candidates), prepared.legal.size);
      let settled = false;
      let phase: "uci" | "ready" | "searching" = this.initialized
        ? "ready"
        : "uci";
      let currentDepth = -1;
      let batch = new Map<number, Candidate>();
      let completed: Candidate[] = [];
      let analysis: EngineAnalysis | undefined;
      const finish = (error?: Error, move?: string) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        signal.removeEventListener("abort", abort);
        if (this.active === task) this.active = null;
        if (error) {
          this.drop(worker);
          reject(error);
        } else {
          worker.onmessage = null;
          worker.onerror = () => {
            if (this.worker === worker) this.drop(worker);
          };
          resolve({
            move: move!,
            analysis: analysis?.move === move ? analysis : undefined,
          });
        }
      };
      const abort = () => finish(new DOMException("Avbruten", "AbortError"));
      const task = { cancel: abort };
      this.active = task;
      const timeout = setTimeout(
        () => finish(new Error("Schackmotorn svarar inte. Försök igen.")),
        15000,
      );
      signal.addEventListener("abort", abort, { once: true });
      const send = (command: string) => worker.postMessage(command);
      const configure = (fresh: boolean) => {
        phase = "ready";
        if (fresh) {
          send("setoption name Hash value 16");
          send("ucinewgame");
        } else if (this.previousLevel !== index) {
          // An expert hint must not leave deep cached analysis in the beginner opponent.
          send("setoption name Clear Hash");
        }
        send(`setoption name Skill Level value ${config.skill}`);
        send(`setoption name MultiPV value ${expected}`);
        this.previousLevel = index;
        send("isready");
      };
      worker.onerror = () =>
        finish(
          new Error(
            "Schackmotorn kunde inte laddas. Kontrollera anslutningen och försök igen.",
          ),
        );
      worker.onmessage = ({ data }) => {
        if (settled || this.worker !== worker) return;
        try {
          for (const text of String(data).split("\n")) {
            if (settled) return;
            const line = text.trim();
            if (line.includes("CRITICAL ERROR")) {
              finish(
                new Error(
                  "Schackmotorn kunde inte läsa ställningen. Försök igen.",
                ),
              );
              return;
            }
            if (phase === "uci" && line === "uciok") {
              this.initialized = true;
              configure(true);
            } else if (phase === "ready" && line === "readyok") {
              phase = "searching";
              send(prepared.command);
              send(`go depth ${config.depth} movetime ${config.time}`);
            } else if (phase === "searching" && line.startsWith("info ")) {
              const pv = line.match(
                /\bpv ([a-h][1-8][a-h][1-8][qrbn]?)(?:\s|$)/,
              );
              const score = line.match(/\bscore (cp|mate) (-?\d+)/);
              const depth = Number(line.match(/\bdepth (\d+)/)?.[1]);
              const slot = Number(line.match(/\bmultipv (\d+)/)?.[1] ?? 1);
              if (
                !pv ||
                !score ||
                !Number.isFinite(depth) ||
                !prepared.legal.has(pv[1]) ||
                /\b(?:upperbound|lowerbound)\b/.test(line) ||
                slot < 1 ||
                slot > expected ||
                depth < currentDepth
              )
                continue;
              if (
                slot === 1 &&
                index === 4 &&
                Number.isSafeInteger(Number(score[2]))
              ) {
                // Only expose legal continuations as teaching examples.
                const moves = line.split(/\bpv /)[1]?.trim().split(/\s+/) ?? [];
                const replay = new Chess(position.initialFen);
                try {
                  for (const uci of [...position.moves, ...moves]) {
                    if (!uciMove.test(uci)) throw new Error("Invalid PV");
                    replay.move({
                      from: uci.slice(0, 2),
                      to: uci.slice(2, 4),
                      promotion: uci[4],
                    });
                  }
                  analysis = {
                    move: pv[1],
                    score: {
                      kind: score[1] as "cp" | "mate",
                      value: Number(score[2]),
                    },
                    depth,
                    pv: moves,
                  };
                } catch {
                  /* Ignore incomplete or illegal engine variations. */
                }
              }
              if (depth > currentDepth) {
                currentDepth = depth;
                batch = new Map();
              }
              batch.set(slot, {
                move: pv[1],
                score: Number(score[2]),
                mate: score[1] === "mate",
              });
              if (batch.size === expected)
                completed = Array.from({ length: expected }, (_, i) =>
                  batch.get(i + 1)!,
                );
            } else if (phase === "searching" && line.startsWith("bestmove ")) {
              const best = line.split(/\s+/)[1];
              if (!prepared.legal.has(best)) {
                finish(
                  new Error("Motorn hittade inget lagligt drag. Försök igen."),
                );
                return;
              }
              let chosen = best;
              if (index < 2) {
                const compared = chooseCandidate(completed, index, this.random);
                if (compared) chosen = compared;
                else {
                  // A slow device must not silently turn Easy into Stockfish's best move.
                  // Still finish a directly verified mate-in-one when one is available.
                  prepared.board.move({
                    from: best.slice(0, 2),
                    to: best.slice(2, 4),
                    promotion: best[4],
                  });
                  const mate = prepared.board.isCheckmate();
                  prepared.board.undo();
                  const legal = [...prepared.legal];
                  chosen = mate
                    ? best
                    : legal[
                        Math.min(
                          legal.length - 1,
                          Math.floor(this.random() * legal.length),
                        )
                      ];
                }
              }
              finish(undefined, chosen);
            }
          }
        } catch {
          finish(new Error("Schackmotorn kunde inte svara. Försök igen."));
        }
      };
      try {
        if (this.initialized) configure(false);
        else send("uci");
      } catch {
        finish(new Error("Schackmotorn kunde inte starta. Försök igen."));
      }
    });
  }
}
