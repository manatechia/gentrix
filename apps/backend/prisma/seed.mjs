import { pathToFileURL } from 'node:url';

import { createPrismaClient } from './prisma-client.mjs';
const ids = {
  organizations: {
    gentrixDemo: '91000000-0000-4000-8000-000000000001',
  },
  facilities: {
    residenciaCentral: '91000000-0000-4000-8000-000000000002',
  },
  users: {
    sofiaQuiroga: '8f4e8eb5-f02f-49f3-8c1e-e8fba2264ec6',
    anaGomez: 'ba9c797a-3129-4d80-a2c6-16d846a84e56',
  },
  memberships: {
    sofiaQuirogaDemo: '91000000-0000-4000-8000-000000000003',
    anaGomezDemo: '91000000-0000-4000-8000-000000000004',
  },
  residents: {
    martaDiaz: 'f3bf3160-6a6e-492f-a632-e7485915a54d',
    elenaSuarez: '6d0c9153-5c16-4452-bdcb-c00b0d1cbde3',
    raulBenitez: '2259e44c-be39-4078-b4d0-70d07b06dc31',
  },
  staff: {
    anaGomez: 'd8c09d82-f72a-4af6-98cf-a3440ed61cd9',
    mauroPaz: 'dcd490ca-605b-4adb-8a4d-7d83972db84a',
    luciaMendez: '54b355fb-6515-4800-9443-0b0577f52350',
  },
  medicationCatalog: {
    paracetamol: '11111111-1111-4111-8111-111111111111',
    donepezil: '22222222-2222-4222-8222-222222222222',
    enoxaparina: '33333333-3333-4333-8333-333333333333',
    metformina: '44444444-4444-4444-8444-444444444444',
    levotiroxina: '55555555-5555-4555-8555-555555555555',
    furosemida: '66666666-6666-4666-8666-666666666666',
    quetiapina: '77777777-7777-4777-8777-777777777777',
    risperidona: '88888888-8888-4888-8888-888888888888',
  },
  medications: {
    paracetamolMarta: '4595044f-f7f8-4a0a-8a1e-a0a37662789a',
    donepezilElena: '32d18f29-f891-42ea-83ec-269b055f933a',
    enoxaparinaRaul: 'b5fbd5c4-db9c-4595-a359-c8ba4cca2ceb',
  },
  medicationExecutions: {
    paracetamolMartaMorning: '5dbf65d5-8f42-474d-b7f4-48a2f6d4f4b1',
    donepezilElenaNight: '61193cb0-e234-4adf-a5d0-91db43bf7ef4',
    enoxaparinaRaulMorning: 'fbad88d8-fbd2-48e1-a60c-044bf2394f6f',
  },
  clinicalHistory: {
    martaAdmission: 'c1ab5e2a-f96d-45a6-ad33-48f7d41ceb14',
    elenaNeurologyReview: '3e773a38-77f4-4c17-934b-4e4dbd5c287f',
  },
  schedules: {
    anaMondayMorning: 'ba2660f8-2d11-4305-8341-cc1e933265a8',
    mauroWednesdayAfternoon: 'f7f6b3c7-a18f-4f75-8ff7-c24635fce4d1',
    luciaFridayCoverage: '095e2046-1ae0-4e67-b469-bef643970bd9',
  },
  staffAssignments: {
    anaCentral: '91000000-0000-4000-8000-000000000011',
    mauroCentral: '91000000-0000-4000-8000-000000000012',
    luciaCentral: '91000000-0000-4000-8000-000000000013',
  },
};

export async function seedDatabase(prisma) {
  await prisma.authSession.deleteMany();
  await prisma.staffSchedule.deleteMany();
  await prisma.staffFacilityAssignment.deleteMany();
  await prisma.clinicalHistoryEvent.deleteMany();
  await prisma.medicationExecution.deleteMany();
  await prisma.medicationOrder.deleteMany();
  await prisma.medicationCatalogItem.deleteMany();
  await prisma.staffMember.deleteMany();
  await prisma.resident.deleteMany();
  await prisma.membershipFacilityScope.deleteMany();
  await prisma.organizationMembership.deleteMany();
  await prisma.facility.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.userAccount.deleteMany();

  await prisma.organization.create({
    data: {
      id: ids.organizations.gentrixDemo,
      slug: 'gentrix-demo',
      legalName: 'Gentrix Demo SA',
      displayName: 'Gentrix Demo',
      status: 'active',
      timezone: 'America/Argentina/Buenos_Aires',
      defaultLocale: 'es-AR',
      createdAt: new Date('2026-01-10T09:00:00.000Z'),
      createdBy: 'seed-script',
      updatedAt: new Date('2026-03-20T09:00:00.000Z'),
      updatedBy: 'seed-script',
    },
  });

  await prisma.facility.create({
    data: {
      id: ids.facilities.residenciaCentral,
      organizationId: ids.organizations.gentrixDemo,
      code: 'central',
      name: 'Residencia Central',
      status: 'active',
      address: {
        street: 'Av. Siempreviva 742',
        city: 'Buenos Aires',
        state: 'CABA',
        postalCode: 'C1405',
      },
      phone: '+54 11 5555-0000',
      email: 'central@gentrix.local',
      capacity: 24,
      createdAt: new Date('2026-01-10T09:00:00.000Z'),
      createdBy: 'seed-script',
      updatedAt: new Date('2026-03-20T09:00:00.000Z'),
      updatedBy: 'seed-script',
    },
  });

  await prisma.userAccount.create({
    data: {
      id: ids.users.sofiaQuiroga,
      fullName: 'Sofia Quiroga',
      email: 'admin@gentrix.local',
      password: 'gentrix123',
      role: 'admin',
      status: 'active',
      createdAt: new Date('2026-01-10T09:00:00.000Z'),
      createdBy: 'seed-script',
      updatedAt: new Date('2026-03-20T09:00:00.000Z'),
      updatedBy: 'seed-script',
    },
  });

  await prisma.userAccount.create({
    data: {
      id: ids.users.anaGomez,
      fullName: 'Ana Gomez',
      email: 'ana.gomez@gentrix.local',
      password: 'gentrix123',
      role: 'staff',
      status: 'active',
      createdAt: new Date('2026-01-10T09:00:00.000Z'),
      createdBy: 'seed-script',
      updatedAt: new Date('2026-03-20T09:00:00.000Z'),
      updatedBy: 'seed-script',
    },
  });

  await prisma.organizationMembership.create({
    data: {
      id: ids.memberships.sofiaQuirogaDemo,
      organizationId: ids.organizations.gentrixDemo,
      userId: ids.users.sofiaQuiroga,
      roleCode: 'admin',
      status: 'active',
      isDefault: true,
      joinedAt: new Date('2026-01-10T09:00:00.000Z'),
      createdAt: new Date('2026-01-10T09:00:00.000Z'),
      createdBy: 'seed-script',
      updatedAt: new Date('2026-03-20T09:00:00.000Z'),
      updatedBy: 'seed-script',
      facilityScopes: {
        create: {
          facilityId: ids.facilities.residenciaCentral,
          scopeType: 'assigned',
          createdAt: new Date('2026-01-10T09:00:00.000Z'),
          createdBy: 'seed-script',
          updatedAt: new Date('2026-03-20T09:00:00.000Z'),
          updatedBy: 'seed-script',
        },
      },
    },
  });

  await prisma.organizationMembership.create({
    data: {
      id: ids.memberships.anaGomezDemo,
      organizationId: ids.organizations.gentrixDemo,
      userId: ids.users.anaGomez,
      roleCode: 'staff',
      status: 'active',
      isDefault: true,
      joinedAt: new Date('2026-02-01T08:00:00.000Z'),
      createdAt: new Date('2026-02-01T08:00:00.000Z'),
      createdBy: 'seed-script',
      updatedAt: new Date('2026-03-20T09:00:00.000Z'),
      updatedBy: 'seed-script',
      facilityScopes: {
        create: {
          facilityId: ids.facilities.residenciaCentral,
          scopeType: 'assigned',
          createdAt: new Date('2026-02-01T08:00:00.000Z'),
          createdBy: 'seed-script',
          updatedAt: new Date('2026-03-20T09:00:00.000Z'),
          updatedBy: 'seed-script',
        },
      },
    },
  });

  await prisma.resident.createMany({
    data: [
      {
        id: ids.residents.martaDiaz,
        organizationId: ids.organizations.gentrixDemo,
        facilityId: ids.facilities.residenciaCentral,
        firstName: 'Marta',
        middleNames: '',
        lastName: 'Diaz',
        otherLastNames: '',
        documentType: 'dni',
        documentNumber: '30123456',
        documentIssuingCountry: 'Argentina',
        internalNumber: 'resident-internal-marta-diaz-30123456-a-101',
        procedureNumber: 'TRM-30123456',
        cuil: '27-30123456-3',
        birthDate: new Date('1942-05-19T00:00:00.000Z'),
        admissionDate: new Date('2024-11-03T12:00:00.000Z'),
        sex: 'femenino',
        maritalStatus: 'Viuda',
        nationality: 'Argentina',
        email: 'marta.diaz@sin-email.local',
        room: 'A-101',
        careLevel: 'assisted',
        status: 'active',
        attachments: [],
        insurance: {
          provider: 'PAMI',
          memberNumber: '4587-221904',
        },
        transfer: {
          provider: 'SAME',
          address: 'Av. Directorio 1800, CABA',
          phone: '+54 11 4321-7788',
        },
        psychiatry: {
          provider: 'Centro Amelia Salud Mental',
          careLocation: 'Consultorio externo',
          address: 'Av. Rivadavia 5200, CABA',
          phone: '+54 11 4567-8832',
        },
        clinicalProfile: {
          allergies: 'Sin alergias medicamentosas informadas.',
          emergencyCareLocation: 'Hospital Durand',
          clinicalRecordNumber: 'HC-77541',
          primaryDoctorName: 'Dra. Lucia Mendez',
          primaryDoctorOfficeAddress: 'Av. Medrano 1120, CABA',
          primaryDoctorOfficePhone: '+54 11 4988-1200',
          pathologies: 'Hipertension arterial y deterioro cognitivo leve.',
          surgeries: 'Apendicectomia y reemplazo total de rodilla derecha.',
          smokes: false,
          drinksAlcohol: false,
          currentWeightKg: 62.4,
        },
        belongings: {
          glasses: true,
          dentures: false,
          walker: false,
          orthopedicBed: false,
          notes: 'Ropa de cambio, album familiar y calzado ortopedico.',
        },
        familyContacts: [
          {
            id: 'resident-family-contact-marta-diaz',
            fullName: 'Laura Perez',
            relationship: 'Hija',
            phone: '+54 11 5555-0101',
            email: 'laura.perez@familia.local',
            address: 'Paysandu 1402, CABA',
            notes: 'Coordina tramites y acompanamiento en consultas.',
          },
        ],
        discharge: {},
        address: {
          street: 'Av. Siempreviva 742',
          city: 'Buenos Aires',
          state: 'CABA',
          postalCode: 'C1405',
          room: 'A-101',
        },
        emergencyContact: {
          fullName: 'Laura Perez',
          relationship: 'Hija',
          phone: '+54 11 5555-0101',
        },
        createdAt: new Date('2026-01-10T09:00:00.000Z'),
        createdBy: 'seed-script',
        updatedAt: new Date('2026-03-20T09:00:00.000Z'),
        updatedBy: 'seed-script',
      },
      {
        id: ids.residents.elenaSuarez,
        organizationId: ids.organizations.gentrixDemo,
        facilityId: ids.facilities.residenciaCentral,
        firstName: 'Elena',
        middleNames: '',
        lastName: 'Suarez',
        otherLastNames: '',
        documentType: 'dni',
        documentNumber: '28987456',
        documentIssuingCountry: 'Argentina',
        internalNumber: 'resident-internal-elena-suarez-28987456-b-204',
        procedureNumber: 'TRM-28987456',
        cuil: '27-28987456-1',
        birthDate: new Date('1943-06-12T00:00:00.000Z'),
        admissionDate: new Date('2024-12-01T12:00:00.000Z'),
        sex: 'femenino',
        maritalStatus: 'Casada',
        nationality: 'Argentina',
        email: 'elena.suarez@sin-email.local',
        room: 'B-204',
        careLevel: 'memory-care',
        status: 'active',
        attachments: [],
        insurance: {
          provider: 'PAMI',
          memberNumber: '5120-338761',
        },
        transfer: {
          provider: 'SAME',
          address: 'Av. Directorio 1800, CABA',
          phone: '+54 11 4321-7788',
        },
        psychiatry: {
          provider: 'Centro Amelia Salud Mental',
          careLocation: 'Consultorio externo',
          address: 'Av. Rivadavia 5200, CABA',
          phone: '+54 11 4567-8832',
        },
        clinicalProfile: {
          allergies: 'Sin alergias medicamentosas informadas.',
          emergencyCareLocation: 'Hospital Durand',
          clinicalRecordNumber: 'HC-77542',
          primaryDoctorName: 'Dra. Lucia Mendez',
          primaryDoctorOfficeAddress: 'Av. Medrano 1120, CABA',
          primaryDoctorOfficePhone: '+54 11 4988-1200',
          pathologies: 'Deterioro cognitivo con desorientacion vespertina.',
          surgeries: 'Colecistectomia laparoscopica.',
          smokes: false,
          drinksAlcohol: false,
          currentWeightKg: 58.1,
        },
        belongings: {
          glasses: true,
          dentures: true,
          walker: false,
          orthopedicBed: false,
          notes: 'Caja organizadora de medicacion y manta personal.',
        },
        familyContacts: [
          {
            id: 'resident-family-contact-elena-suarez',
            fullName: 'Claudia Suarez',
            relationship: 'Hija',
            phone: '+54 11 5555-0132',
            email: 'claudia.suarez@familia.local',
            address: 'Av. Montes de Oca 1100, CABA',
            notes: 'Referencia principal para tramites y acompanamiento.',
          },
        ],
        discharge: {},
        address: {
          street: 'Av. Siempreviva 742',
          city: 'Buenos Aires',
          state: 'CABA',
          postalCode: 'C1405',
          room: 'B-204',
        },
        emergencyContact: {
          fullName: 'Claudia Suarez',
          relationship: 'Hija',
          phone: '+54 11 5555-0132',
        },
        createdAt: new Date('2026-01-10T09:00:00.000Z'),
        createdBy: 'seed-script',
        updatedAt: new Date('2026-03-20T09:00:00.000Z'),
        updatedBy: 'seed-script',
      },
      {
        id: ids.residents.raulBenitez,
        organizationId: ids.organizations.gentrixDemo,
        facilityId: ids.facilities.residenciaCentral,
        firstName: 'Raul',
        middleNames: '',
        lastName: 'Benitez',
        otherLastNames: '',
        documentType: 'dni',
        documentNumber: '25440991',
        documentIssuingCountry: 'Argentina',
        internalNumber: 'resident-internal-raul-benitez-25440991-c-301',
        procedureNumber: 'TRM-25440991',
        cuil: '20-25440991-7',
        birthDate: new Date('1939-02-08T00:00:00.000Z'),
        admissionDate: new Date('2025-01-14T12:00:00.000Z'),
        sex: 'masculino',
        maritalStatus: 'Viudo',
        nationality: 'Argentina',
        email: 'raul.benitez@sin-email.local',
        room: 'C-301',
        careLevel: 'high-dependency',
        status: 'active',
        attachments: [],
        insurance: {
          provider: 'OSDE',
          memberNumber: '8842-110321',
        },
        transfer: {
          provider: 'SAME',
          address: 'Av. Directorio 1800, CABA',
          phone: '+54 11 4321-7788',
        },
        psychiatry: {
          provider: '',
          careLocation: '',
          address: '',
          phone: '',
        },
        clinicalProfile: {
          allergies: 'Alergia reportada a penicilina.',
          emergencyCareLocation: 'Hospital Italiano',
          clinicalRecordNumber: 'HC-77543',
          primaryDoctorName: 'Dr. Lucio Ferreyra',
          primaryDoctorOfficeAddress: 'Av. Rivadavia 3311, CABA',
          primaryDoctorOfficePhone: '+54 11 4822-9911',
          pathologies: 'Secuela motora post ACV y diabetes tipo 2.',
          surgeries: 'Bypass femoropopliteo.',
          smokes: false,
          drinksAlcohol: false,
          currentWeightKg: 74.8,
        },
        belongings: {
          glasses: false,
          dentures: true,
          walker: true,
          orthopedicBed: true,
          notes: 'Baston plegable y documentacion de cobertura medica.',
        },
        familyContacts: [
          {
            id: 'resident-family-contact-raul-benitez',
            fullName: 'Nadia Benitez',
            relationship: 'Hija',
            phone: '+54 11 5555-0140',
            email: 'nadia.benitez@familia.local',
            address: 'Constitucion 944, CABA',
            notes: 'Autoriza traslados y acompanamiento clinico.',
          },
        ],
        discharge: {},
        address: {
          street: 'Av. Siempreviva 742',
          city: 'Buenos Aires',
          state: 'CABA',
          postalCode: 'C1405',
          room: 'C-301',
        },
        emergencyContact: {
          fullName: 'Nadia Benitez',
          relationship: 'Hija',
          phone: '+54 11 5555-0140',
        },
        createdAt: new Date('2026-01-10T09:00:00.000Z'),
        createdBy: 'seed-script',
        updatedAt: new Date('2026-03-20T09:00:00.000Z'),
        updatedBy: 'seed-script',
      },
    ],
  });

  await prisma.staffMember.createMany({
    data: [
      {
        id: ids.staff.anaGomez,
        organizationId: ids.organizations.gentrixDemo,
        firstName: 'Ana',
        lastName: 'Gomez',
        role: 'nurse',
        ward: 'Unidad A',
        shift: 'morning',
        status: 'active',
        startDate: new Date('2025-02-01T08:00:00.000Z'),
        createdAt: new Date('2026-01-10T09:00:00.000Z'),
        createdBy: 'seed-script',
        updatedAt: new Date('2026-03-20T09:00:00.000Z'),
        updatedBy: 'seed-script',
      },
      {
        id: ids.staff.mauroPaz,
        organizationId: ids.organizations.gentrixDemo,
        firstName: 'Mauro',
        lastName: 'Paz',
        role: 'caregiver',
        ward: 'Unidad B',
        shift: 'afternoon',
        status: 'active',
        startDate: new Date('2025-02-01T08:00:00.000Z'),
        createdAt: new Date('2026-01-10T09:00:00.000Z'),
        createdBy: 'seed-script',
        updatedAt: new Date('2026-03-20T09:00:00.000Z'),
        updatedBy: 'seed-script',
      },
      {
        id: ids.staff.luciaMendez,
        organizationId: ids.organizations.gentrixDemo,
        firstName: 'Lucia',
        lastName: 'Mendez',
        role: 'doctor',
        ward: 'Consultorio',
        shift: 'morning',
        status: 'active',
        startDate: new Date('2025-02-01T08:00:00.000Z'),
        createdAt: new Date('2026-01-10T09:00:00.000Z'),
        createdBy: 'seed-script',
        updatedAt: new Date('2026-03-20T09:00:00.000Z'),
        updatedBy: 'seed-script',
      },
    ],
  });

  await prisma.staffFacilityAssignment.createMany({
    data: [
      {
        id: ids.staffAssignments.anaCentral,
        staffId: ids.staff.anaGomez,
        facilityId: ids.facilities.residenciaCentral,
        assignmentRole: 'nurse',
        ward: 'Unidad A',
        shift: 'morning',
        startDate: new Date('2025-02-01T08:00:00.000Z'),
        status: 'active',
        createdAt: new Date('2026-01-10T09:00:00.000Z'),
        createdBy: 'seed-script',
        updatedAt: new Date('2026-03-20T09:00:00.000Z'),
        updatedBy: 'seed-script',
      },
      {
        id: ids.staffAssignments.mauroCentral,
        staffId: ids.staff.mauroPaz,
        facilityId: ids.facilities.residenciaCentral,
        assignmentRole: 'caregiver',
        ward: 'Unidad B',
        shift: 'afternoon',
        startDate: new Date('2025-02-01T08:00:00.000Z'),
        status: 'active',
        createdAt: new Date('2026-01-10T09:00:00.000Z'),
        createdBy: 'seed-script',
        updatedAt: new Date('2026-03-20T09:00:00.000Z'),
        updatedBy: 'seed-script',
      },
      {
        id: ids.staffAssignments.luciaCentral,
        staffId: ids.staff.luciaMendez,
        facilityId: ids.facilities.residenciaCentral,
        assignmentRole: 'doctor',
        ward: 'Consultorio',
        shift: 'morning',
        startDate: new Date('2025-02-01T08:00:00.000Z'),
        status: 'active',
        createdAt: new Date('2026-01-10T09:00:00.000Z'),
        createdBy: 'seed-script',
        updatedAt: new Date('2026-03-20T09:00:00.000Z'),
        updatedBy: 'seed-script',
      },
    ],
  });

  await prisma.clinicalHistoryEvent.createMany({
    data: [
      {
        id: ids.clinicalHistory.martaAdmission,
        organizationId: ids.organizations.gentrixDemo,
        facilityId: ids.facilities.residenciaCentral,
        residentId: ids.residents.martaDiaz,
        eventType: 'admission-note',
        title: 'Ingreso y evaluacion inicial',
        description:
          'Se registra ingreso con movilidad asistida y plan base de observacion diaria.',
        occurredAt: new Date('2024-11-03T12:30:00.000Z'),
        createdAt: new Date('2024-11-03T12:30:00.000Z'),
        createdBy: 'seed-script',
        updatedAt: new Date('2024-11-03T12:30:00.000Z'),
        updatedBy: 'seed-script',
      },
      {
        id: ids.clinicalHistory.elenaNeurologyReview,
        organizationId: ids.organizations.gentrixDemo,
        facilityId: ids.facilities.residenciaCentral,
        residentId: ids.residents.elenaSuarez,
        eventType: 'follow-up',
        title: 'Seguimiento cognitivo',
        description:
          'Se registra seguimiento neurologico con refuerzo de rutina nocturna y acompanamiento.',
        occurredAt: new Date('2026-03-12T18:00:00.000Z'),
        createdAt: new Date('2026-03-12T18:00:00.000Z'),
        createdBy: 'seed-script',
        updatedAt: new Date('2026-03-12T18:00:00.000Z'),
        updatedBy: 'seed-script',
      },
    ],
  });

  await prisma.medicationCatalogItem.createMany({
    data: [
      {
        id: ids.medicationCatalog.paracetamol,
        medicationName: 'Paracetamol',
        activeIngredient: 'Paracetamol',
        status: 'active',
        createdAt: new Date('2026-01-10T09:00:00.000Z'),
        createdBy: 'seed-script',
        updatedAt: new Date('2026-03-20T09:00:00.000Z'),
        updatedBy: 'seed-script',
      },
      {
        id: ids.medicationCatalog.donepezil,
        medicationName: 'Donepezil',
        activeIngredient: 'Donepezil',
        status: 'active',
        createdAt: new Date('2026-01-10T09:00:00.000Z'),
        createdBy: 'seed-script',
        updatedAt: new Date('2026-03-20T09:00:00.000Z'),
        updatedBy: 'seed-script',
      },
      {
        id: ids.medicationCatalog.enoxaparina,
        medicationName: 'Enoxaparina',
        activeIngredient: 'Enoxaparina sodica',
        status: 'active',
        createdAt: new Date('2026-01-10T09:00:00.000Z'),
        createdBy: 'seed-script',
        updatedAt: new Date('2026-03-20T09:00:00.000Z'),
        updatedBy: 'seed-script',
      },
      {
        id: ids.medicationCatalog.metformina,
        medicationName: 'Metformina',
        activeIngredient: 'Metformina',
        status: 'active',
        createdAt: new Date('2026-01-10T09:00:00.000Z'),
        createdBy: 'seed-script',
        updatedAt: new Date('2026-03-20T09:00:00.000Z'),
        updatedBy: 'seed-script',
      },
      {
        id: ids.medicationCatalog.levotiroxina,
        medicationName: 'Levotiroxina',
        activeIngredient: 'Levotiroxina sodica',
        status: 'active',
        createdAt: new Date('2026-01-10T09:00:00.000Z'),
        createdBy: 'seed-script',
        updatedAt: new Date('2026-03-20T09:00:00.000Z'),
        updatedBy: 'seed-script',
      },
      {
        id: ids.medicationCatalog.furosemida,
        medicationName: 'Furosemida',
        activeIngredient: 'Furosemida',
        status: 'active',
        createdAt: new Date('2026-01-10T09:00:00.000Z'),
        createdBy: 'seed-script',
        updatedAt: new Date('2026-03-20T09:00:00.000Z'),
        updatedBy: 'seed-script',
      },
      {
        id: ids.medicationCatalog.quetiapina,
        medicationName: 'Quetiapina',
        activeIngredient: 'Quetiapina',
        status: 'active',
        createdAt: new Date('2026-01-10T09:00:00.000Z'),
        createdBy: 'seed-script',
        updatedAt: new Date('2026-03-20T09:00:00.000Z'),
        updatedBy: 'seed-script',
      },
      {
        id: ids.medicationCatalog.risperidona,
        medicationName: 'Risperidona',
        activeIngredient: 'Risperidona',
        status: 'active',
        createdAt: new Date('2026-01-10T09:00:00.000Z'),
        createdBy: 'seed-script',
        updatedAt: new Date('2026-03-20T09:00:00.000Z'),
        updatedBy: 'seed-script',
      },
    ],
  });

  await prisma.medicationOrder.createMany({
    data: [
      {
        id: ids.medications.paracetamolMarta,
        organizationId: ids.organizations.gentrixDemo,
        facilityId: ids.facilities.residenciaCentral,
        medicationCatalogId: ids.medicationCatalog.paracetamol,
        residentId: ids.residents.martaDiaz,
        medicationName: 'Paracetamol',
        dose: '500 mg',
        route: 'oral',
        frequency: 'twice-daily',
        scheduleTimes: ['09:00', '21:00'],
        prescribedBy: 'Dr. Lucio Ferreyra',
        startDate: new Date('2026-03-01T00:00:00.000Z'),
        status: 'active',
        createdAt: new Date('2026-01-10T09:00:00.000Z'),
        createdBy: 'seed-script',
        updatedAt: new Date('2026-03-20T09:00:00.000Z'),
        updatedBy: 'seed-script',
      },
      {
        id: ids.medications.donepezilElena,
        organizationId: ids.organizations.gentrixDemo,
        facilityId: ids.facilities.residenciaCentral,
        medicationCatalogId: ids.medicationCatalog.donepezil,
        residentId: ids.residents.elenaSuarez,
        medicationName: 'Donepezil',
        dose: '10 mg',
        route: 'oral',
        frequency: 'nightly',
        scheduleTimes: ['21:00'],
        prescribedBy: 'Dr. Lucio Ferreyra',
        startDate: new Date('2026-03-01T00:00:00.000Z'),
        status: 'active',
        createdAt: new Date('2026-01-10T09:00:00.000Z'),
        createdBy: 'seed-script',
        updatedAt: new Date('2026-03-20T09:00:00.000Z'),
        updatedBy: 'seed-script',
      },
      {
        id: ids.medications.enoxaparinaRaul,
        organizationId: ids.organizations.gentrixDemo,
        facilityId: ids.facilities.residenciaCentral,
        medicationCatalogId: ids.medicationCatalog.enoxaparina,
        residentId: ids.residents.raulBenitez,
        medicationName: 'Enoxaparina',
        dose: '40 mg',
        route: 'subcutaneous',
        frequency: 'daily',
        scheduleTimes: ['08:00'],
        prescribedBy: 'Dr. Lucio Ferreyra',
        startDate: new Date('2026-03-01T00:00:00.000Z'),
        status: 'active',
        createdAt: new Date('2026-01-10T09:00:00.000Z'),
        createdBy: 'seed-script',
        updatedAt: new Date('2026-03-20T09:00:00.000Z'),
        updatedBy: 'seed-script',
      },
    ],
  });

  await prisma.medicationExecution.createMany({
    data: [
      {
        id: ids.medicationExecutions.paracetamolMartaMorning,
        organizationId: ids.organizations.gentrixDemo,
        facilityId: ids.facilities.residenciaCentral,
        medicationOrderId: ids.medications.paracetamolMarta,
        residentId: ids.residents.martaDiaz,
        medicationName: 'Paracetamol',
        result: 'administered',
        occurredAt: new Date('2026-03-26T09:05:00.000Z'),
        createdAt: new Date('2026-03-26T09:05:00.000Z'),
        createdBy: 'ana.gomez@gentrix.local',
        updatedAt: new Date('2026-03-26T09:05:00.000Z'),
        updatedBy: 'ana.gomez@gentrix.local',
      },
      {
        id: ids.medicationExecutions.donepezilElenaNight,
        organizationId: ids.organizations.gentrixDemo,
        facilityId: ids.facilities.residenciaCentral,
        medicationOrderId: ids.medications.donepezilElena,
        residentId: ids.residents.elenaSuarez,
        medicationName: 'Donepezil',
        result: 'rejected',
        occurredAt: new Date('2026-03-26T21:10:00.000Z'),
        createdAt: new Date('2026-03-26T21:10:00.000Z'),
        createdBy: 'mauro.paz@gentrix.local',
        updatedAt: new Date('2026-03-26T21:10:00.000Z'),
        updatedBy: 'mauro.paz@gentrix.local',
      },
      {
        id: ids.medicationExecutions.enoxaparinaRaulMorning,
        organizationId: ids.organizations.gentrixDemo,
        facilityId: ids.facilities.residenciaCentral,
        medicationOrderId: ids.medications.enoxaparinaRaul,
        residentId: ids.residents.raulBenitez,
        medicationName: 'Enoxaparina',
        result: 'omitted',
        occurredAt: new Date('2026-03-26T08:15:00.000Z'),
        createdAt: new Date('2026-03-26T08:15:00.000Z'),
        createdBy: 'ana.gomez@gentrix.local',
        updatedAt: new Date('2026-03-26T08:15:00.000Z'),
        updatedBy: 'ana.gomez@gentrix.local',
      },
    ],
  });

  await prisma.staffSchedule.createMany({
    data: [
      {
        id: ids.schedules.anaMondayMorning,
        staffId: ids.staff.anaGomez,
        weekday: 1,
        startTime: '07:00',
        endTime: '15:00',
        createdAt: new Date('2026-01-10T09:00:00.000Z'),
        createdBy: 'seed-script',
        updatedAt: new Date('2026-03-20T09:00:00.000Z'),
        updatedBy: 'seed-script',
      },
      {
        id: ids.schedules.mauroWednesdayAfternoon,
        staffId: ids.staff.mauroPaz,
        weekday: 3,
        startTime: '14:00',
        endTime: '22:00',
        createdAt: new Date('2026-01-10T09:00:00.000Z'),
        createdBy: 'seed-script',
        updatedAt: new Date('2026-03-20T09:00:00.000Z'),
        updatedBy: 'seed-script',
      },
      {
        id: ids.schedules.luciaFridayCoverage,
        staffId: ids.staff.luciaMendez,
        weekday: 5,
        startTime: '08:00',
        endTime: '12:00',
        exceptionDate: new Date('2026-03-27T08:00:00.000Z'),
        coverageNote: 'Cobertura medica puntual por ausencia del turno manana.',
        createdAt: new Date('2026-01-10T09:00:00.000Z'),
        createdBy: 'seed-script',
        updatedAt: new Date('2026-03-20T09:00:00.000Z'),
        updatedBy: 'seed-script',
      },
    ],
  });
}

const isDirectExecution =
  typeof process.argv[1] === 'string' &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  const prisma = createPrismaClient();

  seedDatabase(prisma)
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (error) => {
      console.error(error);
      await prisma.$disconnect();
      process.exit(1);
    });
}
