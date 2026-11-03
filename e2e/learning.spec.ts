import { test, expect, type Page, type Locator } from "@playwright/test";

async function press(locator: Locator, touch: boolean) {
  if (touch) await locator.tap();
  else await locator.click();
}
async function open(
  page: Page,
  title: string,
  touch: boolean,
  advanced = true,
) {
  const back = page.getByRole("button", {
    name: "Tillbaka till schackskolan",
    exact: true,
  });
  if (await back.isVisible()) await press(back, touch);
  else await page.goto("/#school");
  await press(
    page.getByRole("tab", { name: advanced ? /^Nästa nivå/ : /^Grunderna/ }),
    touch,
  );
  await press(page.getByRole("button", { name: new RegExp(title) }), touch);
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
}
async function move(page: Page, from: string, to: string, touch: boolean) {
  await press(
    page.getByRole("button", { name: new RegExp(`^${from},`) }),
    touch,
  );
  await press(page.getByRole("button", { name: new RegExp(`^${to},`) }), touch);
}
async function reply(page: Page, touch: boolean) {
  await press(
    page.getByRole("button", { name: "Visa motståndarens svar", exact: true }),
    touch,
  );
}
async function completed(page: Page): Promise<string[]> {
  return page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("schacklabbet.progress.v1")!).completed,
  );
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}

test("gaffeln behöver två egna drag, väntar på eleven och sparar först efter avslutet", async ({
  page,
  hasTouch,
}) => {
  const touch = Boolean(hasTouch);
  await open(page, "Gaffel med springaren", touch);
  await move(page, "e4", "c5", touch);
  await expect(page.locator(".exercise-feedback")).toContainText(
    "ett lagligt drag",
  );
  await expect(
    page.getByRole("button", { name: /^e4, vit springare/ }),
  ).toBeVisible();
  await press(
    page.getByRole("button", { name: "En liten ledtråd", exact: true }),
    touch,
  );
  await expect(page.locator(".hint-text")).toContainText("E8 och B7");
  await move(page, "e4", "d6", touch);
  expect(await completed(page)).toEqual([]);
  await expect(
    page.getByRole("button", { name: /^e8, svart kung/ }),
  ).toHaveAttribute("aria-disabled", "true");
  await press(
    page.getByRole("button", { name: "Börja om lektionen", exact: true }),
    touch,
  );
  await expect(
    page.getByRole("button", { name: /^e4, vit springare/ }),
  ).toBeVisible();
  await move(page, "e4", "d6", touch);
  await reply(page, touch);
  await expect(
    page.getByRole("button", { name: /^d7, svart kung/ }),
  ).toBeVisible();
  await expect(page.locator(".lesson-step")).toContainText("Ditt drag 2 av 2");
  await press(
    page.getByRole("button", { name: "En liten ledtråd", exact: true }),
    touch,
  );
  await expect(page.locator(".hint-text")).toContainText("B7");
  await move(page, "d6", "b7", touch);
  await expect(
    page.getByRole("heading", { name: "En ny upptäckt!" }),
  ).toBeVisible();
  expect(await completed(page)).toEqual(["tactic-knight-fork"]);
  await press(
    page.getByRole("button", { name: "Prova igen", exact: true }),
    touch,
  );
  await move(page, "e4", "d6", touch);
  await reply(page, touch);
  await move(page, "d6", "b7", touch);
  expect(await completed(page)).toEqual(["tactic-knight-fork"]);
  await press(
    page.getByRole("button", {
      name: "Tillbaka till schackskolan",
      exact: true,
    }),
    touch,
  );
  await expect(page.getByRole("tab", { name: /^Nästa nivå/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(
    page.getByRole("region", { name: "1. Smarta drag och kombinationer" }),
  ).toContainText("1 av 8 klara");
  await page.reload();
  await expect(page.getByRole("tab", { name: /^Nästa nivå/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await noOverflow(page);
});

test("öppningslektion för svart behåller rätt perspektiv och tur genom alla svar", async ({
  page,
  hasTouch,
}) => {
  const touch = Boolean(hasTouch);
  await open(page, "En bra start när du spelar svart", touch);
  await expect(page.locator(".square").first()).toHaveAttribute(
    "aria-label",
    /^h1,/,
  );
  await move(page, "e7", "e5", touch);
  await reply(page, touch);
  await move(page, "b8", "c6", touch);
  await reply(page, touch);
  await move(page, "g8", "f6", touch);
  await expect(
    page.getByRole("heading", { name: "En ny upptäckt!" }),
  ).toBeVisible();
  expect(await completed(page)).toEqual(["opening-black"]);
  await expect(
    page.getByRole("button", { name: /^c4, vit löpare/ }),
  ).toBeVisible();
  await noOverflow(page);
});

test("kung och torn går hela vägen från spärr till matt utan att markeras klart för tidigt", async ({
  page,
  hasTouch,
}) => {
  test.setTimeout(60000);
  const touch = Boolean(hasTouch);
  await open(page, "Kung och torn samarbetar", touch);
  const line = [
    ["a1", "a5"],
    ["d4", "e5"],
    ["a5", "a6"],
    ["e5", "f5"],
    ["f5", "f6"],
    ["a6", "a7"],
    ["a7", "a8"],
  ];
  for (const [i, [from, to]] of line.entries()) {
    await move(page, from, to, touch);
    if (i < line.length - 1) {
      expect(await completed(page)).toEqual([]);
      await reply(page, touch);
    }
  }
  await expect(
    page.getByRole("heading", { name: "En ny upptäckt!" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^f8, svart kung, schack/ }),
  ).toBeVisible();
  expect(await completed(page)).toEqual(["ending-rook-king"]);
  await noOverflow(page);
});

test("förvandlingens val ingår i uppgiften och en felaktig dam ger inte framsteg", async ({
  page,
  hasTouch,
}) => {
  const touch = Boolean(hasTouch);
  await open(page, "Välj torn och undvik patt", touch);
  await move(page, "c7", "c8", touch);
  const choices = page.getByRole("group", { name: "Välj bondens nya pjäs" });
  await press(choices.getByRole("button", { name: "dam", exact: true }), touch);
  expect(await completed(page)).toEqual([]);
  await expect(
    page.getByRole("button", { name: /^c7, vit bonde/ }),
  ).toBeVisible();
  await move(page, "c7", "c8", touch);
  await press(
    choices.getByRole("button", { name: "torn", exact: true }),
    touch,
  );
  await expect(
    page.getByRole("heading", { name: "En ny upptäckt!" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^c8, vit torn/ }),
  ).toBeVisible();
  expect(await completed(page)).toEqual(["ending-underpromotion"]);
});

for (const example of [
  {
    title: "Morphys operaparti: damen visar vägen",
    from: "b3",
    to: "b8",
    finishFrom: "d1",
    finishTo: "d8",
    id: "master-opera",
  },
  {
    title: "Det odödliga partiet: tre pjäser hjälps åt",
    from: "f3",
    to: "f6",
    finishFrom: "d6",
    finishTo: "e7",
    id: "master-immortal",
  },
]) {
  test(`${example.id}: mästardrag visar offret, svaret och avslutningen med källänk`, async ({
    page,
    hasTouch,
  }) => {
    const touch = Boolean(hasTouch);
    await open(page, example.title, touch);
    await expect(page.locator(".lesson-source a")).toHaveAttribute(
      "href",
      /^https:\/\/www.chess.com\/terms\//,
    );
    await move(page, example.from, example.to, touch);
    expect(await completed(page)).toEqual([]);
    await reply(page, touch);
    await move(page, example.finishFrom, example.finishTo, touch);
    await expect(
      page.getByRole("heading", { name: "En ny upptäckt!" }),
    ).toBeVisible();
    expect(await completed(page)).toEqual([example.id]);
    await noOverflow(page);
  });
}

test("lärvägarna kan väljas med tangentbord och saknade inspelningar anropas inte", async ({
  page,
  hasTouch,
}) => {
  const errors: string[] = [];
  const missing: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.url().endsWith(".mp3") && !r.ok()) missing.push(r.url());
  });
  await page.goto("/#school");
  await page.getByRole("tab", { name: /^Grunderna/ }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: /^Nästa nivå/ })).toBeFocused();
  await expect(page.getByRole("tab", { name: /^Nästa nivå/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.keyboard.press("Home");
  await expect(page.getByRole("tab", { name: /^Grunderna/ })).toBeFocused();
  const touch = Boolean(hasTouch);
  await press(
    page.getByRole("button", { name: "Röst av", exact: true }),
    touch,
  );
  await open(page, "Din tankepaus före draget", touch, false);
  await press(
    page.getByRole("button", { name: "Jag ska ta svarts kung", exact: true }),
    touch,
  );
  expect(await completed(page)).toEqual([]);
  await press(
    page.getByRole("button", { name: "Min kung står i schack", exact: true }),
    touch,
  );
  await expect(
    page.getByRole("heading", { name: "En ny upptäckt!" }),
  ).toBeVisible();
  expect(await completed(page)).toEqual(["thinking-routine"]);
  expect(errors).toEqual([]);
  expect(missing).toEqual([]);
  await noOverflow(page);
});
