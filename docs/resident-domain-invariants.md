# Resident Domain Invariants

## Purpose

This note closes `TASK-000` from `tmp/resident-product-audit/docs/implementation-tasks.md`.
It defines the minimum invariant we will use when evolving the resident model, its base
profile, its current state and its event timeline.

## Core Rule

- Stable data answers who the resident is and which base profile identifies that person.
- Current state answers how the resident is today from an operational point of view.
- Event answers what happened to the resident at a specific time.
- Derived data answers what the system infers from stable data, current state and events.
- These groups must not be mixed again inside the base resident write contract.

## Minimum Classification

| Group | Definition | Current project examples | Write rule |
| --- | --- | --- | --- |
| Stable data | Identity and base profile that should not depend on a shift or a recent action. | `firstName`, `lastName`, `birthDate`, `documentNumber`, `documentType`, `documentIssuingCountry` | Belongs to the resident base contract. |
| Current state | Operational snapshot that can change without redefining identity. | `room`, `status`, `careLevel`, active `MedicationOrder` set | Belongs to the resident current-state contract or dedicated operational modules. |
| Event | Something that happened at a point in time and must keep chronology. | `admission-note`, `follow-up`, `medical-history`, future medication administration | Must be written as an event, never as resident base profile. |
| Derived data | Read model or signal calculated from other sources. | derived alert, upcoming doses, handoff summary | Must be rebuilt from source data, never treated as primary persistence. |

## What This Means In The Current Code

- `ClinicalHistoryEvent` is already the persistence model for resident chronology in
  `apps/backend/prisma/schema.prisma`.
- `Resident.medicalHistory` is a projection of `ClinicalHistoryEvent` filtered by
  `medical-history` in
  `apps/backend/src/modules/residents/infrastructure/persistence/prisma/prisma-resident.repository.ts`.
- `MedicationOrder` already lives outside `Resident` and should be treated as current
  resident state, not as part of the resident identity profile.
- `dashboardAlerts`, upcoming doses and handoff summaries are derived data. They must stay
  out of `ResidentCreateInput`, `ResidentUpdateInput` and any future resident event payload.

## Explicit Rule For Contracts

- The resident base write contract can contain stable data.
- The resident operational contract can contain current state such as `room` or `careLevel`.
- Resident events must use their own contract and timeline API.
- Derived data must only appear in read models.

## Current Gap We Are Keeping Visible

- `ResidentUpdateInput extends ResidentCreateInput` still mixes stable data, current state
  and intake/supporting records such as `medicalHistory`, `attachments` and `familyContacts`.
- This is a known transitional shape and is the direct follow-up for `TASK-001` and
  `TASK-002`.
- Until that refactor lands, no new event type and no derived field should be added to the
  resident create/update contract.
