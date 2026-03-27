import { expect, test } from '@playwright/test';

import {
  fetchStaff,
  fetchStaffSchedules,
  loginWithDemoCredentials,
} from '../playwright/api';
import {
  createFutureDate,
  createNumericScenarioId,
} from '../playwright/paths';
import { selectFieldOption } from '../playwright/ui';

test('create and edit a staff coverage schedule', async (
  { page, request },
  testInfo,
) => {
  test.slow();

  const authSession = await loginWithDemoCredentials(request);
  const staff = await fetchStaff(request, authSession.token);
  const targetStaff = staff[0];
  const scenarioId = createNumericScenarioId(testInfo.project.name);
  const coverageNote = `Cobertura Playwright ${scenarioId}`;
  const updatedCoverageNote = `${coverageNote} actualizada`;

  expect(targetStaff).toBeDefined();

  if (!targetStaff) {
    throw new Error('No hay personal disponible para el smoke test.');
  }

  await page.goto('/personal');

  await expect(page).toHaveURL(/\/personal$/);
  await page.getByTestId(`staff-member-${targetStaff.id}`).click();

  await expect(
    page.getByRole('heading', { name: targetStaff.name }),
  ).toBeVisible();
  await selectFieldOption(page, 'staff-schedule-weekday-select', '2');
  await page.getByTestId('staff-schedule-start-time-input').fill('09:00');
  await page.getByTestId('staff-schedule-end-time-input').fill('17:00');
  await page
    .getByTestId('staff-schedule-date-input')
    .fill(createFutureDate(8));
  await page.getByTestId('staff-schedule-note-input').fill(coverageNote);
  await page.getByTestId('staff-schedule-submit-button').click();

  await expect(page.getByText('Horario agregado correctamente.')).toBeVisible();

  const createdSchedule = (
    await fetchStaffSchedules(request, authSession.token, targetStaff.id)
  ).find((schedule) => schedule.coverageNote === coverageNote);

  expect(createdSchedule).toBeDefined();

  if (!createdSchedule) {
    throw new Error('No pude encontrar el horario creado por el smoke test.');
  }

  await page.getByTestId(`staff-schedule-edit-${createdSchedule.id}`).click();
  await page.getByTestId('staff-schedule-note-input').fill(updatedCoverageNote);
  await page.getByTestId('staff-schedule-end-time-input').fill('18:00');
  await page.getByTestId('staff-schedule-submit-button').click();

  await expect(
    page.getByText('Horario actualizado correctamente.'),
  ).toBeVisible();

  const updatedSchedule = (
    await fetchStaffSchedules(request, authSession.token, targetStaff.id)
  ).find((schedule) => schedule.id === createdSchedule.id);

  expect(updatedSchedule?.coverageNote).toBe(updatedCoverageNote);
  expect(updatedSchedule?.endTime).toBe('18:00');
});
