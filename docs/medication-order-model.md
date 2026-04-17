# Medication Order Model

## Status

- Accepted on 2026-03-27 to close `TASK-006` before implementing `TASK-007`.
- `MedicationExecution` entity is implemented in `apps/backend/prisma/schema.prisma`.

## Context

- `MedicationOrder` persists the current prescription for a resident:
  medication, dose, route, frequency, schedule times, prescriber, dates and status.
- `MedicationExecution` persists what happened to a concrete dose during a
  shift, with fields `medicationOrderId`, `residentId`, `organizationId`,
  `facilityId`, `result`, `occurredAt` and audit fields.

## Decision

- `MedicationOrder` models the current prescription in force for a resident.
- `scheduleTimes` represent planned execution times declared by the prescription.
  They are not proof that a dose was given.
- Administration, omission and rejection are modeled as `MedicationExecution`
  rows, never as fields, counters or ad hoc statuses inside `MedicationOrder`.

## Implementation Rule

- Create and update flows for medication only mutate prescription data:
  medication, dose, route, frequency, planned schedule, prescriber and
  prescription validity window.
- `MedicationExecution.result` captures `administered`, `omitted` or `rejected`
  (plus optional notes in future iterations).
- Resident timelines, alerts and handoff views that need execution data must
  read from `MedicationExecution` instead of overloading `MedicationOrder`.

## Out Of Scope For This Note

- UI flows to mark a dose as administered, omitted or rejected.
- Derived alerts based on execution data.
- Richer execution payload (e.g. reason codes, substitute staff).
