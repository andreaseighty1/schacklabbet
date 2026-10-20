import { test, expect, type Page } from "@playwright/test";

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
async function observeWorkers(page: Page, holdFirst = false) {
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
async function start(page: Page) {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Spela mot datorn", exact: false })
    .first()
    .click();
  await page
    .getByLabel("Hur mycket hjälp vill du ha?")
    .selectOption("training");
  await page.getByRole("button", { name: "Nu spelar vi" }).click();
}
async function play(page: Page, from: string, to: string, count: number) {
  await page.getByRole("button", { name: new RegExp(`^${from},`) }).click();
  await page.getByRole("button", { name: new RegExp(`^${to},`) }).click();
  await expect(page.locator(".move-action")).toHaveCount(count, {
    timeout: 20000,
  });
}
async function navigate(page: Page, name: string) {
  const menu = page.getByRole("button", { name: "Öppna meny" });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole("link", { name, exact: true }).click();
}

test("dator och experttips återanvänder motorn med full historik och rensar vid sidbyte", async ({
  page,
}) => {
  await observeWorkers(page);
  await start(page);
  await play(page, "e2", "e4", 2);
  await play(page, "g1", "f3", 4);
  expect(await page.evaluate(() => window.__engineProbe.created)).toBe(1);
  expect(await page.evaluate(() => window.__engineProbe.terminated)).toBe(0);
  await page.getByRole("button", { name: /Ge mig en ledtråd/ }).click();
  await page.getByRole("button", { name: /En tydligare ledtråd/ }).click();
  await page.getByRole("button", { name: /Visa datorns förslag/ }).click();
  await expect(page.locator(".hint-text")).toContainText("Datorns förslag:", {
    timeout: 20000,
  });
  await play(page, "f1", "c4", 6);
  const probe = await page.evaluate(() => window.__engineProbe);
  expect(probe.created).toBe(1);
  expect(
    probe.commands.filter((line) => line === "setoption name Clear Hash"),
  ).toHaveLength(2);
  expect(
    probe.commands.some((line) =>
      /^position startpos moves e2e4 \S+ g1f3 \S+ f1c4$/.test(line),
    ),
  ).toBe(true);
  await navigate(page, "Schackskolan");
  expect(await page.evaluate(() => window.__engineProbe.terminated)).toBe(1);
  await navigate(page, "Spela schack");
  await expect(page.locator(".move-action")).toHaveCount(6);
  await page.getByRole("button", { name: "Nytt parti", exact: true }).click();
  await page.getByRole("button", { name: "Nu spelar vi" }).click();
  await expect(page.locator(".move-action")).toHaveCount(0);
  await play(page, "e2", "e4", 2);
  expect(await page.evaluate(() => window.__engineProbe.created)).toBe(2);
});

test("ett sent riktigt motorsvar från avbrutet parti kan inte flytta i det nya", async ({
  page,
}) => {
  await observeWorkers(page, true);
  await start(page);
  await page.getByRole("button", { name: /^e2,/ }).click();
  await page.getByRole("button", { name: /^e4,/ }).click();
  await expect
    .poll(() => page.evaluate(() => window.__engineProbe.held), {
      timeout: 20000,
    })
    .toBe(true);
  await page.getByRole("button", { name: "Nytt parti", exact: true }).click();
  await page.getByRole("button", { name: "Nu spelar vi" }).click();
  await page.evaluate(() => window.__engineProbe.releaseHeld?.());
  await expect(page.locator(".move-action")).toHaveCount(0);
  await play(page, "e2", "e4", 2);
  expect(await page.evaluate(() => window.__engineProbe.created)).toBe(2);
  expect(await page.evaluate(() => window.__engineProbe.terminated)).toBe(1);
});
