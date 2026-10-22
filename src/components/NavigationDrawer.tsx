import { useEffect, useRef, type ReactNode } from "react";

/** The same labelled navigation is used on desktop and in the compact drawer. */
export function NavigationDrawer({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const panel = ref.current!;
    const controls = () =>
      Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href],button:not(:disabled),[tabindex="0"]',
        ),
      ).filter((node) => node.getClientRects().length > 0);
    controls()[0]?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close.current();
      }
      if (event.key !== "Tab") return;
      const nodes = controls();
      const first = nodes[0],
        last = nodes.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    const media = window.matchMedia("(max-width: 1100px)");
    const resize = () => {
      if (!media.matches) close.current();
    };
    document.addEventListener("keydown", key);
    media.addEventListener("change", resize);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", key);
      media.removeEventListener("change", resize);
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [open]);
  return (
    <>
      {open && (
        <div
          className="menu-backdrop"
          aria-hidden="true"
          onClick={() => close.current()}
        />
      )}
      <aside
        ref={ref}
        id="main-navigation"
        className={`sidebar ${open ? "is-open" : ""}`}
        role={open ? "dialog" : undefined}
        aria-label={open ? "Meny" : undefined}
        aria-modal={open || undefined}
      >
        {children}
      </aside>
    </>
  );
}
