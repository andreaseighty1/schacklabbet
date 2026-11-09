import { useLayoutEffect, useRef, type RefObject } from "react";
import type { Color, Square } from "chess.js";
import {
  pieceFlights,
  type MotionMove,
  type MotionPosition,
} from "../chess/motion";
import type { PieceSet } from "./VisualPreferences";

type Frame = MotionPosition & {
  sprites: Map<Square, Element>;
  orientation: Color;
  pieceSet: PieceSet;
  width: number;
};

export function useBoardMotion(
  board: RefObject<HTMLDivElement | null>,
  fen: string,
  last: MotionMove | undefined,
  orientation: Color,
  pieceSet: PieceSet,
  enabled: boolean,
) {
  const previous = useRef<Frame | null>(null);
  const { from, to, before, after, flags } = last ?? {};
  useLayoutEffect(() => {
    const root = board.current;
    if (!root) return;
    const bounds = root.getBoundingClientRect();
    const squares = new Map<Square, HTMLElement>();
    const sprites = new Map<Square, Element>();
    for (const square of root.querySelectorAll<HTMLElement>(".square")) {
      const name = square.dataset.square as Square;
      squares.set(name, square);
      const piece = square.querySelector(".piece");
      // Freeze the old appearance: promotion and reverse captures replace these DOM nodes.
      if (piece) sprites.set(name, piece.cloneNode(true) as Element);
    }
    const next: Frame = {
      fen,
      last:
        from && to && before && after && flags
          ? { from, to, before, after, flags }
          : undefined,
      orientation,
      pieceSet,
      width: bounds.width,
      sprites,
    };
    const old = previous.current;
    previous.current = next;
    if (
      !enabled ||
      !old ||
      old.orientation !== orientation ||
      old.pieceSet !== pieceSet ||
      Math.abs(old.width - bounds.width) > 1
    )
      return;
    const cleanups: (() => void)[] = [];
    for (const flight of pieceFlights(old, next)) {
      const sprite = old.sprites.get(flight.from);
      const origin = squares.get(flight.from);
      const destination = squares.get(flight.to);
      const landing = destination?.querySelector<HTMLElement>(".piece");
      if (
        !sprite ||
        !origin ||
        !destination ||
        !landing ||
        typeof origin.animate !== "function"
      )
        continue;
      if (
        sprite instanceof HTMLImageElement &&
        sprite.complete &&
        sprite.naturalWidth === 0
      )
        continue;
      const a = origin.getBoundingClientRect(),
        b = destination.getBoundingClientRect();
      const layer = document.createElement("span");
      layer.className = "piece-flight";
      layer.dataset.flight = `${flight.from}-${flight.to}`;
      layer.setAttribute("aria-hidden", "true");
      Object.assign(layer.style, {
        left: `${a.left - bounds.left}px`,
        top: `${a.top - bounds.top}px`,
        width: `${a.width}px`,
        height: `${a.height}px`,
      });
      layer.appendChild(sprite);
      root.appendChild(layer);
      const visibility = landing.style.visibility;
      landing.style.visibility = "hidden";
      const animation = layer.animate(
        [
          { transform: "translate(0, 0)" },
          { transform: `translate(${b.left - a.left}px, ${b.top - a.top}px)` },
        ],
        {
          duration: 240,
          easing: "cubic-bezier(.22,.61,.36,1)",
          fill: "forwards",
        },
      );
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        landing.style.visibility = visibility;
        layer.remove();
      };
      animation.onfinish = finish;
      animation.oncancel = finish;
      cleanups.push(() => {
        animation.cancel();
        finish();
      });
    }
    return () => cleanups.forEach((cleanup) => cleanup());
  }, [
    board,
    fen,
    from,
    to,
    before,
    after,
    flags,
    orientation,
    pieceSet,
    enabled,
  ]);
}
