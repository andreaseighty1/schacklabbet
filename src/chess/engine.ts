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
export interface WorkerPort {
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage(message: string): void;
  terminate(): void;
}
/** One worker owns one search. Termination guarantees stale bestmove cannot enter a later game. */
export function search(
  fen: string,
  level: number,
  signal: AbortSignal,
  factory: () => WorkerPort = () =>
    new Worker(`${import.meta.env.BASE_URL}engine/stockfish-19-lite-single.js`),
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Avbruten", "AbortError"));
      return;
    }
    const worker = factory();
    const config = levels[level] ?? levels[0];
    const candidates = new Map<number, Candidate>();
    let settled = false;
    const finish = (error?: Error, move?: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      signal.removeEventListener("abort", abort);
      worker.terminate();
      if (error) reject(error);
      else resolve(move!);
    };
    const abort = () => finish(new DOMException("Avbruten", "AbortError"));
    const timeout = setTimeout(
      () => finish(new Error("Schackmotorn svarar inte. Försök igen.")),
      15000,
    );
    signal.addEventListener("abort", abort, { once: true });
    worker.onerror = () =>
      finish(
        new Error(
          "Schackmotorn kunde inte laddas. Kontrollera anslutningen och försök igen.",
        ),
      );
    worker.onmessage = ({ data }) => {
      if (settled) return;
      for (const line of String(data).split("\n")) {
        if (line === "uciok") {
          worker.postMessage(
            `setoption name Skill Level value ${config.skill}`,
          );
          worker.postMessage(
            `setoption name MultiPV value ${config.candidates}`,
          );
          worker.postMessage("setoption name Hash value 16");
          worker.postMessage("isready");
        } else if (line === "readyok") {
          worker.postMessage(`position fen ${fen}`);
          worker.postMessage(
            `go depth ${config.depth} movetime ${config.time}`,
          );
        } else if (line.startsWith("info ")) {
          const pv = line.match(/\bpv ([a-h][1-8][a-h][1-8][qrbn]?)/);
          const score = line.match(/score (cp|mate) (-?\d+)/);
          const slot = Number(line.match(/multipv (\d+)/)?.[1] || 1);
          if (pv && score)
            candidates.set(slot, {
              move: pv[1],
              score: Number(score[2]),
              mate: score[1] === "mate",
            });
        } else if (line.startsWith("bestmove ")) {
          const best = line.split(" ")[1];
          const chosen =
            level < 2
              ? chooseCandidate(
                  [...candidates.entries()]
                    .sort((a, b) => a[0] - b[0])
                    .map(([, v]) => v),
                  level,
                )
              : best;
          if (!chosen || chosen === "(none)" || chosen === "0000")
            finish(new Error("Motorn hittade inget drag."));
          else finish(undefined, chosen);
        }
      }
    };
    worker.postMessage("uci");
  });
}
