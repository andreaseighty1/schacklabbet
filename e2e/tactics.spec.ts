import { test, expect, type Page, type Locator } from "@playwright/test";

async function press(locator: Locator, touch: boolean) {
  if (touch) await locator.tap();
  else await locator.click();
}
async function open(page: Page, title: string, touch: boolean) {
  const back = page.getByRole("button", {
    name: "Tillbaka till schackskolan",
    exact: true,
  });
  if (await back.isVisible()) await press(back, touch);
  await press(page.getByRole("button", { name: new RegExp(title) }), touch);
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
}
async function move(page: Page, from: string, to: string, touch: boolean) {
  await press(
    page.getByRole("button", { name: new RegExp(`^${from},`) }),
    touch,
  );
  await press(page.getByRole("button", { name: new RegExp(`^${to},`) }), touch);
}
async function completed(page: Page) {
  return page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("schacklabbet.progress.v1")!).completed,
  );
}

test("se hotet och rädda tornet med två lösningar utan dubbla framsteg", async ({
  page,
  hasTouch,
}) => {
  const touch = Boolean(hasTouch);
  await page.addInitScript(() => {
    if (!localStorage.getItem("schacklabbet.game.v1"))
      localStorage.setItem(
        "schacklabbet.game.v1",
        JSON.stringify({
          version: 1,
          pgn: "1. e4 e5 *",
          color: "w",
          level: 0,
          profile: "training",
          ended: null,
          id: "tactics-preserved-game",
        }),
      );
    if (!localStorage.getItem("schacklabbet.progress.v1"))
      localStorage.setItem(
        "schacklabbet.progress.v1",
        JSON.stringify({
          version: 1,
          completed: ["rook"],
          games: 2,
          wins: 1,
          finishedIds: ["old1", "old2"],
        }),
      );
  });
  await page.goto("/#school");
  await expect(
    page.getByRole("region", { name: "4. Upptäck hot och rädda pjäser" }),
  ).toContainText("0 av 5 klara");
  const game = await page.evaluate(() =>
    localStorage.getItem("schacklabbet.game.v1"),
  );
  await open(page, "Vem hotar damen?", touch);
  await press(
    page.getByRole("button", { name: "Kungen på A8", exact: true }),
    touch,
  );
  await expect(page.locator(".exercise-feedback")).toContainText(
    "för långt från E5",
  );
  expect(await completed(page)).toEqual(["rook"]);
  await press(
    page.getByRole("button", { name: "Springaren på C6", exact: true }),
    touch,
  );
  await expect(
    page.getByRole("heading", { name: "En ny upptäckt!" }),
  ).toBeVisible();
  await open(page, "Rädda tornet", touch);
  await move(page, "a1", "a2", touch);
  await expect(page.locator(".exercise-feedback")).toContainText(
    "Svarts torn kan fortfarande ta ditt torn",
  );
  expect(await completed(page)).not.toContain("rescue-rook");
  await press(page.getByRole("button", { name: /^a1, vit torn/ }), touch);
  await expect(
    page
      .getByRole("button", { name: /^a8, svart torn/ })
      .locator(".capture-dot"),
  ).toBeVisible();
  await press(page.getByRole("button", { name: /^a8,/ }), touch);
  await expect(
    page.getByRole("heading", { name: "En ny upptäckt!" }),
  ).toBeVisible();
  await press(
    page.getByRole("button", { name: "Prova igen", exact: true }),
    touch,
  );
  await move(page, "a1", "b1", touch);
  await expect(
    page.getByRole("button", { name: /^b1, vit torn/ }),
  ).toBeVisible();
  expect(
    (await completed(page)).filter((id: string) => id === "rescue-rook"),
  ).toHaveLength(1);
  expect(
    await page.evaluate(() => localStorage.getItem("schacklabbet.game.v1")),
  ).toBe(game);
  const progress = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("schacklabbet.progress.v1")!),
  );
  expect(progress.games).toBe(2);
  expect(progress.wins).toBe(1);
  await page.reload();
  await expect(
    page.getByRole("region", { name: "4. Upptäck hot och rädda pjäser" }),
  ).toContainText("2 av 5 klara");
});

test("damen, svart springare och säkert slag fungerar med hjälprutor och utan saknade ljud", async ({
  page,
  hasTouch,
}) => {
  const touch = Boolean(hasTouch);
  const missingAudio: string[] = [];
  page.on("request", (request) => {
    if (
      /\/audio\/sv-SE\/lesson-(spot-threat|rescue-|safe-capture)/.test(
        request.url(),
      )
    )
      missingAudio.push(request.url());
  });
  await page.goto("/#school");
  await press(
    page.getByRole("button", { name: "Röst av", exact: true }),
    touch,
  );
  await open(page, "Rädda damen", touch);
  await expect(
    page.getByText("Den här övningen har textinstruktioner.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Lyssna på uppdraget", exact: true }),
  ).toHaveCount(0);
  await move(page, "e5", "e7", touch);
  await expect(page.locator(".exercise-feedback")).toContainText(
    "Damen kan fortfarande tas",
  );
  await press(
    page.getByRole("button", { name: "En liten ledtråd", exact: true }),
    touch,
  );
  await expect(page.locator(".hint-text")).toContainText("E-linjen");
  await move(page, "e5", "e4", touch);
  await expect(
    page.getByRole("heading", { name: "En ny upptäckt!" }),
  ).toBeVisible();
  await press(
    page.getByRole("button", { name: "Prova igen", exact: true }),
    touch,
  );
  await move(page, "e5", "d6", touch);
  await expect(
    page.getByRole("heading", { name: "En ny upptäckt!" }),
  ).toBeVisible();
  await open(page, "Rädda svarts springare", touch);
  await expect(page.locator(".square-name").first()).toHaveText("H1");
  await move(page, "f6", "e4", touch);
  await expect(page.locator(".exercise-feedback")).toContainText(
    "Springaren kan fortfarande tas",
  );
  await move(page, "f6", "d5", touch);
  await expect(
    page.getByRole("heading", { name: "En ny upptäckt!" }),
  ).toBeVisible();
  await open(page, "Ta en pjäs – men se upp", touch);
  await move(page, "d3", "h7", touch);
  await expect(page.locator(".exercise-feedback")).toContainText(
    "Tornet på H7 skyddas av kungen",
  );
  expect(await completed(page)).not.toContain("safe-capture");
  await move(page, "d3", "c4", touch);
  await expect(
    page.getByRole("heading", { name: "En ny upptäckt!" }),
  ).toBeVisible();
  expect(await completed(page)).toEqual([
    "rescue-queen",
    "rescue-knight",
    "safe-capture",
  ]);
  expect(missingAudio).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
