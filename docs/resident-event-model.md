# Resident Event and Observation Model

## Status

- Accepted on 2026-03-26 to close `TASK-003` before implementing `TASK-004`.
- Extended on 2026-04-14 while closing `MVP-RES-16`.

## Context

- The current persistence model already has `ClinicalHistoryEvent` with
  `residentId`, `eventType`, `title`, `description`, `occurredAt` and audit data.
- Seeds already use `admission-note` and `follow-up`.
- Resident intake still projects `medical-history` through
  `Resident.medicalHistory`, but the application needs a stable event contract and
  dedicated API before opening new resident timeline features.
- Operational follow-up now needs a second lane:
  - append-only clinical timeline for events
  - open observation flow for cases that stay active across turns and require
    follow-up or closure

## Decision

- Keep `ClinicalHistoryEvent` as the persistence model for now.
- Introduce `ResidentEvent` as the stable application and API contract over that
  table.
- Use the route family `/api/residents/:residentId/events` as the minimal timeline
  API surface.
- Keep observations as a dedicated model:
  - `ResidentObservation` stores the open/resolved case
  - `ResidentObservationEntry` stores internal follow-ups, actions and the final
    resolution entry
- Use the route family `/api/residents/:residentId/observations` for active or
  resolved cases, plus nested routes for entry creation and resolution.

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

## Observation Flow

- `ResidentObservation`
  - `status`: `active` or `resolved`
  - `severity`: `warning` or `critical`
  - `title`
  - `description`
  - `openedAt`
  - `openedBy`
  - optional closure fields: `resolvedAt`, `resolvedBy`, `resolutionType`,
    `resolutionSummary`
- `ResidentObservationEntry`
  - `entryType`: `follow-up`, `action` or `resolution`
  - `title`
  - `description`
  - `occurredAt`
  - `actor`

## Observation Rules

- Opening an observation puts the resident in an operational observation state
  until explicit closure.
- New movement inside the same case is recorded as:
  - `follow-up` when we describe evolution or monitoring
  - `action` when someone actually does something
  - `resolution` only when the case is closed
- Resolving an observation always:
  - marks the case as `resolved`
  - stores `resolutionType` and `resolutionSummary`
  - appends a `resolution` entry so the internal sequence stays readable
- Handoff reads only active observations.

## Implementation Rule

- The authenticated user provides `actor` through `createdBy` and `updatedBy`.
- The API body only asks for `eventType`, `title`, `description` and
  `occurredAt`; resident and actor context come from the route and session.
- Resident event listing reads every `ClinicalHistoryEvent` for the resident,
  ordered by `occurredAt` descending.

## Out Of Scope

- Separate incident modules.
- Medication administration execution.
- Replacing `Resident.medicalHistory` projection in this iteration.
