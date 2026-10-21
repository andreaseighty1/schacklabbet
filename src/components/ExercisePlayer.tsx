import { useEffect, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  RotateCcw,
} from "lucide-react";
import type { Exercise } from "../content";
import type { Voice } from "../audio/useVoice";
import { exerciseClip } from "../audio/clips";
import { pieceNames, playUci, type Promotion } from "../chess/model";
import { Board } from "./Board";
import { Piece } from "./Piece";
import { ListenButton, PlaybackControls } from "./VoiceControls";
import { SquareNamesToggle, useSquareNames } from "./SquareNamesToggle";

export function ExercisePlayer({
  exercise,
  voice,
  completed,
  onComplete,
  onBack,
  nextExercise,
  onNext,
  savedSolution,
  backLabel,
  doneLabel,
}: {
  exercise: Exercise;
  voice: Voice;
  completed: boolean;
  onComplete: (solution?: string) => void;
  onBack: () => void;
  nextExercise?: Exercise;
  onNext: () => void;
  savedSolution?: string;
  backLabel?: string;
  doneLabel?: string;
}) {
  const restoredSolution = exercise.solutions.includes(savedSolution ?? "")
    ? savedSolution
    : undefined;
  const [game, setGame] = useState(() => {
    const initial = new Chess(exercise.fen);
    if (restoredSolution) playUci(initial, restoredSolution);
    return initial;
  });
  const [showSquareNames, toggleSquareNames] = useSquareNames("lesson");
  const [selected, setSelected] = useState<Square | null>(null);
  const [feedback, setFeedback] = useState(
    restoredSolution
      ? exercise.success
      : exercise.question
        ? "Titta på brädet och välj ett svar."
        : "Prova en idé på brädet.",
  );
  const [solved, setSolved] = useState(Boolean(restoredSolution));
  const [showHint, setShowHint] = useState(false);
  const [answer, setAnswer] = useState<number | null>(null);
  const [promotion, setPromotion] = useState<{
    from: Square;
    to: Square;
  } | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const promotionChoices = useRef<HTMLDivElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [exercise.id]);
  useEffect(() => {
    if (promotion) promotionChoices.current?.querySelector("button")?.focus();
  }, [promotion]);
  const clip = exerciseClip(exercise.id, solved ? "success" : "intro");
  function finish(solution?: string) {
    voice.player.reset();
    setSolved(true);
    setSelected(null);
    setPromotion(null);
    setFeedback(exercise.success);
    const successClip = exerciseClip(exercise.id, "success");
    if (successClip) voice.player.play(successClip);
    onComplete(solution);
  }
  function apply(from: Square, to: Square, promote?: Promotion) {
    if (solved) return;
    const uci = `${from}${to}${promote ?? ""}`;
    if (exercise.solutions.includes(uci)) {
      const copy = new Chess(game.fen());
      copy.move({ from, to, promotion: promote });
      setGame(copy);
      finish(uci);
    } else {
      setFeedback(
        exercise.tryAgain ??
          "Det är ett lagligt drag, men det löser inte just den här uppgiften. Försök med en annan idé.",
      );
      setSelected(null);
      setPromotion(null);
      voice.player.play("exercise-try-again");
    }
  }
  function move(square: Square, fromDrag?: Square) {
    if (solved || promotion || exercise.question) return;
    const from = fromDrag ?? selected;
    const candidates = from
      ? game
          .moves({ square: from, verbose: true })
          .filter((m) => m.to === square)
      : [];
    if (from && candidates.length) {
      if (candidates.some((m) => m.promotion)) {
        voice.player.reset();
        setPromotion({ from, to: square });
        setFeedback("Välj vilken pjäs bonden ska bli.");
      } else apply(from, square);
      return;
    }
    if (game.get(square)?.color === game.turn()) setSelected(square);
    else {
      if (from && from !== square) {
        setFeedback(
          "Den pjäsen kan inte flytta dit just nu. Välj en annan ruta.",
        );
        voice.player.play("exercise-move-not-allowed");
      }
      setSelected(null);
    }
  }
  return (
    <>
      <button className="text-button back-link" onClick={onBack}>
        <ArrowLeft size={17} />
        {backLabel ??
          `Tillbaka till ${exercise.category === "school" ? "schackskolan" : "utmaningarna"}`}
      </button>
      <div className="page-heading">
        <div>
          <div className="eyebrow">{exercise.tag}</div>
          <h1 ref={heading} tabIndex={-1}>
            {exercise.title}
          </h1>
        </div>
        {completed && (
          <span className="completed-tag">
            <CheckCircle2 size={18} /> Avklarad
          </span>
        )}
      </div>
      <div className="exercise-layout">
        <div className="exercise-board">
          <div className="lesson-board-options">
            <SquareNamesToggle
              enabled={showSquareNames}
              onToggle={toggleSquareNames}
            />
            <span>D4 betyder D-linjen, rad 4.</span>
          </div>
          <Board
            game={game}
            showSquareNames={showSquareNames}
            orientation={exercise.orientation ?? "w"}
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
            disabled={
              solved || Boolean(promotion) || Boolean(exercise.question)
            }
          />
          <p className="board-perspective">
            {exercise.orientation === "b"
              ? "Du ser brädet från svarts sida."
              : "Du ser brädet från vits sida."}
          </p>
          {!exercise.question && !solved && (
            <p className="board-help-legend">
              Välj en pjäs. Punkter visar möjliga drag. En ring visar var du kan
              ta en pjäs.
              {exercise.tryAgain &&
                " Markeringarna visar hur pjäsen får gå. Undersök själv om den kan tas efteråt."}
            </p>
          )}
        </div>
        <section className="exercise-panel">
          <span className="card-icon sage">
            {solved ? <CheckCircle2 /> : <Lightbulb />}
          </span>
          <h2>{solved ? "En ny upptäckt!" : "Ditt uppdrag"}</h2>
          <p>{exercise.description}</p>
          {!clip && (
            <p className="fine-print">
              Den här övningen har textinstruktioner. Uppläsning av uppdraget
              finns inte ännu.
            </p>
          )}
          {clip && (
            <PlaybackControls
              voice={voice}
              clip={clip}
              label={solved ? "Lyssna på förklaringen" : "Lyssna på uppdraget"}
            />
          )}
          {promotion && (
            <div
              className="lesson-promotion"
              ref={promotionChoices}
              role="group"
              aria-label="Välj bondens nya pjäs"
            >
              <h3>Vad ska bonden bli?</h3>
              <div className="promotion-options">
                {(["q", "r", "b", "n"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => apply(promotion.from, promotion.to, p)}
                  >
                    <Piece type={p} color={game.turn()} />
                    <span>{pieceNames[p]}</span>
                  </button>
                ))}
              </div>
              <button
                className="text-button"
                onClick={() => {
                  setPromotion(null);
                  setFeedback("Välj bonden och prova igen.");
                }}
              >
                Tillbaka till brädet
              </button>
            </div>
          )}
          {exercise.question && (
            <div
              className="lesson-answers"
              role="group"
              aria-label="Välj ditt svar"
            >
              {exercise.question.choices.map((choice, i) => (
                <button
                  className="button outline"
                  key={choice.label}
                  aria-pressed={answer === i}
                  disabled={solved}
                  onClick={() => {
                    voice.player.reset();
                    setAnswer(i);
                    if (choice.correct) finish();
                    else setFeedback(choice.feedback);
                  }}
                >
                  {choice.label}
                </button>
              ))}
            </div>
          )}
          <div
            className={`exercise-feedback ${solved ? "success" : ""}`}
            role="status"
          >
            {solved && <CheckCircle2 size={20} />}
            <p>{feedback}</p>
          </div>
          {showHint && !solved && (
            <>
              <p className="hint-text">{exercise.hint}</p>
              <ListenButton
                voice={voice}
                clip={exerciseClip(exercise.id, "hint")}
                label="Lyssna på ledtråden"
              />
            </>
          )}
          <div className="exercise-actions">
            {!solved && (
              <button
                className="button outline"
                onClick={() => {
                  if (!showHint) {
                    const hintClip = exerciseClip(exercise.id, "hint");
                    if (hintClip) voice.player.play(hintClip);
                  } else voice.player.reset();
                  setShowHint((v) => !v);
                }}
              >
                <Lightbulb size={17} />
                {showHint ? "Dölj ledtråd" : "En liten ledtråd"}
              </button>
            )}
            {solved && (
              <>
                <button
                  className="button primary"
                  onClick={nextExercise ? onNext : onBack}
                >
                  {nextExercise
                    ? `Nästa: ${nextExercise.title}`
                    : (doneLabel ?? "Fortsätt upptäcka")}
                  <ArrowRight size={17} />
                </button>
                <button
                  className="text-button"
                  onClick={() => {
                    voice.player.reset();
                    setGame(new Chess(exercise.fen));
                    setSolved(false);
                    setSelected(null);
                    setShowHint(false);
                    setAnswer(null);
                    setPromotion(null);
                    setFeedback(
                      exercise.question
                        ? "Titta på brädet och välj ett svar igen."
                        : "Prova igen. Kan du förklara varför draget fungerar?",
                    );
                  }}
                >
                  <RotateCcw size={16} /> Prova igen
                </button>
              </>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
