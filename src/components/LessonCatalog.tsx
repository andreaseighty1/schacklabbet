import { ArrowRight, CheckCircle2 } from "lucide-react";
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
  const sections =
    category === "school"
      ? schoolSections
      : [
          {
            title: "Matt i ett drag",
            description: "Hitta ett drag som avslutar partiet med schackmatt.",
            ids: lessons.map((e) => e.id),
          },
        ];
  return (
    <>
      {category === "school" && (
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
      {sections.map((section) => (
        <section
          className="school-section"
          key={section.title}
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
                    <LessonArt lesson={e.id} />
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
    </>
  );
}
