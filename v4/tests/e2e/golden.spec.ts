import { test, expect } from "@playwright/test";
test("login, presentation escape, and logout", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("admin@fonat.local");
  await page.getByLabel("Jelszó").fill("fonat-demo");
  await page.getByRole("button", { name: "Belépés" }).click();
  await expect(
    page.getByRole("heading", { name: /Ma a szálak/ }),
  ).toBeVisible();
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
