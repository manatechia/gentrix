import { expect, test } from '@playwright/test';

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
    clinicalHistoryTitle: `Seguimiento automatizado ${scenarioId}`,
    clinicalHistoryDescription: `Evento agregado por Playwright para el escenario ${scenarioId}.`,
  };
}

test('create, edit, and append clinical history for a resident', async (
  { page },
  testInfo,
) => {
  test.slow();

  const scenario = createResidentScenario(testInfo.project.name);

  await page.goto('/residentes');
  await expect(page).toHaveURL(/\/residentes$/);

  await page.getByTestId('residents-add-button').click();

  await expect(page).toHaveURL(/\/residentes\/nuevo$/);
  await selectFieldOption(page, 'resident-document-type-select', 'dni');
  await page.getByTestId('resident-document-number-input').fill(
    scenario.documentNumber,
  );
  await page.getByTestId('resident-first-name-input').fill(scenario.firstName);
  await page.getByTestId('resident-last-name-input').fill(scenario.lastName);
  await page.getByTestId('resident-birth-date-input').fill('14/05/1941');
  await selectFieldOption(page, 'resident-sex-select', 'femenino');
  await page.getByTestId('resident-room-input').fill(scenario.room);
  await page.getByTestId('resident-submit-button').click();

  await expect(page).toHaveURL(/\/residentes\/[^/]+$/);
  await expect(
    page.getByRole('heading', { name: scenario.fullName }),
  ).toBeVisible();
  await expect(page.getByTestId('resident-edit-button')).toBeVisible();

  await page.getByTestId('resident-edit-button').click();

  await expect(page).toHaveURL(/\/residentes\/[^/]+\/editar$/);
  await page.getByTestId('resident-room-input').fill(scenario.updatedRoom);
  await page.getByTestId('resident-submit-button').click();

  await expect(page).toHaveURL(/\/residentes\/[^/]+$/);
  await expect(page.getByText(scenario.updatedRoom).first()).toBeVisible();

  await page
    .getByTestId('clinical-history-title-input')
    .fill(scenario.clinicalHistoryTitle);
  await page
    .getByTestId('clinical-history-description-input')
    .fill(scenario.clinicalHistoryDescription);
  await page.getByTestId('clinical-history-submit-button').click();

  await expect(page.getByText(scenario.clinicalHistoryTitle)).toBeVisible();
  await expect(
    page.getByText(scenario.clinicalHistoryDescription),
  ).toBeVisible();
});
