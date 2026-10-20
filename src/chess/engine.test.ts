import { describe, it, expect, vi } from "vitest";
import { search, chooseCandidate, type WorkerPort } from "./engine";
function fakeWorker() {
  return {
    onmessage: null,
    onerror: null,
    postMessage: vi.fn(),
    terminate: vi.fn(),
  } as WorkerPort & {
    postMessage: ReturnType<typeof vi.fn>;
    terminate: ReturnType<typeof vi.fn>;
  };
}
describe("Stockfish-livscykel", () => {
  it("väntar på UCI och ready, återger drag och avslutar worker", async () => {
    const w = fakeWorker();
    const task = search("FEN", 2, new AbortController().signal, () => w);
    expect(w.postMessage).toHaveBeenCalledWith("uci");
    w.onmessage!({ data: "uciok" } as MessageEvent);
    expect(w.postMessage).toHaveBeenCalledWith("isready");
    w.onmessage!({ data: "readyok" } as MessageEvent);
    expect(w.postMessage).toHaveBeenCalledWith("position fen FEN");
    w.onmessage!({ data: "bestmove e2e4" } as MessageEvent);
    expect(await task).toBe("e2e4");
    expect(w.terminate).toHaveBeenCalledOnce();
  });
  it("avbryter beräkning och ignorerar försenat bestmove", async () => {
    const w = fakeWorker();
    const controller = new AbortController();
    const task = search("FEN", 0, controller.signal, () => w);
    const rejected = expect(task).rejects.toMatchObject({ name: "AbortError" });
    controller.abort();
    await rejected;
    w.onmessage!({ data: "bestmove e2e4" } as MessageEvent);
    expect(w.terminate).toHaveBeenCalledOnce();
  });
  it("startar inte worker om sökningen redan avbrutits", async () => {
    const controller = new AbortController();
    controller.abort();
    const factory = vi.fn(fakeWorker);
    await expect(
      search("FEN", 0, controller.signal, factory),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(factory).not.toHaveBeenCalled();
  });
  it("visar ett laddningsfel och städar worker", async () => {
    const w = fakeWorker();
    const task = search("FEN", 0, new AbortController().signal, () => w);
    w.onerror!({} as ErrorEvent);
    await expect(task).rejects.toThrow("kunde inte laddas");
    expect(w.terminate).toHaveBeenCalledOnce();
  });
  it("hanterar en motor som inte svarar", async () => {
    vi.useFakeTimers();
    try {
      const w = fakeWorker();
      const task = search("FEN", 0, new AbortController().signal, () => w);
      const rejected = expect(task).rejects.toThrow("svarar inte");
      await vi.advanceTimersByTimeAsync(15000);
      await rejected;
      expect(w.terminate).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });
  it("avvisar resultat utan drag", async () => {
    const w = fakeWorker();
    const task = search("FEN", 4, new AbortController().signal, () => w);
    w.onmessage!({ data: "bestmove (none)" } as MessageEvent);
    await expect(task).rejects.toThrow("inget drag");
  });
});
describe("begränsad nybörjarstyrka", () => {
  const candidates = [
    { move: "e2e4", score: 40, mate: false },
    { move: "d2d4", score: 10, mate: false },
    { move: "f2f3", score: -600, mate: false },
  ];
  it("kan variera mellan rimliga kandidatdrag", () => {
    expect(chooseCandidate(candidates, 0, () => 0.99)).toBe("d2d4");
  });
  it("väljer inte en kandidat med stor känd materialförlust", () => {
    for (let i = 0; i < 100; i++)
      expect(chooseCandidate(candidates, 0, () => i / 100)).not.toBe("f2f3");
  });
  it("behåller mattdrag och starka nivåers förstaval", () => {
    expect(
      chooseCandidate(
        [{ move: "e2e4", score: 1, mate: true }, ...candidates],
        0,
        () => 0.99,
      ),
    ).toBe("e2e4");
    expect(chooseCandidate(candidates, 4, () => 0.99)).toBe("e2e4");
  });
});
