import { expect, test } from '@playwright/test';

import {
  fetchMedicationCatalog,
  fetchMedicationOrders,
  fetchResidents,
  loginWithDemoCredentials,
} from '../playwright/api';
import { createNumericScenarioId } from '../playwright/paths';
import { selectFieldOption } from '../playwright/ui';

test('create and edit a medication order with duplicate-schedule validation', async (
  { page, request },
  testInfo,
) => {
  test.slow();

  const authSession = await loginWithDemoCredentials(request);
  const [residents, medicationCatalog] = await Promise.all([
    fetchResidents(request, authSession.token),
    fetchMedicationCatalog(request, authSession.token),
  ]);
  const targetResident = residents[0];
  const targetMedication =
    medicationCatalog.find((item) => item.status === 'active') ??
    medicationCatalog[0];
  const scenarioId = createNumericScenarioId(testInfo.project.name);
  const prescribedBy = `Dr. Playwright ${scenarioId}`;

  expect(targetResident).toBeDefined();
  expect(targetMedication).toBeDefined();

  if (!targetResident || !targetMedication) {
    throw new Error('No hay residentes o medicamentos disponibles para el smoke test.');
  }

  await page.goto('/medicacion/nueva');

  await expect(page).toHaveURL(/\/medicacion\/nueva$/);
  await selectFieldOption(page, 'medication-resident-select', targetResident.id);
  await selectFieldOption(
    page,
    'medication-catalog-select',
    targetMedication.id,
  );
  await page.getByTestId('medication-dose-input').fill('1 comprimido');
  await selectFieldOption(page, 'medication-route-select', 'oral');
  await selectFieldOption(page, 'medication-frequency-select', 'daily');
  await page.getByTestId('medication-schedule-time-0').fill('08:00');
  await page.getByTestId('medication-add-schedule-button').click();
  await page.getByTestId('medication-schedule-time-1').fill('08:00');
  await page
    .getByTestId('medication-prescribed-by-input')
    .fill(prescribedBy);

  await page.getByTestId('medication-submit-button').click();

  await expect(page.getByText('Los horarios no pueden repetirse.')).toBeVisible();

  await page.getByTestId('medication-schedule-time-1').fill('20:00');
  await page.getByTestId('medication-submit-button').click();

  await expect(page.getByTestId('medication-form-notice')).toContainText(
    'guardada correctamente',
  );

  const createdOrder = (
    await fetchMedicationOrders(request, authSession.token)
  ).find((order) => order.prescribedBy === prescribedBy);

  expect(createdOrder).toBeDefined();

  if (!createdOrder) {
    throw new Error('No pude encontrar la orden creada por el smoke test.');
  }

  await page.goto(`/medicacion/${createdOrder.id}/editar`);

  await expect(page).toHaveURL(new RegExp(`/medicacion/${createdOrder.id}/editar$`));
  await selectFieldOption(page, 'medication-status-select', 'inactive');
  await page.getByTestId('medication-submit-button').click();

  await expect(page).toHaveURL(/\/medicacion$/);

  const updatedOrder = (
    await fetchMedicationOrders(request, authSession.token)
  ).find((order) => order.id === createdOrder.id);

  expect(updatedOrder?.status).toBe('inactive');
});
