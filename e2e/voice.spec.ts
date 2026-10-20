import { test, expect } from "@playwright/test";
import manifest from "../docs/audio/manifest.json";

test("rösten kräver elevens val och kan stoppas, upprepas och stängas av", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith(".mp3")) requests.push(request.url());
  });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(
    page.getByRole("button", { name: "Röst av", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  expect(requests).toEqual([]);
  await page.getByRole("button", { name: "Röst av", exact: true }).click();
  expect(requests).toEqual([]);
  await page
    .getByRole("button", { name: "Lyssna på välkomsten", exact: true })
    .click();
  await expect(page.locator(".voice-status")).toHaveText(
    "Spelar: Välkommen till Schacklabbet",
  );
  expect(requests.some((url) => url.endsWith("/start-welcome.mp3"))).toBe(true);
  const controls = page.getByRole("group", { name: "Röstkontroller" });
  await controls.getByRole("button", { name: "Stoppa uppläsningen" }).click();
  await expect(page.locator(".voice-status")).toBeEmpty();
  await controls.getByRole("button", { name: "Lyssna igen" }).click();
  await expect(page.locator(".voice-status")).toContainText("Spelar:");
  await controls.getByRole("button", { name: "Röst på", exact: true }).click();
  await expect(page.locator(".voice-status")).toBeEmpty();
  await expect(
    controls.getByRole("button", { name: "Lyssna igen" }),
  ).toBeDisabled();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Röst av", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".voice-status")).toBeEmpty();
});

test("övningens uppdrag, ledtråd och lösning får rätt ljud och sidbyte stoppar", async ({
  page,
}) => {
  await page.goto("/#school");
  await page.getByRole("button", { name: /Raka vägen med tornet/ }).click();
  await page.getByRole("button", { name: "Lyssna på uppdraget" }).click();
  await expect(page.locator(".voice-status")).toHaveText("Spelar: Uppdraget");
  await page.getByRole("button", { name: "En liten ledtråd" }).click();
  await expect(page.locator(".voice-status")).toHaveText("Spelar: Ledtråden");
  await page.getByRole("button", { name: /^a1, vit torn/ }).click();
  await page.getByRole("button", { name: /^a7, svart bonde/ }).click();
  await expect(page.locator(".voice-status")).toHaveText(
    "Spelar: Förklaringen",
  );
  await page
    .getByRole("button", { name: "Tillbaka till schackskolan" })
    .click();
  await expect(page.locator(".voice-status")).toBeEmpty();
  await expect(
    page
      .getByRole("group", { name: "Röstkontroller" })
      .getByRole("button", { name: "Lyssna igen" }),
  ).toBeDisabled();
});

test("tävlingsprofilen får inga talade tips när kungen står i schack", async ({
  page,
}) => {
  const audioRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith(".mp3")) audioRequests.push(request.url());
  });
  await page.addInitScript(() => {
    localStorage.setItem(
      "schacklabbet.game.v1",
      JSON.stringify({
        version: 1,
        pgn: "1. e4 d5 2. Bb5+ *",
        color: "b",
        profile: "competition",
        level: 0,
        ended: null,
        id: "competition-check",
      }),
    );
  });
  await page.goto("/#play");
  await page.getByRole("button", { name: "Röst av", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Schack – skydda kungen!" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Lyssna: din kung står i schack" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Lyssna: så flyttar du" }),
  ).toHaveCount(0);
  await page.waitForLoadState("networkidle");
  expect(audioRequests).toEqual([]);
});

test("ljudfel lämnar text och övning användbara", async ({ page }) => {
  await page.route("**/audio/sv-SE/lesson-rook-intro.mp3", (route) =>
    route.abort("failed"),
  );
  await page.goto("/#school");
  await page.getByRole("button", { name: /Raka vägen med tornet/ }).click();
  await page.getByRole("button", { name: "Lyssna på uppdraget" }).click();
  await expect(page.locator(".voice-status")).toContainText(
    "Ljudet kunde inte spelas",
  );
  await page.getByRole("button", { name: /^a1, vit torn/ }).click();
  await page.getByRole("button", { name: /^a7, svart bonde/ }).click();
  await expect(
    page.getByRole("heading", { name: "En ny upptäckt!" }),
  ).toBeVisible();
});

test("alla 25 MP3-filer kan läsas av webbläsarens ljudavkodare", async ({
  page,
}) => {
  await page.goto("/");
  const files = manifest.clips
    .filter((clip) => clip.priority === "P1")
    .map((clip) => `${clip.id}.mp3`);
  const durations = await page.evaluate(
    async (files) =>
      Promise.all(
        files.map(
          (file) =>
            new Promise<number>((resolve, reject) => {
              const audio = new Audio();
              const timer = setTimeout(
                () => reject(new Error(`Timeout: ${file}`)),
                15000,
              );
              audio.preload = "metadata";
              audio.onloadedmetadata = () => {
                clearTimeout(timer);
                resolve(audio.duration);
                audio.removeAttribute("src");
                audio.load();
              };
              audio.onerror = () => {
                clearTimeout(timer);
                reject(new Error(`Kan inte läsa ${file}`));
              };
              audio.src = `/audio/sv-SE/${file}`;
              audio.load();
            }),
        ),
      ),
    files,
  );
  expect(durations).toHaveLength(25);
  expect(
    durations.every((duration) => Number.isFinite(duration) && duration > 0),
  ).toBe(true);
});
