# Resident Event Model

## Status

- Accepted on 2026-03-26 to close `TASK-003` before implementing `TASK-004`.

## Context

- The current persistence model already has `ClinicalHistoryEvent` with
  `residentId`, `eventType`, `title`, `description`, `occurredAt` and audit data.
- Seeds already use `admission-note` and `follow-up`.
- Resident intake still projects `medical-history` through
  `Resident.medicalHistory`, but the application needs a stable event contract and
  dedicated API before opening new resident timeline features.

## Decision

- Keep `ClinicalHistoryEvent` as the persistence model for now.
- Introduce `ResidentEvent` as the stable application and API contract over that
  table.
- Use the route family `/api/residents/:residentId/events` as the minimal timeline
  API surface.

## Initial Event Types

- `medical-history`: legacy event already used to project intake medical history.
  It stays readable from the resident timeline, but this first write API does not
  create it.
- `admission-note`: resident admission or intake note.
- `follow-up`: operational resident follow-up note.

## Minimum Common Payload

- `residentId`
- `eventType`
- `title`
- `description`
- `occurredAt`
- `actor`

## Implementation Rule

- The authenticated user provides `actor` through `createdBy` and `updatedBy`.
- The API body only asks for `eventType`, `title`, `description` and
  `occurredAt`; resident and actor context come from the route and session.
- Resident event listing reads every `ClinicalHistoryEvent` for the resident,
  ordered by `occurredAt` descending.

## Out Of Scope

- Separate incident modules.
- Handoff-specific entities.
- Medication administration execution.
- Replacing `Resident.medicalHistory` projection in this iteration.
