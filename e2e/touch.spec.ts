import { test, expect } from "@playwright/test";

test("elevdator med pekskärm: tryck pjäs och ruta i lektion och parti", async ({
  page,
}) => {
  await page.goto("/#school");
  await page.getByRole("button", { name: /Raka vägen med tornet/ }).tap();
  await page.getByRole("button", { name: /^a1, vit torn/ }).tap();
  await expect(
    page.getByRole("button", { name: /^a7,/ }).locator(".capture-dot"),
  ).toBeVisible();
  await page.getByRole("button", { name: /^a7,/ }).tap();
  await expect(
    page.getByRole("heading", { name: "En ny upptäckt!" }),
  ).toBeVisible();
  await page.goto("/");
  await page
    .getByRole("button", { name: "Spela mot datorn", exact: false })
    .first()
    .tap();
  await page.getByRole("button", { name: "Nu spelar vi" }).tap();
  await page.getByRole("button", { name: /^e2, vit bonde/ }).tap();
  await expect(
    page.getByRole("button", { name: /^e4,/ }).locator(".move-dot"),
  ).toBeVisible();
  await page.getByRole("button", { name: /^e4,/ }).tap();
  await expect(
    page.locator(".move-pair").first().locator(".move-description").nth(1),
  ).not.toHaveText("—", { timeout: 20000 });
  const toggle = page.getByRole("button", { name: "Rutnamn på rutorna" });
  await toggle.tap();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  const box = await toggle.boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(44);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
