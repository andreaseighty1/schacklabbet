import { Chess, DEFAULT_POSITION } from "chess.js";

export const levels = [
  {
    name: "Nybörjare",
    label: "Ta dina första steg",
    skill: 0,
    depth: 3,
    time: 180,
    candidates: 5,
  },
  {
    name: "Lätt",
    label: "Hitta ditt flyt",
    skill: 2,
    depth: 5,
    time: 240,
    candidates: 3,
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

type Candidate = { move: string; score: number; mate: boolean };
export function chooseCandidate(
  candidates: Candidate[],
  level: number,
  random = Math.random,
): string | undefined {
  const best = candidates[0];
  if (!best) return;
  if (level > 1 || best.mate) return best.move;
  const choices = candidates.filter(
    (c) => !c.mate && best.score - c.score <= (level === 0 ? 250 : 120),
  );
  return (
    choices[Math.min(choices.length - 1, Math.floor(random() * choices.length))]
      ?.move || best.move
  );
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
    legal,
  };
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

  constructor(
    factory: () => WorkerPort = () =>
      new Worker(
        `${import.meta.env.BASE_URL}engine/stockfish-19-lite-single.js`,
      ),
  ) {
    this.factory = factory;
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
      const expected = Math.min(config.candidates, prepared.legal.size);
      let settled = false;
      let phase: "uci" | "ready" | "searching" = this.initialized
        ? "ready"
        : "uci";
      let currentDepth = -1;
      let batch = new Map<number, Candidate>();
      let completed: Candidate[] = [];
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
          resolve(move!);
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
        send(`setoption name MultiPV value ${config.candidates}`);
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
              const chosen =
                index < 2 ? (chooseCandidate(completed, index) ?? best) : best;
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
