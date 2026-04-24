import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { demoAccessOptions } from '../../frontend/src/features/auth/constants/demo-credentials';
import { authTokenStorageKey } from '../../frontend/src/shared/lib/auth-token-storage';
import {
  fetchUsers,
  loginWithCredentials,
  loginWithDemoCredentials,
} from '../playwright/api';
import { createNumericScenarioId } from '../playwright/paths';
import { openSidebarIfNeeded, selectFieldOption } from '../playwright/ui';

const emptyStorageState = {
  cookies: [],
  origins: [],
};

async function authenticatePage(
  page: Page,
  request: APIRequestContext,
  email: string,
  password: string,
  destination = '/dashboard',
): Promise<void> {
  const authSession = await loginWithCredentials(request, { email, password });

  await page.goto('/login');
  await page.evaluate(
    ({ storageKey, token }) => {
      window.localStorage.setItem(storageKey, token);
    },
    {
      storageKey: authTokenStorageKey,
      token: authSession.token,
    },
  );
  await page.goto(destination);
}

test('admin sees Personal while Pase and Medicacion stay hidden in menu', async ({
  page,
}) => {
  await page.goto('/dashboard');
  await openSidebarIfNeeded(page);

  await expect(page.getByTestId('workspace-sidebar-link-users')).toBeVisible();
  await expect(page.getByTestId('workspace-sidebar-link-handoff')).toHaveCount(0);
  await expect(
    page.getByTestId('workspace-sidebar-link-medication'),
  ).toHaveCount(0);
});

test.describe('personal route restrictions', () => {
  test.use({ storageState: emptyStorageState });

  test('non-admin roles do not see Personal and cannot open /personal', async ({
    browser,
    request,
  }) => {
    for (const option of demoAccessOptions.filter(
      (candidate) => candidate.id !== 'admin',
    )) {
      const context = await browser.newContext();
      const page = await context.newPage();

      await authenticatePage(
        page,
        request,
        option.credentials.email,
        option.credentials.password,
      );

      await expect(page).toHaveURL(/\/dashboard$/);
      await openSidebarIfNeeded(page);
      await expect(page.getByTestId('workspace-sidebar-link-users')).toHaveCount(
        0,
      );
      await expect(
        page.getByTestId('workspace-sidebar-link-handoff'),
      ).toHaveCount(0);
      await expect(
        page.getByTestId('workspace-sidebar-link-medication'),
      ).toHaveCount(0);

      await page.goto('/personal');
      await expect(page).toHaveURL(/\/residentes$/);
      await context.close();
    }
  });
});

test.describe('admin user management', () => {
  test.use({ storageState: emptyStorageState });

  test('admin creates a user and the new role gets the correct menu visibility', async ({
    page,
    request,
  }, testInfo) => {
    test.slow();

    const scenarioId = createNumericScenarioId(testInfo.project.name);
    const fullName = `Director Salud Playwright ${scenarioId}`;
    const email = `director.salud.${scenarioId}@gentrix.local`;
    const password = `gentrix-${scenarioId}`;

    await authenticatePage(
      page,
      request,
      demoAccessOptions[0].credentials.email,
      demoAccessOptions[0].credentials.password,
      '/personal',
    );

    await expect(page).toHaveURL(/\/personal$/);
    const usersWorkspace = page.getByTestId('users-admin-workspace');
    await expect(usersWorkspace).toBeVisible();
    await expect(page.getByText('Usuarios de la plataforma')).toHaveCount(0);
    await expect(usersWorkspace.getByText('Admin')).toHaveCount(0);
    await expect(usersWorkspace.getByText('Sofia Quiroga')).toHaveCount(0);

    await page.getByTestId('users-admin-add-button').click();
    await expect(page.getByTestId('users-create-drawer')).toBeVisible();

    await page.getByTestId('users-form-full-name-input').fill(fullName);
    await page.getByTestId('users-form-email-input').fill(email);
    await selectFieldOption(page, 'users-form-role-select', 'health-director');
    await page.getByTestId('users-form-password-input').fill(password);
    await page.getByTestId('users-form-submit-button').click();

    await expect(page.getByText('Personal agregado correctamente.')).toBeVisible();
    await expect(page.getByText(fullName)).toBeVisible();

    const adminSession = await loginWithDemoCredentials(request);
    const users = await fetchUsers(request, adminSession.token);
    expect(users.some((user) => user.email === email)).toBeTruthy();

    await openSidebarIfNeeded(page);
    await page.getByTestId('workspace-logout-button').click();

    await expect(page).toHaveURL(/\/login$/);
    await page.getByTestId('login-email-input').fill(email);
    await page.getByTestId('login-password-input').fill(password);
    await page.getByTestId('login-submit-button').click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await openSidebarIfNeeded(page);
    await expect(page.getByTestId('workspace-sidebar-link-users')).toHaveCount(
      0,
    );
    await expect(page.getByText('Director de salud').first()).toBeVisible();

    await page.goto('/personal');
    await expect(page).toHaveURL(/\/residentes$/);
  });
});
