import { test, expect, type Page } from "@playwright/test";
import { friendFixture } from "./friend-fixture";

test("mobilen har inga vyval och behåller både information och sparade datorval", async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("schacklabbet.layout.v1"))
      localStorage.setItem(
        "schacklabbet.layout.v1",
        JSON.stringify({ focus: true, compact: true, sidebarHidden: true }),
      );
    if (!localStorage.getItem("schacklabbet.game.v1"))
      localStorage.setItem(
        "schacklabbet.game.v1",
        JSON.stringify({
          version: 1,
          pgn: "1. f3 e5 2. g4 Qh4# 0-1",
          color: "w",
          level: 0,
          profile: "training",
          ended: null,
          id: "mobile-view",
        }),
      );
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#play");
  const choices = page.getByRole("button", {
    name: /^(Stort bräde|Avsluta brädesläge|Kompakt spelvy)$/,
  });
  await expect(choices).toHaveCount(0);
  await expect(page.locator(".focus-tools-dialog")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: /Svart vinner med schackmatt/ }),
  ).toBeVisible();
  await expect(page.locator(".move-description")).toHaveCount(4);
  const mobileSize = (await page.locator(".board").boundingBox())!.width;
  expect(mobileSize).toBeGreaterThanOrEqual(280);
  const pgn = await page.evaluate(
    () => JSON.parse(localStorage.getItem("schacklabbet.game.v1")!).pgn,
  );
  await noOverflow(page);
  await page.goto("/#school");
  await page.getByRole("button", { name: /Raka vägen med tornet/ }).tap();
  await expect(choices).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Ditt uppdrag", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".focus-tools-dialog")).toHaveCount(0);
  await noOverflow(page);
  await page.goto("/#play");
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(
    page.getByRole("button", { name: "Avsluta brädesläge", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  expect((await page.locator(".board").boundingBox())!.width).toBeGreaterThan(
    mobileSize + 100,
  );
  await page.getByRole("button", { name: "Drag & spelval", exact: true }).tap();
  await expect(
    page.getByRole("dialog", { name: "Drag och spelval", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".move-description")).toHaveCount(4);
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("schacklabbet.game.v1")!).pgn,
    ),
  ).toBe(pgn);
});

for (const viewport of [
  { width: 1366, height: 900 },
  { width: 1024, height: 768 },
  { width: 800, height: 600 },
]) {
  test(`brädesläge använder fönsterhöjden och behåller parti, klocka och hjälpval, ${viewport.width} × ${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/#play");
    await page
      .getByRole("button", { name: "Starta ett parti", exact: true })
      .tap();
    await page.getByLabel("Vill du spela med klocka?").selectOption("10");
    await page.getByRole("button", { name: "Nu spelar vi", exact: true }).tap();
    const original = (await page.locator(".board").boundingBox())!.width;
    await page.getByRole("button", { name: /^e2, vit bonde/ }).tap();
    await page.getByRole("button", { name: /^e4,/ }).tap();
    await expect(page.locator(".move-description").nth(1)).not.toHaveText("—", {
      timeout: 20000,
    });
    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("schacklabbet.game.v1")!),
    );
    await page.getByRole("button", { name: "Stort bräde", exact: true }).tap();
    await boardFits(page);
    const size = (await page.locator(".board").boundingBox())!.width;
    expect(size).toBeGreaterThan(original + 75);
    expect(size).toBeGreaterThanOrEqual(
      Math.min(viewport.height - 100, viewport.width - 215),
    );
    for (const clock of await page.getByRole("timer").all()) {
      const box = (await clock.boundingBox())!;
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    }
    await expect(page.locator(".board-focus-status")).toContainText("Din tur");
    const opener = page.getByRole("button", {
      name: "Drag & spelval",
      exact: true,
    });
    await opener.tap();
    const panel = page.getByRole("dialog", {
      name: "Drag och spelval",
      exact: true,
    });
    await expect(panel).toBeVisible();
    await expect(
      panel.getByRole("button", { name: "Tillbaka till brädet", exact: true }),
    ).toBeFocused();
    await expect(panel.locator(".move-description").first()).toContainText(
      "Bonden till E4",
    );
    await panel.getByRole("checkbox", { name: /Visa hotade pjäser/ }).check();
    await page.keyboard.press("Escape");
    await expect(panel).not.toBeVisible();
    await expect(opener).toBeFocused();
    await opener.tap();
    await expect(
      panel.getByRole("checkbox", { name: /Visa hotade pjäser/ }),
    ).toBeChecked();
    await panel
      .getByRole("button", { name: "Tillbaka till brädet", exact: true })
      .tap();
    await page.getByRole("button", { name: "Ge upp", exact: true }).tap();
    await page
      .getByRole("button", { name: "Fortsätt spela", exact: true })
      .tap();
    await boardFits(page);
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Avsluta brädesläge", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    const after = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("schacklabbet.game.v1")!),
    );
    expect(after.id).toBe(saved.id);
    expect(after.pgn).toBe(saved.pgn);
    expect(after.clock.whiteMs).toBeLessThan(saved.clock.whiteMs);
    expect(after.clock.running).toBe("w");
    await opener.tap();
    await panel
      .getByRole("button", { name: "Tillbaka till brädet", exact: true })
      .tap();
    await page
      .getByRole("button", { name: "Avsluta brädesläge", exact: true })
      .tap();
    expect((await page.locator(".board").boundingBox())!.width).toBeCloseTo(
      original,
      0,
    );
    await noOverflow(page);
  });
}

test("stora lektionsbrädet visar uppdrag, ledtråd, svar och nästa steg", async ({
  page,
}) => {
  await page.setViewportSize({ width: 800, height: 600 });
  await page.goto("/#school");
  await page.getByRole("tab", { name: /^Nästa nivå/ }).tap();
  await page.getByRole("button", { name: /Gaffel med springaren/ }).tap();
  await page.getByRole("button", { name: "Stort bräde", exact: true }).tap();
  await boardFits(page);
  expect(
    (await page.locator(".board").boundingBox())!.width,
  ).toBeGreaterThanOrEqual(510);
  await expect(page.locator(".focus-lesson-summary")).toContainText(
    "Ditt uppdrag",
  );
  await page
    .locator(".topbar")
    .getByRole("button", { name: "Uppdrag & hjälp", exact: true })
    .tap();
  const panel = page.getByRole("dialog", {
    name: "Uppdrag och hjälp",
    exact: true,
  });
  await panel
    .getByRole("button", { name: "En liten ledtråd", exact: true })
    .tap();
  await expect(panel).not.toBeVisible();
  await expect(page.locator(".focus-lesson-summary .hint-text")).toContainText(
    "E8 och B7",
  );
  await page.getByRole("button", { name: /^e4, vit springare/ }).tap();
  await page.getByRole("button", { name: /^d6,/ }).tap();
  await page
    .getByRole("button", { name: "Visa motståndarens svar", exact: true })
    .tap();
  await page.getByRole("button", { name: /^d6, vit springare/ }).tap();
  await page.getByRole("button", { name: /^b7,/ }).tap();
  await expect(panel).toBeVisible();
  await expect(
    panel.getByRole("heading", { name: "En ny upptäckt!", exact: true }),
  ).toBeVisible();
  await panel.getByRole("button", { name: /^Nästa:/ }).tap();
  await expect(panel).not.toBeVisible();
  await boardFits(page);
  await page
    .getByRole("button", { name: "Tillbaka från övningen", exact: true })
    .tap();
  await expect(page.getByRole("tab", { name: /^Nästa nivå/ })).toBeVisible();
  await noOverflow(page);
});

test("brädeslägets kompisparti visar kod och remiförslag och når bekräftelsen", async ({
  page,
  context,
  browser,
}) => {
  const viewport = { width: 800, height: 600 };
  await page.setViewportSize(viewport);
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
    await page.getByLabel("Spelarklocka", { exact: true }).selectOption("5");
    await page
      .getByLabel("Maxtid för hela partiet", { exact: true })
      .selectOption("20");
    await page
      .getByRole("button", { name: "Skapa kompisparti", exact: true })
      .tap();
    await page.getByRole("button", { name: "Stort bräde", exact: true }).tap();
    await expect(page.getByLabel("Partiets kod", { exact: true })).toHaveValue(
      "ABC-234",
    );
    await boardFits(page);
    await guest.goto("/#friends");
    await guest.getByLabel("Kompisens kod", { exact: true }).fill("ABC234");
    await guest
      .getByRole("button", { name: "Gå med i partiet", exact: true })
      .tap();
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(page.locator(".board-focus-status")).toContainText(
      "Nu är det din tur!",
    );
    await expect(
      page.getByRole("timer", {
        name: "Tid till gemensam maxtid",
        exact: true,
      }),
    ).toBeVisible();
    await guest.getByRole("button", { name: "Erbjud remi", exact: true }).tap();
    await guest
      .getByRole("button", { name: "Skicka förslaget", exact: true })
      .tap();
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await page
      .getByRole("button", { name: "Kompisen föreslår remi", exact: true })
      .tap();
    const tools = page.getByRole("dialog", {
      name: "Drag och spelval",
      exact: true,
    });
    await tools.getByRole("button", { name: "Ja, remi", exact: true }).tap();
    const confirmation = page.getByRole("dialog", {
      name: "Avsluta med remi?",
      exact: true,
    });
    await expect(confirmation).toBeVisible();
    await confirmation
      .getByRole("button", { name: "Ja, avsluta med remi", exact: true })
      .tap();
    await expect(
      tools.getByRole("heading", { name: "Remi – lika resultat", exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator(".board-focus-status")).toContainText(
      "Remi – lika resultat",
    );
    await boardFits(page);
  } finally {
    await other.close();
  }
});

for (const viewport of [
  { width: 1366, height: 600 },
  { width: 1280, height: 720 },
  { width: 1024, height: 600 },
  { width: 800, height: 600 },
]) {
  test(`större bräde och oförändrat parti när spelvyn växlas, ${viewport.width} × ${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/#play");
    await page
      .getByRole("button", { name: "Starta ett parti", exact: true })
      .tap();
    await page.getByLabel("Vill du spela med klocka?").selectOption("10");
    await page.getByRole("button", { name: "Nu spelar vi", exact: true }).tap();
    const toggle = page.getByRole("button", {
      name: "Kompakt spelvy",
      exact: true,
    });
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await boardFits(page);
    const large = (await page.locator(".board").boundingBox())!;
    expect(large.width).toBeGreaterThanOrEqual(
      viewport.height === 720 ? 490 : 400,
    );
    const clock = (await page
      .getByRole("timer", { name: /^Din tid:/ })
      .boundingBox())!;
    expect(clock.y + clock.height).toBeLessThanOrEqual(viewport.height);
    if (viewport.height >= 700) {
      const controls = (await page.locator(".board-controls").boundingBox())!;
      expect(controls.y + controls.height).toBeLessThanOrEqual(viewport.height);
    }
    await page.getByRole("button", { name: /^e2, vit bonde/ }).tap();
    await page.getByRole("button", { name: /^e4,/ }).tap();
    await expect(page.locator(".move-description").nth(1)).not.toHaveText("—", {
      timeout: 20000,
    });
    const saved = await page.evaluate(
      () => JSON.parse(localStorage.getItem("schacklabbet.game.v1")!).pgn,
    );
    await toggle.tap();
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect((await page.locator(".board").boundingBox())!.width).toBeLessThan(
      large.width - 35,
    );
    expect(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem("schacklabbet.game.v1")!).pgn,
      ),
    ).toBe(saved);
    await page.reload();
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem("schacklabbet.game.v1")!).pgn,
      ),
    ).toBe(saved);
    await toggle.tap();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await boardFits(page);
    await noOverflow(page);
  });
}

test("sidomenyn kan döljas, användas med tangentbord och visas igen på en bred laptop", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/");
  const before = (await page.locator(".main-shell").boundingBox())!.width;
  await page
    .getByRole("button", { name: "Dölj sidomenyn", exact: true })
    .click();
  expect(
    (await page.locator(".main-shell").boundingBox())!.width,
  ).toBeGreaterThan(before + 200);
  await page.reload();
  const opener = page.getByRole("button", { name: "Öppna meny", exact: true });
  await opener.click();
  const menu = page.getByRole("dialog", { name: "Meny", exact: true });
  await expect(
    menu.getByRole("button", { name: "Stäng meny", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(opener).toBeFocused();
  await opener.click();
  await menu.getByRole("link", { name: "Schackskolan", exact: true }).click();
  await expect(menu).toHaveCount(0);
  await page
    .getByRole("button", { name: "Visa sidomenyn", exact: true })
    .click();
  await expect(opener).not.toBeVisible();
  await expect(
    page.getByRole("link", { name: "Schackskolan", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Dölj sidomenyn", exact: true }),
  ).toBeVisible();
  await noOverflow(page);
});

test("dragloggen har tätare läsbara rader och kan visa fullständiga rutvägar", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 600 });
  await page.addInitScript(() =>
    localStorage.setItem(
      "schacklabbet.game.v1",
      JSON.stringify({
        version: 1,
        pgn: "1. d4 e6 2. a4 Nf6 3. Nh3 c5 4. Nc3 Nc6 5. dxc5 Bxc5 6. b3 Bb4 7. Qd2 Qa5 8. Nf4 Bxc3 9. b4 Qxb4 10. Ra2 Bxd2+ 11. Bxd2 Qb1+ 12. Bc1 Qxc1# 0-1",
        color: "w",
        level: 0,
        profile: "beginner",
        ended: null,
        id: "compact-log",
      }),
    ),
  );
  await page.goto("/#play");
  await expect(page.locator(".move-pair")).toHaveCount(12);
  await expect(page.locator(".move-route").last()).not.toBeVisible();
  await expect(page.locator(".move-pair").last()).toContainText("Schackmatt");
  const concise = (await page.locator(".move-pair").first().boundingBox())!
    .height;
  const list = page.getByRole("region", { name: "Draglista", exact: true });
  expect(await list.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(
    true,
  );
  await page.getByRole("button", { name: "Fler detaljer", exact: true }).tap();
  await page.locator(".move-route").last().scrollIntoViewIfNeeded();
  await expect(page.locator(".move-route").last()).toBeVisible();
  await expect(page.locator(".move-route").last()).toHaveText("B1 → C1");
  expect(
    (await page.locator(".move-pair").first().boundingBox())!.height,
  ).toBeGreaterThan(concise);
  await page.getByRole("button", { name: "Färre detaljer", exact: true }).tap();
  await expect(page.locator(".move-route").last()).not.toBeVisible();
  await noOverflow(page);
});

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

    test("fördjupningen kan väljas, läsas och lösas med motståndarsvar", async ({
      page,
    }) => {
      await page.goto("/#school");
      await page.getByRole("tab", { name: /^Nästa nivå/ }).tap();
      await noOverflow(page);
      await page.getByRole("button", { name: /Gaffel med springaren/ }).tap();
      await boardFits(page);
      await page.getByRole("button", { name: /^e4, vit springare/ }).tap();
      await page.getByRole("button", { name: /^d6,/ }).tap();
      const response = page.getByRole("button", {
        name: "Visa motståndarens svar",
        exact: true,
      });
      expect((await response.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      await response.tap();
      await expect(page.locator(".lesson-step")).toContainText(
        "Ditt drag 2 av 2",
      );
      await page.getByRole("button", { name: /^d6, vit springare/ }).tap();
      await page.getByRole("button", { name: /^b7,/ }).tap();
      await expect(
        page.getByRole("heading", { name: "En ny upptäckt!" }),
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
