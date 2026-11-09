import { test, expect, type Page } from "@playwright/test";
import { friendFixture } from "./friend-fixture";

async function seedTimedSolo(page: Page) {
  await page.addInitScript(() => {
    if (localStorage.getItem("schacklabbet.game.v1")) return;
    localStorage.setItem(
      "schacklabbet.game.v1",
      JSON.stringify({
        version: 1,
        id: "online-handoff",
        color: "w",
        level: 0,
        profile: "training",
        ended: null,
        pgn: '[TimeControl "600"]\n\n1. e4 e5 2. Nf3 Nc6 *',
        clock: {
          minutes: 10,
          whiteMs: 600000,
          blackMs: 600000,
          running: "w",
          updatedAt: Date.now(),
        },
      }),
    );
  });
}
async function soloSnapshot(page: Page) {
  return page.evaluate(() => ({
    now: Date.now(),
    game: JSON.parse(localStorage.getItem("schacklabbet.game.v1")!),
    progress: JSON.parse(localStorage.getItem("schacklabbet.progress.v1")!),
  }));
}
for (const action of ["create", "join"] as const) {
  test(`tidsatt datorparti kan avbryta eller bekräfta byte till kompisparti (${action})`, async ({
    page,
    context,
    browser,
  }) => {
    await page.clock.install();
    await seedTimedSolo(page);
    const fixture = friendFixture();
    await fixture.attach(context);
    const hostContext =
      action === "join"
        ? await browser.newContext({ baseURL: test.info().project.use.baseURL })
        : null;
    try {
      if (hostContext) {
        await fixture.attach(hostContext);
        const host = await hostContext.newPage();
        await host.goto("/#friends");
        await host
          .getByRole("button", { name: "Skapa kompisparti", exact: true })
          .click();
        await expect(
          host.getByLabel("Partiets kod", { exact: true }),
        ).toHaveValue("ABC-234");
      }
      await page.goto("/#friends");
      await expect(
        page.getByRole("heading", { name: "Skapa ett parti", exact: true }),
      ).toBeVisible();
      const before = await soloSnapshot(page);
      const signups = fixture.signups;
      const start = page.getByRole("button", {
        name: action === "create" ? "Skapa kompisparti" : "Gå med i partiet",
        exact: true,
      });
      if (action === "create") {
        await page.getByLabel("Svarta", { exact: true }).check();
        await page
          .getByLabel("Spelarklocka", { exact: true })
          .selectOption("5");
        await page
          .getByLabel("Maxtid för hela partiet", { exact: true })
          .selectOption("20");
      } else
        await page.getByLabel("Kompisens kod", { exact: true }).fill("abc 234");
      await expect(start).toBeEnabled();
      await start.click();
      const dialog = page.getByRole("dialog", {
        name: "Byta till kompisparti?",
        exact: true,
      });
      await expect(dialog).toBeVisible();
      await expect(
        dialog.getByRole("button", { name: "Avbryt bytet", exact: true }),
      ).toBeFocused();
      const box = (await dialog.boundingBox())!;
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.y + box.height).toBeLessThanOrEqual(
        page.viewportSize()!.height,
      );
      await page.clock.fastForward(4000);
      await page.keyboard.press("Escape");
      await expect(dialog).not.toBeVisible();
      await expect(start).toBeFocused();
      let saved = await soloSnapshot(page);
      expect(saved.game.pgn).toBe(before.game.pgn);
      expect(saved.game.ended).toBeNull();
      expect(saved.game.clock.running).toBe("w");
      const remaining =
        saved.game.clock.whiteMs - (saved.now - saved.game.clock.updatedAt);
      const previous =
        before.game.clock.whiteMs - (before.now - before.game.clock.updatedAt);
      expect(remaining).toBeLessThanOrEqual(previous - 4000);
      expect(saved.progress.games).toBe(0);
      expect(fixture.signups).toBe(signups);
      await start.click();
      await dialog
        .getByRole("button", { name: "Avbryt bytet", exact: true })
        .click();
      expect(fixture.signups).toBe(signups);
      await start.click();
      await dialog
        .getByRole("button", { name: "Ja, ge upp och byt", exact: true })
        .click();
      if (action === "create") {
        await expect(
          page.getByLabel("Partiets kod", { exact: true }),
        ).toHaveValue("ABC-234");
        await expect(
          page.getByText("Du spelar svart", { exact: true }),
        ).toBeVisible();
        await expect(page.locator(".friend-time-info")).toContainText(
          "5 minuter var",
        );
        await expect(page.locator(".friend-time-info")).toContainText(
          "20 minuter",
        );
      } else
        await expect(
          page.getByText("Du spelar svart", { exact: true }),
        ).toBeVisible();
      saved = await soloSnapshot(page);
      expect(saved.game.ended).toBe("Svart vinner – du gav upp");
      expect(saved.game.pgn).toContain("1. e4 e5 2. Nf3 Nc6 0-1");
      expect(saved.game.clock.running).toBeNull();
      expect(saved.progress.games).toBe(1);
      expect(saved.progress.wins).toBe(0);
      expect(saved.progress.finishedIds).toContain("online-handoff");
      expect(fixture.signups).toBe(signups + 1);
      await page.reload();
      await expect(
        page.getByText("Du spelar svart", { exact: true }),
      ).toBeVisible();
      expect((await soloSnapshot(page)).progress.games).toBe(1);
      await page.goto("/#play");
      await expect(
        page.getByRole("heading", {
          name: "Svart vinner – du gav upp",
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /^f3, vit springare/ }),
      ).toBeVisible();
    } finally {
      await hostContext?.close();
    }
  });
}

test("datorpartiets tidsavslut under bytesfrågan behåller tidsresultatet", async ({
  page,
  context,
}) => {
  await page.clock.install();
  await seedTimedSolo(page);
  const fixture = friendFixture();
  await fixture.attach(context);
  await page.goto("/#friends");
  await page
    .getByRole("button", { name: "Skapa kompisparti", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Byta till kompisparti?",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await page.clock.fastForward(600001);
  await expect(dialog).toContainText("Datorpartiet är redan avslutat");
  await dialog
    .getByRole("button", { name: "Fortsätt till kompispartiet", exact: true })
    .click();
  await expect(page.getByLabel("Partiets kod", { exact: true })).toHaveValue(
    "ABC-234",
  );
  const saved = await soloSnapshot(page);
  expect(saved.game.ended).toContain("Svart vinner på tid");
  expect(saved.game.clock.running).toBeNull();
  expect(saved.progress.games).toBe(1);
});

test("avbruten hämtning av kompissidan visar återhämtning och behåller menyn", async ({
  page,
}) => {
  await page.route(/\/src\/components\/Multiplayer\.tsx(?:\?|$)/, (route) =>
    route.abort(),
  );
  await page.goto("/#friends");
  await expect(
    page.getByRole("heading", {
      name: "Kompispartier kunde inte öppnas",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Ladda om sidan", exact: true }),
  ).toBeVisible();
  const menu = page.getByRole("button", { name: "Öppna meny", exact: true });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole("link", { name: "Översikt", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Kompispartier kunde inte öppnas",
      exact: true,
    }),
  ).toHaveCount(0);
});

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

test("klockor, remiförslag och gemensam maxtid fungerar för båda spelarna", async ({
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
    await page.getByLabel("Spelarklocka", { exact: true }).selectOption("5");
    await page
      .getByLabel("Maxtid för hela partiet", { exact: true })
      .selectOption("20");
    await page
      .getByRole("button", { name: "Skapa kompisparti", exact: true })
      .click();
    await expect(
      page.getByRole("textbox", { name: "Partiets kod" }),
    ).toHaveValue("ABC-234");
    await expect(page.getByRole("timer", { name: /^Din tid:/ })).toHaveText(
      "5:00",
    );
    await guest.goto("/#friends");
    await guest.getByLabel("Kompisens kod", { exact: true }).fill("abc 234");
    await guest
      .getByRole("button", { name: "Gå med i partiet", exact: true })
      .click();
    await expect(
      guest.getByRole("timer", { name: /^Din tid:/ }),
    ).toHaveAttribute("data-running", "false");
    await expect(guest.getByRole("timer", { name: /^Din tid:/ })).toHaveText(
      "5:00",
    );
    await focus(page);
    await expect(
      page.getByRole("timer", { name: /^Din tid:/ }),
    ).toHaveAttribute("data-running", "true");
    const board = await page.locator(".board").boundingBox();
    expect(board!.y + board!.height).toBeLessThanOrEqual(
      page.viewportSize()!.height,
    );
    fixture.advanceTime(3000);
    await focus(page);
    await page
      .getByRole("button", { name: "Erbjud remi", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Skicka förslaget", exact: true })
      .click();
    await expect(
      page.getByText("Du har föreslagit remi.", { exact: false }),
    ).toBeVisible();
    await focus(guest);
    await expect(
      guest.getByText("Din kompis föreslår remi.", { exact: false }),
    ).toBeVisible();
    await guest
      .getByRole("button", { name: "Nej, spela vidare", exact: true })
      .click();
    await expect(
      guest.getByRole("button", { name: "Erbjud remi", exact: true }),
    ).toBeVisible();
    await focus(page);
    await move(page, "e2", "e4", Boolean(hasTouch));
    await expect(
      page.getByRole("timer", { name: /^Din tid:/ }),
    ).toHaveAttribute("data-running", "false");
    await focus(guest);
    await expect(
      guest.getByRole("timer", { name: /^Din tid:/ }),
    ).toHaveAttribute("data-running", "true");
    await guest
      .getByRole("button", { name: "Erbjud remi", exact: true })
      .click();
    await guest
      .getByRole("button", { name: "Skicka förslaget", exact: true })
      .click();
    await focus(page);
    await page.getByRole("button", { name: "Ja, remi", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Avsluta med remi?", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Ja, avsluta med remi", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Remi – lika resultat", exact: true }),
    ).toBeVisible();
    await focus(guest);
    await expect(
      guest.getByRole("heading", { name: "Remi – lika resultat", exact: true }),
    ).toBeVisible();
    await expect(
      page.locator('.friend-clock[data-running="true"]'),
    ).toHaveCount(0);
    // A fresh game can also finish at its agreed total time without player clocks.
    await page
      .getByRole("button", { name: "Spela ett nytt kompisparti", exact: true })
      .click();
    await guest
      .getByRole("button", { name: "Spela ett nytt kompisparti", exact: true })
      .click();
    await page.getByLabel("Spelarklocka", { exact: true }).selectOption("0");
    await page
      .getByRole("button", { name: "Skapa kompisparti", exact: true })
      .click();
    await expect(
      page.getByRole("textbox", { name: "Partiets kod" }),
    ).toHaveValue("ABC-234");
    await guest.getByLabel("Kompisens kod", { exact: true }).fill("ABC234");
    await guest
      .getByRole("button", { name: "Gå med i partiet", exact: true })
      .click();
    await expect(
      guest.getByText("Du spelar svart", { exact: true }),
    ).toBeVisible();
    await focus(page);
    await page
      .getByRole("button", { name: "Ge upp partiet", exact: true })
      .click();
    fixture.advanceTime(20 * 60000 + 1000);
    await focus(page);
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Remi – lika resultat", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Partiets gemensamma maxtid tog slut", { exact: true }),
    ).toBeVisible();
    await guest.reload();
    await expect(
      guest.getByRole("heading", { name: "Remi – lika resultat", exact: true }),
    ).toBeVisible();
  } finally {
    await guestContext.close();
  }
});

test("serverbekräftat tidsavslut återställs efter omladdning och låser sena drag", async ({
  page,
  context,
  browser,
}) => {
  const fixture = friendFixture();
  await fixture.attach(context);
  const other = await browser.newContext({
    baseURL: test.info().project.use.baseURL,
  });
  await fixture.attach(other);
  try {
    const guest = await other.newPage();
    await page.goto("/#friends");
    await page.getByLabel("Spelarklocka", { exact: true }).selectOption("5");
    await page
      .getByRole("button", { name: "Skapa kompisparti", exact: true })
      .click();
    await expect(
      page.getByRole("textbox", { name: "Partiets kod" }),
    ).toHaveValue("ABC-234");
    await guest.goto("/#friends");
    await guest.getByLabel("Kompisens kod", { exact: true }).fill("ABC234");
    await guest
      .getByRole("button", { name: "Gå med i partiet", exact: true })
      .click();
    await expect(
      guest.getByText("Du spelar svart", { exact: true }),
    ).toBeVisible();
    fixture.advanceTime(5 * 60000 + 1);
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Svart vinner", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("timer", { name: /^Din tid:/ })).toHaveText(
      "0:00",
    );
    await expect(
      page.getByRole("button", { name: /^e2, vit bonde/ }),
    ).toHaveAttribute("aria-disabled", "true");
  } finally {
    await other.close();
  }
});

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
    ).toHaveValue("ABC-234");
    await expect(page.locator(".square").first()).toHaveAttribute(
      "aria-label",
      /^h1,/,
    );
    await guest.goto("/#friends");
    await guest
      .getByRole("textbox", { name: "Kompisens kod", exact: true })
      .fill("abc 234");
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
    await expect
      .poll(async () => {
        const board = await page.locator(".board").boundingBox();
        return Boolean(
          board &&
          board.y >= 0 &&
          board.y + board.height <= page.viewportSize()!.height,
        );
      })
      .toBe(true);
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
    ).toHaveValue("ABC-234");
    await guest.goto("/#friends");
    await guest.getByLabel("Kompisens kod", { exact: true }).fill("ABC234");
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
    "ABC-234",
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
    "ABC-234",
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
