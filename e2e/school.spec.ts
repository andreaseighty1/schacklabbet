import { test, expect, type Page } from "@playwright/test";

async function open(page: Page, title: string) {
  const back = page.getByRole("button", {
    name: "Tillbaka till schackskolan",
    exact: true,
  });
  if (await back.isVisible()) await back.click();
  else await page.goto("/#school");
  await page.getByRole("button", { name: new RegExp(title) }).click();
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeInViewport();
}
async function move(page: Page, from: string, to: string) {
  await page.getByRole("button", { name: new RegExp(`^${from},`) }).click();
  await page.getByRole("button", { name: new RegExp(`^${to},`) }).click();
}
async function complete(page: Page) {
  await expect(
    page.getByRole("heading", { name: "En ny upptäckt!" }),
  ).toBeVisible();
}
async function ids(page: Page) {
  return page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("schacklabbet.progress.v1")!).completed,
  );
}

test("bondens lärväg skiljer på lagliga drag och uppdrag, och vänder för svart", async ({
  page,
}) => {
  await open(page, "Bonden går framåt");
  await move(page, "d3", "c4");
  await expect(page.locator(".exercise-feedback")).toContainText(
    "Den pjäsen kan inte flytta dit",
  );
  expect(await ids(page)).toEqual([]);
  await move(page, "d3", "d4");
  await complete(page);
  await page.getByRole("button", { name: /^Nästa:/ }).click();
  await expect(
    page.getByRole("heading", { name: "Bondens första dubbelsteg" }),
  ).toBeVisible();
  await move(page, "d2", "d3");
  await expect(page.locator(".exercise-feedback")).toContainText(
    "ett lagligt drag",
  );
  expect(await ids(page)).toEqual(["pawn-forward"]);
  await move(page, "d2", "d4");
  await complete(page);
  await page.getByRole("button", { name: /^Nästa:/ }).click();
  await move(page, "d4", "d5");
  await expect(page.locator(".exercise-feedback")).toContainText(
    "Den pjäsen kan inte flytta dit",
  );
  await move(page, "d4", "e5");
  await complete(page);
  await page.getByRole("button", { name: /^Nästa:/ }).click();
  await expect(page.getByText("Du ser brädet från svarts sida.")).toBeVisible();
  await expect(page.locator(".square").first()).toHaveAttribute(
    "aria-label",
    /^h1,/,
  );
  await move(page, "d6", "d5");
  await complete(page);
  expect(await ids(page)).toEqual([
    "pawn-forward",
    "pawn-double",
    "pawn-capture",
    "pawn-black",
  ]);
  await page.reload();
  await expect(
    page.getByRole("region", { name: "1. Lär känna bonden" }),
  ).toContainText("4 av 5 klara");
});

for (const [name, type] of [
  ["dam", "dam"],
  ["torn", "torn"],
  ["löpare", "löpare"],
  ["springare", "springare"],
]) {
  test(`bondeförvandling väntar på elevens val av ${name}`, async ({
    page,
  }) => {
    await open(page, "Bonden blir en ny pjäs");
    await move(page, "a7", "a8");
    await expect(
      page.getByRole("group", { name: "Välj bondens nya pjäs" }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("group", { name: "Välj bondens nya pjäs" })
        .getByRole("button", { name: "dam", exact: true }),
    ).toBeFocused();
    expect(await ids(page)).toEqual([]);
    await page
      .getByRole("group", { name: "Välj bondens nya pjäs" })
      .getByRole("button", { name, exact: true })
      .click();
    await complete(page);
    await expect(
      page.getByRole("button", { name: new RegExp(`^a8, vit ${type}`) }),
    ).toBeVisible();
    expect(await ids(page)).toEqual(["pawn-promotion"]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("button", { name: "Prova igen", exact: true }).click();
    await move(page, "a7", "a8");
    await page
      .getByRole("group", { name: "Välj bondens nya pjäs" })
      .getByRole("button", { name, exact: true })
      .click();
    await complete(page);
    expect(await ids(page)).toEqual(["pawn-promotion"]);
  });
}

test("damen, kungens säkerhet och tre sätt att komma ur schack går att prova", async ({
  page,
}) => {
  test.setTimeout(60000);
  const cases = [
    ["Damen går rakt och snett", "d2", "g5"],
    ["Kungen tar ett säkert steg", "e1", "e2"],
    ["Schack: flytta kungen", "e1", "f1"],
    ["Schack: ta den hotande pjäsen", "e1", "e2"],
    ["Schack: ställ en pjäs emellan", "c1", "e3"],
  ];
  for (const [title, from, to] of cases) {
    await open(page, title);
    if (title === "Kungen tar ett säkert steg") {
      await move(page, "e1", "d2");
      await expect(page.locator(".exercise-feedback")).toContainText(
        "Den pjäsen kan inte flytta dit",
      );
    }
    await move(page, from, to);
    await complete(page);
  }
  expect(await ids(page)).toHaveLength(5);
});

test("matt och patt ger olika återkoppling och bevarar äldre framsteg utan saknade ljudanrop", async ({
  page,
}) => {
  const audio: string[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith(".mp3")) audio.push(request.url());
  });
  await page.addInitScript(() => {
    if (!localStorage.getItem("schacklabbet.progress.v1"))
      localStorage.setItem(
        "schacklabbet.progress.v1",
        JSON.stringify({
          version: 1,
          completed: ["rook"],
          games: 2,
          wins: 1,
          finishedIds: ["old-a", "old-b"],
        }),
      );
  });
  await open(page, "Vad betyder schackmatt?");
  await page
    .getByRole("button", { name: "Patt – det blir oavgjort", exact: true })
    .click();
  await expect(page.locator(".exercise-feedback")).toContainText(
    "Här hotar damen kungen",
  );
  expect(await ids(page)).toEqual(["rook"]);
  await page
    .getByRole("button", { name: "Schackmatt – vit vinner", exact: true })
    .click();
  await complete(page);
  await page.getByRole("button", { name: /^Nästa:/ }).click();
  await expect(
    page.getByRole("heading", { name: "Patt: ingen kan vinna", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Vit vinner för att svart inte kan flytta",
      exact: true,
    })
    .click();
  await expect(page.locator(".exercise-feedback")).toContainText(
    "Här hotas inte rutan H8",
  );
  await page
    .getByRole("button", { name: "Patt – partiet blir oavgjort", exact: true })
    .click();
  await complete(page);
  await expect(page.locator(".exercise-feedback")).toContainText(
    "kungen är inte i schack",
  );
  await page.reload();
  expect(await ids(page)).toEqual(["rook", "checkmate", "stalemate"]);
  const progress = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("schacklabbet.progress.v1")!),
  );
  expect(progress.games).toBe(2);
  expect(progress.wins).toBe(1);
  expect(audio).toEqual([]);
});

test("en passant tar bort bonden från rätt ruta och nybörjarhjälpen förklarar spelstarten", async ({
  page,
}) => {
  await page.goto("/#school");
  await page
    .getByText("Första gången? Så börjar ett parti", { exact: true })
    .click();
  await expect(page.locator(".school-basics")).toContainText("Vit börjar");
  await expect(page.locator(".school-basics")).toContainText(
    "ljus ruta längst ner till höger",
  );
  await page.getByRole("button", { name: /Extra: en passant/ }).click();
  await page.getByRole("button", { name: /^e5, vit bonde/ }).click();
  await expect(
    page.getByRole("button", { name: /^d6,/ }).locator(".capture-dot"),
  ).toBeVisible();
  await move(page, "e5", "d6");
  await complete(page);
  await expect(
    page.getByRole("button", { name: /^d5, tom ruta/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^d6, vit bonde/ }),
  ).toBeVisible();
});
