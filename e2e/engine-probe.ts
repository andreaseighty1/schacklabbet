import type { Page } from "@playwright/test";

declare global {
  interface Window {
    __engineProbe: {
      created: number;
      terminated: number;
      commands: string[];
      held: boolean;
      releaseHeld?: () => void;
    };
  }
}
export async function observeWorkers(page: Page, holdFirst = false) {
  await page.addInitScript((holdFirst) => {
    const NativeWorker = window.Worker;
    const probe = (window.__engineProbe = {
      created: 0,
      terminated: 0,
      commands: [] as string[],
      held: false,
      releaseHeld: undefined as (() => void) | undefined,
    });
    window.Worker = class extends NativeWorker {
      tracked: boolean;
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url, options);
        this.tracked = String(url).includes("stockfish-19-lite-single.js");
        if (this.tracked) {
          const first = ++probe.created === 1;
          if (holdFirst && first)
            this.addEventListener("message", (event) => {
              if (!String(event.data).startsWith("bestmove ")) return;
              event.stopImmediatePropagation();
              probe.held = true;
              const callback = this.onmessage;
              probe.releaseHeld = () => callback?.call(this, event);
            });
        }
      }
      postMessage(
        message: unknown,
        options?: Transferable[] | StructuredSerializeOptions,
      ) {
        if (this.tracked && typeof message === "string")
          probe.commands.push(message);
        if (Array.isArray(options)) super.postMessage(message, options);
        else super.postMessage(message, options);
      }
      terminate() {
        if (this.tracked) probe.terminated++;
        super.terminate();
      }
    };
  }, holdFirst);
}
