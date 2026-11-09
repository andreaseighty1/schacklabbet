import { test, expect, type Page } from "@playwright/test";
import { friendFixture } from "./friend-fixture";

declare global {
  interface Window {
    __pieceAnimations: Animation[];
  }
}
async function observeMotion(page: Page) {
  await page.addInitScript(() => {
    window.__pieceAnimations = [];
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (...args) {
      const animation = animate.apply(this, args);
      if (this.classList.contains("piece-flight")) {
        // Inspect the real animation halfway through without depending on CI wall time.
        animation.pause();
        animation.currentTime = 120;
        window.__pieceAnimations.push(animation);
      }
      return animation;
    };
  });
}
async function move(page: Page, from: string, to: string) {
  await page.getByRole("button", { name: new RegExp(`^${from},`) }).click();
  await page.getByRole("button", { name: new RegExp(`^${to},`) }).click();
}
async function imagesReady(page: Page) {
  await expect
    .poll(() =>
      page
        .locator(".board img")
        .evaluateAll(
          (images) =>
            images.length > 0 &&
            images.every(
              (image) =>
                (image as HTMLImageElement).complete &&
                (image as HTMLImageElement).naturalWidth > 0,
            ),
        ),
    )
    .toBe(true);
}
async function finishMotion(page: Page) {
  await page.evaluate(() =>
    window.__pieceAnimations.forEach((animation) => {
      if (animation.playState !== "idle") animation.finish();
    }),
  );
  await expect(page.locator(".piece-flight")).toHaveCount(0);
  expect(
    await page
      .locator(".board > .square > .piece")
      .evaluateAll((pieces) =>
        pieces.every(
          (piece) => getComputedStyle(piece).visibility === "visible",
        ),
      ),
  ).toBe(true);
}

test("rockad glider med två pjäser och bondeförvandling visar bonden tills den landar", async ({
  page,
}) => {
  await observeMotion(page);
  await page.goto("/#school");
  await page.getByRole("button", { name: /Kungen i säkerhet/ }).click();
  await imagesReady(page);
  await move(page, "e1", "g1");
  await expect(page.locator(".piece-flight")).toHaveCount(2);
  const king = page.locator('[data-flight="e1-g1"]');
  expect(
    await king.evaluate((element) => getComputedStyle(element).pointerEvents),
  ).toBe("none");
  const origin = (await page.locator('[data-square="e1"]').boundingBox())!;
  const destination = (await page.locator('[data-square="g1"]').boundingBox())!;
  const during = (await king.boundingBox())!;
  expect(during.x).toBeGreaterThan(origin.x);
  expect(during.x).toBeLessThan(destination.x);
  await expect(
    page.getByRole("button", { name: /^g1, vit kung/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^f1, vit torn/ }),
  ).toBeVisible();
  await finishMotion(page);
  await page
    .getByRole("button", { name: "Tillbaka till schackskolan", exact: true })
    .click();
  await page.getByRole("button", { name: /Bonden blir en ny pjäs/ }).click();
  await imagesReady(page);
  await move(page, "a7", "a8");
  await page
    .getByRole("group", { name: "Välj bondens nya pjäs" })
    .getByRole("button", { name: "dam", exact: true })
    .click();
  await expect(page.locator('[data-flight="a7-a8"] img')).toHaveAttribute(
    "src",
    /wp\.png$/,
  );
  await expect(page.locator('[data-square="a8"] img')).toHaveAttribute(
    "src",
    /wq\.png$/,
  );
  await finishMotion(page);
});

test("minskad rörelse avbryter en förflyttning och avstängt rörelseval sparas", async ({
  page,
}) => {
  await observeMotion(page);
  await page.goto("/#school");
  await page.getByRole("button", { name: /Raka vägen med tornet/ }).click();
  await imagesReady(page);
  await move(page, "a1", "a7");
  await expect(page.locator(".piece-flight")).toHaveCount(1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".piece-flight")).toHaveCount(0);
  await expect(page.locator('[data-square="a7"] img')).toBeVisible();
  await page.getByRole("button", { name: "Prova igen", exact: true }).click();
  await move(page, "a1", "a7");
  expect(await page.evaluate(() => window.__pieceAnimations.length)).toBe(1);
  await page.goto("/#settings");
  await expect(page.getByText(/Datorn har valt minskad rörelse/)).toBeVisible();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page
    .getByRole("checkbox", { name: "Glidande förflyttningar", exact: true })
    .uncheck();
  await page.reload();
  await expect(
    page.getByRole("checkbox", {
      name: "Glidande förflyttningar",
      exact: true,
    }),
  ).not.toBeChecked();
  await page.goto("/#school");
  await page.getByRole("button", { name: /Raka vägen med tornet/ }).click();
  await move(page, "a1", "a7");
  expect(await page.evaluate(() => window.__pieceAnimations.length)).toBe(0);
  await expect(page.locator('[data-square="a7"] img')).toBeVisible();
});

test("saknad pjäsbild får en tecknad reserv och lektionen går att lösa", async ({
  page,
}) => {
  await page.route("**/pieces/sculpted-v1/*.png", (route) => route.abort());
  await page.goto("/#school");
  await page.getByRole("button", { name: /Raka vägen med tornet/ }).click();
  await expect(page.locator('[data-square="a1"] svg.piece')).toBeVisible();
  await move(page, "a1", "a7");
  await expect(
    page.getByRole("heading", { name: "En ny upptäckt!", exact: true }),
  ).toBeVisible();
  await expect(page.locator('[data-square="a7"] svg.piece')).toBeVisible();
});

test("kompisens bekräftade drag ersätter en pågående förflyttning utan dolda pjäser", async ({
  page,
  context,
  browser,
}) => {
  await observeMotion(page);
  const fixture = friendFixture();
  await fixture.attach(context);
  const other = await browser.newContext({
    baseURL: test.info().project.use.baseURL,
  });
  await fixture.attach(other);
  try {
    const guest = await other.newPage();
    await page.goto("/#friends");
    await page
      .getByRole("button", { name: "Skapa kompisparti", exact: true })
      .click();
    await expect(page.getByLabel("Partiets kod", { exact: true })).toHaveValue(
      "ABC-234",
    );
    await guest.goto("/#friends");
    await guest.getByLabel("Kompisens kod", { exact: true }).fill("ABC234");
    await guest
      .getByRole("button", { name: "Gå med i partiet", exact: true })
      .click();
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(
      page.getByRole("heading", { name: "Nu är det din tur!", exact: true }),
    ).toBeVisible();
    await imagesReady(page);
    await move(page, "e2", "e4");
    await expect(page.locator('[data-flight="e2-e4"]')).toHaveCount(1);
    await guest.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(
      guest.getByRole("button", { name: /^e4, vit bonde/ }),
    ).toBeVisible();
    await move(guest, "e7", "e5");
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(page.locator('[data-flight="e2-e4"]')).toHaveCount(0);
    await expect(page.locator('[data-flight="e7-e5"]')).toHaveCount(1);
    await expect(page.locator('[data-square="e4"] img')).toBeVisible();
    await finishMotion(page);
    await expect(
      page.getByRole("button", { name: /^e5, svart bonde/ }),
    ).toBeVisible();
  } finally {
    await other.close();
  }
});
