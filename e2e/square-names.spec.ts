import { test, expect, type Page } from "@playwright/test";

const toggle = (page: Page) =>
  page.getByRole("button", { name: "Rutnamn på rutorna", exact: true });

test("lektioner visar rutnamn, minns avstängning och fungerar från svarts sida", async ({
  page,
}) => {
  await page.goto("/#school");
  await page.getByRole("button", { name: /Bonden går framåt/ }).click();
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".square-name")).toHaveCount(64);
  await expect(
    page
      .getByRole("button", { name: /^d3, vit bonde/ })
      .locator(".square-name"),
  ).toHaveText("D3");
  await expect(page.locator(".rank-label").first()).toBeHidden();
  await toggle(page).click();
  await expect(page.locator(".square-name")).toHaveCount(0);
  await expect(page.locator(".rank-label").first()).toBeVisible();
  await page.getByRole("button", { name: /^d3, vit bonde/ }).click();
  await page.getByRole("button", { name: /^d4,/ }).click();
  await page.getByRole("button", { name: /^Nästa:/ }).click();
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");
  await page.reload();
  await page.getByRole("button", { name: /Framåt för svart/ }).click();
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");
  await toggle(page).click();
  await expect(page.locator(".square-name").first()).toHaveText("H1");
  await expect(
    page
      .getByRole("button", { name: /^d6, svart bonde/ })
      .locator(".square-name"),
  ).toHaveText("D6");
  await page
    .getByRole("button", { name: /^d6, svart bonde/ })
    .dragTo(page.getByRole("button", { name: /^d5,/ }));
  await expect(
    page.getByRole("heading", { name: "En ny upptäckt!" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("partier har eget sparat rutnamnsval; etiketter följer rutorna när brädet vänds", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("schacklabbet.square-names.lesson.v1", "true"),
  );
  await page.goto("/");
  await page
    .getByRole("button", { name: "Spela mot datorn", exact: true })
    .click();
  await page
    .getByLabel("Hur mycket hjälp vill du ha?")
    .selectOption("competition");
  await page.getByRole("button", { name: "Nu spelar vi" }).click();
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".square-name")).toHaveCount(0);
  await toggle(page).click();
  await expect(page.locator(".square-name")).toHaveCount(64);
  await expect(page.locator(".square-name").first()).toHaveText("A8");
  await page.getByRole("button", { name: "Vänd brädet", exact: true }).click();
  await expect(page.locator(".square-name").first()).toHaveText("H1");
  await expect(
    page
      .getByRole("button", { name: /^e2, vit bonde/ })
      .locator(".square-name"),
  ).toHaveText("E2");
  await expect(page.getByText("Dina hjälpmedel", { exact: true })).toHaveCount(
    0,
  );
  await page.reload();
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".square-name")).toHaveCount(64);
  const settings = await page.evaluate(() => [
    localStorage.getItem("schacklabbet.square-names.lesson.v1"),
    localStorage.getItem("schacklabbet.square-names.game.v1"),
  ]);
  expect(settings).toEqual(["true", "true"]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
