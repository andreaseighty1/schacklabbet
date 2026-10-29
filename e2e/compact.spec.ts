import { test, expect, type Page } from "@playwright/test";
import { friendFixture } from "./friend-fixture";

async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}
async function navigate(page: Page, name: string) {
  await page.getByRole("button", { name: "Öppna meny", exact: true }).tap();
  await page.getByRole("link", { name, exact: true }).tap();
  await expect(
    page.getByRole("dialog", { name: "Meny", exact: true }),
  ).toHaveCount(0);
}
async function boardFits(page: Page) {
  const board = await page.locator(".board").boundingBox();
  expect(board).not.toBeNull();
  expect(Math.abs(board!.height - board!.width)).toBeLessThan(1);
  expect(board!.x).toBeGreaterThanOrEqual(0);
  expect(board!.x + board!.width).toBeLessThanOrEqual(
    page.viewportSize()!.width,
  );
  expect(board!.width).toBeGreaterThanOrEqual(270);
  // Very short windows deliberately scroll vertically instead of shrinking chess squares.
  if (page.viewportSize()!.height >= 600 && page.viewportSize()!.width >= 691) {
    expect(board!.y).toBeGreaterThanOrEqual(0);
    expect(board!.y + board!.height).toBeLessThanOrEqual(
      page.viewportSize()!.height,
    );
  }
  await noOverflow(page);
}

for (const viewport of [
  { width: 1024, height: 768 },
  { width: 1024, height: 600 },
  { width: 960, height: 600 },
  { width: 800, height: 600 },
  { width: 800, height: 500 },
  { width: 640, height: 480 },
]) {
  test.describe(`${viewport.width} × ${viewport.height}, laptop med pekskärm`, () => {
    test.use({ viewport });

    test("menyn har läsbara namn, tangentbordsfokus och når sidornas innehåll", async ({
      page,
    }) => {
      await page.goto("/");
      const opener = page.getByRole("button", {
        name: "Öppna meny",
        exact: true,
      });
      await expect(opener).toBeVisible();
      await opener.tap();
      const menu = page.getByRole("dialog", { name: "Meny", exact: true });
      await expect(menu).toBeVisible();
      const close = menu.getByRole("button", {
        name: "Stäng meny",
        exact: true,
      });
      await expect(close).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(
        menu.getByRole("button", {
          name: "Så funkar Schacklabbet",
          exact: true,
        }),
      ).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(close).toBeFocused();
      for (const link of await menu.getByRole("link").all()) {
        if ((await link.getAttribute("class"))?.includes("nav-item")) {
          await expect(link.locator("span").first()).toBeVisible();
          expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
        }
      }
      await page.keyboard.press("Escape");
      await expect(menu).toHaveCount(0);
      await expect(opener).toBeFocused();
      for (const label of [
        "Schackskolan",
        "Ditt nybörjarpass",
        "Utmaningar 2",
        "Matchträning",
        "Mina framsteg",
        "Inställningar",
        "Spela med en kompis",
        "Översikt",
      ]) {
        await navigate(page, label);
        await noOverflow(page);
      }
      await opener.tap();
      await page
        .locator(".menu-backdrop")
        .tap({ position: { x: viewport.width - 20, y: 30 } });
      await expect(menu).toHaveCount(0);
      await opener.tap();
      await page.setViewportSize({ width: 1366, height: 768 });
      await expect(menu).toHaveCount(0);
      await expect(opener).not.toBeVisible();
      await expect(
        page.getByRole("link", { name: "Schackskolan", exact: true }),
      ).toBeVisible();
    });

    test("lektion och träningspass kan läsas och lösas med tryck", async ({
      page,
    }) => {
      await page.goto("/#school");
      await page.getByRole("button", { name: /Raka vägen med tornet/ }).tap();
      await boardFits(page);
      const task = page.getByRole("heading", {
        name: "Ditt uppdrag",
        exact: true,
      });
      await expect(task).toBeVisible();
      await page.getByRole("button", { name: /^a1, vit torn/ }).tap();
      await page.getByRole("button", { name: /^a7, svart bonde/ }).tap();
      await expect(
        page.getByRole("heading", { name: "En ny upptäckt!", exact: true }),
      ).toBeVisible();
      await noOverflow(page);
      await page.getByRole("button", { name: /^Nästa:/ }).tap();
      await noOverflow(page);
      await navigate(page, "Ditt nybörjarpass");
      await page
        .getByRole("button", { name: "Börja första uppdraget", exact: true })
        .tap();
      await boardFits(page);
      await page.getByRole("button", { name: /^a1, vit torn/ }).tap();
      await page.getByRole("button", { name: /^a7, svart bonde/ }).tap();
      await page.getByRole("button", { name: /^Nästa:/ }).tap();
      await expect(
        page.getByRole("heading", {
          name: "Schack: flytta kungen",
          exact: true,
        }),
      ).toBeVisible();
      await noOverflow(page);
    });

    test("parti, klockor och låga dialoger går att använda utan sidledsrullning", async ({
      page,
    }) => {
      await page.goto("/#play");
      await page
        .getByRole("button", { name: "Starta ett parti", exact: true })
        .tap();
      const dialog = page.getByRole("dialog");
      const box = await dialog.boundingBox();
      expect(box!.y).toBeGreaterThanOrEqual(0);
      expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
      await page.getByLabel("Vill du spela med klocka?").selectOption("10");
      await page
        .getByRole("button", { name: "Nu spelar vi", exact: true })
        .tap();
      await expect(page.getByRole("timer")).toHaveCount(2);
      await boardFits(page);
      if (viewport.height >= 600 && viewport.width >= 691) {
        const clock = await page
          .getByRole("timer", { name: /^Din tid:/ })
          .boundingBox();
        expect(clock!.y + clock!.height).toBeLessThanOrEqual(viewport.height);
      }
      await page.getByRole("button", { name: /^e2, vit bonde/ }).tap();
      await page.getByRole("button", { name: /^e4,/ }).tap();
      await expect(
        page.locator(".move-pair").first().locator(".move-description").nth(1),
      ).not.toHaveText("—", { timeout: 20000 });
      await page.getByRole("button", { name: "Ge upp", exact: true }).tap();
      await expect(page.getByRole("dialog")).toBeVisible();
      await noOverflow(page);
      await page
        .getByRole("button", { name: "Fortsätt spela", exact: true })
        .tap();
    });

    test("kompislobbyn och ett tidsatt kompisparti ryms och går att avsluta", async ({
      page,
      context,
      browser,
    }) => {
      const fixture = friendFixture();
      await fixture.attach(context);
      const other = await browser.newContext({
        baseURL: test.info().project.use.baseURL,
        viewport,
        hasTouch: true,
      });
      await fixture.attach(other);
      try {
        const guest = await other.newPage();
        await page.goto("/#friends");
        await page
          .getByLabel("Spelarklocka", { exact: true })
          .selectOption("15");
        await page
          .getByLabel("Maxtid för hela partiet", { exact: true })
          .selectOption("30");
        await noOverflow(page);
        await page
          .getByRole("button", { name: "Skapa kompisparti", exact: true })
          .tap();
        await expect(
          page.getByLabel("Partiets kod", { exact: true }),
        ).toHaveValue("ABC-234");
        await noOverflow(page);
        await guest.goto("/#friends");
        await guest.getByLabel("Kompisens kod", { exact: true }).fill("ABC234");
        await guest
          .getByRole("button", { name: "Gå med i partiet", exact: true })
          .tap();
        await expect(
          guest.getByText("Du spelar svart", { exact: true }),
        ).toBeVisible();
        await page.evaluate(() => window.dispatchEvent(new Event("focus")));
        await expect(
          page.getByRole("heading", {
            name: "Nu är det din tur!",
            exact: true,
          }),
        ).toBeVisible();
        await page.evaluate(() => window.scrollTo(0, 0));
        await boardFits(page);
        await expect(
          page.getByRole("timer", { name: /^Din tid:/ }),
        ).toBeVisible();
        await page
          .getByRole("button", { name: "Ge upp partiet", exact: true })
          .tap();
        const box = await page.getByRole("dialog").boundingBox();
        expect(box!.y).toBeGreaterThanOrEqual(0);
        expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
        await page
          .getByRole("button", { name: "Ja, jag ger upp", exact: true })
          .tap();
        await expect(
          page.getByRole("heading", { name: "Svart vinner", exact: true }),
        ).toBeVisible();
        await noOverflow(page);
      } finally {
        await other.close();
      }
    });
  });
}
