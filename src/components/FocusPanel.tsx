import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from "react";
import { X } from "lucide-react";

export const BoardFocusContext = createContext<{
  enabled: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
}>({
  enabled: false,
  open: false,
  setOpen: () => undefined,
});

/** The same controls stay available in a native modal when the board is enlarged. */
export function FocusPanel({
  className,
  title,
  children,
  attention = false,
}: {
  className: string;
  title: string;
  children: ReactNode;
  attention?: boolean;
}) {
  const { enabled, open, setOpen } = useContext(BoardFocusContext);
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useId();
  useEffect(() => {
    if (enabled && attention) setOpen(true);
  }, [enabled, attention, setOpen]);
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (enabled && open) {
      if (!node.open) node.showModal();
      const log = node.querySelector<HTMLElement>(".move-table");
      if (log) log.scrollTop = log.scrollHeight;
    } else if (node.open) node.close();
  }, [enabled, open]);
  if (!enabled) return <aside className={className}>{children}</aside>;
  return (
    <dialog
      ref={dialog}
      className={`${className} focus-tools-dialog`}
      aria-labelledby={heading}
      onCancel={() => setOpen(false)}
      onClose={() => setOpen(false)}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const box = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < box.left ||
          event.clientX > box.right ||
          event.clientY < box.top ||
          event.clientY > box.bottom
        )
          setOpen(false);
      }}
    >
      <div className="focus-tools-heading">
        <h2 id={heading}>{title}</h2>
        <button
          className="icon-button"
          onClick={() => setOpen(false)}
          aria-label="Tillbaka till brädet"
        >
          <X />
        </button>
      </div>
      {children}
    </dialog>
  );
}
