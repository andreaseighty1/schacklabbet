import { useContext, useEffect, useRef, useState } from "react";
import { type Square } from "chess.js";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  RotateCcw,
} from "lucide-react";
import type { Exercise } from "../content";
import type { Voice } from "../audio/useVoice";
import { exerciseClip, learningClip } from "../audio/clips";
import { pieceNames, type Promotion } from "../chess/model";
import {
  attemptLesson,
  lessonSteps,
  revealLessonReply,
  startLesson,
} from "../learning/session";
import { Board } from "./Board";
import { Piece } from "./Piece";
import { ListenButton, PlaybackControls } from "./VoiceControls";
import { SquareNamesToggle, useSquareNames } from "./SquareNamesToggle";
import { BoardFocusContext, FocusPanel } from "./FocusPanel";

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
  const focus = useContext(BoardFocusContext);
  const restoredSolution = exercise.solutions.includes(savedSolution ?? "")
    ? savedSolution
    : undefined;
  const [session, setSession] = useState(() =>
    startLesson(exercise, restoredSolution),
  );
  const { game, awaitingReply } = session;
  const steps = lessonSteps(exercise);
  const currentStep = steps[session.step];
  const reply = awaitingReply ? steps[session.step - 1].reply : undefined;
  const multipleSteps = steps.length > 1;
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
  const clip =
    exerciseClip(exercise.id, solved ? "success" : "intro") ??
    learningClip(
      exercise.id,
      solved
        ? "success"
        : session.step === 0
          ? "intro"
          : `step-${session.step + 1}`,
    );
  const hintClip =
    exerciseClip(exercise.id, "hint") ??
    learningClip(
      exercise.id,
      exercise.steps ? `hint-${session.step + 1}` : "hint",
    );
  function finish(solution?: string) {
    voice.player.reset();
    setSolved(true);
    setSelected(null);
    setPromotion(null);
    setFeedback(exercise.success);
    const successClip =
      exerciseClip(exercise.id, "success") ??
      learningClip(exercise.id, "success");
    if (successClip) voice.player.play(successClip);
    onComplete(solution);
  }
  function apply(from: Square, to: Square, promote?: Promotion) {
    if (solved || awaitingReply) return;
    const uci = `${from}${to}${promote ?? ""}`;
    const next = attemptLesson(exercise, session, uci);
    if (next !== session) {
      voice.player.reset();
      setSession(next);
      setSelected(null);
      setPromotion(null);
      setShowHint(false);
      if (next.solved) finish(uci);
      else
        setFeedback(
          next.awaitingReply
            ? "Bra! Titta på ditt drag. Visa motståndarens svar när du är redo."
            : "Bra! Fortsätt med nästa steg.",
        );
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
    if (solved || awaitingReply || promotion || exercise.question) return;
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
  const backText =
    backLabel ??
    `Tillbaka till ${exercise.category === "school" ? "schackskolan" : "utmaningarna"}`;
  function showReply() {
    focus.setOpen(false);
    voice.player.reset();
    setSession(revealLessonReply(exercise, session));
    setFeedback(reply!.explanation);
    const responseClip = learningClip(exercise.id, `reply-${session.step}`);
    if (responseClip) voice.player.play(responseClip);
    setSelected(null);
    setShowHint(false);
  }
  return (
    <>
      <div className="exercise-heading">
        <button
          className="text-button back-link"
          onClick={onBack}
          aria-label={backText}
          title={backText}
        >
          <ArrowLeft size={17} />
          <span className="back-link-text">{backText}</span>
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
      </div>
      <div className="exercise-layout">
        <div className="exercise-board">
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
              solved ||
              awaitingReply ||
              Boolean(promotion) ||
              Boolean(exercise.question)
            }
          />
          <div className="lesson-board-tools">
            {focus.enabled && (
              <div className="focus-lesson-summary" role="status">
                <strong>
                  {solved
                    ? "Avklarat!"
                    : awaitingReply
                      ? "Motståndarens tur"
                      : "Ditt uppdrag"}
                </strong>
                <p>
                  {solved
                    ? exercise.success
                    : awaitingReply
                      ? "Visa svaret när du har tittat på ditt drag."
                      : (currentStep?.instruction ?? exercise.description)}
                </p>
                <p className="fine-print">{feedback}</p>
                {showHint && !solved && !awaitingReply && (
                  <p className="hint-text">{currentStep.hint}</p>
                )}
                {awaitingReply && (
                  <button className="button primary" onClick={showReply}>
                    Visa motståndarens svar
                  </button>
                )}
                <button
                  className="button outline"
                  onClick={() => focus.setOpen(true)}
                >
                  {exercise.question
                    ? "Visa svarsalternativ"
                    : solved
                      ? "Nästa steg"
                      : "Uppdrag & hjälp"}
                </button>
              </div>
            )}
            <div className="lesson-board-options">
              <SquareNamesToggle
                enabled={showSquareNames}
                onToggle={toggleSquareNames}
              />
              <span>D4 betyder D-linjen, rad 4.</span>
            </div>
            <p className="board-perspective">
              {exercise.orientation === "b"
                ? "Du ser brädet från svarts sida."
                : "Du ser brädet från vits sida."}
            </p>
            {!exercise.question && !solved && (
              <p className="board-help-legend">
                Välj en pjäs. Punkter visar möjliga drag. En ring visar var du
                kan ta en pjäs.
                {exercise.tryAgain &&
                  " Markeringarna visar hur pjäsen får gå. Undersök själv om den kan tas efteråt."}
              </p>
            )}
          </div>
        </div>
        <FocusPanel
          className="exercise-panel"
          title="Uppdrag och hjälp"
          attention={Boolean(promotion) || solved}
        >
          <span className="card-icon sage">
            {solved ? <CheckCircle2 /> : <Lightbulb />}
          </span>
          <h2>{solved ? "En ny upptäckt!" : "Ditt uppdrag"}</h2>
          <p>{exercise.description}</p>
          {exercise.steps && !solved && (
            <div className="lesson-step">
              <span className="card-kicker">
                {awaitingReply
                  ? "Motståndarens tur"
                  : `Ditt drag ${session.step + 1} av ${steps.length}`}
              </span>
              {!awaitingReply && <p>{currentStep.instruction}</p>}
              {multipleSteps && (
                <p className="fine-print">
                  Vi provar en bestämd fortsättning. I ett riktigt parti kan
                  andra svar vara möjliga.
                </p>
              )}
            </div>
          )}
          {!clip && (
            <p className="fine-print">
              Den här övningen har textinstruktioner. Uppläsning av uppdraget
              finns inte ännu.
            </p>
          )}
          {clip && !awaitingReply && (
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
          {awaitingReply && (
            <button className="button primary lesson-reply" onClick={showReply}>
              Visa motståndarens svar <ArrowRight size={17} />
            </button>
          )}
          {solved && exercise.takeaway && (
            <p className="lesson-takeaway">
              <strong>Ta med dig:</strong> {exercise.takeaway}
            </p>
          )}
          {exercise.source && (
            <p className="fine-print lesson-source">
              Läs mer:{" "}
              <a
                href={exercise.source.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {exercise.source.title}
              </a>
            </p>
          )}
          {showHint && !solved && !awaitingReply && (
            <>
              <p className="hint-text">{currentStep.hint}</p>
              <ListenButton
                voice={voice}
                clip={hintClip}
                label="Lyssna på ledtråden"
              />
            </>
          )}
          <div className="exercise-actions">
            {!solved && !awaitingReply && (
              <button
                className="button outline"
                onClick={() => {
                  if (!showHint) {
                    if (hintClip) voice.player.play(hintClip);
                  } else voice.player.reset();
                  setShowHint((v) => !v);
                  focus.setOpen(false);
                }}
              >
                <Lightbulb size={17} />
                {showHint ? "Dölj ledtråd" : "En liten ledtråd"}
              </button>
            )}
            {!solved && multipleSteps && (
              <button
                className="text-button"
                onClick={() => {
                  voice.player.reset();
                  setSession(startLesson(exercise));
                  setSelected(null);
                  setPromotion(null);
                  setShowHint(false);
                  setFeedback(
                    "Börja från första draget igen. Dina tidigare framsteg finns kvar.",
                  );
                }}
              >
                <RotateCcw size={16} /> Börja om lektionen
              </button>
            )}
            {solved && (
              <>
                <button
                  className="button primary"
                  onClick={() => {
                    focus.setOpen(false);
                    if (nextExercise) onNext();
                    else onBack();
                  }}
                >
                  {nextExercise
                    ? `Nästa: ${nextExercise.title}`
                    : (doneLabel ?? "Fortsätt upptäcka")}
                  <ArrowRight size={17} />
                </button>
                <button
                  className="text-button"
                  onClick={() => {
                    focus.setOpen(false);
                    voice.player.reset();
                    setSession(startLesson(exercise));
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
        </FocusPanel>
      </div>
    </>
  );
}
