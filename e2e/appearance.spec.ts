import { test, expect, type Page } from "@playwright/test";

async function navigate(page: Page, label: string) {
  const menu = page.getByRole("button", { name: "Öppna meny", exact: true });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole("link", { name: label, exact: true }).click();
}

test("lektionskort visar skulpterade pjäser i SVG för både rörelser och hela ställningar", async ({
  page,
}) => {
  const loaded = new Set<string>();
  page.on("response", (response) => {
    const path = new URL(response.url()).pathname;
    if (path.includes("/pieces/sculpted-v1/") && response.ok())
      loaded.add(path);
  });
  await page.goto("/#school");
  for (const [title, piece] of [
    ["Raka vägen med tornet", "wr"],
    ["Löparens diagonaler", "wb"],
    ["Springarens hemliga hopp", "wn"],
    ["Damen går rakt och snett", "wq"],
    ["Kungen tar ett säkert steg", "wk"],
  ]) {
    const card = page.getByRole("button", { name: new RegExp(title) });
    const image = card.locator("image.sculpted-piece");
    await expect(image).toHaveCount(1);
    await expect(image).toHaveAttribute(
      "href",
      `/pieces/sculpted-v1/${piece}.png`,
    );
    await expect
      .poll(() => loaded.has(`/pieces/sculpted-v1/${piece}.png`))
      .toBe(true);
    expect(
      await image.evaluate(
        (el) =>
          el instanceof SVGImageElement &&
          el.getBBox().width > 0 &&
          el.getBoundingClientRect().height > 0,
      ),
    ).toBe(true);
  }
  await expect(page.locator(".lesson-scene img")).toHaveCount(0);
  await page.getByRole("tab", { name: /^Nästa nivå/ }).click();
  const position = page.getByRole("button", {
    name: /Morphys operaparti: damen visar vägen/,
  });
  expect(
    await position.locator("image.sculpted-piece").count(),
  ).toBeGreaterThan(2);
  expect(
    await position
      .locator("image.sculpted-piece")
      .evaluateAll((images) =>
        images.every(
          (el) => el instanceof SVGImageElement && el.getBBox().width > 0,
        ),
      ),
  ).toBe(true);
  await expect(page.locator(".lesson-scene img")).toHaveCount(0);
  await navigate(page, "Inställningar");
  await page
    .getByLabel("Pjäsernas utseende", { exact: true })
    .selectOption("simple");
  await navigate(page, "Schackskolan");
  await expect(page.locator(".lesson-scene image")).toHaveCount(0);
  expect(await page.locator(".lesson-scene svg.piece").count()).toBeGreaterThan(
    2,
  );
  await navigate(page, "Inställningar");
  await page
    .getByLabel("Pjäsernas utseende", { exact: true })
    .selectOption("sculpted");
  await page.reload();
  await navigate(page, "Schackskolan");
  expect(
    await page.locator(".lesson-scene image.sculpted-piece").count(),
  ).toBeGreaterThan(2);
});

test("en saknad pjäsbild på lektionskort ersätts av den ritade pjäsen", async ({
  page,
}) => {
  await page.route("**/pieces/sculpted-v1/wr.png", (route) => route.abort());
  await page.goto("/#school");
  const rook = page.getByRole("button", { name: /Raka vägen med tornet/ });
  await expect(rook.locator("svg.piece")).toHaveCount(1);
  await expect(rook.locator("image.sculpted-piece")).toHaveCount(0);
  const bishop = page.getByRole("button", { name: /Löparens diagonaler/ });
  await expect(bishop.locator("image.sculpted-piece")).toHaveCount(1);
  await expect(page.locator(".lesson-scene img")).toHaveCount(0);
});

test("inställningar nås i menyn, minns färger och behåller parti och framsteg", async ({
  page,
}) => {
  await page.addInitScript(() => {
    // This test inspects the existing SVG palette; raster styles have separate coverage.
    localStorage.setItem(
      "schacklabbet.visuals.v1",
      JSON.stringify({ pieceSet: "simple", animateMoves: true }),
    );
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
  await expect(footer).toContainText(
    "© 2026 42 Improbable Owls & Andreas Jonsson",
  );
  const publisherLogo = footer.getByRole("img", {
    name: "42 Improbable Owls",
    exact: true,
  });
  await publisherLogo.scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      publisherLogo.evaluate(
        (image) =>
          (image as HTMLImageElement).complete &&
          (image as HTMLImageElement).naturalWidth > 0,
      ),
    )
    .toBe(true);
  await expect(footer.getByRole("combobox")).toHaveCount(0);
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
  await navigate(page, "Inställningar");
  await expect(
    page.getByRole("heading", { name: "Inställningar", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Förhandsvisning av valt bräde och pjäser" }),
  ).toBeVisible();
  const picker = page.getByRole("combobox", {
    name: "Brädets färger",
    exact: true,
  });
  await expect(picker).toHaveValue("classic");
  await picker.selectOption("green");
  await page.reload();
  await expect(picker).toHaveValue("green");
  await navigate(page, "Spela schack");
  const green = await colors();
  expect(green.dark).not.toBe(wood.dark);
  expect(green.square).not.toBe(wood.square);
  expect(green.light).toBe(wood.light);
  expect(
    await page.evaluate(() => [
      localStorage.getItem("schacklabbet.game.v1"),
      localStorage.getItem("schacklabbet.progress.v1"),
    ]),
  ).toEqual(saved);
  await navigate(page, "Schackskolan");
  await page.getByRole("button", { name: /Raka vägen med tornet/ }).click();
  const lessonPiece = page
    .getByRole("button", { name: /^a7, svart bonde/ })
    .locator("stop")
    .first();
  expect(
    await lessonPiece.evaluate((el) => getComputedStyle(el).stopColor),
  ).toBe(green.dark);
  await navigate(page, "Inställningar");
  await picker.selectOption("classic");
  await navigate(page, "Spela schack");
  expect(await colors()).toEqual(wood);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("tolv skulpterade pjäser laddas och utseendet sparas utan att ändra partiet", async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("schacklabbet.game.v1"))
      localStorage.setItem(
        "schacklabbet.game.v1",
        JSON.stringify({
          version: 1,
          pgn: "*",
          color: "w",
          level: 0,
          profile: "training",
          ended: null,
          id: "piece-style-game",
        }),
      );
  });
  await page.goto("/#play");
  const loaded = () =>
    page
      .locator(".board img.sculpted-piece")
      .evaluateAll(
        (images) =>
          images.length === 32 &&
          images.every(
            (image) =>
              (image as HTMLImageElement).complete &&
              (image as HTMLImageElement).naturalWidth > 0,
          ),
      );
  await expect.poll(loaded).toBe(true);
  expect(
    await page
      .locator(".board img")
      .evaluateAll(
        (images) =>
          new Set(images.map((image) => (image as HTMLImageElement).src)).size,
      ),
  ).toBe(12);
  const saved = await page.evaluate(() => [
    localStorage.getItem("schacklabbet.game.v1"),
    localStorage.getItem("schacklabbet.progress.v1"),
  ]);
  await navigate(page, "Inställningar");
  const picker = page.getByLabel("Pjäsernas utseende", { exact: true });
  await expect(picker).toHaveValue("sculpted");
  await picker.selectOption("simple");
  await page.reload();
  await expect(picker).toHaveValue("simple");
  await navigate(page, "Spela schack");
  await expect(page.locator(".board svg.piece")).toHaveCount(32);
  await expect(page.locator(".board img.piece")).toHaveCount(0);
  await navigate(page, "Inställningar");
  await picker.selectOption("sculpted");
  await page
    .getByLabel("Brädets färger", { exact: true })
    .selectOption("green");
  await page.reload();
  await expect(picker).toHaveValue("sculpted");
  await navigate(page, "Spela schack");
  await expect.poll(loaded).toBe(true);
  expect(
    await page.evaluate(() => [
      localStorage.getItem("schacklabbet.game.v1"),
      localStorage.getItem("schacklabbet.progress.v1"),
    ]),
  ).toEqual(saved);
});

test("inställningar för rutnamn och röst fungerar med tryck och sparas enligt sitt syfte", async ({
  page,
  hasTouch,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "schacklabbet.game.v1",
      JSON.stringify({
        version: 1,
        pgn: "1. e4 e5 *",
        color: "w",
        level: 0,
        profile: "training",
        ended: null,
        id: "coordinate-settings-game",
      }),
    ),
  );
  const press = async (name: string) => {
    const control = page.getByRole("checkbox", { name, exact: true });
    if (hasTouch) await control.tap();
    else await control.click();
  };
  await page.goto("/#settings");
  await expect(
    page.getByRole("checkbox", { name: "Rutnamn i partier", exact: true }),
  ).not.toBeChecked();
  await expect(
    page.getByRole("checkbox", { name: "Rutnamn i lektioner", exact: true }),
  ).toBeChecked();
  await press("Rutnamn i partier");
  await press("Rutnamn i lektioner");
  await page
    .getByRole("button", { name: "Slå på rösten", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Stäng av rösten", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(
    page.getByRole("checkbox", { name: "Rutnamn i partier", exact: true }),
  ).toBeChecked();
  await expect(
    page.getByRole("checkbox", { name: "Rutnamn i lektioner", exact: true }),
  ).not.toBeChecked();
  await expect(
    page.getByRole("button", { name: "Slå på rösten", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await navigate(page, "Spela schack");
  await expect(page.locator(".square-name")).toHaveCount(64);
  await navigate(page, "Schackskolan");
  await page.getByRole("button", { name: /Raka vägen med tornet/ }).click();
  await expect(page.locator(".square-name")).toHaveCount(0);
  await navigate(page, "Inställningar");
  await press("Rutnamn i lektioner");
  await navigate(page, "Schackskolan");
  await page.getByRole("button", { name: /Raka vägen med tornet/ }).click();
  await expect(page.locator(".square-name")).toHaveCount(64);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
