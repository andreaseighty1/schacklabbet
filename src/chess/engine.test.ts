import { describe, it, expect, vi } from "vitest";
import { Chess, DEFAULT_POSITION } from "chess.js";
import {
  EngineSession,
  enginePosition,
  preparePosition,
  chooseCandidate,
  levels,
  type WorkerPort,
} from "./engine";
import { easyFeedbackMoves } from "./fixtures/easy-feedback-game";
const initial = () => enginePosition(new Chess());
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
function emit(worker: WorkerPort, data: string) {
  worker.onmessage?.({ data } as MessageEvent);
}
function ready(worker: WorkerPort) {
  emit(worker, "uciok");
  emit(worker, "readyok");
}

describe("bedömningar till efteranalys", () => {
  it("läser perspektiv, djup och en laglig variant utan att låta ett grundare svar ersätta den", async () => {
    const worker = fakeWorker();
    const engine = new EngineSession(() => worker);
    const task = engine.analyze(initial(), new AbortController().signal);
    ready(worker);
    emit(worker, "info depth 11 score cp 32 pv e2e4 e7e5 g1f3");
    emit(worker, "info depth 9 score cp -50 pv d2d4 d7d5");
    emit(worker, "info depth 12 score cp 60 lowerbound pv e2e4 e7e5");
    emit(worker, "bestmove e2e4");
    await expect(task).resolves.toEqual({
      move: "e2e4",
      score: { kind: "cp", value: 32 },
      depth: 11,
      pv: ["e2e4", "e7e5", "g1f3"],
    });
    engine.reset();
  });
  it("avvisar saknad bedömning, olaglig fortsättning och poäng för annat bästdrag", async () => {
    for (const info of [
      "",
      "info depth 12 score cp 20 pv e2e4 e7e4",
      "info depth 12 score cp 20 pv d2d4 d7d5",
    ]) {
      const worker = fakeWorker();
      const engine = new EngineSession(() => worker);
      const task = engine.analyze(initial(), new AbortController().signal);
      const rejection = expect(task).rejects.toThrow("hann inte bedöma");
      ready(worker);
      emit(worker, info);
      emit(worker, "bestmove e2e4");
      await rejection;
      engine.reset();
    }
  });
  it("behåller matt separat och avbryter även en analys", async () => {
    const worker = fakeWorker();
    const engine = new EngineSession(() => worker);
    const task = engine.analyze(initial(), new AbortController().signal);
    ready(worker);
    emit(worker, "info depth 10 score mate -3 pv e2e4 e7e5");
    emit(worker, "bestmove e2e4");
    expect((await task).score).toEqual({ kind: "mate", value: -3 });
    const controller = new AbortController();
    const pending = engine.analyze(initial(), controller.signal);
    const rejection = expect(pending).rejects.toMatchObject({
      name: "AbortError",
    });
    controller.abort();
    await rejection;
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
});

describe("fullständig motorhistorik", () => {
  it("bevarar upprepade ställningar och gör en fristående kopia", () => {
    const game = new Chess();
    ["Nf3", "Nf6", "Ng1", "Ng8", "Nf3", "Nf6", "Ng1", "Ng8"].forEach((move) =>
      game.move(move),
    );
    expect(game.isThreefoldRepetition()).toBe(true);
    const position = enginePosition(game);
    expect(preparePosition(position).command).toBe(
      "position startpos moves g1f3 g8f6 f3g1 f6g8 g1f3 g8f6 f3g1 f6g8",
    );
    game.undo();
    expect(position.moves).toHaveLength(8);
    const replay = new Chess(position.initialFen);
    position.moves.forEach((move) =>
      replay.move({
        from: move.slice(0, 2),
        to: move.slice(2, 4),
        promotion: move[4],
      }),
    );
    expect(replay.isThreefoldRepetition()).toBe(true);
  });
  it("bevarar annan startställning och bondeförvandling från sparad PGN", () => {
    const game = new Chess("7k/P7/8/8/8/8/8/7K w - - 0 1");
    game.move("a8=N");
    const loaded = new Chess();
    loaded.loadPgn(game.pgn());
    const position = enginePosition(loaded);
    expect(position.initialFen).toBe("7k/P7/8/8/8/8/8/7K w - - 0 1");
    expect(position.moves).toEqual(["a7a8n"]);
    expect(preparePosition(position).command).toBe(
      `position fen ${position.initialFen} moves a7a8n`,
    );
    expect(preparePosition(position).legal).toEqual(
      new Set(
        loaded
          .moves({ verbose: true })
          .map((m) => `${m.from}${m.to}${m.promotion ?? ""}`),
      ),
    );
  });
  it("validerar draghistoriken innan motorn startas", async () => {
    const factory = vi.fn(fakeWorker);
    const engine = new EngineSession(factory);
    await expect(
      engine.search(
        { initialFen: DEFAULT_POSITION, moves: ["e2e5"] },
        0,
        new AbortController().signal,
      ),
    ).rejects.toThrow("läsa partiets drag");
    await expect(
      engine.search(
        { initialFen: DEFAULT_POSITION + "\nquit", moves: [] },
        0,
        new AbortController().signal,
      ),
    ).rejects.toThrow("läsa partiets drag");
    expect(factory).not.toHaveBeenCalled();
  });
});

describe("återanvändbar Stockfish", () => {
  it("startar ingen motor när ställningen redan är matt", async () => {
    const game = new Chess("7k/6Q1/5K2/8/8/8/8/8 b - - 0 1");
    expect(game.isCheckmate()).toBe(true);
    const factory = vi.fn(fakeWorker);
    await expect(
      new EngineSession(factory).search(
        enginePosition(game),
        0,
        new AbortController().signal,
      ),
    ).rejects.toThrow("inget drag");
    expect(factory).not.toHaveBeenCalled();
  });
  it("släpper en färdig motor som havererar i vila och startar om vid nästa drag", async () => {
    const old = fakeWorker(),
      fresh = fakeWorker();
    const engine = new EngineSession(
      vi.fn().mockReturnValueOnce(old).mockReturnValueOnce(fresh),
    );
    const first = engine.search(initial(), 2, new AbortController().signal);
    ready(old);
    emit(old, "bestmove e2e4");
    await first;
    old.onerror!({} as ErrorEvent);
    expect(old.terminate).toHaveBeenCalledOnce();
    const second = engine.search(initial(), 2, new AbortController().signal);
    ready(fresh);
    emit(fresh, "bestmove d2d4");
    expect(await second).toBe("d2d4");
    engine.reset();
  });
  it("återanvänder motorn efter färdig sökning och väntar på nästa readyok", async () => {
    const worker = fakeWorker();
    const factory = vi.fn(() => worker);
    const engine = new EngineSession(factory);
    const first = engine.search(initial(), 2, new AbortController().signal);
    const oldHandler = worker.onmessage!;
    ready(worker);
    expect(worker.postMessage).toHaveBeenCalledWith("position startpos");
    emit(worker, "bestmove e2e4");
    expect(await first).toBe("e2e4");
    expect(worker.terminate).not.toHaveBeenCalled();
    const game = new Chess();
    game.move("e4");
    const second = engine.search(
      enginePosition(game),
      2,
      new AbortController().signal,
    );
    oldHandler({ data: "bestmove d2d4" } as MessageEvent);
    emit(worker, "bestmove d2d4"); // Old traffic before the ready barrier is ignored.
    emit(worker, "readyok");
    expect(worker.postMessage).toHaveBeenCalledWith(
      "position startpos moves e2e4",
    );
    emit(worker, "bestmove e7e5");
    expect(await second).toBe("e7e5");
    expect(factory).toHaveBeenCalledOnce();
    expect(
      worker.postMessage.mock.calls.filter(([line]) => line === "uci"),
    ).toHaveLength(1);
    engine.reset();
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
  it("nollställer djup analys när nivån byts, till exempel efter ett experttips", async () => {
    const worker = fakeWorker();
    const engine = new EngineSession(() => worker);
    for (const [i, level] of [0, 0, 4, 0].entries()) {
      const task = engine.search(
        initial(),
        level,
        new AbortController().signal,
      );
      if (!i) emit(worker, "uciok");
      emit(worker, "readyok");
      emit(worker, "bestmove e2e4");
      await task;
    }
    expect(
      worker.postMessage.mock.calls.filter(
        ([line]) => line === "setoption name Clear Hash",
      ),
    ).toHaveLength(2);
    expect(
      worker.postMessage.mock.calls.filter(([line]) => line === "ucinewgame"),
    ).toHaveLength(1);
    engine.reset();
  });
  it("avbrott dödar motorn och gamla callbacks kan inte påverka nästa sökning", async () => {
    const old = fakeWorker(),
      fresh = fakeWorker();
    const factory = vi.fn().mockReturnValueOnce(old).mockReturnValueOnce(fresh);
    const engine = new EngineSession(factory);
    const controller = new AbortController();
    const first = engine.search(initial(), 2, controller.signal);
    const rejected = expect(first).rejects.toMatchObject({
      name: "AbortError",
    });
    const late = old.onmessage!;
    ready(old);
    controller.abort();
    await rejected;
    const second = engine.search(initial(), 2, new AbortController().signal);
    late({ data: "readyok\nbestmove d2d4" } as MessageEvent);
    ready(fresh);
    emit(fresh, "bestmove e2e4");
    expect(await second).toBe("e2e4");
    expect(old.terminate).toHaveBeenCalledOnce();
    expect(factory).toHaveBeenCalledTimes(2);
    engine.reset();
  });
  it("en ny sökning avbryter en redan pågående utan att köa den", async () => {
    const old = fakeWorker(),
      fresh = fakeWorker();
    const engine = new EngineSession(
      vi.fn().mockReturnValueOnce(old).mockReturnValueOnce(fresh),
    );
    const first = engine.search(initial(), 2, new AbortController().signal);
    const rejected = expect(first).rejects.toMatchObject({
      name: "AbortError",
    });
    const second = engine.search(initial(), 4, new AbortController().signal);
    await rejected;
    ready(fresh);
    emit(fresh, "bestmove e2e4");
    expect(await second).toBe("e2e4");
    expect(old.terminate).toHaveBeenCalledOnce();
    engine.reset();
  });
  it("startar inte om signalen redan är avbruten", async () => {
    const factory = vi.fn(fakeWorker),
      controller = new AbortController();
    controller.abort();
    await expect(
      new EngineSession(factory).search(initial(), 2, controller.signal),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(factory).not.toHaveBeenCalled();
  });
  it("återhämtar sig från ett laddningsfel", async () => {
    const old = fakeWorker(),
      fresh = fakeWorker();
    const engine = new EngineSession(
      vi.fn().mockReturnValueOnce(old).mockReturnValueOnce(fresh),
    );
    const failed = engine.search(initial(), 2, new AbortController().signal);
    old.onerror!({} as ErrorEvent);
    await expect(failed).rejects.toThrow("kunde inte laddas");
    const next = engine.search(initial(), 2, new AbortController().signal);
    ready(fresh);
    emit(fresh, "bestmove e2e4");
    expect(await next).toBe("e2e4");
    engine.reset();
  });
  it("timeout stänger motorn och nästa försök kan starta på nytt", async () => {
    vi.useFakeTimers();
    try {
      const old = fakeWorker(),
        fresh = fakeWorker();
      const engine = new EngineSession(
        vi.fn().mockReturnValueOnce(old).mockReturnValueOnce(fresh),
      );
      const task = engine.search(initial(), 2, new AbortController().signal);
      const rejected = expect(task).rejects.toThrow("svarar inte");
      await vi.advanceTimersByTimeAsync(15000);
      await rejected;
      expect(old.terminate).toHaveBeenCalledOnce();
      const next = engine.search(initial(), 2, new AbortController().signal);
      ready(fresh);
      emit(fresh, "bestmove e2e4");
      await next;
      engine.reset();
    } finally {
      vi.useRealTimers();
    }
  });
  it.each(["(none)", "0000", "e2e5"])(
    "avvisar otillåtna svar: %s",
    async (move) => {
      const worker = fakeWorker(),
        engine = new EngineSession(() => worker);
      const task = engine.search(initial(), 4, new AbortController().signal);
      ready(worker);
      emit(worker, `bestmove ${move}`);
      await expect(task).rejects.toThrow("inget lagligt drag");
      expect(worker.terminate).toHaveBeenCalledOnce();
    },
  );
  it("hanterar fabrikfel och kritiska motorfel", async () => {
    const broken = new EngineSession(() => {
      throw new Error("unsupported Worker");
    });
    await expect(
      broken.search(initial(), 2, new AbortController().signal),
    ).rejects.toThrow("kunde inte laddas");
    const worker = fakeWorker(),
      engine = new EngineSession(() => worker);
    const task = engine.search(initial(), 2, new AbortController().signal);
    emit(worker, "info string CRITICAL ERROR invalid position");
    await expect(task).rejects.toThrow("kunde inte läsa ställningen");
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
  it("reset under pågående sökning avvisar svaret och nollställer partiet", async () => {
    const worker = fakeWorker(),
      engine = new EngineSession(() => worker);
    const task = engine.search(initial(), 2, new AbortController().signal);
    const rejected = expect(task).rejects.toMatchObject({ name: "AbortError" });
    engine.reset();
    await rejected;
    engine.reset();
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
  it("nybörjarval jämför bara en komplett uppsättning från samma sökdjup", async () => {
    const worker = fakeWorker(),
      engine = new EngineSession(() => worker);
    const task = engine.search(initial(), 0, new AbortController().signal);
    ready(worker);
    const moves = [...preparePosition(initial()).legal];
    expect(worker.postMessage).toHaveBeenCalledWith(
      "setoption name MultiPV value 20",
    );
    moves.forEach((move, i) =>
      emit(
        worker,
        `info depth 1 multipv ${i + 1} score cp ${40 - i * 5} pv ${move}`,
      ),
    );
    emit(worker, "info depth 2 multipv 1 score cp 2000 pv f2f3");
    const random = vi.spyOn(Math, "random").mockReturnValue(0.99);
    try {
      emit(worker, "bestmove f2f3");
      expect(await task).toBe(moves.at(-1));
    } finally {
      random.mockRestore();
      engine.reset();
    }
  });
  it("blir inte starkare på en långsam dator när jämförbara kandidatbedömningar saknas", async () => {
    const worker = fakeWorker(),
      engine = new EngineSession(
        () => worker,
        () => 0.99,
      );
    const task = engine.search(initial(), 0, new AbortController().signal);
    ready(worker);
    emit(worker, "info depth 3 multipv 1 score cp 50 upperbound pv d2d4");
    emit(worker, "info depth 3 multipv 2 score cp 20 pv e2e5");
    emit(worker, "bestmove e2e4");
    expect(await task).toBe([...preparePosition(initial()).legal].at(-1));
    engine.reset();
  });
});

describe("begränsad nybörjarstyrka", () => {
  it("jämför verkliga poäng även när MultiPV-radernas ordning inte följer poängen", () => {
    const scores = [
      { move: "a2a3", score: -100, mate: false },
      { move: "e2e4", score: 100, mate: false },
    ];
    expect(chooseCandidate(scores, 1, () => 0)).toBe("e2e4");
    expect(scores[0].move).toBe("a2a3");
    expect(
      chooseCandidate(
        [{ move: "a2a3", score: -1, mate: true }, ...scores],
        0,
        () => 0,
      ),
    ).toBe("e2e4");
  });
  const candidates = [
    { move: "e2e4", score: 40, mate: false },
    { move: "d2d4", score: 10, mate: false },
    { move: "f2f3", score: -600, mate: false },
  ];
  it("kan missa chanser och göra sämre drag på båda lägsta nivåerna", () => {
    expect(chooseCandidate(candidates, 0, () => 0.99)).toBe("f2f3");
    expect(chooseCandidate(candidates, 1, () => 0.999)).toBe("f2f3");
  });
  it("ger nybörjare fler missar men låter båda välja utanför den gamla topp-tre-gruppen", () => {
    const options = [400, 350, 200, 100, -100, -600].map((score, index) => ({
      move: String(index),
      score,
      mate: false,
    }));
    const losses = [0, 1].map((level) => {
      const picks = Array.from({ length: 1000 }, (_, index) =>
        Number(chooseCandidate(options, level, () => (index + 0.5) / 1000)),
      );
      expect(picks.some((pick) => pick > 2)).toBe(true);
      return (
        picks.reduce(
          (sum, pick) => sum + options[0].score - options[pick].score,
          0,
        ) / picks.length
      );
    });
    expect(losses[0]).toBeGreaterThan(losses[1] + 50);
  });
  it("behåller nivåernas ordning och efteranalysens starka motor", () => {
    expect(levels.slice(0, 2).map((level) => level.depth)).toEqual([1, 2]);
    expect(
      levels
        .slice(2)
        .map((level) => [level.skill, level.depth, level.candidates]),
    ).toEqual([
      [6, 8, 1],
      [12, 11, 1],
      [20, 15, 1],
    ]);
  });
  it("kan spela igenom hela det rapporterade partiet till den faktiska schackmatten", () => {
    const game = new Chess();
    for (const uci of easyFeedbackMoves)
      game.move({
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        promotion: uci[4],
      });
    expect(easyFeedbackMoves).toHaveLength(86);
    expect(game.isCheckmate()).toBe(true);
    expect(game.turn()).toBe("w");
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
