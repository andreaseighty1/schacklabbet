import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import { curriculumLessons } from "./curriculum";
import {
  attemptLesson,
  lessonSteps,
  revealLessonReply,
  startLesson,
} from "./session";
import { playUci } from "../chess/model";

const byId = (id: string) => curriculumLessons.find((e) => e.id === id)!;

describe("lektioner med motståndarsvar", () => {
  for (const exercise of curriculumLessons.filter((e) => e.steps)) {
    it(`${exercise.id}: hela följden är laglig och klaras först efter sista egna draget`, () => {
      let session = startLesson(exercise);
      const player = session.game.turn();
      let plies = 0;
      for (const [i, step] of lessonSteps(exercise).entries()) {
        expect(session.solved).toBe(false);
        expect(session.game.turn()).toBe(player);
        expect(session.game.isGameOver()).toBe(false);
        expect(step.instruction.length).toBeGreaterThan(10);
        expect(step.hint.length).toBeGreaterThan(10);
        const previous = session;
        session = attemptLesson(exercise, session, step.solutions[0]);
        plies++;
        expect(previous.game.history()).toHaveLength(plies - 1);
        expect(session.solved).toBe(i === exercise.steps!.length - 1);
        if (step.reply) {
          expect(session.awaitingReply).toBe(true);
          expect(attemptLesson(exercise, session, step.solutions[0])).toBe(
            session,
          );
          expect(step.reply.explanation.length).toBeGreaterThan(10);
          session = revealLessonReply(exercise, session);
          plies++;
        }
        expect(session.game.history()).toHaveLength(plies);
      }
      expect(session.solved).toBe(true);
      expect(attemptLesson(exercise, session, exercise.solutions[0])).toBe(
        session,
      );
      expect(revealLessonReply(exercise, session)).toBe(session);
      const restarted = startLesson(exercise);
      expect(restarted.game.fen()).toBe(exercise.fen);
      expect(restarted.solved).toBe(false);
    });
  }
  it("låter en felaktig idé lämna både ställning och historik orörda", () => {
    const exercise = byId("opening-italian");
    const session = startLesson(exercise);
    expect(attemptLesson(exercise, session, "d2d4")).toBe(session);
    expect(session.game.history()).toEqual([]);
    expect(startLesson(exercise, "e2e4").solved).toBe(false);
  });
});

describe("schackidéerna stämmer, inte bara dragen", () => {
  it("springargaffeln och bondegaffeln hotar båda målen", () => {
    const knight = new Chess(byId("tactic-knight-fork").fen);
    playUci(knight, "e4d6");
    expect(knight.isCheck()).toBe(true);
    expect(knight.attackers("b7", "w")).toContain("d6");
    const pawn = new Chess(byId("tactic-pawn-fork").fen);
    playUci(pawn, "e4e5");
    expect(pawn.attackers("d6", "w")).toContain("e5");
    expect(pawn.attackers("f6", "w")).toContain("e5");
  });
  it("bindningen gör springarens flytt olaglig och avdraget öppnar tornets schack", () => {
    const pin = new Chess(byId("tactic-pin").fen);
    playUci(pin, "f1b5");
    expect(pin.moves({ square: "d7" })).toEqual([]);
    const discovered = new Chess(byId("tactic-discovered").fen);
    playUci(discovered, "e2c4");
    expect(discovered.attackers("e8", "w")).toEqual(["e1"]);
    expect(discovered.attackers("d5", "w")).toContain("c4");
  });
  for (const id of [
    "tactic-sacrifice",
    "tactic-mate-two",
    "practice-mate-two",
  ]) {
    it(`${id}: den tvingade mattföljden fungerar mot samtliga lagliga svar`, () => {
      const exercise = byId(id);
      const board = new Chess(exercise.fen);
      playUci(board, exercise.steps![0].solutions[0]);
      const replies = board.moves({ verbose: true });
      expect(replies).toHaveLength(1);
      for (const reply of replies) {
        const game = new Chess(board.fen());
        game.move(reply);
        playUci(game, exercise.steps![1].solutions[0]);
        expect(game.isCheckmate()).toBe(true);
      }
    });
  }
  for (const id of [
    "ending-ladder",
    "ending-rook-king",
    "master-opera",
    "master-immortal",
    "trap-scholars-mate",
    "ending-queen-king",
    "practice-mate-two",
    "practice-back-rank",
  ]) {
    it(`${id}: avslutningen är schackmatt`, () => {
      const exercise = byId(id);
      let session = startLesson(exercise);
      for (const step of exercise.steps!) {
        session = attemptLesson(exercise, session, step.solutions[0]);
        session = revealLessonReply(exercise, session);
      }
      expect(session.game.isCheckmate()).toBe(true);
    });
  }
  it("ett torn undviker patt där en dam omedelbart ger remi", () => {
    const fen = byId("ending-underpromotion").fen;
    const queen = new Chess(fen);
    playUci(queen, "c7c8q");
    expect(queen.isStalemate()).toBe(true);
    const rook = new Chess(fen);
    playUci(rook, "c7c8r");
    expect(rook.isGameOver()).toBe(false);
    expect(rook.moves()).toEqual(["Ka6"]);
  });
  it("försvaret mot skolmatt stoppar båda visade matthoten", () => {
    const exercise = byId("trap-defend-scholars");
    const game = new Chess(exercise.fen);
    playUci(game, "g7g6");
    expect(game.moves()).not.toContain("Qxf7#");
    playUci(game, "h5f3");
    playUci(game, "g8f6");
    expect(
      game
        .moves({ verbose: true })
        .some((m) => m.to === "f7" && m.piece === "q"),
    ).toBe(false);
    expect(game.isCheck()).toBe(false);
  });
});
