import { CalendarDays, ArrowRight, Sparkles } from "lucide-react";
import { dailyById, pickDaily, swedishDate, type DailyPick } from "./content";
import { dailyStatus, type DailyProgress, type DailyPuzzle } from "./model";

export function DailyCard({
  day,
  progress,
  onStart,
  warning,
  entries,
}: {
  day: string;
  progress: (day: string, puzzle: DailyPuzzle) => DailyProgress;
  onStart: (pick: DailyPick) => void;
  warning: string;
  entries: Record<string, DailyProgress>;
}) {
  const { puzzle, scheduled } = pickDaily(day);
  const state = progress(day, puzzle);
  const previous = Object.entries(entries)
    .filter(
      ([key, p]) =>
        key.slice(0, 10) < day &&
        !p.solvedLine &&
        !p.solutionShown &&
        (p.attempts > 0 || p.moves.length > 0 || p.hintLevel > 0),
    )
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 3);
  return (
    <section className="daily-card" aria-label="Dagens schackutmaning">
      <div className="daily-card-mark">
        <CalendarDays size={30} />
      </div>
      <div className="daily-card-content">
        <div className="eyebrow">
          {swedishDate(day)} ·{" "}
          {scheduled ? "DAGENS UTMANING" : "TRÄNINGSFAVORIT I REPRIS"}
        </div>
        <h2>{puzzle.title}</h2>
        <p>
          {puzzle.theme} ·{" "}
          {new Map([
            ["authored", "Egen undervisningsuppgift"],
            ["lichess", "Från ett riktigt parti"],
            ["historical", "Från ett känt parti"],
          ]).get(puzzle.source.kind)}
        </p>
        <p>
          {puzzle.fen.split(" ")[1] === "w"
            ? "Det är vits tur."
            : "Det är svarts tur."}{" "}
          {puzzle.instruction}
        </p>
        <p className="fine-print">
          Samma uppgift för alla i dag. Tänk i lugn och ro, utan klocka.
          Ledtrådar finns när du behöver dem.
        </p>
        {!scheduled && (
          <p className="fine-print">
            Vi återser en kontrollerad uppgift ur banken medan fler dagar
            förbereds.
          </p>
        )}
        <div className="daily-card-actions">
          <button
            className="button primary"
            onClick={() => onStart({ day, puzzleId: puzzle.id, scheduled })}
          >
            {state.solvedLine || state.solutionShown
              ? "Prova igen"
              : state.moves.length || state.attempts || state.hintLevel
                ? "Fortsätt utmaningen"
                : "Starta dagens utmaning"}{" "}
            <ArrowRight size={17} />
          </button>
          <span className="daily-status">{dailyStatus(state)}</span>
        </div>
        {puzzle.extraId && (
          <p className="fine-print">
            <Sparkles size={15} /> En frivillig klurigare uppgift finns efteråt.
          </p>
        )}
        {warning && (
          <p role="status" className="daily-warning">
            {warning}
          </p>
        )}
        {previous.length > 0 && (
          <details className="daily-previous">
            <summary>Fortsätt en tidigare utmaning</summary>
            {previous.map(([key]) => {
              const [date, id] = key.split("|");
              const old = dailyById.get(id)!;
              return (
                <button
                  key={key}
                  className="text-button"
                  onClick={() =>
                    onStart({
                      day: date,
                      puzzleId: id,
                      scheduled: pickDaily(date).scheduled,
                    })
                  }
                >
                  {swedishDate(date)}: {old.title}
                </button>
              );
            })}
          </details>
        )}
      </div>
    </section>
  );
}
