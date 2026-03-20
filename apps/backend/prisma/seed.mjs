import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ids = {
  users: {
    sofiaQuiroga: '8f4e8eb5-f02f-49f3-8c1e-e8fba2264ec6',
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
  medications: {
    paracetamolMarta: '4595044f-f7f8-4a0a-8a1e-a0a37662789a',
    donepezilElena: '32d18f29-f891-42ea-83ec-269b055f933a',
    enoxaparinaRaul: 'b5fbd5c4-db9c-4595-a359-c8ba4cca2ceb',
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
};

async function main() {
  await prisma.session.deleteMany();
  await prisma.staffSchedule.deleteMany();
  await prisma.clinicalHistoryEvent.deleteMany();
  await prisma.medicationOrder.deleteMany();
  await prisma.staffMember.deleteMany();
  await prisma.resident.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: {
      id: ids.users.sofiaQuiroga,
      fullName: 'Sofia Quiroga',
      email: 'admin@gentrix.local',
      password: 'gentrix123',
      role: 'admin',
      createdAt: new Date('2026-01-10T09:00:00.000Z'),
      createdBy: 'seed-script',
      updatedAt: new Date('2026-03-20T09:00:00.000Z'),
      updatedBy: 'seed-script',
    },
  });

  await prisma.resident.createMany({
    data: [
      {
        id: ids.residents.martaDiaz,
        firstName: 'Marta',
        lastName: 'Diaz',
        birthDate: new Date('1942-05-19T00:00:00.000Z'),
        admissionDate: new Date('2024-11-03T12:00:00.000Z'),
        room: 'A-101',
        careLevel: 'assisted',
        status: 'active',
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
        firstName: 'Elena',
        lastName: 'Suarez',
        birthDate: new Date('1943-06-12T00:00:00.000Z'),
        admissionDate: new Date('2024-12-01T12:00:00.000Z'),
        room: 'B-204',
        careLevel: 'memory-care',
        status: 'active',
        address: {
          street: 'Av. Siempreviva 742',
          city: 'Buenos Aires',
          state: 'CABA',
          postalCode: 'C1405',
          room: 'B-204',
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
        id: ids.residents.raulBenitez,
        firstName: 'Raul',
        lastName: 'Benitez',
        birthDate: new Date('1939-02-08T00:00:00.000Z'),
        admissionDate: new Date('2025-01-14T12:00:00.000Z'),
        room: 'C-301',
        careLevel: 'high-dependency',
        status: 'active',
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

  await prisma.clinicalHistoryEvent.createMany({
    data: [
      {
        id: ids.clinicalHistory.martaAdmission,
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

  await prisma.medicationOrder.createMany({
    data: [
      {
        id: ids.medications.paracetamolMarta,
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

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
