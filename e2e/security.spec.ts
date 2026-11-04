import { test, expect, type Page } from "@playwright/test";
import { friendFixture } from "./friend-fixture";

// These fixtures never contact Cloudflare or bypass a real challenge.
const challengeUrl =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
async function mockChallenge(page: Page) {
  await page.route(challengeUrl, (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `
    window.turnstile={
      render(container,options){
        const control=document.createElement('button');
        control.textContent='Bekräfta testkontroll';
        control.id='test-turnstile';
        control.onclick=()=>options.callback('fixture-proof');
        container.append(control);return control.id;
      },
      remove(id){document.getElementById(id)?.remove();}
    };
  `,
    }),
  );
}

test("produktionspolicy tillåter verklig WASM-motor och blockerar främmande och inbäddade skript", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.locator('meta[http-equiv="Content-Security-Policy"]'),
  ).toHaveAttribute("content", /default-src 'none'/);
  await page
    .getByRole("button", { name: "Spela mot datorn", exact: false })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Svart · datorn börjar", exact: true })
    .click();
  await page.getByRole("button", { name: "Nu spelar vi", exact: true }).click();
  await expect(page.locator(".move-action")).toHaveCount(1, { timeout: 25000 });
  await page.evaluate(() => {
    document.addEventListener("securitypolicyviolation", (event) => {
      if (event.blockedURI === "inline")
        document.body.dataset.blockedInline = "yes";
      if (event.blockedURI.startsWith("https://example.invalid/"))
        document.body.dataset.blockedExternal = "yes";
    });
    const inline = document.createElement("script");
    inline.textContent = "document.body.dataset.inlineExecuted='yes'";
    document.head.append(inline);
    const external = document.createElement("script");
    external.src = "https://example.invalid/e2e-blocked.js";
    document.head.append(external);
  });
  await expect(page.locator("body")).toHaveAttribute(
    "data-blocked-inline",
    "yes",
  );
  await expect(page.locator("body")).toHaveAttribute(
    "data-blocked-external",
    "yes",
  );
  await expect(page.locator("body")).not.toHaveAttribute(
    "data-inline-executed",
    "yes",
  );
});

test("kontrollen krävs vid ny spelplats, skickar bevis och återkommer inte efter omladdning", async ({
  page,
  context,
}) => {
  const fixture = friendFixture();
  await fixture.attach(context);
  await mockChallenge(page);
  let signupProof = "";
  page.on("request", (request) => {
    if (request.url().endsWith("/auth/v1/signup"))
      signupProof = request.postDataJSON()?.gotrue_meta_security?.captcha_token;
  });
  await page.goto("/#friends");
  await page
    .getByRole("button", { name: "Skapa kompisparti", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Säkerhetskontroll" }),
  ).toBeVisible();
  expect(fixture.signups).toBe(0);
  await page
    .getByRole("button", { name: "Bekräfta testkontroll", exact: true })
    .click();
  await expect(page.getByRole("textbox", { name: "Partiets kod" })).toHaveValue(
    "ABC-234",
  );
  expect(signupProof).toBe("fixture-proof");
  expect(fixture.signups).toBe(1);
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Partiets kod" })).toHaveValue(
    "ABC-234",
  );
  await expect(
    page.getByRole("region", { name: "Säkerhetskontroll" }),
  ).toHaveCount(0);
  expect(fixture.signups).toBe(1);
});

test("blockerad kontroll kan avbrytas och försökas igen utan att skapa extra konton", async ({
  page,
  context,
}) => {
  const fixture = friendFixture();
  await fixture.attach(context);
  await mockChallenge(page);
  await page.goto("/#friends");
  await page
    .getByRole("button", { name: "Skapa kompisparti", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Bekräfta testkontroll", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Avbryt kontrollen", exact: true })
    .click();
  await expect(
    page.getByText(/Säkerhetskontrollen gick inte att slutföra/),
  ).toBeVisible();
  expect(fixture.signups).toBe(0);
  await page
    .getByRole("button", { name: "Skapa kompisparti", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Bekräfta testkontroll", exact: true })
    .click();
  await expect(page.getByRole("textbox", { name: "Partiets kod" })).toHaveValue(
    "ABC-234",
  );
  expect(fixture.signups).toBe(1);
});
