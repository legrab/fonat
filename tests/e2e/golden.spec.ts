import { test, expect, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("admin@fonat.local");
  await page.getByLabel("Jelszó").fill("fonat-demo");
  await page.getByRole("button", { name: "Belépés" }).click();
  await expect(
    page.getByRole("heading", { name: /Ma a szálak/ }),
  ).toBeVisible();
}

test("login, presentation escape, and logout", async ({ page }) => {
  await login(page);
  await page.getByRole("link", { name: "Pitagorasz-bemutató" }).click();
  await expect(
    page.getByRole("button", { name: "Szünet és kilépés" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Szünet és kilépés" }).click();
  await page.getByRole("button", { name: "Kilépés" }).click();
  await expect(
    page.getByRole("heading", { name: "Belépés a munkatérbe" }),
  ).toBeVisible();
});

test("existing exercise Markdown hydrates the rich editor", async ({
  page,
}) => {
  await login(page);
  await page.goto("/exercises/exercise.missing-hypotenuse-6-8");
  const promptEditor = page.locator(".content-editor").first();
  await expect(promptEditor).toContainText(
    "A befogók 6 cm és 8 cm. Mekkora az átfogó?",
  );
  await expect(promptEditor).not.toContainText("Írd ide a feladat szövegét.");
});

test("manual search and contextual editor help stay connected", async ({
  page,
}) => {
  await login(page);
  await page.goto("/guide");
  await page.getByLabel("Keresés az útmutatóban").fill("tolerancia");
  await expect(
    page.getByRole("link", { name: /Gyakorlófeladat készítése/ }),
  ).toBeVisible();
  await page.getByRole("link", { name: /Gyakorlófeladat készítése/ }).click();
  await expect(
    page.getByRole("heading", { name: "Tolerancia példa" }),
  ).toBeVisible();

  await page.goto("/exercises/new");
  await page.getByRole("link", { name: "Súgó" }).click();
  await expect(
    page.getByRole("heading", { name: "Gyakorlófeladat készítése" }),
  ).toBeVisible();
});
