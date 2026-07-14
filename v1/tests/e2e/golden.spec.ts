import { expect, test } from '@playwright/test';

test('Fonat golden path', async ({ page }) => {
  await page.goto('/login');
  const bootstrapTab = page.getByRole('tab', { name: 'Első beállítás' });
  if (await bootstrapTab.isVisible().catch(() => false)) {
    await bootstrapTab.click();
    await page.getByLabel('Felhasználónév').last().fill('admin');
    await page.getByLabel('Megjelenített név').fill('E2E tanár');
    await page.getByLabel('Jelszó').last().fill('e2e-test-password-123');
    await page.getByRole('button', { name: 'Fonat indítása' }).click();
  } else {
    await page.getByLabel('Felhasználónév').first().fill('admin');
    await page.getByLabel('Jelszó').first().fill('e2e-test-password-123');
    await page.getByRole('button', { name: 'Belépés' }).click();
  }

  await expect(page.getByRole('heading', { name: 'Ma' })).toBeVisible();
  await expect(page.getByText('Következő óra')).toBeVisible();

  await page.goto('/planning/lesson/lesson.grade8.06');
  await expect(page.getByRole('heading', { name: 'Gyakorlati szöveges feladatok' })).toBeVisible();
  await expect(page.getByText('Az időkeret nem egyezik')).toBeVisible();

  await page.goto('/library');
  await expect(page.getByRole('heading', { name: 'Tartalomtár' })).toBeVisible();
  await page.goto('/assessments/assessment.grade8.formative');
  await expect(page.getByText('Elemzési megállapítások')).toBeVisible();
});
