# Resident Event and Observation Model

## Status

- Accepted on 2026-03-26 to close `TASK-003`.
- Observation scope simplified during MVP iteration: operational notes
  (`ResidentObservationNote`) plus a `careStatus` field on the resident replace
  the earlier proposal of a full `ResidentObservation` case with entries.

## Context

- `ClinicalHistoryEvent` in `apps/backend/prisma/schema.prisma` persists the
  resident event timeline with `residentId`, `eventType`, `title`, `description`
  and `occurredAt` plus audit data.
- Seeds already use `admission-note` and `follow-up` event types.
- Operational follow-up still needs a second lane for short, unstructured notes
  written by staff during a shift (e.g. "did not eat lunch", "refused walk").

## Decision

- Keep `ClinicalHistoryEvent` as the persistence model for the resident
  timeline. Expose it through the stable `ResidentEvent` contract at
  `/api/residents/:residentId/events`.
- Observations are modeled as two pieces:
  - `Resident.careStatus` (field) tracks whether the resident is `normal` or
    `en_observacion` at any moment. Changes update `careStatusChangedAt` and
    `careStatusChangedBy`.
  - `ResidentObservationNote` (table) stores free-text operational notes with
    `residentId`, `note`, timestamps and soft-delete audit fields.

## Initial Event Types (ClinicalHistoryEvent)

- `medical-history`: legacy event used to project intake medical history. Stays
  readable from the resident timeline, but the event write API does not create
  it.
- `admission-note`: resident admission or intake note.
- `follow-up`: operational resident follow-up note.

## Minimum Event Payload

- `residentId`
- `eventType`
- `title`
- `description`
- `occurredAt`
- `actor` (derived from session through `createdBy`)

## Observation Rules (current implementation)

- `careStatus` is the authoritative operational signal. It flips to
  `en_observacion` when staff opens an observation and back to `normal` when
  they close it.
- `careStatusChangedAt` / `careStatusChangedBy` preserve only the last
  transition. Full history of transitions is a tech debt tracked in
  `docs/tech-debt/resident-care-status-audit.md`.
- `ResidentObservationNote` rows hold free-text notes tied to a resident; they
  are not grouped into cases.
- Handoff reads current `careStatus` plus recent `ResidentObservationNote`
  entries.

## Implementation Rule

- The API body only asks for `eventType`, `title`, `description` and
  `occurredAt`. Resident and actor context come from the route and session.
- Resident event listing reads every `ClinicalHistoryEvent` for the resident,
  ordered by `occurredAt` descending.
- Notes use a dedicated route family under the resident.

## Out Of Scope

- Separate incident modules.
- Medication administration execution (lives in `MedicationExecution`).
- Full case-based observation flow with internal entries and explicit
  resolution type (earlier proposal, not implemented).
- Replacing `Resident.medicalHistory` projection in this iteration.
