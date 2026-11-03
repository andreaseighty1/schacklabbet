import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { exercises, schoolSections, type Exercise } from "../content";
import { LessonArt } from "./LessonArt";

export function LessonCatalog({
  category,
  completed,
  onSelect,
}: {
  category: "school" | "challenge";
  completed: string[];
  onSelect: (exercise: Exercise) => void;
}) {
  const lessons = exercises.filter((e) => e.category === category);
  const [track, updateTrack] = useState<"foundation" | "advanced">(() => {
    try {
      return sessionStorage.getItem("schacklabbet.school-track") === "advanced"
        ? "advanced"
        : "foundation";
    } catch {
      return "foundation";
    }
  });
  function setTrack(next: "foundation" | "advanced") {
    updateTrack(next);
    try {
      sessionStorage.setItem("schacklabbet.school-track", next);
    } catch {
      /* Selection still works without storage. */
    }
  }
  const sections =
    category === "school"
      ? schoolSections.filter(
          (section) => (section.track ?? "foundation") === track,
        )
      : [
          {
            title: "Matt i ett drag",
            description: "Hitta ett drag som avslutar partiet med schackmatt.",
            ids: lessons.map((e) => e.id),
          },
        ];
  const nextLesson = sections
    .flatMap((s) => s.ids)
    .map((id) => lessons.find((e) => e.id === id)!)
    .find((e) => !completed.includes(e.id));
  return (
    <>
      {category === "school" && (
        <>
          <div
            className="school-tracks"
            role="tablist"
            aria-label="Välj lärväg"
          >
            {(
              [
                ["foundation", "Grunderna"],
                ["advanced", "Nästa nivå"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                role="tab"
                id={`track-${id}`}
                aria-selected={track === id}
                aria-controls="school-track-content"
                tabIndex={track === id ? 0 : -1}
                onClick={() => setTrack(id)}
                onKeyDown={(event) => {
                  if (
                    ["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                      event.key,
                    )
                  ) {
                    event.preventDefault();
                    const next =
                      event.key === "Home"
                        ? "foundation"
                        : event.key === "End"
                          ? "advanced"
                          : track === "foundation"
                            ? "advanced"
                            : "foundation";
                    setTrack(next);
                    document.getElementById(`track-${next}`)?.focus();
                  }
                }}
              >
                {label}
                <span>
                  {
                    schoolSections
                      .filter((s) => (s.track ?? "foundation") === id)
                      .flatMap((s) => s.ids)
                      .filter((key) => completed.includes(key)).length
                  }{" "}
                  av{" "}
                  {
                    schoolSections
                      .filter((s) => (s.track ?? "foundation") === id)
                      .flatMap((s) => s.ids).length
                  }{" "}
                  klara
                </span>
              </button>
            ))}
          </div>
          <p className="school-track-intro">
            {track === "foundation"
              ? "Börja här om du är ny. Lär dig reglerna och vanorna som hjälper dig att spela ett helt parti."
              : "För dig som kan flytta pjäserna och vill lära dig mer. Välj ett område som gör dig nyfiken. Du får prova, ta ledtrådar och börja om."}
          </p>
          <div className="school-next">
            <div>
              <strong>
                {nextLesson
                  ? "Nästa rekommenderade lektion"
                  : "Du har provat hela den här lärvägen!"}
              </strong>
              <p>
                {nextLesson
                  ? nextLesson.title
                  : track === "foundation"
                    ? "Repetera när du vill, eller upptäck Nästa nivå."
                    : "Repetera dina favoriter och prova idéerna i ett parti."}
              </p>
            </div>
            {nextLesson && (
              <button
                className="button primary"
                aria-label="Starta nästa rekommenderade lektion"
                onClick={() => onSelect(nextLesson)}
              >
                Fortsätt din lärväg <ArrowRight size={17} />
              </button>
            )}
            {!nextLesson && track === "foundation" && (
              <button
                className="button primary"
                onClick={() => setTrack("advanced")}
              >
                Upptäck nästa nivå <ArrowRight size={17} />
              </button>
            )}
          </div>
          <div className="school-chapters" aria-label="Hoppa till ett område">
            {sections.map((s, i) => (
              <a
                key={s.title}
                href={`#school-section-${track}-${i}`}
                onClick={(event) => {
                  event.preventDefault();
                  document
                    .getElementById(`school-section-${track}-${i}`)
                    ?.scrollIntoView({ block: "start" });
                }}
              >
                {s.title}
              </a>
            ))}
          </div>
        </>
      )}
      {category === "school" && track === "foundation" && (
        <details className="school-basics">
          <summary>Första gången? Så börjar ett parti</summary>
          <p>
            Ställ brädet så att du har en ljus ruta längst ner till höger. Varje
            spelare börjar med 16 pjäser: åtta bönder, två torn, två springare,
            två löpare, en dam och en kung.
          </p>
          <p>
            På raden närmast dig står torn, springare, löpare, dam, kung,
            löpare, springare och torn från vänster till höger när du spelar
            vit. Damen börjar på sin egen färg: vit dam på ljus ruta och svart
            dam på mörk. Bönderna står på raden framför.
          </p>
          <p>
            Vit börjar. Sedan turas ni om att göra ett drag var. Du flyttar dina
            egna pjäser. När du tar en motståndarpjäs tar du bort den och
            ställer din pjäs på dess ruta. En passant är ett undantag som du kan
            lära dig sist.
          </p>
          <p>
            Du får inte landa på en egen pjäs. Bara springaren kan hoppa över
            pjäser. Skydda alltid din kung. Målet är schackmatt: motståndarens
            kung är hotad och inget lagligt drag kan rädda den.
          </p>
          <p>
            Rutorna har namn som D4: bokstaven visar linjen och siffran visar
            raden. Börja med bondens första övning nedan.
          </p>
        </details>
      )}
      <div
        id="school-track-content"
        role={category === "school" ? "tabpanel" : undefined}
        aria-labelledby={category === "school" ? `track-${track}` : undefined}
      >
        {sections.map((section, index) => (
          <section
            className="school-section"
            key={section.title}
            id={`school-section-${track}-${index}`}
            aria-label={section.title}
          >
            <div className="school-section-heading">
              <h2>{section.title}</h2>
              <p>{section.description}</p>
              <span>
                {section.ids.filter((id) => completed.includes(id)).length} av{" "}
                {section.ids.length} klara
              </span>
            </div>
            <div className="lesson-grid">
              {section.ids
                .map((id) => lessons.find((e) => e.id === id)!)
                .map((e) => (
                  <button
                    key={e.id}
                    className="lesson-card"
                    onClick={() => onSelect(e)}
                  >
                    <div className="lesson-art">
                      <LessonArt
                        lesson={e.id}
                        position={e.takeaway ? e.fen : undefined}
                      />
                      <span className="lesson-number">
                        {String(lessons.indexOf(e) + 1).padStart(2, "0")}
                      </span>
                      {completed.includes(e.id) && (
                        <span className="lesson-complete">
                          <CheckCircle2 size={21} /> Klar
                        </span>
                      )}
                    </div>
                    <div className="lesson-copy">
                      <span className="card-kicker">{e.tag}</span>
                      <h3>{e.title}</h3>
                      <span className="lesson-link">
                        {completed.includes(e.id)
                          ? "Prova igen"
                          : "Börja upptäcka"}
                        <ArrowRight size={18} />
                      </span>
                    </div>
                  </button>
                ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
