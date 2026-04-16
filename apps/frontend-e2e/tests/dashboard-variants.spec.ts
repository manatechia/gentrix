import { expect, test, type Page } from '@playwright/test';

import { demoAccessOptions } from '../../frontend/src/features/auth/constants/demo-credentials';

const emptyStorageState = {
  cookies: [],
  origins: [],
};

test.use({ storageState: emptyStorageState });

async function loginAs(
  page: Page,
  credentials: { email: string; password: string },
) {
  await page.goto('/login');
  await expect(page.getByTestId('login-screen')).toBeVisible();
  await page.getByTestId('login-email-input').fill(credentials.email);
  await page.getByTestId('login-password-input').fill(credentials.password);
  await page.getByTestId('login-submit-button').click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test('admin sees the management dashboard variant', async ({ page }) => {
  const adminOption = demoAccessOptions.find((option) => option.id === 'admin');
  expect(adminOption).toBeDefined();

  await loginAs(page, adminOption!.credentials);

  await expect(page.getByTestId('dashboard-variant-management')).toBeVisible();
  await expect(page.getByTestId('dashboard-variant-operational')).toHaveCount(0);
  await expect(
    page.getByTestId('operational-dashboard-header'),
  ).toHaveCount(0);
});

test('nurse sees the operational dashboard variant with header and tasks', async ({
  page,
}) => {
  const nurseOption = demoAccessOptions.find((option) => option.id === 'nurse');
  expect(nurseOption).toBeDefined();

  await loginAs(page, nurseOption!.credentials);

  await expect(page.getByTestId('dashboard-variant-operational')).toBeVisible();
  await expect(page.getByTestId('dashboard-variant-management')).toHaveCount(0);
  await expect(page.getByTestId('operational-dashboard-header')).toBeVisible();
  await expect(
    page.getByTestId('operational-dashboard-shift-label'),
  ).toBeVisible();
  await expect(page.getByTestId('operational-kpi-grid')).toHaveCount(0);
  await expect(page.getByTestId('priority-tasks-panel')).toBeVisible();
  await expect(
    page.getByTestId('operational-header-new-observation'),
  ).toBeVisible();
});

test('nurse can create a quick observation from the dashboard', async ({
  page,
}) => {
  const nurseOption = demoAccessOptions.find((option) => option.id === 'nurse');
  expect(nurseOption).toBeDefined();

  await loginAs(page, nurseOption!.credentials);

  await page.getByTestId('operational-header-new-observation').click();

  const modal = page.getByTestId('quick-observation-modal');
  await expect(modal).toBeVisible();

  const select = page.getByTestId('quick-observation-resident-select');
  const firstResidentValue = await select
    .locator('option')
    .nth(1)
    .getAttribute('value');

  expect(firstResidentValue).toBeTruthy();
  await select.selectOption(firstResidentValue!);

  await page
    .getByTestId('quick-observation-note-input')
    .fill('Observación rápida desde Playwright.');

  await page.getByTestId('quick-observation-submit').click();

  await expect(modal).toHaveCount(0);
  await expect(page.getByTestId('operational-dashboard-notice')).toContainText(
    /Observación registrada/,
  );
});
