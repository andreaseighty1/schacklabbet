import { describe, it, expect } from "vitest";
import { Chess } from "chess.js";
import {
  capturesAgainst,
  threats,
  previewRisk,
  resultText,
  playUci,
  capturedPieces,
  concreteClue,
  updateResultHeader,
} from "./model";
describe("schackmodell", () => {
  it("skriver korrekt resultat till exporterad PGN", () => {
    const g = new Chess();
    ["f3", "e5", "g4", "Qh4#"].forEach((m) => g.move(m));
    updateResultHeader(g);
    expect(g.getHeaders().Result).toBe("0-1");
    expect(g.pgn()).toContain("0-1");
    const fresh = new Chess();
    updateResultHeader(fresh, "b");
    expect(fresh.getHeaders().Result).toBe("1-0");
  });
  it("ger en konkret ledtråd utifrån den verkliga positionen", () => {
    const g = new Chess();
    expect(concreteClue(g, "w")).toContain("springare");
    g.move("e4");
    g.move("g6");
    g.move("Qh5");
    expect(concreteClue(g, "w")).toContain("h5");
    expect(concreteClue(g, "w")).toContain("g6");
  });
  it("validerar turordning och olagliga drag", () => {
    const g = new Chess();
    expect(g.moves()).toHaveLength(20);
    expect(() => g.move({ from: "e7", to: "e5" })).toThrow();
    g.move("e4");
    expect(g.turn()).toBe("b");
    expect(() => g.move({ from: "e4", to: "e5" })).toThrow();
  });
  it("upptäcker schackmatt och rätt vinnare", () => {
    const g = new Chess();
    ["f3", "e5", "g4", "Qh4#"].forEach((m) => g.move(m));
    expect(g.isCheckmate()).toBe(true);
    expect(resultText(g)).toContain("Svart vinner");
  });
  it("upptäcker patt separat från matt", () => {
    const g = new Chess("7k/5K2/6Q1/8/8/8/8/8 b - - 0 1");
    expect(g.isCheck()).toBe(false);
    expect(resultText(g)).toBe("Remi – patt");
  });
  it("gör rockad med kung och torn", () => {
    const g = new Chess("4k3/8/8/8/8/8/8/4K2R w K - 0 1");
    g.move("O-O");
    expect(g.get("g1")?.type).toBe("k");
    expect(g.get("f1")?.type).toBe("r");
  });
  it("tillåter inte rockad genom en angripen ruta", () => {
    const g = new Chess("4kr2/8/8/8/8/8/8/4K2R w K - 0 1");
    expect(g.moves()).not.toContain("O-O");
  });
  it("hanterar en passant och hotad ruta", () => {
    const g = new Chess();
    ["e4", "a6", "e5", "d5"].forEach((m) => g.move(m));
    expect(
      threats(g, "b").some((t) => t.square === "d5" && t.from === "e5"),
    ).toBe(true);
    g.move("exd6");
    expect(g.get("d5")).toBeUndefined();
    expect(g.get("d6")?.type).toBe("p");
    expect(capturedPieces(g, "w")).toEqual(["p"]);
  });
  it.each(["q", "r", "b", "n"] as const)("förvandlar bonde till %s", (p) => {
    const g = new Chess("7k/P7/8/8/8/8/8/7K w - - 0 1");
    g.move({ from: "a7", to: "a8", promotion: p });
    expect(g.get("a8")?.type).toBe(p);
  });
  it("skiljer kontrollerad ruta från lagligt slag av bunden pjäs", () => {
    const g = new Chess("4k3/4b3/3R4/8/8/8/8/K3R3 w - - 0 1");
    expect(g.isAttacked("d6", "b")).toBe(true);
    expect(
      capturesAgainst(g, "w").some((m) => m.from === "e7" && m.to === "d6"),
    ).toBe(false);
  });
  it("varnar för ett verkligt slag utan att ändra partiet", () => {
    const g = new Chess();
    g.move("e4");
    g.move("g6");
    const before = g.fen();
    const risk = previewRisk(g, "d1", "h5");
    expect(risk.attackers.some((m) => m.from === "g6" && m.to === "h5")).toBe(
      true,
    );
    expect(g.fen()).toBe(before);
    expect(g.history()).toHaveLength(2);
  });
  it("hittar inget påhittat hot för ett säkert öppningsdrag", () => {
    const g = new Chess();
    expect(previewRisk(g, "e2", "e4").attackers).toHaveLength(0);
  });
  it("varnar även om den flyttade bonden kan tas en passant", () => {
    const g = new Chess("7k/8/8/8/3p4/8/4P3/K7 w - - 0 1");
    const risk = previewRisk(g, "e2", "e4");
    expect(
      risk.attackers.some(
        (m) => m.from === "d4" && m.to === "e3" && m.isEnPassant(),
      ),
    ).toBe(true);
  });
  it("upptäcker trefaldig upprepning med full historik", () => {
    const g = new Chess();
    ["Nf3", "Nf6", "Ng1", "Ng8", "Nf3", "Nf6", "Ng1", "Ng8"].forEach((m) =>
      g.move(m),
    );
    expect(resultText(g)).toContain("tre gånger");
  });
  it("upptäcker otillräckligt material", () => {
    expect(resultText(new Chess("7k/8/8/8/8/8/8/K7 w - - 0 1"))).toContain(
      "otillräckligt",
    );
  });
  it("upptäcker femtiodragsregeln", () => {
    expect(resultText(new Chess("7k/8/8/8/8/8/8/KR6 w - - 100 51"))).toContain(
      "femtiodrag",
    );
  });
  it("validerar motorns UCI-drag med samma regelmotor", () => {
    const g = new Chess();
    playUci(g, "e2e4");
    expect(g.history()).toEqual(["e4"]);
    expect(() => playUci(g, "e2e5")).toThrow();
    expect(() => playUci(g, "invalid")).toThrow();
  });
});
