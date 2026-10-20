import { test, expect, type Page } from "@playwright/test";
async function start(
  page: Page,
  options: { profile?: string; color?: string } = {},
) {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Spela mot datorn", exact: false })
    .first()
    .click();
  if (options.profile)
    await page
      .getByLabel("Hur mycket hjälp vill du ha?")
      .selectOption(options.profile);
  if (options.color === "b")
    await page.getByRole("button", { name: "Svart · datorn börjar" }).click();
  await page.getByRole("button", { name: "Nu spelar vi" }).click();
}
test("startsidan har sex övningar och inga fel i konsolen", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Hej, schackutforskare" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /FRÅN FÖRSTA DRAGET/ }).click();
  await expect(
    page.getByRole("button", { name: /Börja upptäcka/ }),
  ).toHaveCount(4);
  expect(errors).toEqual([]);
});
test("ett lagligt drag får svar från verklig Stockfish och återställs efter omladdning", async ({
  page,
}) => {
  await start(page, { profile: "training" });
  await page.getByRole("button", { name: /^e2, vit bonde/ }).click();
  await expect(
    page.getByRole("button", { name: /^e4, tom ruta, möjligt drag/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: /^e4,/ }).click();
  await expect(page.locator(".move-pair")).toHaveCount(1);
  await expect(
    page.locator(".move-pair").first().locator("span").nth(2),
  ).not.toHaveText("—", { timeout: 20000 });
  const fen = await page.evaluate(() =>
    localStorage.getItem("schacklabbet.game.v1"),
  );
  await page.reload();
  await expect(
    page.locator(".move-pair").first().locator("span").nth(1),
  ).toHaveText("e4");
  expect(
    await page.evaluate(() => localStorage.getItem("schacklabbet.game.v1")),
  ).toBe(fen);
});
test("svart väljs och datorn gör första draget", async ({ page }) => {
  await start(page, { color: "b" });
  await expect(page.locator(".move-pair")).toHaveCount(1, { timeout: 20000 });
  await expect(page.locator(".player-row.own-player")).toContainText("SVART");
});
test("övning räknas efter riktigt drag och sparas bara en gång", async ({
  page,
}) => {
  await page.goto("/#school");
  await page.getByRole("button", { name: /Raka vägen med tornet/ }).click();
  await page.getByRole("button", { name: /^a1, vit torn/ }).click();
  await page.getByRole("button", { name: /^a7, svart bonde/ }).click();
  await expect(
    page.getByRole("heading", { name: "En ny upptäckt!" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: /Raka vägen med tornet/ }),
  ).toContainText("Klar");
  const completed = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("schacklabbet.progress.v1")!).completed,
  );
  expect(completed).toEqual(["rook"]);
});
test("tävlingsprofil döljer stöd och ångra", async ({ page }) => {
  await start(page, { profile: "competition" });
  await expect(page.getByText("Dina hjälpmedel")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Ångra", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: /^e2, vit bonde/ }).click();
  await expect(page.locator(".move-dot")).toHaveCount(0);
});
test("tangentbord kan välja pjäs och genomföra ett drag", async ({ page }) => {
  await start(page, { profile: "training" });
  const e2 = page.getByRole("button", { name: /^e2, vit bonde/ });
  await e2.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Enter");
  await expect(page.locator(".move-pair").first()).toContainText("e4");
});
test("layout ryms på skärmen utan horisontell scroll", async ({ page }) => {
  await start(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  if (page.viewportSize()!.width > 1000) {
    const board = await page.locator(".board-controls").boundingBox();
    expect(board!.y + board!.height).toBeLessThanOrEqual(768);
  }
});
test("drag och släpp flyttar en pjäs", async ({ page }) => {
  await start(page, { profile: "training" });
  await page
    .getByRole("button", { name: /^e2, vit bonde/ })
    .dragTo(page.getByRole("button", { name: /^e4, tom ruta/ }));
  await expect(page.locator(".move-pair").first()).toContainText("e4");
});
test("ge upp avslutar partiet och räknas en gång", async ({ page }) => {
  await start(page);
  await page.getByRole("button", { name: "Ge upp", exact: true }).click();
  await page.getByRole("button", { name: "Ge upp partiet" }).click();
  await expect(
    page.getByRole("heading", { name: /Svart vinner/ }),
  ).toBeVisible();
  await page.reload();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("schacklabbet.progress.v1")!).games,
    ),
  ).toBe(1);
});
