import { useEffect, useRef, useState } from "react";
import { Chess, type Color, type Square } from "chess.js";
import { EngineSession } from "../chess/engine";
import {
  reviewGame,
  uci,
  type GameReview,
  type ReviewExample,
} from "../chess/review";
import { pieceNames, type Promotion } from "../chess/model";
import { describeMove } from "../chess/moveDescription";
import { Board } from "./Board";
import { MoveLabel } from "./MoveLabel";
import { SquareNamesToggle, useSquareNames } from "./SquareNamesToggle";
import {
  recommendTraining,
  type TrainingRecommendation,
} from "../chess/recommendation";
import { exercises } from "../content";

export function PostGameReview({
  pgn,
  color,
  result,
  onResult,
  onPractice,
}: {
  pgn: string;
  color: Color;
  result: GameReview | null;
  onResult: (result: GameReview | null) => void;
  onPractice: (recommendation: TrainingRecommendation) => void;
}) {
  const engine = useRef<EngineSession | null>(null);
  const task = useRef<AbortController | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (result) {
      heading.current?.focus({ preventScroll: true });
      heading.current?.scrollIntoView({ block: "start" });
    }
  }, [result]);
  useEffect(
    () => () => {
      task.current?.abort();
      task.current = null;
      engine.current?.reset();
    },
    [],
  );

  async function start() {
    task.current?.abort();
    const controller = new AbortController();
    task.current = controller;
    engine.current ??= new EngineSession();
    const session = engine.current;
    setBusy(true);
    onResult(null);
    try {
      const review = await reviewGame(
        pgn,
        color,
        (position, signal) => session.analyze(position, signal),
        controller.signal,
        (done, total) => setStatus(`Granskar dina drag: ${done} av ${total}.`),
      );
      if (task.current !== controller || controller.signal.aborted) return;
      onResult(review);
      setStatus("");
    } catch (error) {
      if (task.current !== controller || controller.signal.aborted) return;
      setStatus(
        error instanceof Error
          ? error.message
          : "Genomgången kunde inte slutföras. Försök igen.",
      );
    } finally {
      if (task.current === controller) {
        setBusy(false);
        session.reset();
      }
    }
  }
  function cancel() {
    task.current?.abort();
    task.current = null;
    engine.current?.reset();
    setBusy(false);
    setStatus("Genomgången är stoppad. Du kan starta den igen.");
  }
  const recommendation = result ? recommendTraining(result) : null;
  const lesson = exercises.find(
    (exercise) => exercise.id === recommendation?.exerciseId,
  );
  return (
    <section className="post-game-review" aria-labelledby="review-heading">
      <div className="review-intro">
        <div>
          <span className="eyebrow">Efter partiet</span>
          <h2 id="review-heading" ref={heading} tabIndex={-1}>
            Upptäck ett drag
          </h2>
          <p>
            Se ett drag som fungerade bra och prova högst ett förslag att lära
            av.
          </p>
          <p className="fine-print">
            Datorn tittar på dina senaste åtta drag. Det är en kort genomgång
            och den kan missa saker.
          </p>
        </div>
        {!result && (
          <button className="button primary" onClick={busy ? cancel : start}>
            {busy ? "Stoppa genomgången" : "Gå igenom mitt parti"}
          </button>
        )}
      </div>
      <p role="status" className="review-status">
        {status}
      </p>
      {result && (
        <>
          <p className="fine-print">
            Klart! {result.checked} av dina {result.total} drag granskades.
          </p>
          {result.good && (
            <div className="review-good">
              <h3>Ett drag som fungerade bra</h3>
              <MoveLabel move={result.good.played} />
              <p>
                {result.good.played.san.endsWith("#")
                  ? "Du satte schackmatt! Motståndarens kung kunde inte komma undan schacken."
                  : "Datorns korta genomgång tyder på att det här draget fungerade bra i ställningen."}
              </p>
            </div>
          )}
          {!result.good && (
            <p>
              Den här korta genomgången gav inget säkert exempel på ett bra
              drag. Du kan ändå lära dig av att spela igenom partiet ovan.
            </p>
          )}
          {result.improvement ? (
            <RetryMove
              key={result.improvement.played.before}
              example={result.improvement}
              color={color}
            />
          ) : (
            <p>
              Inget tydligt förbättringstips hittades bland de granskade dragen.
              Det betyder inte att alla drag var bäst.
            </p>
          )}
          {recommendation && lesson && (
            <section
              className="review-training"
              aria-labelledby="training-tip-heading"
            >
              <span className="eyebrow">ETT NÄSTA STEG</span>
              <h3 id="training-tip-heading">Träningstips från ditt parti</h3>
              <p>{recommendation.reason}</p>
              <p className="fine-print">
                Övningen är en repetition. Du kan göra den igen även om den
                redan är avklarad.
              </p>
              <button
                className="button primary"
                onClick={() => onPractice(recommendation)}
              >
                Öva: {lesson.title}
              </button>
            </section>
          )}
        </>
      )}
    </section>
  );
}

function RetryMove({
  example,
  color,
}: {
  example: ReviewExample;
  color: Color;
}) {
  const [game, setGame] = useState(() => new Chess(example.played.before));
  const [selected, setSelected] = useState<Square | null>(null);
  const [promotion, setPromotion] = useState<{
    from: Square;
    to: Square;
  } | null>(null);
  const [solved, setSolved] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [showNames, toggleNames] = useSquareNames("lesson");
  const promotionChoices = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (promotion) promotionChoices.current?.querySelector("button")?.focus();
  }, [promotion]);
  const target = describeMove(example.suggested);
  function apply(from: Square, to: Square, promote?: Promotion) {
    const copy = new Chess(game.fen());
    const move = copy.move({ from, to, promotion: promote });
    setPromotion(null);
    setSelected(null);
    if (uci(move) !== uci(example.suggested)) {
      setFeedback(
        `Det är ett lagligt drag. Nu övar vi på datorns förslag: ${target.action}. Andra drag kan också fungera.`,
      );
      return;
    }
    setGame(copy);
    setSolved(true);
    setFeedback(
      "Du provade förslaget! Jämför med ditt drag i partiet: vilka pjäser fick skydd, och vilka rutor blev fria?",
    );
  }
  function onSquare(square: Square, dragFrom?: Square) {
    if (solved || promotion) return;
    const from = dragFrom ?? selected;
    if (from) {
      const choices = game
        .moves({ square: from, verbose: true })
        .filter((move) => move.to === square);
      if (choices.length) {
        if (choices.some((move) => move.promotion))
          setPromotion({ from, to: square });
        else apply(from, square);
        return;
      }
    }
    setSelected(game.get(square)?.color === game.turn() ? square : null);
  }
  return (
    <section className="review-retry" aria-labelledby="retry-heading">
      <div>
        <h3 id="retry-heading">Prova ett annat drag</h3>
        <p>Datorn hittade ett starkare förslag i den här ställningen.</p>
        <div className="review-comparison">
          <div>
            <h4>Du spelade</h4>
            <MoveLabel move={example.played} />
          </div>
          <div>
            <h4>Prova förslaget</h4>
            <MoveLabel move={example.suggested} />
          </div>
        </div>
        {example.reply && (
          <p className="fine-print">
            Efter ditt drag kunde motståndaren svara:{" "}
            {describeMove(example.reply).action}.
          </p>
        )}
        <p>
          Välj pjäsen på {example.suggested.from.toUpperCase()} och flytta till{" "}
          {example.suggested.to.toUpperCase()}. Prickar visar lagliga drag.
          Ringar visar var du kan ta en pjäs.
        </p>
        <SquareNamesToggle enabled={showNames} onToggle={toggleNames} />
        <p className="exercise-feedback" role="status">
          {feedback}
        </p>
        {promotion && (
          <div
            className="lesson-promotion"
            ref={promotionChoices}
            role="group"
            aria-label="Välj ny pjäs"
          >
            <h4>Vilken pjäs ska bonden bli?</h4>
            {(["q", "r", "b", "n"] as Promotion[]).map((piece) => (
              <button
                className="button secondary"
                key={piece}
                onClick={() => apply(promotion.from, promotion.to, piece)}
              >
                {pieceNames[piece]}
              </button>
            ))}
            <button className="text-button" onClick={() => setPromotion(null)}>
              Avbryt pjäsval
            </button>
          </div>
        )}
        {solved && (
          <button
            className="button secondary"
            onClick={() => {
              setGame(new Chess(example.played.before));
              setSolved(false);
              setFeedback("");
            }}
          >
            Prova förslaget igen
          </button>
        )}
      </div>
      <div className="review-board">
        <Board
          game={game}
          orientation={color}
          selected={selected}
          legal={
            selected
              ? game
                  .moves({ square: selected, verbose: true })
                  .map((move) => move.to)
              : []
          }
          last={game.history({ verbose: true }).at(-1)}
          onSquare={onSquare}
          disabled={solved || Boolean(promotion)}
          showSquareNames={showNames}
        />
      </div>
    </section>
  );
}
