import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Pause,
  Sparkles,
} from "lucide-react";
import type { Voice } from "../audio/useVoice";
import type { Exercise } from "../content";
import {
  advanceTraining,
  solveTraining,
  startTraining,
  trainingSteps,
  trainingExercises,
  type TrainingState,
} from "../training";
import { ExercisePlayer } from "./ExercisePlayer";

export function TrainingSession({
  state,
  update,
  voice,
  onCompleteExercise,
  onPause,
}: {
  state: TrainingState;
  update: (change: (state: TrainingState) => TrainingState) => void;
  voice: Voice;
  onCompleteExercise: (exercise: Exercise) => void;
  onPause: () => void;
}) {
  const [running, setRunning] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const run = state.current;
  const finished = Boolean(run && run.finishedAt !== null);
  useEffect(() => {
    voice.player.reset();
  }, [voice.player, run?.id, run?.step]);
  useEffect(() => () => voice.player.reset(), [voice.player]);
  useEffect(() => {
    if (!running || finished) {
      heading.current?.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    }
  }, [running, finished]);
  function begin() {
    voice.player.reset();
    const id = crypto.randomUUID(),
      now = Date.now();
    update((saved) => startTraining(saved, id, now));
    setRunning(true);
  }
  if (running && run && !finished) {
    const exercise = trainingExercises[run.step];
    return (
      <>
        <div className="training-step-status" role="status">
          Ditt nybörjarpass · Uppdrag {run.step + 1} av {trainingSteps.length} ·{" "}
          {trainingSteps[run.step].title}
        </div>
        <ExercisePlayer
          key={`${run.id}:${run.step}`}
          exercise={exercise}
          voice={voice}
          completed={Boolean(run.solutions[run.step])}
          savedSolution={run.solutions[run.step]}
          backLabel="Ta en paus – tillbaka till översikten"
          onBack={onPause}
          nextExercise={trainingExercises[run.step + 1]}
          onNext={() => update((saved) => advanceTraining(saved, run.id))}
          onComplete={(solution) => {
            if (!solution) return;
            onCompleteExercise(exercise);
            update((saved) =>
              solveTraining(saved, run.id, run.step, solution, Date.now()),
            );
          }}
        />
      </>
    );
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">TRE SMÅ UPPDRAG. I DIN TAKT.</div>
          <h1 ref={heading} tabIndex={-1}>
            {finished ? "Ditt pass är klart!" : "Ditt nybörjarpass"}
          </h1>
          <p>
            {finished
              ? "Ta en titt på det du har övat på idag."
              : "Ungefär 10 minuter. Ingen nedräkning. Du kan ta en paus när du vill."}
          </p>
        </div>
      </div>
      <section
        className={`beginner-session ${finished ? "session-finished" : ""}`}
        aria-label={finished ? "Det här har du övat på" : "Passets tre uppdrag"}
      >
        <span className="card-icon sage">
          {finished ? <Sparkles /> : <BookOpen />}
        </span>
        <h2>{finished ? "Tre nya upptäckter" : "Vi tar ett steg i taget"}</h2>
        <ol className="session-step-list">
          {trainingSteps.map((step, i) => {
            const done = Boolean(run?.solutions[i]);
            return (
              <li
                key={step.exerciseId}
                aria-current={!finished && run?.step === i ? "step" : undefined}
              >
                <span className={`session-step-icon ${done ? "done" : ""}`}>
                  {done ? <CheckCircle2 size={21} /> : i + 1}
                </span>
                <div>
                  <h3>{step.title}</h3>
                  <p>
                    {finished ? step.reflection : trainingExercises[i].title}
                  </p>
                  <span>
                    {done
                      ? "Klart"
                      : (!run ? i === 0 : run.step === i)
                        ? "Nästa uppgift"
                        : "Kommer sedan"}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
        {!finished && (
          <p className="session-guidance">
            Välj en pjäs så visar punkterna vart den kan gå. En ring visar var
            du kan ta en motståndarpjäs. Du får använda ledtrådar och röst –
            hjälpen minskar inte dina framsteg.
          </p>
        )}
        {finished && (
          <p className="session-guidance">
            Fundera: Hur kan tornet och kungen hjälpa varandra? Berätta gärna
            för en kompis eller vuxen. Du behöver inte skriva något svar här.
          </p>
        )}
        <p className="fine-print">
          {run
            ? `${run.solutions.length} av ${trainingSteps.length} uppdrag klara. `
            : ""}
          Din plats sparas i den här webbläsaren.
        </p>
        <div className="session-actions">
          <button
            className="button primary"
            onClick={finished || !run ? begin : () => setRunning(true)}
          >
            {finished
              ? "Öva passet igen"
              : run
                ? "Fortsätt där du var"
                : "Börja första uppdraget"}
            <ArrowRight size={17} />
          </button>
          <button className="text-button" onClick={onPause}>
            <Pause size={16} />
            {finished ? "Till översikten" : "Tillbaka till översikten"}
          </button>
        </div>
      </section>
    </>
  );
}

export function TrainingHistory({ state }: { state: TrainingState }) {
  return (
    <section className="session-history" aria-label="Dina träningspass">
      <h2>Dina träningspass</h2>
      <p>
        {state.history.length === 1
          ? "1 avslutat pass sparat i den här webbläsaren."
          : state.history.length
            ? `${state.history.length} avslutade pass sparade i den här webbläsaren.`
            : "Här visas passet när du har löst alla tre uppdrag."}
      </p>
      {state.history.length > 0 && (
        <ol>
          {state.history.slice(0, 5).map((run) => (
            <li key={run.id}>
              <CheckCircle2 size={18} />
              <span>Nybörjarpass · 3 av 3 uppdrag</span>
              <time dateTime={new Date(run.finishedAt!).toISOString()}>
                {new Date(run.finishedAt!).toLocaleDateString("sv-SE")}
              </time>
            </li>
          ))}
        </ol>
      )}
      {state.history.length > 5 && (
        <p className="fine-print">
          De fem senaste visas här. Upp till 20 avslut sparas.
        </p>
      )}
    </section>
  );
}
