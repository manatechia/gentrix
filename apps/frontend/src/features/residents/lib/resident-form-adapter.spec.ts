import { describe, expect, it } from 'vitest';

import {
  createResidentSeed,
  toResidentDetail,
} from '@gentrix/domain-residents';

import {
  toResidentFormValues,
  toResidentUpdateInput,
} from './resident-form-adapter';

describe('resident-form-adapter', () => {
  it('keeps local ids for supporting records in edit form state', () => {
    const resident = createResidentSeed({
      attachments: [
        {
          id: 'resident-attachment-001',
          fileName: 'consentimiento.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 2048,
          dataUrl: 'data:application/pdf;base64,ZmFrZQ==',
          kind: 'pdf',
          uploadedAt: '2026-01-10T09:00:00.000Z',
        },
      ],
      familyContacts: [
        {
          id: 'resident-family-contact-001',
          fullName: 'Laura Perez',
          relationship: 'Hija',
          phone: '+54 11 5555-0101',
          email: 'laura.perez@familia.local',
          address: 'Paysandu 1402, CABA',
          notes: 'Coordina tramites y acompanamiento en consultas.',
        },
      ],
      medicalHistory: [
        {
          id: 'resident-history-001',
          recordedAt: '2025-11-12T00:00:00.000Z',
          title: 'Hipertension arterial',
          notes: 'Controlada con seguimiento ambulatorio.',
          createdAt: '2026-01-10T09:00:00.000Z',
          updatedAt: '2026-01-10T09:00:00.000Z',
          createdBy: 'setup-script',
          updatedBy: 'setup-script',
        },
      ],
    });

    const values = toResidentFormValues(toResidentDetail(resident));

    expect(values.medicalHistory[0]?.localId).toBe('resident-history-001');
    expect(values.attachments[0]?.localId).toBe('resident-attachment-001');
    expect(values.familyContacts[0]?.localId).toBe(
      'resident-family-contact-001',
    );
  });

  it('omits supporting snapshots from the base resident update payload', () => {
    const resident = createResidentSeed();
    const values = toResidentFormValues(toResidentDetail(resident));

    const updateInput = toResidentUpdateInput(values);

    expect(updateInput).not.toHaveProperty('medicalHistory');
    expect(updateInput).not.toHaveProperty('attachments');
    expect(updateInput).not.toHaveProperty('familyContacts');
    expect(updateInput).toMatchObject({
      firstName: resident.firstName,
      lastName: resident.lastName,
      email: resident.email,
      room: resident.room,
      careLevel: resident.careLevel,
    });
  });
});
