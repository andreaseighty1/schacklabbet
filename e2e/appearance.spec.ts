import { test, expect } from "@playwright/test";

test("skaparens namn och sparat färgval gäller alla bräden utan att ändra partiet", async ({
  page,
}) => {
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
          id: "theme-preserved-game",
        }),
      );
  });
  await page.goto("/#play");
  const footer = page.getByRole("contentinfo");
  await expect(footer).toContainText("Skapat av Andreas Jonsson");
  const picker = page.getByLabel("Bräde och pjäser", { exact: true });
  await expect(picker).toHaveValue("classic");
  const saved = await page.evaluate(() => [
    localStorage.getItem("schacklabbet.game.v1"),
    localStorage.getItem("schacklabbet.progress.v1"),
  ]);
  const colors = () =>
    page.evaluate(() => {
      const dark = document.querySelector('[aria-label="a8, svart torn"]')!;
      const light = document.querySelector('[aria-label="a1, vit torn"]')!;
      return {
        dark: getComputedStyle(dark.querySelector("stop")!).stopColor,
        light: getComputedStyle(light.querySelector("stop")!).stopColor,
        square: getComputedStyle(dark).backgroundImage,
      };
    });
  const wood = await colors();
  await page.getByRole("button", { name: /^g1, vit springare/ }).click();
  await expect(
    page.getByRole("button", { name: /^f3,/ }).locator(".move-dot"),
  ).toBeVisible();
  await picker.selectOption("green");
  const green = await colors();
  expect(green.dark).not.toBe(wood.dark);
  expect(green.square).not.toBe(wood.square);
  expect(green.light).toBe(wood.light);
  await expect(
    page.getByRole("button", { name: /^g1, vit springare/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(picker).toHaveValue("green");
  expect(await colors()).toEqual(green);
  expect(
    await page.evaluate(() => [
      localStorage.getItem("schacklabbet.game.v1"),
      localStorage.getItem("schacklabbet.progress.v1"),
    ]),
  ).toEqual(saved);
  await page.goto("/#school");
  await page.getByRole("button", { name: /Raka vägen med tornet/ }).click();
  await expect(footer).toContainText("Andreas Jonsson");
  const lessonPiece = page
    .getByRole("button", { name: /^a7, svart bonde/ })
    .locator("stop")
    .first();
  expect(
    await lessonPiece.evaluate((el) => getComputedStyle(el).stopColor),
  ).toBe(green.dark);
  await picker.selectOption("classic");
  expect(
    await lessonPiece.evaluate((el) => getComputedStyle(el).stopColor),
  ).toBe(wood.dark);
  await page.reload();
  await expect(picker).toHaveValue("classic");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
