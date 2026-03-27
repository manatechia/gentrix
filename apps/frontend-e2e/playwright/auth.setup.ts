import { mkdir } from 'node:fs/promises';
import * as path from 'node:path';

import { expect, test as setup } from '@playwright/test';

import { authTokenStorageKey } from '../../frontend/src/shared/lib/auth-token-storage';
import { loginWithDemoCredentials } from './api';
import { getAuthStorageStatePath, getFrontendBaseUrl } from './paths';

setup('authenticate demo session', async ({ browser, request }) => {
  const authSession = await loginWithDemoCredentials(request);
  const storageStatePath = getAuthStorageStatePath();

  await mkdir(path.dirname(storageStatePath), { recursive: true });

  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(getFrontendBaseUrl());
  await page.evaluate(
    ({ storageKey, token }) => {
      window.localStorage.setItem(storageKey, token);
    },
    {
      storageKey: authTokenStorageKey,
      token: authSession.token,
    },
  );
  await page.goto(`${getFrontendBaseUrl()}/dashboard`);

  await expect(page).toHaveURL(/\/dashboard$/);
  await context.storageState({ path: storageStatePath });
  await context.close();
});
