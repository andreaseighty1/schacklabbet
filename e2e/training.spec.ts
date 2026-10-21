import { test, expect, type Page } from "@playwright/test";

async function state(page: Page) {
  return page.evaluate(() =>
    JSON.parse(localStorage.getItem("schacklabbet.training.v1")!),
  );
}
async function move(page: Page, from: string, to: string) {
  await page.getByRole("button", { name: new RegExp(`^${from},`) }).click();
  await page.getByRole("button", { name: new RegExp(`^${to},`) }).click();
}
async function navigate(page: Page, name: string) {
  const menu = page.getByRole("button", { name: "Öppna meny", exact: true });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole("link", { name, exact: true }).click();
}

test("ett helt pass kräver tre nya lösningar, visar hjälprutor och registreras bara en gång", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.addInitScript(() => {
    if (!localStorage.getItem("schacklabbet.progress.v1"))
      localStorage.setItem(
        "schacklabbet.progress.v1",
        JSON.stringify({
          version: 1,
          completed: ["rook"],
          games: 2,
          wins: 1,
          finishedIds: ["a", "b"],
        }),
      );
    if (!localStorage.getItem("schacklabbet.game.v1"))
      localStorage.setItem(
        "schacklabbet.game.v1",
        JSON.stringify({
          version: 1,
          pgn: "1. e4 e5 *",
          color: "w",
          profile: "training",
          level: 0,
          ended: null,
          id: "preserved-game",
        }),
      );
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Starta nybörjarpass", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Ditt nybörjarpass", exact: true }),
  ).toBeVisible();
  const oldGame = await page.evaluate(() =>
    localStorage.getItem("schacklabbet.game.v1"),
  );
  await page
    .getByRole("button", { name: "Börja första uppdraget", exact: true })
    .click();
  expect((await state(page)).current.solutions).toEqual([]);
  await page.getByRole("button", { name: /^a1, vit torn/ }).click();
  await expect(
    page
      .getByRole("button", { name: /^a7, svart bonde/ })
      .locator(".capture-dot"),
  ).toBeVisible();
  expect(await page.locator(".move-dot").count()).toBeGreaterThan(0);
  await page.getByRole("button", { name: /^a2,/ }).click();
  await expect(page.locator(".exercise-feedback")).toContainText(
    "ett lagligt drag",
  );
  expect((await state(page)).current.solutions).toEqual([]);
  await page
    .getByRole("button", { name: "En liten ledtråd", exact: true })
    .click();
  await move(page, "a1", "a7");
  await expect(
    page.getByRole("heading", { name: "En ny upptäckt!" }),
  ).toBeVisible();
  expect((await state(page)).current.solutions).toEqual(["a1a7"]);
  await page.getByRole("button", { name: /^Nästa:/ }).click();
  await expect(page.locator(".training-step-status")).toContainText(
    "Uppdrag 2 av 3",
  );
  await move(page, "e1", "f1");
  await page.getByRole("button", { name: /^Nästa:/ }).click();
  await move(page, "a1", "h1");
  await expect(
    page.getByRole("heading", { name: "Ditt pass är klart!", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Det här har du övat på" }),
  ).toContainText("samarbeta för att sätta matt");
  const done = await state(page);
  expect(done.history).toHaveLength(1);
  expect(done.current.solutions).toEqual(["a1a7", "e1f1", "a1h1"]);
  expect(
    await page.evaluate(() => localStorage.getItem("schacklabbet.game.v1")),
  ).toBe(oldGame);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Ditt pass är klart!", exact: true }),
  ).toBeVisible();
  expect((await state(page)).history).toHaveLength(1);
  await navigate(page, "Mina framsteg");
  await expect(
    page.getByRole("region", { name: "Dina träningspass" }),
  ).toContainText("1 avslutat pass sparat");
  const progress = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("schacklabbet.progress.v1")!),
  );
  expect(progress.completed).toEqual(["rook", "check-escape", "mate-rook"]);
  expect(progress.games).toBe(2);
  expect(progress.wins).toBe(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await navigate(page, "Ditt nybörjarpass");
  await page
    .getByRole("button", { name: "Öva passet igen", exact: true })
    .click();
  expect((await state(page)).current.solutions).toEqual([]);
  expect((await state(page)).history).toHaveLength(1);
});

test("paus och omladdning bevarar lösningen i det aktuella steget och nästa olösta uppgift", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.goto("/#session");
  await page
    .getByRole("button", { name: "Börja första uppdraget", exact: true })
    .click();
  await move(page, "a1", "a7");
  await page
    .getByRole("button", {
      name: "Ta en paus – tillbaka till översikten",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Fortsätt nybörjarpasset", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Fortsätt där du var", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "En ny upptäckt!" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^a7, vit torn/ }),
  ).toBeVisible();
  expect((await state(page)).current.solutions).toEqual(["a1a7"]);
  await page.reload();
  await page
    .getByRole("button", { name: "Fortsätt där du var", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "En ny upptäckt!" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /^Nästa:/ }).click();
  await page.reload();
  await page
    .getByRole("button", { name: "Fortsätt där du var", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Schack: flytta kungen", exact: true }),
  ).toBeInViewport();
  await expect(
    page.getByRole("heading", { name: "Ditt uppdrag", exact: true }),
  ).toBeVisible();
  expect((await state(page)).current.step).toBe(1);
  expect((await state(page)).history).toEqual([]);
});

test("skadad passdata blockerar inte andra framsteg eller ett nytt pass", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "schacklabbet.training.v1",
      '{"version":1,"current":{"step":99},"history":[]}',
    );
    localStorage.setItem(
      "schacklabbet.progress.v1",
      JSON.stringify({
        version: 1,
        completed: ["pawn-forward"],
        games: 1,
        wins: 0,
        finishedIds: ["old"],
      }),
    );
  });
  await page.goto("/#session");
  await expect(
    page.getByText(/Det sparade träningspasset kunde inte läsas/),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Börja första uppdraget", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Raka vägen med tornet", exact: true }),
  ).toBeVisible();
  expect((await state(page)).current.step).toBe(0);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("schacklabbet.progress.v1")!).completed,
    ),
  ).toEqual(["pawn-forward"]);
});
