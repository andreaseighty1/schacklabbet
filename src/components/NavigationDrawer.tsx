import { useEffect, useRef, type ReactNode } from "react";

/** The same labelled navigation is used on desktop and in the compact drawer. */
export function NavigationDrawer({
  open,
  drawer,
  onClose,
  children,
}: {
  open: boolean;
  drawer: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!open || !drawer) return;
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
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", key);
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [open, drawer]);
  useEffect(() => {
    if (!drawer && open) close.current();
  }, [drawer, open]);
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
