import { test, expect, type Page, type Locator } from "@playwright/test";
import { observeWorkers } from "./engine-probe";

async function seed(
  page: Page,
  pgn = "1. e4 e5 2. Qh5 Nc6 3. Qxe5+ Nxe5 0-1",
  ended: string | null = "Du gav upp.",
) {
  await page.addInitScript(
    ({ pgn, ended }) => {
      localStorage.setItem(
        "schacklabbet.game.v1",
        JSON.stringify({
          version: 1,
          pgn,
          color: "w",
          level: 0,
          profile: "competition",
          ended,
          id: "review-fixture",
        }),
      );
    },
    { pgn, ended },
  );
}
async function press(locator: Locator, touch: boolean) {
  if (touch) await locator.tap();
  else await locator.click();
}
async function stored(page: Page) {
  return page.evaluate(() => [
    localStorage.getItem("schacklabbet.game.v1"),
    localStorage.getItem("schacklabbet.progress.v1"),
  ]);
}
async function scriptedEngine(
  page: Page,
  answers: { move: string; score: number }[],
) {
  await page.addInitScript((answers) => {
    let index = 0;
    window.Worker = class {
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror = null;
      stopped = false;
      postMessage(command: string) {
        const send = (data: string) =>
          queueMicrotask(() => {
            if (!this.stopped) this.onmessage?.({ data } as MessageEvent);
          });
        if (command === "uci") send("uciok");
        if (command === "isready") send("readyok");
        if (command.startsWith("go ")) {
          const answer = answers[index++];
          send(`info depth 12 score cp ${answer.score} pv ${answer.move}`);
          send(`bestmove ${answer.move}`);
        }
      }
      terminate() {
        this.stopped = true;
      }
    } as unknown as typeof Worker;
  }, answers);
}

test("kort analys med verklig Stockfish startar manuellt efter partiet", async ({
  page,
  hasTouch,
}) => {
  test.setTimeout(60000);
  await seed(page);
  await observeWorkers(page);
  await page.goto("/#play");
  const review = page.getByRole("region", {
    name: "Upptäck ett drag",
    exact: true,
  });
  await expect(review).toBeVisible();
  expect(await page.evaluate(() => window.__engineProbe.created)).toBe(0);
  const saved = await stored(page);
  await press(
    review.getByRole("button", { name: "Gå igenom mitt parti" }),
    Boolean(hasTouch),
  );
  await expect(review).toContainText("Klart! 3 av dina 3 drag granskades.", {
    timeout: 40000,
  });
  await expect(
    review.getByRole("heading", { name: "Prova ett annat drag" }),
  ).toBeVisible();
  expect(await stored(page)).toEqual(saved);
  expect(await page.evaluate(() => window.__engineProbe.created)).toBe(
    await page.evaluate(() => window.__engineProbe.terminated),
  );
});

test("prova förslag med hjälprutor utan att ändra parti eller framsteg", async ({
  page,
  hasTouch,
}) => {
  await seed(page);
  await scriptedEngine(page, [
    { move: "e2e4", score: 30 },
    { move: "e7e5", score: -25 },
    { move: "g1f3", score: 30 },
    { move: "b8c6", score: 10 },
    { move: "h5f3", score: 0 },
    { move: "c6e5", score: 900 },
  ]);
  await page.goto("/#play");
  const saved = await stored(page);
  await press(
    page.getByRole("button", { name: "Gå igenom mitt parti" }),
    Boolean(hasTouch),
  );
  const retry = page.getByRole("region", {
    name: "Prova ett annat drag",
    exact: true,
  });
  await expect(retry).toBeVisible();
  await press(
    retry.getByRole("button", { name: /^h5, vit dam/ }),
    Boolean(hasTouch),
  );
  await expect(retry.locator(".move-dot").first()).toBeVisible();
  await expect(
    retry.getByRole("button", { name: /^e5,/ }).locator(".capture-dot"),
  ).toBeVisible();
  await press(retry.getByRole("button", { name: /^e5,/ }), Boolean(hasTouch));
  await expect(retry.getByRole("status")).toContainText(
    "Andra drag kan också fungera",
  );
  await press(
    retry.getByRole("button", { name: /^h5, vit dam/ }),
    Boolean(hasTouch),
  );
  await press(retry.getByRole("button", { name: /^f3,/ }), Boolean(hasTouch));
  await expect(retry.getByRole("status")).toContainText(
    "Du provade förslaget!",
  );
  await expect(
    retry.getByRole("button", { name: /^f3, vit dam/ }),
  ).toBeVisible();
  expect(await stored(page)).toEqual(saved);
  await press(
    retry.getByRole("button", { name: "Prova förslaget igen" }),
    Boolean(hasTouch),
  );
  await expect(
    retry.getByRole("button", { name: /^h5, vit dam/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("analys kan stoppas och sena motorsvar lämnas utan verkan", async ({
  page,
}) => {
  await seed(page);
  await observeWorkers(page, true);
  await page.goto("/#play");
  await page.getByRole("button", { name: "Gå igenom mitt parti" }).click();
  await expect
    .poll(() => page.evaluate(() => window.__engineProbe.held), {
      timeout: 20000,
    })
    .toBe(true);
  await page.getByRole("button", { name: "Stoppa genomgången" }).click();
  await page.evaluate(() => window.__engineProbe.releaseHeld?.());
  await expect(page.locator(".review-status")).toContainText("stoppad");
  await expect(
    page.getByRole("heading", { name: "Prova ett annat drag" }),
  ).toHaveCount(0);
  expect(await page.evaluate(() => window.__engineProbe.created)).toBe(
    await page.evaluate(() => window.__engineProbe.terminated),
  );
});

test("förvandling i analysövningen kräver rätt pjäsval", async ({
  page,
  hasTouch,
}) => {
  await seed(
    page,
    '[SetUp "1"]\n[FEN "7k/P7/8/8/8/8/8/7K w - - 0 1"]\n\n1. a8=R+ 0-1',
  );
  await scriptedEngine(page, [
    { move: "a7a8q", score: 600 },
    { move: "h8h7", score: -300 },
  ]);
  await page.goto("/#play");
  const saved = await stored(page);
  await press(
    page.getByRole("button", { name: "Gå igenom mitt parti" }),
    Boolean(hasTouch),
  );
  const retry = page.getByRole("region", {
    name: "Prova ett annat drag",
    exact: true,
  });
  const move = async () => {
    await press(
      retry.getByRole("button", { name: /^a7, vit bonde/ }),
      Boolean(hasTouch),
    );
    await press(retry.getByRole("button", { name: /^a8,/ }), Boolean(hasTouch));
  };
  await move();
  await expect(
    retry.getByRole("button", { name: "dam", exact: true }),
  ).toBeFocused();
  await press(
    retry.getByRole("button", { name: "springare", exact: true }),
    Boolean(hasTouch),
  );
  await expect(retry.getByRole("status")).toContainText(
    "Andra drag kan också fungera",
  );
  await move();
  await press(
    retry.getByRole("button", { name: "dam", exact: true }),
    Boolean(hasTouch),
  );
  await expect(
    retry.getByRole("button", { name: /^a8, vit dam/ }),
  ).toBeVisible();
  expect(await stored(page)).toEqual(saved);
});

test("pågående tävlingsparti ger ingen efteranalys", async ({ page }) => {
  await seed(page, "1. e4 e5 *", null);
  await page.goto("/#play");
  await expect(
    page.getByRole("button", { name: "Gå igenom mitt parti" }),
  ).toHaveCount(0);
});
