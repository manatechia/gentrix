import { expect, test } from '@playwright/test';

import { demoCredentials } from '../../frontend/src/features/auth/constants/demo-credentials';
import { openSidebarIfNeeded } from '../playwright/ui';

const emptyStorageState = {
  cookies: [],
  origins: [],
};

test.use({ storageState: emptyStorageState });

test('login and logout from the dashboard', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByTestId('login-screen')).toBeVisible();
  await expect(page.getByTestId('login-email-input')).toHaveValue(
    demoCredentials.email,
  );
  await expect(page.getByTestId('login-password-input')).toHaveValue(
    demoCredentials.password,
  );

  await page.getByTestId('login-submit-button').click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText('Consola operativa Gentrix')).toHaveCount(0);
  await expect(page.getByText('Plan de vistas')).toHaveCount(0);
  await openSidebarIfNeeded(page);
  const logoutButton = page.getByTestId('workspace-logout-button');

  await expect(logoutButton).toBeVisible();
  await logoutButton.scrollIntoViewIfNeeded();
  await expect(logoutButton).toBeInViewport();
  await logoutButton.click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByTestId('login-screen')).toBeVisible();
});
