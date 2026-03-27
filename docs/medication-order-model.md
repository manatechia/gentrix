# Medication Order Model

## Status

- Accepted on 2026-03-27 to close `TASK-006` before implementing `TASK-007`.

## Context

- The current medication module already persists `MedicationOrder` with
  resident, dose, route, frequency, schedule times, prescriber, dates and status.
- The system still does not persist what happened to a concrete dose during a
  shift.
- Future medication work needs to support three concrete outcomes:
  administration, omission and rejection.

## Decision

- `MedicationOrder` remains the model of the current prescription in force for a
  resident.
- `scheduleTimes` represent planned execution times declared by the prescription.
  They are not proof that a dose was given.
- Administration, omission and rejection must not be encoded as fields, counters
  or ad hoc statuses inside `MedicationOrder`.
- The future execution layer will use a dedicated `MedicationExecution` entity
  linked to `MedicationOrder` and the resident.

## Implementation Rule

- Create and update flows for medication only mutate prescription data:
  medication, dose, route, frequency, planned schedule, prescriber and
  prescription validity window.
- Medication execution will be modeled later with its own contract including at
  least `medicationOrderId`, `occurredAt`, `actor`, `result` and optional
  notes.
- Resident timelines, alerts and handoff views may project medication execution
  data, but they must read it from `MedicationExecution` instead of overloading
  `MedicationOrder`.

## Out Of Scope

- Persisting `MedicationExecution`.
- UI to mark a dose as administered, omitted or rejected.
- Derived alerts based on real medication execution.
