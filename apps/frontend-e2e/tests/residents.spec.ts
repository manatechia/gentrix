import { expect, test } from '@playwright/test';

import {
  fetchResidents,
  loginWithDemoCredentials,
} from '../playwright/api';
import { createNumericScenarioId } from '../playwright/paths';
import { selectFieldOption } from '../playwright/ui';

function createResidentScenario(projectName: string) {
  const scenarioId = createNumericScenarioId(projectName);
  const documentNumber = String(40_000_000 + Number(scenarioId));
  const room = `PW-${scenarioId.slice(-3)}`;

  return {
    firstName: `Ana${scenarioId.slice(-3)}`,
    lastName: `Playwright${scenarioId.slice(-2)}`,
    fullName: `Ana${scenarioId.slice(-3)} Playwright${scenarioId.slice(-2)}`,
    documentNumber,
    room,
    updatedRoom: `${room}-B`,
    vgiSupportEquipment: `Andador escenario ${scenarioId}`,
    updatedVgiNotes: `VGI editada por Playwright en el escenario ${scenarioId}.`,
  };
}

test('create, edit, and search residents', async (
  { page, request },
  testInfo,
) => {
  test.slow();

  const scenario = createResidentScenario(testInfo.project.name);
  const authSession = await loginWithDemoCredentials(request);
  const seededResidents = await fetchResidents(request, authSession.token);
  const primaryResident = seededResidents[0];
  const secondaryResident = seededResidents[1];

  expect(primaryResident).toBeDefined();
  expect(secondaryResident).toBeDefined();

  if (!primaryResident || !secondaryResident) {
    throw new Error('No hay suficientes residentes para validar la busqueda.');
  }

  await page.goto('/residentes');
  await expect(page).toHaveURL(/\/residentes$/);
  await expect(page.getByText('Padron de residentes')).toHaveCount(0);
  await expect(page.getByText('Vista general de residentes')).toHaveCount(0);
  await expect(page.getByText('Buscar por nombre')).toHaveCount(0);

  const searchInput = page.getByTestId('resident-search-input');

  await expect(searchInput).toBeVisible();
  await expect(searchInput).toBeInViewport();
  await searchInput.fill(primaryResident.fullName);
  await expect(
    page.getByTestId(`resident-card-${primaryResident.id}`),
  ).toBeVisible();
  await expect(
    page.getByTestId(`resident-card-${secondaryResident.id}`),
  ).toBeHidden();
  await searchInput.fill('');

  await page.getByTestId('residents-add-button').click();

  await expect(page).toHaveURL(/\/residentes\/nuevo$/);
  await expect(
    page.getByText('Carga el ingreso en bloques cortos'),
  ).toHaveCount(0);
  await selectFieldOption(page, 'resident-document-type-select', 'dni');
  await page.getByTestId('resident-document-number-input').fill(
    scenario.documentNumber,
  );
  await page.getByTestId('resident-first-name-input').fill(scenario.firstName);
  await page.getByTestId('resident-last-name-input').fill(scenario.lastName);
  await page.getByTestId('resident-birth-date-input').fill('14/05/1941');
  await selectFieldOption(page, 'resident-sex-select', 'femenino');
  await page.getByTestId('resident-room-input').fill(scenario.room);
  await selectFieldOption(page, 'resident-vgi-cognition-select', 'monitored');
  await selectFieldOption(page, 'resident-vgi-mobility-select', 'monitored');
  await page
    .getByTestId('resident-vgi-support-equipment-input')
    .fill(scenario.vgiSupportEquipment);
  await page.getByTestId('resident-submit-button').click();

  await expect(page).toHaveURL(/\/residentes\/[^/]+$/);
  await expect(
    page.getByRole('heading', { name: scenario.fullName }),
  ).toBeVisible();
  await expect(page.getByTestId('resident-edit-button')).toBeVisible();
  await expect(page.getByText('VGI inicial')).toBeVisible();
  await expect(page.getByText(scenario.vgiSupportEquipment)).toBeVisible();
  await expect(page.getByText('Prioriza el timeline clinico')).toHaveCount(0);
  await expect(page.getByText('Vista operativa del personal')).toHaveCount(0);

  await page.getByTestId('resident-edit-button').click();

  await expect(page).toHaveURL(/\/residentes\/[^/]+\/editar$/);
  await expect(page.getByText('Corrige solo lo necesario')).toHaveCount(0);
  await page.getByTestId('resident-room-input').fill(scenario.updatedRoom);
  await page
    .getByTestId('resident-vgi-notes-input')
    .fill(scenario.updatedVgiNotes);
  await page.getByTestId('resident-submit-button').click();

  await expect(page).toHaveURL(/\/residentes\/[^/]+$/);
  await expect(page.getByText(scenario.updatedRoom).first()).toBeVisible();
  await expect(page.getByText(scenario.updatedVgiNotes)).toBeVisible();
});
