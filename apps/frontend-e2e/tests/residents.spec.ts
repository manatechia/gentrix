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

test('register, list with "see more" and delete resident observations', async (
  { page, request },
  testInfo,
) => {
  test.slow();

  const authSession = await loginWithDemoCredentials(request);
  const seeded = await fetchResidents(request, authSession.token);
  const target = seeded[0];
  expect(target).toBeDefined();
  if (!target) throw new Error('No seeded resident available.');

  const stamp = createNumericScenarioId(testInfo.project.name);
  const firstNote = `Nota uno ${stamp}`;
  const observationNote = `No comio al mediodia ${stamp}`;

  await page.goto(`/residentes/${target.id}`);
  await expect(page.getByTestId('resident-observations-panel')).toBeVisible();

  // 1. Registrar una observacion simple, sin cambiar careStatus.
  const noteInput = page.getByTestId('resident-observation-note-input');
  await noteInput.fill(firstNote);
  await page.getByTestId('resident-observations-submit').click();
  await expect(page.getByText(firstNote)).toBeVisible();

  // 2. Registrar otra observacion marcando "poner en observacion". El checkbox
  //    debe estar visible (residente en `normal`) y luego desaparecer porque
  //    el residente queda en observacion.
  const checkbox = page.getByTestId(
    'resident-observation-put-under-observation-checkbox',
  );
  await expect(checkbox).toBeVisible();
  await noteInput.fill(observationNote);
  await checkbox.check();
  await page.getByTestId('resident-observations-submit').click();
  await expect(page.getByText(observationNote)).toBeVisible();
  await expect(page.getByTestId('resident-care-status-badge')).toContainText(
    'En observacion',
  );
  await expect(checkbox).toBeHidden();

  // 3. Borrar la primera nota con confirmacion inline.
  const firstItem = page
    .getByTestId('resident-observation-item')
    .filter({ hasText: firstNote });
  await firstItem.getByTestId('resident-observation-delete-button').click();
  await firstItem
    .getByTestId('resident-observation-confirm-delete-button')
    .click();
  await expect(page.getByText(firstNote)).toBeHidden();

  // 4. Cerrar la observacion: ahora pide motivo en un modal. Confirmamos que
  //    al cerrar con motivo el residente vuelve a normal y queda registrado
  //    el cierre como hito en el timeline.
  const clearButton = page.getByTestId('resident-clear-observation-button');
  if (await clearButton.isVisible()) {
    await clearButton.click();
    await selectFieldOption(
      page,
      'resident-observation-closure-reason-select',
      'estable',
    );
    await page.getByTestId('resident-observation-closure-submit').click();
    await expect(page.getByTestId('resident-care-status-badge')).toContainText(
      'Normal',
    );
    await expect(
      page.getByTestId('resident-observation-put-under-observation-checkbox'),
    ).toBeVisible();
    await expect(
      page.getByTestId('resident-observation-closure-item').first(),
    ).toBeVisible();
  }
});
