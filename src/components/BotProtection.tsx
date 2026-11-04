import { useCallback, useEffect, useRef, useState } from "react";
import { FriendError } from "../multiplayer/client";
import { loadTurnstile } from "../multiplayer/captcha";

function Challenge({
  onProof,
  onCancel,
}: {
  onProof: (token: string) => void;
  onCancel: () => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    const timer = setTimeout(onCancel, 120000);
    void loadTurnstile()
      .then((api) => {
        if (cancelled || !container.current) return;
        const id = api.render(container.current, {
          sitekey: import.meta.env.VITE_TURNSTILE_SITE_KEY,
          action: "anonymous_signup",
          language: "sv",
          size: "flexible",
          theme: "light",
          callback: (token: string) => {
            if (!cancelled) onProof(token);
          },
          "error-callback": () => {
            if (!cancelled) onCancel();
          },
          "expired-callback": () => {
            if (!cancelled) onCancel();
          },
          "timeout-callback": () => {
            if (!cancelled) onCancel();
          },
          retry: "never",
        });
        cleanup = () => api.remove(id);
      })
      .catch(() => {
        if (!cancelled) onCancel();
      });
    return () => {
      cancelled = true;
      clearTimeout(timer);
      cleanup?.();
    };
  }, [onProof, onCancel]);
  return (
    <section className="bot-check" aria-label="Säkerhetskontroll">
      <strong>En snabb säkerhetskontroll</strong>
      <p>
        Vi kontrollerar att en person startar spelplatsen. Vänta en stund och
        följ instruktionen om en ruta visas.
      </p>
      <div ref={container} />
      <button className="text-button" onClick={onCancel}>
        Avbryt kontrollen
      </button>
    </section>
  );
}

export function useBotProtection() {
  const [checking, setChecking] = useState(false);
  const pending = useRef<{
    resolve: (token: string) => void;
    reject: (error: Error) => void;
  } | null>(null);
  const cancel = useCallback(() => {
    pending.current?.reject(new FriendError("captcha"));
    pending.current = null;
    setChecking(false);
  }, []);
  const complete = useCallback((token: string) => {
    pending.current?.resolve(token);
    pending.current = null;
    setChecking(false);
  }, []);
  const verify = useCallback(
    () =>
      new Promise<string>((resolve, reject) => {
        pending.current?.reject(new FriendError("captcha"));
        pending.current = { resolve, reject };
        setChecking(true);
      }),
    [],
  );
  useEffect(
    () => () => {
      pending.current?.reject(new FriendError("captcha"));
      pending.current = null;
    },
    [],
  );
  return {
    verify,
    element: checking ? (
      <Challenge onProof={complete} onCancel={cancel} />
    ) : null,
  };
}
