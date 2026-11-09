import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { type Square } from "chess.js";
import {
  ArrowLeft,
  CheckCircle2,
  Lightbulb,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Board } from "../components/Board";
import { BoardFocusContext, FocusPanel } from "../components/FocusPanel";
import {
  SquareNamesToggle,
  useSquareNames,
} from "../components/SquareNamesToggle";
import { Piece } from "../components/Piece";
import { pieceNames, type Promotion } from "../chess/model";
import { pickDaily, swedishDate } from "./content";
import {
  attemptDaily,
  dailyPosition,
  dailyStatus,
  resetDaily,
  revealDailyReply,
  showDailySolution,
  type DailyProgress,
  type DailyPuzzle,
} from "./model";

export function DailyPlayer({
  puzzle,
  day,
  today,
  progress,
  onChange,
  onBack,
  onExtra,
  warning,
}: {
  puzzle: DailyPuzzle;
  day: string;
  today: string;
  progress: DailyProgress;
  onChange: (change: (previous: DailyProgress) => DailyProgress) => void;
  onBack: () => void;
  onExtra?: () => void;
  warning: string;
}) {
  const view = useMemo(
    () => dailyPosition(puzzle, progress.moves),
    [puzzle, progress.moves],
  );
  const { game, node, done, awaitingReply } = view;
  const learner = puzzle.fen.split(" ")[1] as "w" | "b";
  const focus = useContext(BoardFocusContext);
  const [names, toggleNames] = useSquareNames("lesson");
  const [selected, setSelected] = useState<Square | null>(null);
  const [promotion, setPromotion] = useState<{
    from: Square;
    to: Square;
  } | null>(null);
  const [feedback, setFeedback] = useState(
    "Välj en pjäs och prova en idé. Du får försöka hur många gånger du vill.",
  );
  const [confirmSolution, setConfirmSolution] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const promotionGroup = useRef<HTMLDivElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, []);
  useEffect(() => {
    if (promotion) promotionGroup.current?.querySelector("button")?.focus();
  }, [promotion]);
  const instruction = awaitingReply
    ? "Bra! Titta på ditt drag. Visa motståndarens svar när du är redo."
    : progress.moves.length
      ? "Nu är det din tur igen. Hitta ett drag som gör schackmatt."
      : `${learner === "w" ? "Det är vits tur." : "Det är svarts tur."} ${puzzle.instruction}`;
  const candidate = Object.keys(node.moves ?? {})[0];
  const hintText =
    progress.hintLevel === 3 && candidate
      ? `Ett drag som fungerar: ${pieceNames[game.get(candidate.slice(0, 2) as Square)!.type]} från ${candidate.slice(0, 2).toUpperCase()} till ${candidate.slice(2, 4).toUpperCase()}${candidate[4] ? `, välj ${pieceNames[candidate[4] as Promotion]}` : ""}.`
      : progress.moves.length
        ? progress.hintLevel === 2 && candidate
          ? `Undersök hur din ${pieceNames[game.get(candidate.slice(0, 2) as Square)!.type]} kan ge schack.`
          : "Titta efter en schack som också stänger kungens flyktvägar."
        : puzzle.hints[progress.hintLevel - 1];
  function apply(from: Square, to: Square, promote?: Promotion) {
    if (done || awaitingReply) return;
    const move = from + to + (promote ?? "");
    const accepted = Boolean(node.moves?.[move]);
    onChange((previous) => attemptDaily(puzzle, previous, move));
    setSelected(null);
    setPromotion(null);
    setConfirmSolution(false);
    setFeedback(
      accepted
        ? "Bra! Du hittade ett drag som fungerar."
        : puzzle.goal.kind === "promotion"
          ? "Det valet ger remi i den här ställningen. Prova en annan förvandlingspjäs."
          : "Det är ett lagligt drag, men det löser inte just det här uppdraget. Titta på målet och prova igen.",
    );
  }
  function move(square: Square, fromDrag?: Square) {
    if (done || awaitingReply || promotion) return;
    const from = fromDrag ?? selected;
    const candidates = from
      ? game
          .moves({ square: from, verbose: true })
          .filter((m) => m.to === square)
      : [];
    if (from && candidates.length) {
      if (candidates.some((m) => m.promotion)) {
        setPromotion({ from, to: square });
        setFeedback("Välj vilken pjäs bonden ska bli.");
      } else apply(from, square);
      return;
    }
    if (game.get(square)?.color === game.turn()) setSelected(square);
    else {
      if (from && from !== square)
        setFeedback(
          "Den pjäsen kan inte flytta dit just nu. Välj en annan ruta.",
        );
      setSelected(null);
    }
  }
  function reply() {
    onChange((previous) => revealDailyReply(puzzle, previous));
    setSelected(null);
    focus.setOpen(false);
    setFeedback("Motståndaren har svarat. Nu är det din tur igen.");
  }
  function hint() {
    onChange((previous) => ({
      ...previous,
      hintLevel: Math.min(3, previous.hintLevel + 1),
      helpUsed: true,
    }));
    focus.setOpen(false);
  }
  function reset() {
    onChange(resetDaily);
    setSelected(null);
    setPromotion(null);
    setConfirmSolution(false);
    setFeedback(
      "Börja från första draget igen. Dina tidigare framsteg finns kvar.",
    );
    focus.setOpen(false);
  }
  const status = dailyStatus(progress);
  const result = progress.solvedLine
    ? "Du klarade uppgiften!"
    : "Lösningen visad – prova gärna själv igen.";
  const message = done ? puzzle.success : feedback;
  const solutionMoves = game.history({ verbose: true });
  return (
    <>
      <div className="exercise-heading">
        <button
          className="text-button back-link"
          onClick={onBack}
          aria-label="Tillbaka till utmaningarna"
        >
          <ArrowLeft size={17} />
          <span className="back-link-text">Tillbaka till utmaningarna</span>
        </button>
        <div className="page-heading">
          <div>
            <div className="eyebrow">
              {swedishDate(day)} ·{" "}
              {puzzle.id.startsWith("extra-") || puzzle.id.endsWith("-two")
                ? "LITE KLURIGARE"
                : pickDaily(day).scheduled
                  ? "DAGENS UTMANING"
                  : "TRÄNINGSFAVORIT I REPRIS"}
            </div>
            <h1 ref={heading} tabIndex={-1}>
              {puzzle.title}
            </h1>
          </div>
          <span className="daily-status">{status}</span>
        </div>
      </div>
      {day !== today && (
        <p className="daily-date-note">
          Du fortsätter utmaningen från {swedishDate(day)}. Dagens uppgift finns
          på utmaningssidan.{" "}
          <button className="text-button" onClick={onBack}>
            Till dagens uppgift
          </button>
        </p>
      )}
      <div className="exercise-layout daily-layout">
        <div className="exercise-board">
          <Board
            game={game}
            orientation={learner}
            selected={selected}
            legal={
              selected
                ? game
                    .moves({ square: selected, verbose: true })
                    .map((m) => m.to)
                : []
            }
            last={game.history({ verbose: true }).at(-1)}
            onSquare={move}
            disabled={done || awaitingReply || Boolean(promotion)}
            showSquareNames={names}
          />
          <div className="lesson-board-tools">
            {focus.enabled && day !== today && (
              <p className="daily-date-note">
                Du fortsätter {swedishDate(day)}.{" "}
                <button className="text-button" onClick={onBack}>
                  Till dagens uppgift
                </button>
              </p>
            )}
            <div
              className={
                focus.enabled ? "focus-lesson-summary" : "daily-board-summary"
              }
              role="status"
            >
              <strong>
                {done
                  ? result
                  : awaitingReply
                    ? "Motståndarens tur"
                    : "Ditt uppdrag"}
              </strong>
              <p>{done ? message : instruction}</p>
              {focus.enabled && !done && (
                <p className="fine-print">{feedback}</p>
              )}
              {progress.hintLevel > 0 && !done && !awaitingReply && (
                <p className="hint-text">{hintText}</p>
              )}
              {awaitingReply && (
                <button className="button primary" onClick={reply}>
                  Visa motståndarens svar
                </button>
              )}
              {focus.enabled && (
                <button
                  className="button outline"
                  onClick={() => focus.setOpen(true)}
                >
                  {done ? "Förklaring och nästa steg" : "Uppdrag & hjälp"}
                </button>
              )}
              {focus.enabled && !done && !awaitingReply && (
                <button
                  className="text-button"
                  onClick={hint}
                  disabled={progress.hintLevel >= 3}
                >
                  Ledtråd
                </button>
              )}
            </div>
            <div className="lesson-board-options">
              <SquareNamesToggle enabled={names} onToggle={toggleNames} />
              <span>D4 betyder D-linjen, rad 4.</span>
            </div>
            <p className="board-perspective">
              Du ser brädet från {learner === "w" ? "vits" : "svarts"} sida.
            </p>
          </div>
        </div>
        <FocusPanel
          className="exercise-panel daily-panel"
          title="Uppdrag och hjälp"
          attention={done || Boolean(promotion)}
        >
          <span className="card-icon sage">
            {done ? <CheckCircle2 /> : <Lightbulb />}
          </span>
          <h2>{done ? result : "Ditt uppdrag"}</h2>
          <p>{done ? puzzle.instruction : instruction}</p>
          <div
            className={`exercise-feedback ${done ? "success" : ""}`}
            role="status"
          >
            <p>{message}</p>
          </div>
          {awaitingReply && !focus.enabled && (
            <button className="button primary" onClick={reply}>
              Visa motståndarens svar
            </button>
          )}
          {warning && (
            <p className="daily-warning" role="status">
              {warning}
            </p>
          )}
          {promotion && (
            <div
              className="lesson-promotion"
              role="group"
              aria-label="Välj bondens nya pjäs"
              ref={promotionGroup}
            >
              <h3>Vad ska bonden bli?</h3>
              <div className="promotion-options">
                {(["q", "r", "b", "n"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => apply(promotion.from, promotion.to, p)}
                  >
                    <Piece type={p} color={learner} />
                    <span>{pieceNames[p]}</span>
                  </button>
                ))}
              </div>
              <button
                className="text-button"
                onClick={() => setPromotion(null)}
              >
                Tillbaka till brädet
              </button>
            </div>
          )}
          {!done && !awaitingReply && !promotion && (
            <>
              <div className="exercise-actions">
                <button
                  className="button outline"
                  onClick={hint}
                  disabled={progress.hintLevel >= 3}
                >
                  <Lightbulb size={17} />
                  {progress.hintLevel === 0
                    ? "En liten ledtråd"
                    : progress.hintLevel < 3
                      ? "Nästa ledtråd"
                      : "Alla ledtrådar visade"}
                </button>
                <button
                  className="text-button"
                  onClick={() => setConfirmSolution((v) => !v)}
                >
                  Visa lösningen
                </button>
              </div>
              {progress.hintLevel > 0 && !focus.enabled && (
                <p className="hint-text">{hintText}</p>
              )}
              {confirmSolution && (
                <div className="daily-solution-confirm">
                  <p>
                    Du får se ett sätt att lösa hela uppgiften. Sedan kan du
                    prova själv igen.
                  </p>
                  <button
                    className="button outline"
                    onClick={() => {
                      onChange((previous) =>
                        showDailySolution(puzzle, previous),
                      );
                      setSelected(null);
                      setConfirmSolution(false);
                    }}
                  >
                    Ja, visa lösningen
                  </button>
                  <button
                    className="text-button"
                    onClick={() => setConfirmSolution(false)}
                  >
                    Jag vill tänka lite till
                  </button>
                </div>
              )}
            </>
          )}
          {done && (
            <>
              <p className="lesson-takeaway">
                <strong>Ta med dig:</strong> {puzzle.takeaway}
              </p>
              <details className="daily-solution-list">
                <summary>Se dragen i din fortsättning</summary>
                <ol>
                  {solutionMoves.map((m, i) => (
                    <li key={i}>
                      {m.color === "w" ? "Vit" : "Svart"}:{" "}
                      {m.isKingsideCastle()
                        ? "kort rockad"
                        : m.isQueensideCastle()
                          ? "lång rockad"
                          : `${pieceNames[m.piece]} ${m.from.toUpperCase()} → ${m.to.toUpperCase()}${m.promotion ? `, blir ${pieceNames[m.promotion]}` : ""}${m.captured ? ", tar en pjäs" : ""}${m.san.endsWith("#") ? ", schackmatt" : m.san.endsWith("+") ? ", schack" : ""}`}
                    </li>
                  ))}
                </ol>
              </details>
              <div className="daily-source">
                <h3>Om uppgiften</h3>
                <p>
                  {puzzle.source.story ??
                    "En egen undervisningsställning där du får öva en tydlig schackidé."}
                </p>
                <p className="fine-print">
                  {puzzle.source.label}. {puzzle.source.credit}
                </p>
                {puzzle.source.url && (
                  <a
                    href={puzzle.source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Läs mer hos källan
                  </a>
                )}
                <p className="fine-print">{puzzle.source.license}</p>
              </div>
              {onExtra && (
                <button className="button primary" onClick={onExtra}>
                  <Sparkles size={17} /> Lite klurigare
                </button>
              )}
              {puzzle.source.gameUrl && (
                <p>
                  <a
                    href={puzzle.source.gameUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Se partiets spelprotokoll
                  </a>
                </p>
              )}
              <button className="button outline" onClick={onBack}>
                Tillbaka till utmaningarna
              </button>
            </>
          )}
          <div className="exercise-actions">
            <button className="text-button" onClick={reset}>
              <RotateCcw size={16} />
              {done ? "Prova igen" : "Börja om uppgiften"}
            </button>
          </div>
          <p className="fine-print">Den här uppgiften har textinstruktioner.</p>
        </FocusPanel>
      </div>
    </>
  );
}
