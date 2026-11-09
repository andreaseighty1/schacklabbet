import { type PieceSymbol } from "chess.js";
import { useEffect, useRef } from "react";
import { ChessThemePicker, type ChessTheme } from "./ChessTheme";
import { Piece } from "./Piece";
import { useSquareNames } from "./SquareNamesToggle";
import type { Voice } from "../audio/useVoice";
import type { VisualPreferences } from "./VisualPreferences";

export function SettingsPage({
  theme,
  onTheme,
  gameNames,
  onGameNames,
  voice,
  visuals,
  onVisuals,
  reducedMotion,
}: {
  theme: ChessTheme;
  onTheme: (theme: ChessTheme) => void;
  gameNames: boolean;
  onGameNames: () => void;
  voice: Voice;
  visuals: VisualPreferences;
  onVisuals: (value: VisualPreferences) => void;
  reducedMotion: boolean;
}) {
  const [lessonNames, toggleLessonNames] = useSquareNames("lesson");
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, []);
  const pieces: (PieceSymbol | null)[] = [
    "r",
    "n",
    "q",
    "k",
    "p",
    null,
    null,
    "p",
    "p",
    null,
    null,
    "p",
    "r",
    "n",
    "q",
    "k",
  ];
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">DITT BRÄDE. DITT SÄTT ATT LÄRA.</div>
          <h1 ref={heading} tabIndex={-1}>
            Inställningar
          </h1>
          <p>Välj hur Schacklabbet ska se ut och vilken hjälp du vill ha.</p>
        </div>
      </div>
      <div className="settings-grid">
        <section className="settings-card" aria-labelledby="appearance-heading">
          <h2 id="appearance-heading">Bräde och pjäser</h2>
          <p>Välj ett klassiskt träbräde eller det gröna temat.</p>
          <ChessThemePicker theme={theme} onChange={onTheme} />
          <div className="chess-theme-picker">
            <label htmlFor="piece-set">Pjäsernas utseende</label>
            <select
              id="piece-set"
              value={visuals.pieceSet}
              onChange={(event) =>
                onVisuals({
                  ...visuals,
                  pieceSet:
                    event.target.value === "simple" ? "simple" : "sculpted",
                })
              }
            >
              <option value="sculpted">
                Skulpterade · elfenben och valnöt
              </option>
              <option value="simple">Enkla · tydliga tecknade pjäser</option>
            </select>
          </div>
          <div
            className="theme-preview"
            role="img"
            aria-label="Förhandsvisning av valt bräde och pjäser"
          >
            {pieces.map((piece, index) => (
              <span
                key={index}
                className={`theme-preview-cell ${(Math.floor(index / 4) + (index % 4)) % 2 ? "dark" : "light"}`}
              >
                {piece && <Piece type={piece} color={index < 8 ? "b" : "w"} />}
              </span>
            ))}
          </div>
          <p className="fine-print">
            Spelarna heter vit och svart. De skulpterade pjäserna är alltid
            elfenbensvita och bruna. Dina val sparas på den här datorn.
          </p>
        </section>
        <div className="settings-stack">
          <section className="settings-card" aria-labelledby="motion-heading">
            <h2 id="motion-heading">Pjäsernas rörelser</h2>
            <p>
              Låt pjäserna glida från en ruta till nästa, så att draget blir
              lättare att följa.
            </p>
            <label className="settings-check">
              <input
                type="checkbox"
                checked={visuals.animateMoves}
                onChange={() =>
                  onVisuals({ ...visuals, animateMoves: !visuals.animateMoves })
                }
              />
              Glidande förflyttningar
            </label>
            <p className="fine-print">
              {reducedMotion
                ? "Datorn har valt minskad rörelse. Därför visas dragen direkt, även om rutan är ikryssad."
                : "Avmarkera för att visa dragen direkt. Valet gäller i både partier och lektioner."}
            </p>
          </section>
          <section
            className="settings-card"
            aria-labelledby="coordinates-heading"
          >
            <h2 id="coordinates-heading">Hitta rätt ruta</h2>
            <p>
              Visa namn som D4 direkt på rutorna. Du kan också ändra detta vid
              brädet.
            </p>
            <label className="settings-check">
              <input
                type="checkbox"
                checked={gameNames}
                onChange={onGameNames}
              />{" "}
              Rutnamn i partier
            </label>
            <label className="settings-check">
              <input
                type="checkbox"
                checked={lessonNames}
                onChange={toggleLessonNames}
              />{" "}
              Rutnamn i lektioner
            </label>
            <p className="fine-print">
              Valet för lektioner gäller också när du provar ett förslag efter
              partiet.
            </p>
          </section>
          <section className="settings-card" aria-labelledby="voice-heading">
            <h2 id="voice-heading">Röst</h2>
            <p>Du väljer själv när du vill lyssna.</p>
            <button
              className="button outline"
              aria-pressed={voice.state.enabled}
              onClick={() => voice.player.setEnabled(!voice.state.enabled)}
            >
              {voice.state.enabled ? "Stäng av rösten" : "Slå på rösten"}
            </button>
            <p className="fine-print">
              Rösten börjar alltid avstängd när du öppnar eller laddar om sidan.
              Du kan också styra den med Röst-knappen högst upp.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
