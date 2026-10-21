import { test, expect, type Page } from "@playwright/test";
import { observeWorkers } from "./engine-probe";

async function start(page: Page, minutes = "0") {
  await page.goto("/");
  await page
    .getByRole("button", { name: /Spela mot datorn/ })
    .first()
    .click();
  await page
    .getByLabel("Hur mycket hjälp vill du ha?")
    .selectOption("training");
  await expect(page.getByLabel("Vill du spela med klocka?")).toHaveValue("0");
  await page.getByLabel("Vill du spela med klocka?").selectOption(minutes);
  await page.getByRole("button", { name: "Nu spelar vi" }).click();
}
async function navigate(page: Page, name: string) {
  const menu = page.getByRole("button", { name: "Öppna meny" });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole("link", { name, exact: true }).click();
}
async function saved(page: Page) {
  return page.evaluate(() =>
    JSON.parse(localStorage.getItem("schacklabbet.game.v1")!),
  );
}
async function seed(page: Page, pgn: string, turn: "w" | "b") {
  await page.addInitScript(
    ({ pgn, turn }) => {
      if (localStorage.getItem("schacklabbet.game.v1")) return;
      localStorage.setItem(
        "schacklabbet.game.v1",
        JSON.stringify({
          version: 1,
          pgn,
          color: "w",
          level: 0,
          profile: "training",
          ended: null,
          id: "clock-test",
          clock: {
            minutes: 10,
            whiteMs: 600000,
            blackMs: 600000,
            running: turn,
            updatedAt: Date.now(),
          },
        }),
      );
    },
    { pgn, turn },
  );
}

test("utan tid är standard; tio minuter tickar, ryms och fortsätter efter omladdning", async ({
  page,
}) => {
  await page.clock.install();
  await start(page);
  await expect(page.getByRole("timer")).toHaveCount(0);
  await page.getByRole("button", { name: "Nytt parti", exact: true }).click();
  await page.getByLabel("Vill du spela med klocka?").selectOption("10");
  await page.getByRole("button", { name: "Nu spelar vi" }).click();
  await expect(page.getByRole("timer")).toHaveCount(2);
  await expect(page.locator('[role="timer"][data-color="w"]')).toHaveAttribute(
    "data-running",
    "true",
  );
  await page.clock.fastForward(5000);
  await expect(page.locator('[role="timer"][data-color="w"]')).not.toHaveText(
    "10:00",
  );
  await expect(page.locator('[role="timer"][data-color="b"]')).toHaveText(
    "10:00",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  if (page.viewportSize()!.width > 1000) {
    const controls = await page.locator(".board-controls").boundingBox();
    expect(controls!.y + controls!.height).toBeLessThanOrEqual(768);
  }
  await page.reload();
  await expect(page.getByRole("timer")).toHaveCount(2);
  const game = await saved(page);
  expect(game.clock.whiteMs).toBeLessThanOrEqual(595000);
  expect(game.clock.blackMs).toBe(600000);
  expect(game.clock.running).toBe("w");
  expect(game.pgn).toContain('[TimeControl "600"]');
});

test("tiden går i dialoger; tidsavslut stänger dialogen och blockerar nya drag", async ({
  page,
}) => {
  await page.clock.install();
  await seed(page, "*", "w");
  await page.goto("/#play");
  await page.getByRole("button", { name: "Ge upp", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.clock.fastForward(600100);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: /Svart vinner på tid/ }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /^e2,/ })).toBeDisabled();
  await expect(page.locator('[role="timer"][data-color="w"]')).toHaveText(
    "0:00",
  );
  await expect(page.locator('[role="timer"][data-running="true"]')).toHaveCount(
    0,
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: /Svart vinner på tid/ }),
  ).toBeVisible();
  expect((await saved(page)).clock.running).toBeNull();
  const progress = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("schacklabbet.progress.v1")!),
  );
  expect(progress.games).toBe(1);
  expect(progress.wins).toBe(0);
});

test("datorns tidsavslut avbryter motorn och ignorerar ett försenat verkligt svar", async ({
  page,
}) => {
  await page.clock.install();
  await observeWorkers(page, true);
  await seed(page, '[TimeControl "600"]\n\n1. e4 *', "b");
  await page.goto("/#play");
  await expect
    .poll(() => page.evaluate(() => window.__engineProbe.held), {
      timeout: 20000,
    })
    .toBe(true);
  await page.clock.fastForward(600100);
  await expect(
    page.getByRole("heading", { name: /Vit vinner på tid/ }),
  ).toBeVisible();
  expect(await page.evaluate(() => window.__engineProbe.terminated)).toBe(1);
  await page.evaluate(() => window.__engineProbe.releaseHeld?.());
  await expect(page.locator(".move-action")).toHaveCount(1);
  const game = await saved(page);
  expect(game.pgn).toContain('[Result "1-0"]');
  expect(game.pgn).toContain('[Termination "time forfeit"]');
  expect(game.clock).toMatchObject({ blackMs: 0, running: null });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: /Vit vinner på tid/ }),
  ).toBeVisible();
  const progress = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("schacklabbet.progress.v1")!),
  );
  expect(progress.games).toBe(1);
  expect(progress.wins).toBe(1);
});

test("ett drag efter tidsgränsen stoppas även innan nästa klockkontroll", async ({
  page,
}) => {
  await page.clock.install();
  await seed(page, "*", "w");
  await page.goto("/#play");
  await page.getByRole("button", { name: /^e2,/ }).click();
  const now = await page.evaluate(() => Date.now());
  await page.clock.pauseAt(new Date(now + 1000));
  // Change the wall time without running any interval callback.
  await page.clock.setFixedTime(new Date(now + 601000));
  await expect(
    page.getByRole("heading", { name: /Svart vinner på tid/ }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: /^e4,/ }).click();
  await expect(
    page.getByRole("heading", { name: /Svart vinner på tid/ }),
  ).toBeVisible();
  await expect(page.locator(".move-action")).toHaveCount(0);
});

test("ett parti på tid och datorns sökning fortsätter vid sidbyte; ångra ger ingen tid tillbaka", async ({
  page,
}) => {
  await page.clock.install();
  await observeWorkers(page, true);
  await start(page, "15");
  await page.clock.fastForward(5000);
  await page.getByRole("button", { name: /^e2,/ }).click();
  await page.getByRole("button", { name: /^e4,/ }).click();
  await expect
    .poll(() => page.evaluate(() => window.__engineProbe.held), {
      timeout: 20000,
    })
    .toBe(true);
  const before = await saved(page);
  await navigate(page, "Schackskolan");
  await expect(page.getByText("Partiet på tid fortsätter.")).toBeVisible();
  expect(await page.evaluate(() => window.__engineProbe.terminated)).toBe(0);
  await page.evaluate(() => window.__engineProbe.releaseHeld?.());
  await expect.poll(async () => (await saved(page)).clock.running).toBe("w");
  await page
    .getByRole("button", { name: "Tillbaka till partiet", exact: true })
    .click();
  await expect(page.locator(".move-action")).toHaveCount(2);
  await page.getByRole("button", { name: "Ångra", exact: true }).click();
  await expect(page.locator(".move-action")).toHaveCount(0);
  const after = await saved(page);
  expect(after.clock.whiteMs).toBeLessThanOrEqual(before.clock.whiteMs);
  expect(after.clock.blackMs).toBeLessThan(before.clock.blackMs);
  expect(after.clock.running).toBe("w");
});

test("en ensam motståndarkung får remi vid tidsavslut; nytt parti återställer båda klockorna", async ({
  page,
}) => {
  await page.clock.install();
  await seed(
    page,
    '[SetUp "1"]\n[FEN "7k/8/8/6Q1/8/5K2/8/8 w - - 0 1"]\n\n*',
    "w",
  );
  await page.goto("/#play");
  await page.clock.fastForward(600100);
  await expect(
    page.getByRole("heading", { name: /Remi – tiden tog slut/ }),
  ).toBeVisible();
  expect((await saved(page)).pgn).toContain('[Result "1/2-1/2"]');
  await page.getByRole("button", { name: "Spela igen" }).click();
  await page.getByLabel("Vill du spela med klocka?").selectOption("15");
  await page.getByRole("button", { name: "Nu spelar vi" }).click();
  const reset = await saved(page);
  expect(reset.clock.blackMs).toBe(900000);
  expect(reset.clock.whiteMs).toBeGreaterThan(895000);
  expect(reset.clock.running).toBe("w");
  expect(reset.ended).toBeNull();
  expect(reset.pgn).toContain('[TimeControl "900"]');
  expect(reset.pgn).not.toContain("time forfeit");
  await page.getByRole("button", { name: "Ge upp", exact: true }).click();
  await page.getByRole("button", { name: "Ge upp partiet" }).click();
  await expect(
    page.getByRole("heading", { name: /Svart vinner/ }),
  ).toBeVisible();
  const stopped = await saved(page);
  await page.clock.fastForward(10000);
  await page.reload();
  expect((await saved(page)).clock).toEqual(stopped.clock);
});
