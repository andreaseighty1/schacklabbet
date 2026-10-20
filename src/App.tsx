import { useEffect, useRef, useState, type ReactNode } from "react";
import { Chess, type Color, type Square, type Move } from "chess.js";
import {
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CircleHelp,
  Flag,
  FlipVertical2,
  Home,
  Lightbulb,
  Menu,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Swords,
  Target,
  Trophy,
  Users,
  X,
  Zap,
  Download,
  CheckCircle2,
  Wifi,
  VolumeX,
} from "lucide-react";
import { Board } from "./components/Board";
import { Piece } from "./components/Piece";
import { LessonArt } from "./components/LessonArt";
import {
  AchievementArt,
  type AchievementKind,
} from "./components/AchievementArt";
import { levels, search } from "./chess/engine";
import {
  capturedPieces,
  concreteClue,
  other,
  pieceNames,
  playUci,
  previewRisk,
  resultText,
  threats,
  updateResultHeader,
  type Profile,
  type Promotion,
} from "./chess/model";
import {
  emptyProgress,
  readGame,
  readProgress,
  recordGame,
  type Progress,
  type SavedGame,
} from "./storage";
import { exercises, type Exercise } from "./content";
import { checkSupabase } from "./supabase";

type View =
  | "home"
  | "play"
  | "school"
  | "challenges"
  | "tournament"
  | "progress"
  | "friends";
type Config = { color: Color; level: number; profile: Profile };
type Risk = {
  from: Square;
  to: Square;
  promotion: Promotion;
  attackers: Move[];
};
const profileNames: Record<Profile, string> = {
  beginner: "Nybörjare",
  training: "Träning",
  competition: "Tävling",
};
const navItems: { id: View; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Översikt", icon: Home },
  { id: "play", label: "Spela schack", icon: Swords },
  { id: "school", label: "Schackskolan", icon: BookOpen },
  { id: "challenges", label: "Utmaningar", icon: Target },
  { id: "friends", label: "Spela med en kompis", icon: Users },
  { id: "tournament", label: "Schackfyran-träning", icon: Trophy },
  { id: "progress", label: "Mina framsteg", icon: Sparkles },
];
function initialView(): View {
  const id = location.hash.slice(1);
  return navItems.some((x) => x.id === id) ? (id as View) : "home";
}
function loadInitial(): {
  saved: SavedGame | null;
  progress: Progress;
  warning: string;
} {
  let saved: SavedGame | null = null;
  let progress = emptyProgress();
  const errors: string[] = [];
  try {
    saved = readGame(localStorage);
  } catch {
    errors.push(
      "Det sparade partiet kunde inte läsas. Du kan starta ett nytt.",
    );
  }
  try {
    progress = readProgress(localStorage);
  } catch {
    errors.push("Sparade framsteg kunde inte läsas.");
  }
  return { saved, progress, warning: errors.join(" ") };
}
function Logo() {
  return (
    <span className="brand">
      <span className="brand-mark">
        <Piece type="n" color="w" />
      </span>
      <span>
        schack<span className="brand-light">labbet</span>
        <small>NYFIKENHET GÖR NÄSTA DRAG.</small>
      </span>
    </span>
  );
}
function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab") {
        const nodes = ref.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),select,input,[tabindex="0"]',
        );
        if (!nodes?.length) return;
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (
          !e.shiftKey &&
          (document.activeElement === last ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        ref={ref}
      >
        <button
          className="icon-button modal-close"
          onClick={onClose}
          aria-label="Stäng"
        >
          <X />
        </button>
        <h2 id="modal-title">{title}</h2>
        {children}
      </div>
    </div>
  );
}
function HeroArt() {
  return (
    <div className="hero-art" aria-hidden="true">
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <span className="art-star star-one">✦</span>
      <span className="art-star star-two">✧</span>
      <span className="art-dot" />
      <div className="floating-board">
        {Array.from({ length: 16 }, (_, i) => (
          <div
            key={i}
            className={
              (Math.floor(i / 4) + (i % 4)) % 2 ? "mini-dark" : "mini-light"
            }
          />
        ))}
        <div className="art-piece art-knight">
          <Piece type="n" color="w" />
        </div>
        <div className="art-piece art-pawn">
          <Piece type="p" color="b" />
        </div>
      </div>
      <span className="art-caption">
        <Lightbulb size={16} /> Ett drag kan förändra allt.
      </span>
    </div>
  );
}
export default function App() {
  const [initial] = useState(loadInitial);
  const gameRef = useRef<Chess | null>(null);
  if (!gameRef.current) {
    gameRef.current = new Chess();
    if (initial.saved) gameRef.current.loadPgn(initial.saved.pgn);
  }
  const game = gameRef.current;
  const [view, setView] = useState<View>(initialView);
  const viewRef = useRef(view);
  const [config, setConfig] = useState<Config>({
    color: initial.saved?.color ?? "w",
    level: initial.saved?.level ?? 0,
    profile: initial.saved?.profile ?? "beginner",
  });
  const [draft, setDraft] = useState<Config>(config);
  const [id, setId] = useState(initial.saved?.id ?? crypto.randomUUID());
  const [revision, setRevision] = useState(0);
  const [hasGame, setHasGame] = useState(Boolean(initial.saved));
  const [ended, setEnded] = useState<string | null>(
    initial.saved?.ended ?? null,
  );
  const [orientation, setOrientation] = useState<Color>(config.color);
  const [selected, setSelected] = useState<Square | null>(null);
  const [showMoves, setShowMoves] = useState(true);
  const [showThreats, setShowThreats] = useState(false);
  const [busy, setBusy] = useState(false);
  const [engineError, setEngineError] = useState("");
  const [warning, setWarning] = useState(initial.warning);
  const [message, setMessage] = useState(
    "Klicka på en pjäs för att upptäcka dina möjligheter.",
  );
  const [modal, setModal] = useState<"new" | "resign" | "help" | null>(null);
  const [promotion, setPromotion] = useState<{
    from: Square;
    to: Square;
  } | null>(null);
  const [risk, setRisk] = useState<Risk | null>(null);
  const [riskShown, setRiskShown] = useState(false);
  const [hint, setHint] = useState<{ level: number; move?: string }>({
    level: 0,
  });
  const [hintBusy, setHintBusy] = useState(false);
  const hintAbort = useRef<AbortController | null>(null);
  const [progress, setProgress] = useState<Progress>(initial.progress);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [replay, setReplay] = useState<number | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [connection, setConnection] = useState<{
    connected: boolean;
    anonymous: boolean;
    message: string;
  } | null>(null);
  const [connectionBusy, setConnectionBusy] = useState(false);
  const terminal = ended || resultText(game);
  const competition = config.profile === "competition";
  const history = game.history({ verbose: true });
  const playerTurn = game.turn() === config.color;
  const legal =
    selected && !competition && showMoves
      ? game.moves({ square: selected, verbose: true }).map((m) => m.to)
      : [];
  const threatList =
    showThreats && !competition ? threats(game, config.color) : [];
  function navigate(next: View) {
    hintAbort.current?.abort();
    viewRef.current = next;
    setView(next);
    location.hash = next;
    setMobileMenu(false);
    setExercise(null);
    setSelected(null);
  }
  useEffect(() => {
    const handler = () => {
      const next = initialView();
      if (next !== viewRef.current) {
        hintAbort.current?.abort();
        viewRef.current = next;
        setView(next);
        setExercise(null);
        setSelected(null);
      }
    };
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  useEffect(() => {
    return () => hintAbort.current?.abort();
  }, []);
  useEffect(() => {
    if (!hasGame) return;
    try {
      const saved: SavedGame = {
        version: 1,
        pgn: game.pgn(),
        ...config,
        ended,
        id,
      };
      localStorage.setItem("schacklabbet.game.v1", JSON.stringify(saved));
    } catch {
      setWarning(
        "Webbläsaren kunde inte spara ditt parti. Behåll fliken öppen för att fortsätta spela.",
      );
    }
  }, [revision, hasGame, config, ended, id, game]);
  useEffect(() => {
    try {
      localStorage.setItem(
        "schacklabbet.progress.v1",
        JSON.stringify(progress),
      );
    } catch {
      setWarning("Framstegen kunde inte sparas i den här webbläsaren.");
    }
  }, [progress]);
  useEffect(() => {
    if (!hasGame || !terminal) return;
    const won = game.isCheckmate() && game.turn() !== config.color;
    setProgress((p) => recordGame(p, id, won));
  }, [terminal, hasGame, id, config.color, game]);
  useEffect(() => {
    if (
      view !== "play" ||
      !hasGame ||
      terminal ||
      playerTurn ||
      replay !== null
    ) {
      setBusy(false);
      return;
    }
    const controller = new AbortController();
    const fen = game.fen();
    setBusy(true);
    setEngineError("");
    search(fen, config.level, controller.signal)
      .then((move) => {
        if (controller.signal.aborted || game.fen() !== fen) return;
        playUci(game, move);
        updateResultHeader(game);
        setRevision((r) => r + 1);
        setMessage(
          game.isCheck()
            ? "Din kung står i schack. Skydda kungen!"
            : "Din tur. Vad vill du upptäcka?",
        );
      })
      .catch((error) => {
        if (error.name !== "AbortError") setEngineError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => controller.abort();
  }, [
    view,
    revision,
    hasGame,
    terminal,
    playerTurn,
    replay,
    config.level,
    game,
  ]);
  function newGame() {
    hintAbort.current?.abort();
    game.reset();
    setConfig(draft);
    setId(crypto.randomUUID());
    setHasGame(true);
    setEnded(null);
    setOrientation(draft.color);
    setSelected(null);
    setRisk(null);
    setPromotion(null);
    setHint({ level: 0 });
    setReplay(null);
    setShowMoves(true);
    setShowThreats(false);
    setModal(null);
    setEngineError("");
    setMessage("Ta ett andetag. Titta på brädet. Nästa drag är ditt.");
    setRevision((r) => r + 1);
    navigate("play");
  }
  function openNew(profile?: Profile) {
    setDraft({ ...config, profile: profile ?? config.profile });
    setModal("new");
  }
  function applyMove(
    from: Square,
    to: Square,
    promote: Promotion = "q",
    force = false,
  ) {
    if (!playerTurn || terminal || busy || replay !== null) return;
    if (!game.moves({ square: from, verbose: true }).some((m) => m.to === to)) {
      setMessage("Det draget går inte. Välj en annan ruta.");
      return;
    }
    if (config.profile === "beginner" && !force) {
      const assessment = previewRisk(game, from, to, promote);
      if (assessment.attackers.length) {
        setRisk({
          from,
          to,
          promotion: promote,
          attackers: assessment.attackers,
        });
        setRiskShown(false);
        return;
      }
    }
    hintAbort.current?.abort();
    game.move({ from, to, promotion: promote });
    updateResultHeader(game);
    setSelected(null);
    setRisk(null);
    setPromotion(null);
    setHint({ level: 0 });
    setRevision((r) => r + 1);
    setMessage(
      game.isCheck()
        ? "Schack! Nu måste motståndaren skydda sin kung."
        : "Bra, nu är det datorns tur att tänka.",
    );
  }
  function selectSquare(square: Square, dragFrom?: Square) {
    if (!playerTurn || terminal || busy || replay !== null) return;
    const from = dragFrom ?? selected;
    const piece = game.get(square);
    if (
      from &&
      from !== square &&
      game.moves({ square: from, verbose: true }).some((m) => m.to === square)
    ) {
      if (game.get(from)?.type === "p" && ["1", "8"].includes(square[1])) {
        setPromotion({ from, to: square });
        return;
      }
      applyMove(from, square);
      return;
    }
    if (piece?.color === config.color) {
      setSelected(square === selected ? null : square);
      setMessage(
        `${pieceNames[piece.type][0].toUpperCase() + pieceNames[piece.type].slice(1)} på ${square}. ${competition ? "Välj vart du vill flytta." : "Fundera på vilken ruta som hjälper dina pjäser."}`,
      );
    } else {
      setSelected(null);
      setMessage("Välj en av dina egna pjäser först.");
    }
  }
  function undo() {
    if (competition || terminal || !history.length) return;
    hintAbort.current?.abort();
    const turn = game.turn();
    game.undo();
    if (turn === config.color && game.history().length) game.undo();
    setSelected(null);
    setHint({ level: 0 });
    setEngineError("");
    setRevision((r) => r + 1);
    setMessage("Prova en annan idé. Det är så man lär sig.");
  }
  async function requestHint() {
    if (competition || !playerTurn || terminal || hintBusy) return;
    if (hint.level === 0) {
      setHint({ level: 1 });
      return;
    }
    if (hint.level === 1) {
      setHint({ level: 2 });
      return;
    }
    const controller = new AbortController();
    hintAbort.current?.abort();
    hintAbort.current = controller;
    const fen = game.fen();
    setHintBusy(true);
    try {
      const move = await search(fen, 4, controller.signal);
      if (!controller.signal.aborted && game.fen() === fen)
        setHint({ level: 3, move });
    } catch (error) {
      if ((error as Error).name !== "AbortError")
        setEngineError((error as Error).message);
    } finally {
      setHintBusy(false);
    }
  }
  function completeExercise(value: Exercise) {
    setProgress((p) => ({
      ...p,
      completed: p.completed.includes(value.id)
        ? p.completed
        : [...p.completed, value.id],
    }));
  }
  async function testConnection() {
    setConnectionBusy(true);
    try {
      setConnection(await checkSupabase());
    } catch (error) {
      setConnection({
        connected: false,
        anonymous: false,
        message: (error as Error).message,
      });
    } finally {
      setConnectionBusy(false);
    }
  }
  const played = progress.completed.length;
  const schoolDone = exercises.filter(
    (e) => e.category === "school" && progress.completed.includes(e.id),
  ).length;
  const challengeDone = exercises.filter(
    (e) => e.category === "challenge" && progress.completed.includes(e.id),
  ).length;
  const badges: {
    title: string;
    description: string;
    earned: boolean;
    kind: AchievementKind;
  }[] = [
    {
      title: "Första partiet",
      description: "Spela ett helt parti",
      earned: progress.games > 0,
      kind: "game",
    },
    {
      title: "Första vinsten",
      description: "Besegra datorn",
      earned: progress.wins > 0,
      kind: "win",
    },
    {
      title: "Nyfiken upptäckare",
      description: "Klara din första lektion",
      earned: schoolDone > 0,
      kind: "explore",
    },
    {
      title: "Mattdetektiv",
      description: "Lös båda mattproblemen",
      earned: challengeDone === 2,
      kind: "mate",
    },
  ];
  let displayedGame = game;
  if (replay !== null) {
    displayedGame = new Chess();
    history.slice(0, replay).forEach((m) => displayedGame.move(m));
  }
  const hintText =
    hint.level === 1
      ? "Börja med att leta efter schackar, möjliga slag och hot. Vad har motståndaren just ändrat?"
      : hint.level === 2
        ? concreteClue(game, config.color)
        : hint.move
          ? `Motorns förslag: ${hint.move.slice(0, 2)} → ${hint.move.slice(2, 4)}. Prova att se vilka rutor pjäsen får kontakt med. Analysen är kort och förslaget är ingen garanti.`
          : "";
  const pageTitle = navItems.find((n) => n.id === view)?.label ?? "Översikt";
  const riskPosition = risk ? new Chess(game.fen()) : null;
  if (risk && riskPosition)
    riskPosition.move({
      from: risk.from,
      to: risk.to,
      promotion: risk.promotion,
    });
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? "is-open" : ""}`}>
        <a
          href="#home"
          className="brand-link"
          onClick={() => navigate("home")}
          aria-label="Schacklabbet, startsida"
        >
          <Logo />
        </a>
        <span className="nav-eyebrow">DITT SCHACKÄVENTYR</span>
        <nav aria-label="Huvudmeny">
          {navItems.map(({ id: navId, label, icon: Icon }) => (
            <a
              key={navId}
              href={`#${navId}`}
              onClick={() => navigate(navId)}
              className={`nav-item ${view === navId ? "active" : ""}`}
              aria-current={view === navId ? "page" : undefined}
            >
              <Icon size={20} />
              <span>{label}</span>
              {navId === "challenges" && <span className="nav-count">2</span>}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="note-orbit">
              <ShieldCheck size={23} />
            </span>
            <strong>Bara du och ditt nästa drag.</strong>
            <p>Gratis, reklamfritt och utan elevkonto.</p>
          </div>
          <button className="nav-item" onClick={() => setModal("help")}>
            <CircleHelp size={19} /> Så funkar Schacklabbet
          </button>
          <div className="sidebar-footer">
            <span className="online-dot" /> Skapat för nyfikna hjärnor
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-toggle"
              aria-label="Öppna meny"
              onClick={() => setMobileMenu((v) => !v)}
            >
              <Menu />
            </button>
            <span>Schacklabbet</span>
            <ChevronRight size={14} />
            <strong>{pageTitle}</strong>
          </div>
          <div className="topbar-right">
            <span className="local-status">
              <span className="online-dot" /> Dina framsteg sparas på den här
              datorn
            </span>
            <span className="profile-avatar" title="Lokal spelare, inget konto">
              <Piece type="p" color="w" />
            </span>
          </div>
        </header>
        <main
          className={`main-content ${view === "play" && hasGame ? "game-content" : ""}`}
        >
          {warning && (
            <div className="notice warning" role="status">
              {warning}
              <button
                className="icon-button"
                aria-label="Stäng meddelande"
                onClick={() => setWarning("")}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {view === "home" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">
                    ETT LITET DRAG. EN STOR UPPTÄCKT.
                  </div>
                  <h1>
                    Hej, schackutforskare
                    <span className="heading-spark">✦</span>
                  </h1>
                  <p>
                    Spela, testa en idé och lär dig något nytt. I din egen takt.
                  </p>
                </div>
                <span className="edition-tag">
                  <span className="online-dot" /> Ditt äventyr börjar här
                </span>
              </div>
              <section className="hero">
                <div className="hero-copy">
                  <span className="pill">
                    <span className="tiny-chess" /> ALLA STORA SPELARE HAR VARIT
                    NYBÖRJARE
                  </span>
                  <h2>
                    Nästa drag
                    <br />
                    är <em>ditt.</em>
                  </h2>
                  <p>
                    Ett helt bräde av möjligheter väntar.
                    <br />
                    Våga prova. Tänk ett steg till. Ha kul.
                  </p>
                  <div className="hero-actions">
                    <button className="button lime" onClick={() => openNew()}>
                      <Swords size={19} /> Spela mot datorn{" "}
                      <ArrowRight size={19} />
                    </button>
                    <button
                      className="hero-link"
                      onClick={() => navigate("school")}
                    >
                      Lär dig grunderna <ArrowUpRight size={17} />
                    </button>
                  </div>
                  <div className="hero-foot">
                    <Check size={14} /> Ingen inloggning <span />{" "}
                    <Check size={14} /> Hjälp när du vill
                  </div>
                </div>
                <HeroArt />
              </section>
              <div className="section-heading">
                <h2>Vad vill du upptäcka idag?</h2>
                <span>Det finns inget fel ställe att börja.</span>
              </div>
              <div className="discovery-grid">
                <button
                  className="discovery-card"
                  onClick={() => navigate("school")}
                >
                  <span className="card-icon sage">
                    <BookOpen />
                  </span>
                  <span className="card-kicker">FRÅN FÖRSTA DRAGET</span>
                  <h3>Schackskolan</h3>
                  <p>
                    Lär känna pjäserna och upptäck
                    <br className="desktop-break" /> hur de kan samarbeta.
                  </p>
                  <span className="card-bottom">
                    <span>4 interaktiva lektioner</span>
                    <span className="round-arrow">
                      <ArrowUpRight size={19} />
                    </span>
                  </span>
                </button>
                <button
                  className="discovery-card"
                  onClick={() => navigate("challenges")}
                >
                  <span className="card-icon peach">
                    <Target />
                  </span>
                  <span className="card-kicker">VÄCK DIN INRE DETEKTIV</span>
                  <h3>Träningsutmaningar</h3>
                  <p>
                    Hitta det smarta draget.
                    <br />
                    Små klurigheter, stora aha-ögonblick.
                  </p>
                  <span className="card-bottom">
                    <span>2 verifierade schackproblem</span>
                    <span className="round-arrow">
                      <ArrowUpRight size={19} />
                    </span>
                  </span>
                </button>
                <button
                  className="discovery-card"
                  onClick={() => navigate("friends")}
                >
                  <span className="card-icon lavender">
                    <Users />
                  </span>
                  <span className="card-kicker">ROLIGARE TILLSAMMANS</span>
                  <h3>Spela med en kompis</h3>
                  <p>
                    En egen spelkod. En kompis.
                    <br />
                    Ett vänligt möte över schackbrädet.
                  </p>
                  <span className="card-bottom">
                    <span className="coming-label">Kommer i nästa etapp</span>
                    <span className="round-arrow">
                      <ArrowUpRight size={19} />
                    </span>
                  </span>
                </button>
              </div>
              <div className="home-bottom-grid">
                <section className="tournament-banner">
                  <div className="tournament-icon">
                    <Trophy size={31} />
                  </div>
                  <div>
                    <span className="card-kicker">REDO FÖR NÄSTA STEG?</span>
                    <h3>Träna inför Schackfyran</h3>
                    <p>
                      Öva på att tänka efter, se hot och spela självständigt.
                    </p>
                  </div>
                  <button
                    className="button outline"
                    onClick={() => navigate("tournament")}
                  >
                    Till träningen <ArrowRight size={17} />
                  </button>
                </section>
                <button
                  className="progress-teaser"
                  onClick={() => navigate("progress")}
                >
                  <span className="progress-emblem">
                    <Sparkles size={24} />
                  </span>
                  <div>
                    <span className="card-kicker">ETT STEG I TAGET</span>
                    <h3>Se hur du växer</h3>
                    <p>
                      {played} av {exercises.length} övningar klara
                    </p>
                  </div>
                  <ChevronRight size={21} />
                  <span className="progress-track">
                    <span
                      style={{ width: `${(played / exercises.length) * 100}%` }}
                    />
                  </span>
                </button>
              </div>
              <footer className="page-footer">
                <span>
                  <ShieldCheck size={15} /> En trygg plats att tänka fritt.
                </span>
                <span>
                  Ett fristående schackäventyr. Inte en officiell
                  Schackfyran-produkt.
                </span>
              </footer>
            </>
          )}
          {view === "play" && !hasGame && (
            <section className="empty-state">
              <span className="large-piece">
                <Piece type="n" color="w" />
              </span>
              <div className="eyebrow">DITT FÖRSTA DRAG VÄNTAR</div>
              <h1>Ska vi spela?</h1>
              <p>Välj färg, svårighet och hur mycket hjälp du vill ha.</p>
              <button className="button primary" onClick={() => openNew()}>
                Starta ett parti <ArrowRight size={18} />
              </button>
            </section>
          )}
          {view === "play" && hasGame && (
            <>
              <div className="game-heading">
                <div>
                  <div className="eyebrow">ETT DRAG I TAGET</div>
                  <h1>
                    Du möter datorn
                    <span className="level-chip">
                      {levels[config.level].name}
                    </span>
                  </h1>
                </div>
                <button
                  className="button outline small"
                  onClick={() => openNew()}
                >
                  <Swords size={16} /> Nytt parti
                </button>
              </div>
              <div className="game-layout">
                <section className="board-column" aria-label="Partiet">
                  <div className="player-row">
                    <span className="player-icon computer">
                      <Zap size={21} />
                    </span>
                    <div>
                      <strong>
                        Labbet <span className="subtle-tag">DATOR</span>
                      </strong>
                      <span>
                        {config.color === "w" ? "Svarta" : "Vita"} pjäser ·{" "}
                        {levels[config.level].name}
                      </span>
                    </div>
                    <div className="captured-strip">
                      {capturedPieces(game, other(config.color)).map((p, i) => (
                        <Piece key={i} type={p} color={config.color} />
                      ))}
                    </div>
                    {busy && (
                      <span className="thinking">
                        <span className="online-dot" /> Tänker…
                      </span>
                    )}
                  </div>
                  <Board
                    game={displayedGame}
                    orientation={orientation}
                    selected={selected}
                    legal={legal}
                    last={
                      replay === null ? history.at(-1) : history[replay - 1]
                    }
                    threatened={threatList.map((t) => t.square)}
                    highlight={
                      hint.move
                        ? [
                            hint.move.slice(0, 2) as Square,
                            hint.move.slice(2, 4) as Square,
                          ]
                        : []
                    }
                    onSquare={selectSquare}
                    disabled={
                      busy ||
                      !playerTurn ||
                      Boolean(terminal) ||
                      replay !== null
                    }
                  />
                  <div className="player-row own-player">
                    <span className="player-icon you">
                      <Piece type="p" color={config.color} />
                    </span>
                    <div>
                      <strong>
                        Du{" "}
                        <span className="subtle-tag">
                          {config.color === "w" ? "VIT" : "SVART"}
                        </span>
                      </strong>
                      <span>
                        {profileNames[config.profile]}
                        {competition
                          ? " · utan hjälpmedel"
                          : " · tänk, prova, upptäck"}
                      </span>
                    </div>
                    <div className="captured-strip">
                      {capturedPieces(game, config.color).map((p, i) => (
                        <Piece key={i} type={p} color={other(config.color)} />
                      ))}
                    </div>
                    <span className="sound-label">
                      <VolumeX size={16} /> Ljud av
                    </span>
                  </div>
                  <div className="board-controls">
                    <button
                      className="text-button"
                      onClick={() => setOrientation((c) => other(c))}
                    >
                      <FlipVertical2 size={17} /> Vänd brädet
                    </button>
                    {!competition && (
                      <button
                        className="text-button"
                        disabled={!history.length || Boolean(terminal)}
                        onClick={undo}
                      >
                        <RotateCcw size={17} /> Ångra
                      </button>
                    )}
                    <span className="board-control-spacer" />
                    {!terminal && (
                      <button
                        className="text-button"
                        onClick={() => setModal("resign")}
                      >
                        <Flag size={16} /> Ge upp
                      </button>
                    )}
                    {terminal && (
                      <button
                        className="text-button"
                        onClick={() => {
                          const blob = new Blob([game.pgn()], {
                            type: "application/x-chess-pgn",
                          });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = "schacklabbet.pgn";
                          a.click();
                          setTimeout(() => URL.revokeObjectURL(url), 1000);
                        }}
                      >
                        <Download size={16} /> Spara PGN
                      </button>
                    )}
                  </div>
                </section>
                <aside className="game-panel">
                  <div
                    className={`turn-card ${terminal ? "finished" : ""}`}
                    aria-live="polite"
                  >
                    <span className="turn-card-icon">
                      {terminal ? (
                        <Trophy size={23} />
                      ) : (
                        <Piece type="p" color={game.turn()} />
                      )}
                    </span>
                    <div>
                      <span className="eyebrow">
                        {terminal
                          ? "PARTIET ÄR KLART"
                          : busy
                            ? "DATORN FUNDERAR"
                            : playerTurn
                              ? "DIN TUR ATT UPPTÄCKA"
                              : "MOTSTÅNDARENS TUR"}
                      </span>
                      <h2>
                        {terminal ||
                          (game.isCheck()
                            ? "Schack – skydda kungen!"
                            : playerTurn
                              ? "Vad blir ditt nästa drag?"
                              : "Ett ögonblick…")}
                      </h2>
                    </div>
                  </div>
                  {engineError && (
                    <div className="notice warning" role="alert">
                      {engineError}
                      <button
                        className="button outline small"
                        onClick={() => setRevision((r) => r + 1)}
                      >
                        Försök igen
                      </button>
                    </div>
                  )}
                  {!terminal && (
                    <div className="coach-note" role="status">
                      <Lightbulb size={19} />
                      <p>{message}</p>
                    </div>
                  )}
                  {!competition && !terminal && (
                    <section className="panel-section">
                      <h3>
                        <Settings2 size={17} /> Dina hjälpmedel
                      </h3>
                      <label className="toggle-row">
                        <span>
                          Visa möjliga drag
                          <small>Upptäck vart din pjäs kan gå</small>
                        </span>
                        <input
                          type="checkbox"
                          checked={showMoves}
                          onChange={(e) => setShowMoves(e.target.checked)}
                        />
                        <span className="switch" />
                      </label>
                      <label className="toggle-row">
                        <span>
                          Visa hotade pjäser
                          <small>Utropstecken = kan slås lagligt</small>
                        </span>
                        <input
                          type="checkbox"
                          checked={showThreats}
                          onChange={(e) => setShowThreats(e.target.checked)}
                        />
                        <span className="switch" />
                      </label>
                      {showThreats && (
                        <p className="fine-print">
                          {threatList.length
                            ? `${new Set(threatList.map((t) => t.square)).size} av dina pjäser kan slås. En angripen pjäs kan vara försvarad – den är inte automatiskt förlorad.`
                            : "Ingen av dina pjäser kan just nu slås med ett lagligt drag."}
                        </p>
                      )}
                      <button
                        className="button hint-button"
                        disabled={
                          busy || !playerTurn || hintBusy || hint.level === 3
                        }
                        onClick={requestHint}
                      >
                        <Lightbulb size={18} />
                        {hintBusy
                          ? "Analyserar…"
                          : hint.level === 0
                            ? "Ge mig en ledtråd"
                            : hint.level === 1
                              ? "En tydligare ledtråd"
                              : hint.level === 2
                                ? "Visa motorns förslag"
                                : "Förslag visas"}
                        <span>{Math.min(hint.level + 1, 3)}/3</span>
                      </button>
                      {hintText && (
                        <p className="hint-text" role="status">
                          {hintText}
                        </p>
                      )}
                    </section>
                  )}
                  {competition && !terminal && (
                    <div className="coach-note">
                      <ShieldCheck size={20} />
                      <p>
                        Du spelar självständigt. Ta god tid på dig och undersök
                        motståndarens hot innan du flyttar.
                      </p>
                    </div>
                  )}
                  <section className="panel-section moves-section">
                    <h3>
                      <Swords size={17} /> Partiets drag{" "}
                      <span className="move-count">{history.length}</span>
                    </h3>
                    <div className="move-table" aria-label="Draglista">
                      <div className="move-table-head">
                        <span>#</span>
                        <span>Vit</span>
                        <span>Svart</span>
                      </div>
                      {history.length === 0 ? (
                        <p className="moves-empty">
                          En tom draglista.
                          <br />
                          En värld av möjligheter.
                        </p>
                      ) : (
                        Array.from(
                          { length: Math.ceil(history.length / 2) },
                          (_, i) => (
                            <div className="move-pair" key={i}>
                              <span>{i + 1}.</span>
                              <span>{history[i * 2].san}</span>
                              <span>{history[i * 2 + 1]?.san ?? "—"}</span>
                            </div>
                          ),
                        )
                      )}
                    </div>
                  </section>
                  {terminal && (
                    <section className="panel-section">
                      <h3>
                        <BookOpen size={17} /> Lär av ditt parti
                      </h3>
                      <p className="fine-print">
                        Du gjorde{" "}
                        {history.filter((m) => m.color === config.color).length}{" "}
                        drag och tog {capturedPieces(game, config.color).length}{" "}
                        pjäser. Spela igenom partiet och se vad som hände. Ingen
                        motorbedömning av misstag har gjorts.
                      </p>
                      <div className="replay-controls">
                        <button
                          className="icon-button"
                          aria-label="Föregående drag"
                          disabled={replay === 0}
                          onClick={() =>
                            setReplay((v) =>
                              Math.max(0, (v ?? history.length) - 1),
                            )
                          }
                        >
                          <ChevronLeft />
                        </button>
                        <span>
                          Drag {replay ?? history.length} / {history.length}
                        </span>
                        <button
                          className="icon-button"
                          aria-label="Nästa drag"
                          disabled={
                            (replay ?? history.length) === history.length
                          }
                          onClick={() =>
                            setReplay((v) =>
                              Math.min(
                                history.length,
                                (v ?? history.length) + 1,
                              ),
                            )
                          }
                        >
                          <ChevronRight />
                        </button>
                      </div>
                      <button
                        className="button primary full-width"
                        onClick={() => openNew()}
                      >
                        Spela igen <ArrowRight size={17} />
                      </button>
                    </section>
                  )}
                  <div className="panel-bottom">
                    <ShieldCheck size={15} />{" "}
                    {competition
                      ? "Tävlingsprofil · utan schackklocka"
                      : "Ditt parti sparas automatiskt på datorn"}
                  </div>
                </aside>
              </div>
            </>
          )}
          {(view === "school" || view === "challenges") && (
            <>
              {exercise ? (
                <ExercisePlayer
                  key={exercise.id}
                  exercise={exercise}
                  completed={progress.completed.includes(exercise.id)}
                  onComplete={() => completeExercise(exercise)}
                  onBack={() => setExercise(null)}
                />
              ) : (
                <>
                  <div className="page-heading">
                    <div>
                      <div className="eyebrow">
                        {view === "school"
                          ? "FÖRST NYFIKEN. SEDAN LITE KLOKARE."
                          : "SMÅ PROBLEM. STORA AHA-ÖGONBLICK."}
                      </div>
                      <h1>
                        {view === "school"
                          ? "Välkommen till schackskolan."
                          : "Väck din inre schackdetektiv."}
                      </h1>
                      <p>
                        {view === "school"
                          ? "Korta lektioner där du lär dig genom att prova själv."
                          : "Ta en titt, tänk efter och hitta det smarta draget."}
                      </p>
                    </div>
                  </div>
                  <div className="lesson-grid">
                    {exercises
                      .filter(
                        (e) =>
                          e.category ===
                          (view === "school" ? "school" : "challenge"),
                      )
                      .map((e, i) => (
                        <button
                          key={e.id}
                          className="lesson-card"
                          onClick={() => setExercise(e)}
                        >
                          <div className="lesson-art">
                            <LessonArt lesson={e.id} />
                            <span className="lesson-number">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            {progress.completed.includes(e.id) && (
                              <span className="lesson-complete">
                                <CheckCircle2 size={21} /> Klar
                              </span>
                            )}
                          </div>
                          <div className="lesson-copy">
                            <span className="card-kicker">{e.tag}</span>
                            <h3>{e.title}</h3>
                            <span className="lesson-link">
                              {progress.completed.includes(e.id)
                                ? "Prova igen"
                                : "Börja upptäcka"}
                              <ArrowRight size={18} />
                            </span>
                          </div>
                        </button>
                      ))}
                  </div>
                  <p className="fine-print catalog-note">
                    Varje övning har en kontrollerad ställning och en verifierad
                    lösning. Fler lektioner kommer efterhand.
                  </p>
                </>
              )}
            </>
          )}
          {view === "tournament" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">
                    TÄNK EFTER. SE HOTET. GÖR DITT DRAG.
                  </div>
                  <h1>Träna inför Schackfyran.</h1>
                  <p>
                    Tre steg för att bli tryggare vid brädet. Ta dem i din egen
                    takt.
                  </p>
                </div>
              </div>
              <div className="training-path">
                {[
                  {
                    n: "01",
                    title: "Skydda din kung",
                    text: "Prova rockad och lär dig hur kung och torn samarbetar.",
                    action: () => {
                      navigate("school");
                      setExercise(exercises.find((e) => e.id === "castle")!);
                    },
                    label: "Öva rockad",
                    icon: ShieldCheck,
                  },
                  {
                    n: "02",
                    title: "Se den sista möjligheten",
                    text: "Leta efter schackar och flyktvägar i två mattproblem.",
                    action: () => navigate("challenges"),
                    label: "Lös schackproblem",
                    icon: Target,
                  },
                  {
                    n: "03",
                    title: "Lita på ditt eget tänkande",
                    text: "Spela mot datorn med tävlingsprofil, utan tips och ångra.",
                    action: () => openNew("competition"),
                    label: "Spela utan hjälp",
                    icon: Trophy,
                  },
                ].map(({ n, title, text, action, label, icon: Icon }) => (
                  <section className="training-step" key={n}>
                    <span className="step-number">{n}</span>
                    <span className="card-icon sage">
                      <Icon />
                    </span>
                    <h2>{title}</h2>
                    <p>{text}</p>
                    <button className="button outline" onClick={action}>
                      {label}
                      <ArrowRight size={17} />
                    </button>
                  </section>
                ))}
              </div>
              <div className="notice">
                <CircleHelp size={20} />
                <p>
                  Träningen är fristående och följer inte ett officiellt
                  Schackfyran-program. Tävlingsprofilen har i denna version
                  ingen schackklocka.
                </p>
              </div>
            </>
          )}
          {view === "progress" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">VARJE UPPTÄCKT RÄKNAS</div>
                  <h1>Titta vad du har lärt dig.</h1>
                  <p>
                    Dina framsteg, i din takt. Inga topplistor och ingen stress.
                  </p>
                </div>
              </div>
              <div className="stats-grid">
                {[
                  {
                    label: "Lektioner klara",
                    value: schoolDone,
                    total: "av 4",
                    icon: BookOpen,
                  },
                  {
                    label: "Utmaningar lösta",
                    value: challengeDone,
                    total: "av 2",
                    icon: Target,
                  },
                  {
                    label: "Avslutade partier",
                    value: progress.games,
                    total: "hela partier",
                    icon: Swords,
                  },
                  {
                    label: "Vinster mot datorn",
                    value: progress.wins,
                    total: "bra tänkt!",
                    icon: Trophy,
                  },
                ].map(({ label, value, total, icon: Icon }) => (
                  <section key={label} className="stat-card">
                    <Icon size={23} />
                    <strong>
                      {value}
                      <small>{total}</small>
                    </strong>
                    <span>{label}</span>
                  </section>
                ))}
              </div>
              <div className="section-heading">
                <h2>Dina upptäckarmedaljer</h2>
                <span>Små steg värda att fira.</span>
              </div>
              <div className="badge-grid">
                {badges.map(({ title, description, earned, kind }) => (
                  <div
                    className={`badge-card ${earned ? "earned" : ""}`}
                    key={title}
                  >
                    <div className="medal">
                      <AchievementArt kind={kind} earned={earned} />
                    </div>
                    <h3>{title}</h3>
                    <p>{description}</p>
                    <span className="badge-status">
                      {earned ? (
                        <>
                          <Check size={14} /> Upplåst
                        </>
                      ) : (
                        "Något att upptäcka"
                      )}
                    </span>
                  </div>
                ))}
              </div>
              <div className="notice">
                <ShieldCheck size={21} />
                <p>
                  Framsteg lagras bara i den här webbläsaren. De försvinner om
                  du rensar webbplatsens data eller byter dator. Du behöver
                  inget konto.
                </p>
              </div>
            </>
          )}
          {view === "friends" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">
                    SCHACK ÄR EN UPPTÄCKT NI KAN DELA
                  </div>
                  <h1>Snart möts ni över brädet.</h1>
                  <p>
                    Privata partier med en egen kod är nästa utvecklingsetapp.
                  </p>
                </div>
              </div>
              <section className="friends-card">
                <div className="friend-pieces">
                  <Piece type="n" color="w" />
                  <Piece type="n" color="b" />
                </div>
                <span className="pill subtle">KOMMANDE FUNKTION</span>
                <h2>En kompis. En kod. Ett parti.</h2>
                <p>
                  Multiplayer är ännu inte tillgängligt. Spela mot datorn eller
                  utforska schackskolan under tiden.
                </p>
                <button className="button primary" onClick={() => openNew()}>
                  Spela mot datorn <ArrowRight size={18} />
                </button>
              </section>
              <section className="connection-card">
                <Wifi size={22} />
                <div>
                  <h3>Supabase-anslutning</h3>
                  <p role="status">
                    {connection?.message ??
                      "Kontrollera anslutningen för den här installationen."}
                  </p>
                  {connection?.connected && connection.anonymous && (
                    <p className="fine-print">
                      Databas, RLS-regler, realtime och servervaliderade drag
                      återstår innan multiplayer kan användas.
                    </p>
                  )}
                </div>
                <button
                  className="button outline small"
                  disabled={connectionBusy}
                  onClick={testConnection}
                >
                  {connectionBusy ? "Kontrollerar…" : "Kontrollera"}
                </button>
              </section>
            </>
          )}
        </main>
      </div>
      {modal === "new" && (
        <Modal
          title={
            hasGame && !terminal
              ? "Börja på ett nytt parti?"
              : "Ditt nästa schackäventyr"
          }
          onClose={() => setModal(null)}
        >
          <p className="modal-intro">
            {hasGame && !terminal
              ? "Det här ersätter ditt pågående parti. Välj hur du vill spela."
              : "Gör det lagom klurigt. Du lär dig lite mer med varje drag."}
          </p>
          <label className="field-label" htmlFor="difficulty">
            Vem vill du möta?
          </label>
          <div className="select-wrap">
            <select
              id="difficulty"
              value={draft.level}
              onChange={(e) =>
                setDraft((v) => ({ ...v, level: Number(e.target.value) }))
              }
            >
              {levels.map((l, i) => (
                <option key={l.name} value={i}>
                  {i + 1}. {l.name} – {l.label}
                </option>
              ))}
            </select>
            <ChevronDown size={17} />
          </div>
          <span className="field-label">Välj dina pjäser</span>
          <div className="segmented">
            {(["w", "b"] as const).map((c) => (
              <button
                key={c}
                className={draft.color === c ? "chosen" : ""}
                aria-pressed={draft.color === c}
                onClick={() => setDraft((v) => ({ ...v, color: c }))}
              >
                <Piece type="p" color={c} />
                {c === "w" ? "Vit · du börjar" : "Svart · datorn börjar"}
              </button>
            ))}
          </div>
          <label className="field-label" htmlFor="profile">
            Hur mycket hjälp vill du ha?
          </label>
          <div className="select-wrap">
            <select
              id="profile"
              value={draft.profile}
              onChange={(e) =>
                setDraft((v) => ({ ...v, profile: e.target.value as Profile }))
              }
            >
              <option value="beginner">
                Nybörjare – draghjälp, varningar och tips
              </option>
              <option value="training">
                Träning – draghjälp och tips på begäran
              </option>
              <option value="competition">
                Tävling – spela helt utan hjälp
              </option>
            </select>
            <ChevronDown size={17} />
          </div>
          <p className="fine-print">
            {draft.profile === "beginner"
              ? "Om en pjäs kan slås efter ditt drag får du en varning. Du bestämmer alltid själv."
              : draft.profile === "training"
                ? "Välj själv när du vill ha en ledtråd. Förhandsvarningar är avstängda."
                : "Inga möjliga drag visas. Tips och ångra är avstängda. Ingen klocka i denna version."}
          </p>
          <button className="button primary full-width" onClick={newGame}>
            Nu spelar vi <ArrowRight size={18} />
          </button>
        </Modal>
      )}
      {modal === "resign" && (
        <Modal title="Vill du avsluta partiet?" onClose={() => setModal(null)}>
          <p className="modal-intro">
            Att ge upp avslutar partiet som en förlust. Du kan fortfarande gå
            igenom dragen och lära dig av dem.
          </p>
          <div className="modal-actions">
            <button className="button outline" onClick={() => setModal(null)}>
              Fortsätt spela
            </button>
            <button
              className="button primary"
              onClick={() => {
                updateResultHeader(game, config.color);
                setEnded(
                  `${config.color === "w" ? "Svart" : "Vit"} vinner – du gav upp`,
                );
                setModal(null);
                setRevision((r) => r + 1);
              }}
            >
              Ge upp partiet
            </button>
          </div>
        </Modal>
      )}
      {modal === "help" && (
        <Modal
          title="En plats för ditt nästa drag"
          onClose={() => setModal(null)}
        >
          <p className="modal-intro">
            Schacklabbet är en gratis schackplats på svenska. Börja i
            schackskolan eller spela mot datorn på en nivå som passar dig.
          </p>
          <ul className="help-list">
            <li>Klicka på en pjäs och sedan en ruta, eller dra pjäsen.</li>
            <li>Med tangentbord: använd piltangenter och Enter på brädet.</li>
            <li>
              En punkt visar ett lagligt drag. En ring visar ett möjligt slag.
            </li>
            <li>
              Ett utropstecken betyder att en pjäs kan slås – inte att den
              säkert går förlorad.
            </li>
            <li>
              Partier och framsteg sparas i den här webbläsaren. Inget elevkonto
              behövs.
            </li>
          </ul>
          <p className="fine-print">
            Schackmotor: Stockfish.js 19, GPL-3.0.{" "}
            <a
              href="https://github.com/nmrugg/stockfish.js/tree/v19.0.1"
              target="_blank"
              rel="noreferrer"
            >
              Motor, källkod och bygginstruktioner
            </a>{" "}
            ·{" "}
            <a
              href={`${import.meta.env.BASE_URL}licenses/stockfish-js-19.0.1-source.tar.gz`}
            >
              Ladda ner källkod
            </a>{" "}
            ·{" "}
            <a
              href={`${import.meta.env.BASE_URL}licenses/nn-61e7af4bb97d.nnue`}
            >
              Nätverksfil för ombyggnad
            </a>{" "}
            ·{" "}
            <a
              href={`${import.meta.env.BASE_URL}engine/COPYING.txt`}
              target="_blank"
              rel="noreferrer"
            >
              Licens
            </a>
            . Inga speldata skickas till en molnmotor.
          </p>
        </Modal>
      )}
      {promotion && (
        <Modal
          title="Vad vill din bonde bli?"
          onClose={() => setPromotion(null)}
        >
          <p className="modal-intro">
            Din bonde har nått sista raden. Välj en ny pjäs.
          </p>
          <div className="promotion-options">
            {(["q", "r", "b", "n"] as const).map((p) => (
              <button
                key={p}
                onClick={() => {
                  const move = promotion;
                  setPromotion(null);
                  applyMove(move.from, move.to, p);
                }}
              >
                <Piece type={p} color={config.color} />
                <span>{pieceNames[p]}</span>
              </button>
            ))}
          </div>
        </Modal>
      )}
      {risk && (
        <Modal title="Stanna upp och ta en titt." onClose={() => setRisk(null)}>
          <div className="risk-icon">
            <ShieldCheck size={29} />
          </div>
          <p className="risk-copy">
            Motståndarens <strong>{pieceNames[risk.attackers[0].piece]}</strong>{" "}
            på <strong>{risk.attackers[0].from}</strong> kan ta din{" "}
            <strong>{pieceNames[game.get(risk.from)!.type]}</strong> om du
            flyttar till <strong>{risk.to}</strong>.
          </p>
          <p className="fine-print">
            Att pjäsen kan slås betyder inte alltid att draget är dåligt. Du kan
            ha en bra plan.
          </p>
          {riskShown && (
            <>
              <div className="risk-preview">
                <Board
                  game={riskPosition!}
                  orientation={config.color}
                  selected={risk.attackers[0].from}
                  highlight={[risk.attackers[0].to]}
                  threatened={[risk.to]}
                  disabled
                  onSquare={selectSquare}
                />
              </div>
              <p className="hint-text">
                Hotet är {risk.attackers[0].from} → {risk.attackers[0].to}
                {risk.attackers[0].isEnPassant() ? " (en passant)" : ""}. Tänk
                dig din pjäs på {risk.to}: vad händer om motståndaren tar den?
              </p>
            </>
          )}
          <button
            className="text-button"
            onClick={() => setRiskShown((v) => !v)}
          >
            <Lightbulb size={17} /> {riskShown ? "Dölj hotet" : "Visa hotet"}
          </button>
          <div className="modal-actions">
            <button className="button outline" onClick={() => setRisk(null)}>
              Välj ett annat drag
            </button>
            <button
              className="button primary"
              onClick={() =>
                applyMove(risk.from, risk.to, risk.promotion, true)
              }
            >
              Gör draget ändå
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ExercisePlayer({
  exercise,
  completed,
  onComplete,
  onBack,
}: {
  exercise: Exercise;
  completed: boolean;
  onComplete: () => void;
  onBack: () => void;
}) {
  const [game, setGame] = useState(() => new Chess(exercise.fen));
  const [selected, setSelected] = useState<Square | null>(null);
  const [feedback, setFeedback] = useState("Prova en idé på brädet.");
  const [solved, setSolved] = useState(false);
  const [showHint, setShowHint] = useState(false);
  function move(square: Square, fromDrag?: Square) {
    if (solved) return;
    const from = fromDrag ?? selected;
    if (
      from &&
      game.moves({ square: from, verbose: true }).some((m) => m.to === square)
    ) {
      const uci = `${from}${square}`;
      if (exercise.solutions.includes(uci)) {
        const copy = new Chess(game.fen());
        copy.move({ from, to: square, promotion: "q" });
        setGame(copy);
        setSelected(null);
        setSolved(true);
        setFeedback(exercise.success);
        onComplete();
      } else {
        setFeedback(
          "Det är ett lagligt drag, men det löser inte just den här uppgiften. Försök med en annan idé.",
        );
        setSelected(null);
      }
      return;
    }
    if (game.get(square)?.color === game.turn()) setSelected(square);
    else setSelected(null);
  }
  return (
    <>
      <button className="text-button back-link" onClick={onBack}>
        <ArrowLeft size={17} /> Tillbaka till{" "}
        {exercise.category === "school" ? "schackskolan" : "utmaningarna"}
      </button>
      <div className="page-heading">
        <div>
          <div className="eyebrow">{exercise.tag}</div>
          <h1>{exercise.title}</h1>
        </div>
        {completed && (
          <span className="completed-tag">
            <CheckCircle2 size={18} /> Avklarad
          </span>
        )}
      </div>
      <div className="exercise-layout">
        <div className="exercise-board">
          <Board
            game={game}
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
            disabled={solved}
          />
        </div>
        <section className="exercise-panel">
          <span className="card-icon sage">
            {solved ? <CheckCircle2 /> : <Lightbulb />}
          </span>
          <h2>{solved ? "En ny upptäckt!" : "Ditt uppdrag"}</h2>
          <p>{exercise.description}</p>
          <div
            className={`exercise-feedback ${solved ? "success" : ""}`}
            role="status"
          >
            {solved && <CheckCircle2 size={20} />}
            <p>{feedback}</p>
          </div>
          {showHint && !solved && <p className="hint-text">{exercise.hint}</p>}
          <div className="exercise-actions">
            {!solved && (
              <button
                className="button outline"
                onClick={() => setShowHint((v) => !v)}
              >
                <Lightbulb size={17} />
                {showHint ? "Dölj ledtråd" : "En liten ledtråd"}
              </button>
            )}
            {solved && (
              <>
                <button className="button primary" onClick={onBack}>
                  Fortsätt upptäcka <ArrowRight size={17} />
                </button>
                <button
                  className="text-button"
                  onClick={() => {
                    setGame(new Chess(exercise.fen));
                    setSolved(false);
                    setSelected(null);
                    setShowHint(false);
                    setFeedback(
                      "Prova igen. Kan du förklara varför draget fungerar?",
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
