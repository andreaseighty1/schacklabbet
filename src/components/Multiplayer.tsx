import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Color, Square } from "chess.js";
import {
  ArrowRight,
  Check,
  Copy,
  Flag,
  RefreshCw,
  Users,
  WifiOff,
} from "lucide-react";
import { replay } from "../../supabase/functions/chess-room/rules";
import {
  FriendError,
  friendMessage,
  friendRequest,
  normalizeCode,
  watchFriendRoom,
  type Answer,
} from "../multiplayer/client";
import { Board } from "./Board";
import { Piece } from "./Piece";
import { SquareNamesToggle } from "./SquareNamesToggle";
import { MoveLabel } from "./MoveLabel";
import { pieceNames, type Promotion } from "../chess/model";

const savedKey = "schacklabbet.friend.room.v1";
function savedRoom(): string | null {
  try {
    return localStorage.getItem(savedKey);
  } catch {
    return null;
  }
}
function remember(id: string | null) {
  try {
    if (id) localStorage.setItem(savedKey, id);
    else localStorage.removeItem(savedKey);
  } catch {
    /* Resume can still find an active game. */
  }
}
const resultReasons: Record<string, string> = {
  checkmate: "Schackmatt",
  stalemate: "Patt",
  repetition: "Samma ställning tre gånger",
  material: "För få pjäser för att göra schackmatt",
  fifty_moves: "Femtiodragsregeln",
  resignation: "En spelare gav upp",
};

export function Multiplayer({
  showSquareNames,
  onToggleNames,
  soloRunning,
  onSolo,
}: {
  showSquareNames: boolean;
  onToggleNames: () => void;
  soloRunning: boolean;
  onSolo: () => void;
}) {
  const [answer, setAnswer] = useState<Answer>({ room: null });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [reachable, setReachable] = useState(navigator.onLine);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [color, setColor] = useState<Color>("w");
  const [copied, setCopied] = useState(false);
  const [selected, setSelected] = useState<Square | null>(null);
  const [promotion, setPromotion] = useState<{
    from: Square;
    to: Square;
  } | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [showMoves, setShowMoves] = useState(true);
  const mounted = useRef(false);
  const fetching = useRef(false);
  const sending = useRef(false);
  const current = useRef(answer);
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const room = answer.room;
  const id = room?.id;
  const game = useMemo(() => replay(room?.moves ?? []), [room?.moves]);
  const history = game.history({ verbose: true });
  const ownColor = answer.color ?? "w";
  const ownTurn = game.turn() === ownColor;
  const playing = room?.status === "playing";
  const waiting = room?.status === "waiting";
  const finished = room?.status === "finished" || room?.status === "cancelled";
  const locked = !playing || !ownTurn || busy || !reachable || soloRunning;

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [id]);

  const accept = useCallback((next: Answer) => {
    if (!mounted.current) return;
    const before = current.current;
    if (
      before.room &&
      next.room?.id === before.room.id &&
      next.room.version < before.room.version
    )
      return;
    current.current = next;
    setAnswer(next);
    remember(next.room?.id ?? null);
    setReachable(true);
    if (next.room?.version !== before.room?.version) {
      setSelected(null);
      setPromotion(null);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    const stored = savedRoom();
    void friendRequest(
      stored ? "get" : "resume",
      stored ? { id: stored } : {},
      false,
    )
      .then((next) => {
        if (!cancelled) accept(next);
      })
      .catch((cause) => {
        if (cancelled) return;
        // An expired/deleted game must not trap a player on every reload.
        if (
          cause &&
          typeof cause === "object" &&
          "code" in cause &&
          ["not_found", "expired"].includes(String(cause.code))
        )
          remember(null);
        setError(friendMessage(cause));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      mounted.current = false;
    };
  }, [accept]);

  const refresh = useCallback(async () => {
    if (fetching.current || !mounted.current) return;
    fetching.current = true;
    const before = current.current.room;
    try {
      const next = await friendRequest(
        before ? "get" : "resume",
        before ? { id: before.id } : {},
        false,
      );
      if (mounted.current && current.current.room?.id === before?.id) {
        accept(next);
        setError("");
      }
    } catch (cause) {
      if (mounted.current) {
        if (
          cause instanceof FriendError &&
          ["not_found", "expired"].includes(cause.code)
        ) {
          current.current = { room: null };
          setAnswer({ room: null });
          remember(null);
          setError(friendMessage(new FriendError("expired")));
        } else {
          setReachable(false);
          setError(friendMessage(cause));
        }
      }
    } finally {
      fetching.current = false;
    }
  }, [accept]);

  useEffect(() => {
    if (!id || finished) return;
    const stop = watchFriendRoom(id, () => {
      void refresh();
    });
    // Polling and focus recovery keep the board correct even when a school network blocks websockets.
    const interval = window.setInterval(() => {
      if (!document.hidden) void refresh();
    }, 15000);
    const focus = () => {
      if (!document.hidden) void refresh();
    };
    const offline = () => {
      setReachable(false);
      setSelected(null);
    };
    window.addEventListener("online", focus);
    window.addEventListener("offline", offline);
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", focus);
    return () => {
      stop();
      clearInterval(interval);
      window.removeEventListener("online", focus);
      window.removeEventListener("offline", offline);
      window.removeEventListener("focus", focus);
      document.removeEventListener("visibilitychange", focus);
    };
  }, [id, finished, refresh]);

  useEffect(() => {
    if (confirm || promotion) dialog.current?.showModal();
    else dialog.current?.close();
  }, [confirm, promotion]);

  async function act(action: string, params: Record<string, unknown> = {}) {
    if (sending.current || soloRunning) return;
    sending.current = true;
    setBusy(true);
    setError("");
    try {
      accept(await friendRequest(action, params));
    } catch (cause) {
      if (mounted.current) {
        // Never replay a move automatically after a timeout: it may already be committed.
        if (current.current.room) await refresh();
        setError(friendMessage(cause));
      }
    } finally {
      sending.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  function sendMove(from: Square, to: Square, promote?: Promotion) {
    if (!room || locked) return;
    setSelected(null);
    setPromotion(null);
    void act("move", {
      id: room.id,
      version: room.version,
      request: crypto.randomUUID(),
      uci: `${from}${to}${promote ?? ""}`,
    });
  }
  function square(to: Square, dragFrom?: Square) {
    if (locked) return;
    const from = dragFrom ?? selected;
    if (from) {
      const choices = game
        .moves({ square: from, verbose: true })
        .filter((move) => move.to === to);
      if (choices.length) {
        if (choices.some((move) => move.promotion)) {
          setPromotion({ from, to });
          return;
        }
        sendMove(from, to);
        return;
      }
    }
    setSelected(game.get(to)?.color === ownColor ? to : null);
  }
  function leaveFinished() {
    current.current = { room: null };
    setAnswer({ room: null });
    remember(null);
    setError("");
    setSelected(null);
    setCopied(false);
  }
  const winner =
    room?.result === "1-0"
      ? "Vit vinner"
      : room?.result === "0-1"
        ? "Svart vinner"
        : "Remi – lika resultat";
  const status =
    room?.status === "cancelled"
      ? "Inbjudan är stängd"
      : finished
        ? winner
        : waiting
          ? "Väntar på din kompis"
          : busy
            ? "Skickar ditt drag…"
            : ownTurn
              ? "Nu är det din tur!"
              : "Nu är det din kompis tur";

  return (
    <div className="friend-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">SCHACK ÄR EN UPPTÄCKT NI KAN DELA</div>
          <h1 ref={heading} tabIndex={-1}>
            {room ? "Ert kompisparti" : "En kompis. En kod. Ert parti."}
          </h1>
          <p>
            Spela på varsin dator. Ingen klocka – ni får tänka i lugn och ro.
          </p>
        </div>
        <span className="pill subtle">
          <Users size={15} /> KOMPISPARTIER
        </span>
      </div>
      {soloRunning && (
        <div className="notice warning">
          <p>
            Ditt parti mot datorn spelas på tid. Spela klart det innan du
            startar ett kompisparti.
          </p>
          <button className="button outline" onClick={onSolo}>
            Till partiet mot datorn
          </button>
        </div>
      )}
      {error && (
        <div className="notice warning friend-error" role="alert">
          <p>{error}</p>
          <button
            className="button outline small"
            onClick={() => {
              void refresh();
            }}
            disabled={busy || loading}
          >
            <RefreshCw size={16} /> Försök igen
          </button>
        </div>
      )}
      {loading ? (
        <p role="status">Letar efter ditt kompisparti…</p>
      ) : !room ? (
        <>
          <div className="friend-lobby">
            <section className="friend-start" aria-labelledby="create-title">
              <div className="friend-pieces">
                <Piece type="n" color="w" />
                <Piece type="n" color="b" />
              </div>
              <div className="eyebrow">1. BJUD IN</div>
              <h2 id="create-title">Skapa ett parti</h2>
              <p>
                Du får en kod att ge till en kompis. Välj vilka pjäser du vill
                ha.
              </p>
              <fieldset className="friend-colors">
                <legend>Dina pjäser</legend>
                {(["w", "b"] as const).map((c) => (
                  <label key={c} className={color === c ? "chosen" : ""}>
                    <input
                      type="radio"
                      name="friend-color"
                      value={c}
                      checked={color === c}
                      onChange={() => setColor(c)}
                    />
                    <Piece type="k" color={c} />
                    {c === "w" ? "Vita" : "Svarta"}
                  </label>
                ))}
              </fieldset>
              <button
                className="button primary"
                disabled={busy || soloRunning}
                onClick={() => {
                  void act("create", { color });
                }}
              >
                Skapa kompisparti <ArrowRight size={18} />
              </button>
            </section>
            <section className="friend-join" aria-labelledby="join-title">
              <span className="friend-join-icon">
                <Users size={32} />
              </span>
              <div className="eyebrow">2. VAR MED</div>
              <h2 id="join-title">Har du fått en kod?</h2>
              <p>Skriv in din kompis kod. När du går med kan partiet börja!</p>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  if (/^[A-HJ-NP-Z2-9]{10}$/.test(normalizeCode(code)))
                    void act("join", { code: normalizeCode(code) });
                }}
              >
                <label htmlFor="friend-code">Kompisens kod</label>
                <input
                  id="friend-code"
                  value={code}
                  onChange={(event) =>
                    setCode(event.target.value.toUpperCase())
                  }
                  placeholder="ABCDE-FGH23"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  maxLength={24}
                  required
                  aria-describedby="code-help"
                />
                <small id="code-help">
                  10 bokstäver och siffror. Mellanslag och bindestreck går bra.
                </small>
                <button
                  className="button primary"
                  disabled={
                    busy ||
                    soloRunning ||
                    !/^[A-HJ-NP-Z2-9]{10}$/.test(normalizeCode(code))
                  }
                >
                  Gå med i partiet <ArrowRight size={18} />
                </button>
              </form>
            </section>
          </div>
          <p className="friend-privacy">
            Inga namn eller lösenord behövs. Dela bara koden med den du vill
            spela med. Partiet kan återupptas i samma webbläsare i 24 timmar.
            Sedan går det ut och tas bort.
          </p>
        </>
      ) : (
        <>
          {waiting && (
            <section className="friend-invite" aria-labelledby="invite-title">
              <div>
                <div className="eyebrow">GE KODEN TILL DIN KOMPIS</div>
                <h2 id="invite-title">En plats är ledig vid brädet.</h2>
                <p>
                  Din kompis öppnar Schacklabbet → Spela med en kompis och
                  skriver in koden.
                </p>
              </div>
              <div className="friend-invite-code">
                <label htmlFor="own-code">Partiets kod</label>
                <input
                  id="own-code"
                  readOnly
                  value={
                    answer.code
                      ? `${answer.code.slice(0, 5)}-${answer.code.slice(5)}`
                      : ""
                  }
                  onFocus={(event) => event.target.select()}
                />
                <button
                  className="button outline"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(answer.code ?? "");
                      setCopied(true);
                    } catch {
                      setError(
                        "Markera koden och kopiera den, eller läs upp den för din kompis.",
                      );
                    }
                  }}
                >
                  {copied ? <Check size={17} /> : <Copy size={17} />}{" "}
                  {copied ? "Koden är kopierad" : "Kopiera koden"}
                </button>
              </div>
            </section>
          )}
          <div className="game-layout friend-game">
            <section className="board-column" aria-label="Kompispartiets bräde">
              <div className="player-row">
                <span className="player-icon computer">
                  <Users size={22} />
                </span>
                <div>
                  <strong>Din kompis</strong>
                  <span>
                    {ownColor === "w" ? "Svarta" : "Vita"} pjäser
                    {waiting ? " · inte här ännu" : ""}
                  </span>
                </div>
              </div>
              <Board
                game={game}
                orientation={ownColor}
                selected={selected}
                legal={
                  !locked && showMoves && selected
                    ? game
                        .moves({ square: selected, verbose: true })
                        .map((move) => move.to)
                    : []
                }
                last={history.at(-1)}
                disabled={locked}
                onSquare={square}
                showSquareNames={showSquareNames}
              />
              <div className="player-row own-player">
                <span className="player-icon you">
                  <Piece type="p" color={ownColor} />
                </span>
                <div>
                  <strong>
                    Du spelar {ownColor === "w" ? "vit" : "svart"}
                  </strong>
                  <span>
                    {waiting
                      ? "Vit börjar när ni är två."
                      : "Tryck på en pjäs och sedan på rutan dit den ska."}
                  </span>
                </div>
              </div>
              <SquareNamesToggle
                enabled={showSquareNames}
                onToggle={onToggleNames}
              />
            </section>
            <aside className="game-panel">
              <div
                className={`turn-card ${finished ? "finished" : ""}`}
                role="status"
              >
                <span className="turn-card-icon">
                  <Piece type="k" color={game.turn()} />
                </span>
                <div>
                  <span className="eyebrow">
                    {finished ? "PARTIET ÄR KLART" : "ERT GEMENSAMMA BRÄDE"}
                  </span>
                  <h2>{status}</h2>
                </div>
              </div>
              {!reachable && (
                <p className="friend-network">
                  <WifiOff size={18} /> Väntar på kontakt. Brädet låses tills vi
                  har hämtat senaste ställningen.
                </p>
              )}
              {playing && game.isCheck() && (
                <p className="friend-check">
                  Schack! {game.turn() === "w" ? "Vits" : "Svarts"} kung måste
                  skyddas.
                </p>
              )}
              {finished ? (
                <section className="panel-section">
                  <p>
                    {resultReasons[room.reason ?? ""] ??
                      "Ni kan skapa ett nytt parti när ni vill."}
                  </p>
                  <div className="friend-actions">
                    <button className="button primary" onClick={leaveFinished}>
                      Spela ett nytt kompisparti
                    </button>
                    {room.status === "finished" && (
                      <button
                        className="button outline"
                        onClick={() => {
                          const pgn = replay(room.moves);
                          pgn.setHeader("Event", "Schacklabbet – kompisparti");
                          pgn.setHeader("Result", room.result!);
                          const url = URL.createObjectURL(
                            new Blob([pgn.pgn()], {
                              type: "application/x-chess-pgn",
                            }),
                          );
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = "schacklabbet-kompisparti.pgn";
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                      >
                        Spara partiet (PGN)
                      </button>
                    )}
                  </div>
                </section>
              ) : (
                <section className="panel-section">
                  <label className="toggle-row">
                    <span>
                      Visa möjliga drag
                      <small>Visar hur den valda pjäsen får gå</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={showMoves}
                      onChange={(event) => setShowMoves(event.target.checked)}
                    />
                    <span className="switch" />
                  </label>
                  <p className="fine-print">
                    Ni spelar själva, utan ledtrådar från datorn. Ni kan byta
                    sida i menyn och komma tillbaka till samma parti.
                  </p>
                </section>
              )}
              <section className="panel-section friend-history">
                <h3>Era senaste drag</h3>
                {history.length ? (
                  <ol start={Math.max(0, history.length - 6) + 1}>
                    {history.slice(-6).map((move, index) => (
                      <li key={`${index}-${move.lan}`}>
                        <span className="subtle-tag">
                          {move.color === "w" ? "VIT" : "SVART"}
                        </span>
                        <MoveLabel move={move} />
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p>Inget drag ännu. Vit börjar.</p>
                )}
              </section>
              {!finished && (
                <div className="friend-actions">
                  <button
                    className="text-button"
                    disabled={busy || soloRunning}
                    onClick={() => setConfirm(true)}
                  >
                    <Flag size={16} />
                    {waiting ? "Stäng inbjudan" : "Ge upp partiet"}
                  </button>
                </div>
              )}
            </aside>
          </div>
          <p className="friend-privacy">
            Partiet gäller i 24 timmar från att det skapades. Använd samma
            webbläsare om du laddar om sidan. Kompispartier påverkar ännu ingen
            topplista.
          </p>
        </>
      )}
      <dialog
        ref={dialog}
        className="friend-dialog"
        onCancel={() => {
          setConfirm(false);
          setPromotion(null);
        }}
        onClick={(event) => {
          if (event.target === dialog.current) {
            setConfirm(false);
            setPromotion(null);
          }
        }}
        aria-labelledby="friend-dialog-title"
      >
        {promotion ? (
          <>
            <h2 id="friend-dialog-title">Vilken pjäs vill du ha?</h2>
            <p>Bonden har nått sista raden. Välj en ny pjäs.</p>
            <div className="friend-promotions">
              {(["q", "r", "b", "n"] as const).map((p) => (
                <button
                  className="button outline"
                  key={p}
                  onClick={() => sendMove(promotion.from, promotion.to, p)}
                >
                  <Piece type={p} color={ownColor} />
                  {pieceNames[p]}
                </button>
              ))}
            </div>
            <button className="text-button" onClick={() => setPromotion(null)}>
              Tillbaka till brädet
            </button>
          </>
        ) : (
          <>
            <h2 id="friend-dialog-title">
              {waiting ? "Stäng inbjudan?" : "Vill du ge upp?"}
            </h2>
            <p>
              {waiting
                ? "Koden slutar fungera. Du kan skapa en ny inbjudan efteråt."
                : "Din kompis vinner partiet om du ger upp."}
            </p>
            <div className="friend-actions">
              <button
                className="button primary"
                onClick={() => setConfirm(false)}
              >
                Fortsätt {waiting ? "vänta" : "spela"}
              </button>
              <button
                className="button outline"
                onClick={() => {
                  setConfirm(false);
                  if (room)
                    void act(waiting ? "cancel" : "resign", {
                      id: room.id,
                      version: room.version,
                      request: crypto.randomUUID(),
                    });
                }}
              >
                {waiting ? "Ja, stäng inbjudan" : "Ja, jag ger upp"}
              </button>
            </div>
          </>
        )}
      </dialog>
    </div>
  );
}
