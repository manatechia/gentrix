import { expect, type Page } from '@playwright/test';

import { buildOptionTestId } from '../../frontend/src/shared/lib/test-id';

export async function selectFieldOption(
  page: Page,
  fieldTestId: string,
  value: string,
): Promise<void> {
  const trigger = page.getByTestId(fieldTestId);
  const dropdown = page.getByTestId(`${fieldTestId}-dropdown`);

  await trigger.scrollIntoViewIfNeeded();
  await expect(trigger).toBeVisible();
  await trigger.click();
  await expect(dropdown).toBeVisible();

  const option = page.getByTestId(buildOptionTestId(fieldTestId, value));

  await option.scrollIntoViewIfNeeded();
  await expect(option).toBeVisible();
  await option.click();
  await expect(dropdown).toBeHidden();
}

export async function openSidebarIfNeeded(page: Page): Promise<void> {
  const sidebar = page.getByTestId('workspace-sidebar');
  const logoutButton = page.getByTestId('workspace-logout-button');
  const toggleButton = page.getByTestId('workspace-sidebar-toggle');

  if (!(await toggleButton.isVisible())) {
    await expect(logoutButton).toBeVisible();
    return;
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const isSidebarOpen =
      (await toggleButton.getAttribute('aria-expanded')) === 'true';

    if (!isSidebarOpen) {
      await toggleButton.click();
    }

    try {
      await expect(toggleButton).toHaveAttribute('aria-expanded', 'true', {
        timeout: 5_000,
      });
      break;
    } catch (error) {
      if (attempt === 1) {
        throw error;
      }
    }
  }

  await expect(sidebar).toHaveAttribute('aria-hidden', 'false');
  await logoutButton.scrollIntoViewIfNeeded();
  await expect(logoutButton).toBeInViewport();
}
