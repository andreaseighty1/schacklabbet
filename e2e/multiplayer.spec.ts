import { test, expect, type Page } from "@playwright/test";
import { friendFixture } from "./friend-fixture";

async function move(page: Page, from: string, to: string, touch: boolean) {
  const first = page.getByRole("button", { name: new RegExp(`^${from},`) });
  const next = page.getByRole("button", { name: new RegExp(`^${to},`) });
  const color = /, (vit|svart) /.exec(
    (await first.getAttribute("aria-label")) ?? "",
  )?.[1];
  if (touch) {
    await first.tap();
    await next.tap();
  } else {
    await first.click();
    await next.click();
  }
  await expect(next).toHaveAttribute(
    "aria-label",
    new RegExp(`^${to}, ${color} `),
  );
}
async function focus(page: Page) {
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
}
async function unchanged(page: Page) {
  return page.evaluate(() => [
    localStorage.getItem("schacklabbet.game.v1"),
    localStorage.getItem("schacklabbet.progress.v1"),
  ]);
}

test("två webbläsare delar kod, återupptar efter omladdning och ser samma schackmatt", async ({
  page,
  context,
  browser,
  hasTouch,
}) => {
  const fixture = friendFixture();
  await fixture.attach(context);
  const guestContext = await browser.newContext({
    baseURL: test.info().project.use.baseURL,
    viewport: page.viewportSize()!,
    hasTouch: Boolean(hasTouch),
  });
  await fixture.attach(guestContext);
  const guest = await guestContext.newPage();
  try {
    await page.goto("/#friends");
    await expect(
      page.getByRole("heading", { name: "Skapa ett parti", exact: true }),
    ).toBeVisible();
    expect(fixture.signups).toBe(0);
    const before = await unchanged(page);
    await page.getByLabel("Svarta", { exact: true }).check();
    await page
      .getByRole("button", { name: "Skapa kompisparti", exact: true })
      .click();
    await expect(
      page.getByRole("textbox", { name: "Partiets kod", exact: true }),
    ).toHaveValue("ABCDE-FGH23");
    await expect(page.locator(".square").first()).toHaveAttribute(
      "aria-label",
      /^h1,/,
    );
    await guest.goto("/#friends");
    await guest
      .getByRole("textbox", { name: "Kompisens kod", exact: true })
      .fill("abcde fgh23");
    await guest
      .getByRole("button", { name: "Gå med i partiet", exact: true })
      .click();
    await expect(
      guest.getByRole("heading", { name: "Nu är det din tur!", exact: true }),
    ).toBeVisible();
    await focus(page);
    await expect(
      page.getByText("Du spelar svart", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Nu är det din kompis tur",
        exact: true,
      }),
    ).toBeVisible();
    await move(guest, "f2", "f3", Boolean(hasTouch));
    await focus(page);
    await expect(
      page.getByRole("button", { name: /^f3, vit bonde/ }),
    ).toBeVisible();
    await move(page, "e7", "e5", Boolean(hasTouch));
    await expect(
      page.getByRole("button", { name: /^e5, svart bonde/ }),
    ).toBeVisible();
    await guest.reload();
    await expect(
      guest.getByRole("button", { name: /^e5, svart bonde/ }),
    ).toBeVisible();
    expect(fixture.signups).toBe(2);
    await move(guest, "g2", "g4", Boolean(hasTouch));
    await focus(page);
    await expect(
      page.getByRole("button", { name: /^g4, vit bonde/ }),
    ).toBeVisible();
    await move(page, "d8", "h4", Boolean(hasTouch));
    await expect(
      page.getByRole("heading", { name: "Svart vinner", exact: true }),
    ).toBeVisible();
    await focus(guest);
    await expect(
      guest.getByRole("heading", { name: "Svart vinner", exact: true }),
    ).toBeVisible();
    await expect(
      guest.getByRole("button", { name: /^e2, vit bonde/ }),
    ).toHaveAttribute("aria-disabled", "true");
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Svart vinner", exact: true }),
    ).toBeVisible();
    expect(await unchanged(page)).toEqual(before);
    expect(fixture.signups).toBe(2);
    const download = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Spara partiet (PGN)", exact: true })
      .click();
    expect((await download).suggestedFilename()).toBe(
      "schacklabbet-kompisparti.pgn",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  } finally {
    await guestContext.close();
  }
});

test("förlorat dragkvitto återhämtas utan dubbeldrag och ge upp kräver elevens bekräftelse", async ({
  page,
  context,
  browser,
  hasTouch,
}) => {
  const fixture = friendFixture();
  await fixture.attach(context);
  const guestContext = await browser.newContext({
    baseURL: test.info().project.use.baseURL,
    viewport: page.viewportSize()!,
    hasTouch: Boolean(hasTouch),
  });
  await fixture.attach(guestContext);
  const guest = await guestContext.newPage();
  try {
    await page.goto("/#friends");
    await page
      .getByRole("button", { name: "Skapa kompisparti", exact: true })
      .click();
    await expect(
      page.getByRole("textbox", { name: "Partiets kod" }),
    ).toHaveValue("ABCDE-FGH23");
    await guest.goto("/#friends");
    await guest.getByLabel("Kompisens kod", { exact: true }).fill("ABCDEFGH23");
    await guest.getByRole("button", { name: "Gå med i partiet" }).click();
    await expect(
      guest.getByText("Du spelar svart", { exact: true }),
    ).toBeVisible();
    await focus(page);
    await expect(
      page.getByRole("heading", { name: "Nu är det din tur!", exact: true }),
    ).toBeVisible();
    fixture.dropMoveReply();
    await move(page, "e2", "e4", Boolean(hasTouch));
    await expect(page.getByRole("alert")).toContainText(
      "Dina bekräftade drag finns kvar",
    );
    await expect(
      page.getByRole("button", { name: /^e4, vit bonde/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^d2, vit bonde/ }),
    ).toHaveAttribute("aria-disabled", "true");
    await focus(guest);
    await expect(
      guest.getByRole("heading", { name: "Nu är det din tur!", exact: true }),
    ).toBeVisible();
    await move(guest, "e7", "e5", Boolean(hasTouch));
    await expect(
      guest.getByRole("button", { name: /^e5, svart bonde/ }),
    ).toBeVisible();
    await focus(page);
    await expect(
      page.getByRole("heading", { name: "Nu är det din tur!", exact: true }),
    ).toBeVisible();
    await context.setOffline(true);
    await expect(
      page.getByText("Väntar på kontakt.", { exact: false }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^d2, vit bonde/ }),
    ).toHaveAttribute("aria-disabled", "true");
    await context.setOffline(false);
    await focus(page);
    await expect(
      page.getByRole("button", { name: /^d2, vit bonde/ }),
    ).toHaveAttribute("aria-disabled", "false");
    await page
      .getByRole("button", { name: "Ge upp partiet", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Fortsätt spela", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Nu är det din tur!", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Ge upp partiet", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Ja, jag ger upp", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Svart vinner", exact: true }),
    ).toBeVisible();
    await focus(guest);
    await expect(
      guest.getByRole("heading", { name: "Svart vinner", exact: true }),
    ).toBeVisible();
  } finally {
    await guestContext.close();
  }
});

test("stängd inbjudan och utgånget parti lämnar plats för ett nytt", async ({
  page,
  context,
}) => {
  const fixture = friendFixture();
  await fixture.attach(context);
  await page.goto("/#friends");
  await page
    .getByRole("button", { name: "Skapa kompisparti", exact: true })
    .click();
  await expect(page.getByRole("textbox", { name: "Partiets kod" })).toHaveValue(
    "ABCDE-FGH23",
  );
  await page
    .getByRole("button", { name: "Stäng inbjudan", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Ja, stäng inbjudan", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Inbjudan är stängd", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Spela ett nytt kompisparti", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Skapa kompisparti", exact: true })
    .click();
  await expect(page.getByRole("textbox", { name: "Partiets kod" })).toHaveValue(
    "ABCDE-FGH23",
  );
  fixture.expire();
  await focus(page);
  await expect(page.getByRole("alert")).toContainText(
    "Partiets tid har gått ut",
  );
  await expect(
    page.getByRole("button", { name: "Skapa kompisparti", exact: true }),
  ).toBeVisible();
});
