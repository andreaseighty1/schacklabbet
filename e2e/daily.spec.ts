import { test, expect, type Page, type Locator } from "@playwright/test";
import calendar from "../src/daily/calendar.v1.json" with { type: "json" };

async function press(locator: Locator, touch: boolean) {
  if (touch) await locator.tap();
  else await locator.click();
}
async function move(page: Page, from: string, to: string, touch: boolean) {
  await press(page.locator(`.board [data-square="${from}"]`), touch);
  await press(page.locator(`.board [data-square="${to}"]`), touch);
}
async function date(page: Page, day: string) {
  await page.clock.install({ time: new Date(`${day}T12:00:00Z`) });
  await page.goto("/#challenges");
}
async function start(page: Page, touch: boolean) {
  await press(
    page.getByRole("button", {
      name: /Starta dagens utmaning|Fortsätt utmaningen/,
    }),
    touch,
  );
}
async function progress(page: Page) {
  return page.evaluate(
    () => JSON.parse(localStorage.getItem("schacklabbet.daily.v1")!).entries,
  );
}
const dayFor = (id: string) =>
  Object.entries(calendar).find(([, value]) => value === id)![0];

test("daily hints, a wrong move, reload and completion preserve lessons and the regular game", async ({
  page,
  hasTouch,
  isMobile,
}) => {
  const touch = Boolean(hasTouch);
  await date(page, "2026-11-09");
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const other = await page.evaluate(() => [
    localStorage.getItem("schacklabbet.progress.v1"),
    localStorage.getItem("schacklabbet.game.v1"),
  ]);
  await expect(
    page.getByRole("region", { name: "Dagens schackutmaning" }),
  ).toContainText("Inte provad");
  await start(page, touch);
  await expect(
    page.getByRole("heading", { name: "Stäng sista raden", exact: true }),
  ).toBeVisible();
  await move(page, "h1", "h2", touch);
  await expect(page.locator(".exercise-feedback")).toContainText(
    "ett lagligt drag",
  );
  await expect(page.locator('.board [data-square="h1"]')).toHaveAccessibleName(
    /vit torn/,
  );
  await press(
    page.getByRole("button", { name: "En liten ledtråd", exact: true }),
    touch,
  );
  await expect(page.locator(".daily-panel .hint-text")).toContainText(
    "hel rad",
  );
  await page.reload();
  await expect(
    page.getByRole("region", { name: "Dagens schackutmaning" }),
  ).toContainText("Påbörjad");
  await start(page, touch);
  await expect(page.locator(".daily-panel .hint-text")).toContainText(
    "hel rad",
  );
  await move(page, "h1", "h8", touch);
  await expect(page.locator(".daily-panel")).toContainText(
    "Du klarade uppgiften",
  );
  await expect(page.locator(".daily-status")).toHaveText("Klar med hjälp");
  await expect(page.locator(".daily-source")).toContainText(
    "42 Improbable Owls & Andreas Jonsson",
  );
  const entries = await progress(page);
  expect(entries["2026-11-09|roof|1"].solvedLine).toEqual(["h1h8"]);
  expect(
    await page.evaluate(() => [
      localStorage.getItem("schacklabbet.progress.v1"),
      localStorage.getItem("schacklabbet.game.v1"),
    ]),
  ).toEqual(other);
  if (isMobile) {
    await expect(
      page.getByRole("button", { name: "Stort bräde", exact: true }),
    ).toHaveCount(0);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("the master extension waits for an explicit reply, then accepts the final mate", async ({
  page,
  hasTouch,
}) => {
  const touch = Boolean(hasTouch);
  await date(page, dayFor("opera-last"));
  await start(page, touch);
  await move(page, "d1", "d8", touch);
  await expect(page.locator(".daily-source")).toContainText("Paris 1858");
  await press(
    page.getByRole("button", { name: "Lite klurigare", exact: true }),
    touch,
  );
  await expect(
    page.getByRole("heading", {
      name: "Operapartiet: räkna ett steg till",
      exact: true,
    }),
  ).toBeVisible();
  await move(page, "b3", "b8", touch);
  await expect(page.locator('.board [data-square="d7"]')).toHaveAccessibleName(
    /svart springare/,
  );
  await expect(page.locator('.board [data-square="d1"]')).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  const entries = await progress(page);
  expect(
    entries[`${dayFor("opera-last")}|opera-two|1`].solvedLine,
  ).toBeUndefined();
  await press(
    page.getByRole("button", { name: "Visa motståndarens svar", exact: true }),
    touch,
  );
  await expect(page.locator('.board [data-square="b8"]')).toHaveAccessibleName(
    /svart springare/,
  );
  await move(page, "d1", "d8", touch);
  await expect(page.locator(".daily-status")).toHaveText("Klar");
  await expect(page.locator(".daily-panel")).toContainText(
    "Du klarade uppgiften",
  );
});

test("promotion choices explain the stalemate and showing a solution does not award independent completion", async ({
  page,
  hasTouch,
}) => {
  const touch = Boolean(hasTouch);
  await date(page, dayFor("underpromotion"));
  await start(page, touch);
  await move(page, "c7", "c8", touch);
  await press(page.getByRole("button", { name: "dam", exact: true }), touch);
  await expect(page.locator(".exercise-feedback")).toContainText("ger remi");
  await expect(page.locator('.board [data-square="c7"]')).toHaveAccessibleName(
    /vit bonde/,
  );
  await press(
    page.getByRole("button", { name: "Visa lösningen", exact: true }),
    touch,
  );
  await press(
    page.getByRole("button", { name: "Ja, visa lösningen", exact: true }),
    touch,
  );
  await expect(page.locator(".daily-status")).toHaveText("Lösningen visad");
  expect(
    (await progress(page))[`${dayFor("underpromotion")}|underpromotion|1`]
      .solvedLine,
  ).toBeUndefined();
  await press(
    page.getByRole("button", { name: "Prova igen", exact: true }),
    touch,
  );
  await move(page, "c7", "c8", touch);
  await press(page.getByRole("button", { name: "torn", exact: true }), touch);
  await expect(page.locator(".daily-status")).toHaveText("Klar med hjälp");
});

test("the active puzzle stays pinned at midnight and focus controls remain reachable", async ({
  page,
  hasTouch,
  isMobile,
}) => {
  const touch = Boolean(hasTouch);
  await page.clock.install({ time: new Date("2026-11-09T22:59:45Z") });
  await page.goto("/#challenges");
  await start(page, touch);
  await page.clock.fastForward(45000);
  await expect(
    page.getByRole("heading", { name: "Stäng sista raden", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".daily-date-note")).toContainText("9 november");
  if (!isMobile) {
    await press(
      page.getByRole("button", { name: "Stort bräde", exact: true }),
      touch,
    );
    await expect(page.locator(".app-shell")).toHaveClass(/board-focus/);
    await press(
      page
        .getByRole("button", { name: "Uppdrag & hjälp", exact: true })
        .first(),
      touch,
    );
    await expect(page.getByRole("dialog")).toBeVisible();
    await press(
      page.getByRole("button", { name: "Tillbaka till brädet", exact: true }),
      touch,
    );
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await press(
      page.getByRole("button", { name: "Avsluta brädesläge", exact: true }),
      touch,
    );
  }
  await press(
    page.getByRole("button", {
      name: "Tillbaka till utmaningarna",
      exact: true,
    }),
    touch,
  );
  await expect(
    page.getByRole("region", { name: "Dagens schackutmaning" }),
  ).toContainText("10 november");
  await expect(
    page.getByRole("region", { name: "Dagens schackutmaning" }),
  ).toContainText("Stäng flyktvägen");
});

test("two different correct mate moves are both accepted", async ({
  page,
  hasTouch,
}) => {
  const touch = Boolean(hasTouch);
  await date(page, dayFor("queen-mate"));
  await start(page, touch);
  await move(page, "e1", "a5", touch);
  await expect(page.locator(".daily-status")).toHaveText("Klar");
  await press(
    page.getByRole("button", { name: "Prova igen", exact: true }),
    touch,
  );
  await move(page, "e1", "a1", touch);
  await expect(page.locator(".daily-status")).toHaveText("Klar");
});
