import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';
import { resolve } from 'path';

// ⚠️  DEMO SEED ONLY — All users have password "123456"
// For production deployment, rotate all passwords before going live

config({ path: resolve(__dirname, '../.env') });

function createPrismaClient() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  if (tursoUrl) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaLibSQL } = require('@prisma/adapter-libsql');
    return new PrismaClient({
      adapter: new PrismaLibSQL({
        url: tursoUrl,
        authToken: process.env.TURSO_AUTH_TOKEN!,
      }),
    });
  }
  return new PrismaClient();
}

const prisma = createPrismaClient();

async function main() {
  console.log('🧹 Limpiando base de datos...');
  await prisma.collection.deleteMany();
  await prisma.routeStop.deleteMany();
  await prisma.route.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.collectionSchedule.deleteMany();
  await prisma.pickupPoint.deleteMany();
  await prisma.userZone.deleteMany();
  await prisma.wasteType.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Base de datos limpia\n');

  const passwordHash = await bcrypt.hash('123456', 10);
  const now = new Date();
  const day = (n: number) =>
    new Date(Date.now() - n * 24 * 60 * 60 * 1000);
  const hour = (n: number) =>
    new Date(Date.now() - n * 60 * 60 * 1000);

  // ═══════════════════════════════════════════════════════════════════════════
  // USUARIOS
  // ═══════════════════════════════════════════════════════════════════════════

  const usersData = [
    {
      email: 'admin@terracivic.pe',
      fullName: 'Hector Mamani',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
    {
      email: 'carlos.conductor@terracivic.pe',
      fullName: 'Carlos Quispe',
      role: 'DRIVER',
      status: 'ACTIVE',
    },
    {
      email: 'maria.conductor@terracivic.pe',
      fullName: 'Maria Huaman',
      role: 'DRIVER',
      status: 'ACTIVE',
    },
    {
      email: 'juan@terracivic.pe',
      fullName: 'Juan Quispe',
      role: 'CITIZEN',
      status: 'ACTIVE',
    },
    {
      email: 'rosa@terracivic.pe',
      fullName: 'Rosa Mamani',
      role: 'CITIZEN',
      status: 'ACTIVE',
    },
    {
      email: 'pedro@terracivic.pe',
      fullName: 'Pedro Ccahuana',
      role: 'CITIZEN',
      status: 'ACTIVE',
    },
    {
      email: 'lucia@terracivic.pe',
      fullName: 'Lucia Huilca',
      role: 'CITIZEN',
      status: 'ACTIVE',
    },
    {
      email: 'miguel@terracivic.pe',
      fullName: 'Miguel Sotomayor',
      role: 'CITIZEN',
      status: 'ACTIVE',
    },
    {
      email: 'inactivo@terracivic.pe',
      fullName: 'Usuario Inactivo',
      role: 'CITIZEN',
      status: 'INACTIVE',
    },
  ];

  const users: Record<string, { id: string; email: string }> = {};
  for (const u of usersData) {
    const created = await prisma.user.create({
      data: { ...u, passwordHash, createdAt: now },
    });
    users[u.email] = { id: created.id, email: u.email };
    console.log(`✅ Usuario ${u.email} (${u.role})`);
  }

  const admin = users['admin@terracivic.pe'];
  const driver1 = users['carlos.conductor@terracivic.pe'];
  const driver2 = users['maria.conductor@terracivic.pe'];
  const citizens = [
    users['juan@terracivic.pe'],
    users['rosa@terracivic.pe'],
    users['pedro@terracivic.pe'],
    users['lucia@terracivic.pe'],
    users['miguel@terracivic.pe'],
  ];

  // ═══════════════════════════════════════════════════════════════════════════
  // TIPOS DE RESIDUO
  // ═══════════════════════════════════════════════════════════════════════════

  const wasteTypesData = [
    {
      name: 'Orgánico',
      category: 'ORGANIC',
      description:
        'Restos de comida, cáscaras, residuos de jardín y materia biodegradable',
    },
    {
      name: 'Reciclable',
      category: 'RECYCLABLE',
      description: 'Papel, cartón, plástico, vidrio, metales y tetra pak',
    },
    {
      name: 'No Reciclable',
      category: 'NON_RECYCLABLE',
      description:
        'Residuos de baño, barrido, pañales y desechos generales no aprovechables',
    },
    {
      name: 'Peligroso',
      category: 'HAZARDOUS',
      description:
        'Pilas, baterías, aceites quemados, medicamentos vencidos y residuos electrónicos',
    },
  ];

  const wasteTypes: Record<string, string> = {};
  for (const wt of wasteTypesData) {
    const created = await prisma.wasteType.create({
      data: { ...wt, createdAt: now },
    });
    wasteTypes[wt.category] = created.id;
    console.log(`✅ WasteType ${wt.name}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ZONAS (distritos de Cusco)
  // ═══════════════════════════════════════════════════════════════════════════

  const zonesData = [
    {
      name: 'Centro Histórico',
      description: 'Zona monumental, turística y comercial del Cusco',
    },
    {
      name: 'San Blas',
      description: 'Barrio artesanal, bohemio y cultural con calles empedradas',
    },
    {
      name: 'San Sebastián',
      description: 'Distrito residencial y comercial en crecimiento',
    },
    {
      name: 'Santiago',
      description: 'Distrito popular con zona industrial y mercados',
    },
    {
      name: 'Wanchaq',
      description: 'Distrito moderno, comercial y financiero',
    },
  ];

  const zoneIds: Record<string, string> = {};
  for (const z of zonesData) {
    const created = await prisma.zone.create({
      data: { ...z, createdAt: now },
    });
    zoneIds[z.name] = created.id;
    console.log(`✅ Zona ${z.name}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ASIGNACIONES USUARIO-ZONA
  // ═══════════════════════════════════════════════════════════════════════════

  const allZoneIds = Object.values(zoneIds);
  // Admin: todas las zonas
  for (const zoneId of allZoneIds) {
    await prisma.userZone.create({
      data: { userId: admin.id, zoneId, assignedAt: now },
    });
  }
  // Driver 1: Centro Histórico + San Blas
  for (const name of ['Centro Histórico', 'San Blas']) {
    await prisma.userZone.create({
      data: { userId: driver1.id, zoneId: zoneIds[name], assignedAt: now },
    });
  }
  // Driver 2: San Sebastián + Santiago + Wanchaq
  for (const name of ['San Sebastián', 'Santiago', 'Wanchaq']) {
    await prisma.userZone.create({
      data: { userId: driver2.id, zoneId: zoneIds[name], assignedAt: now },
    });
  }
  // Ciudadanos: cada uno en 1-2 zonas
  const citizenZoneAssignments = [
    { citizenIdx: 0, zoneNames: ['Centro Histórico', 'San Blas'] },
    { citizenIdx: 1, zoneNames: ['San Blas', 'Wanchaq'] },
    { citizenIdx: 2, zoneNames: ['San Sebastián'] },
    { citizenIdx: 3, zoneNames: ['Santiago', 'Centro Histórico'] },
    { citizenIdx: 4, zoneNames: ['Wanchaq', 'San Sebastián'] },
  ];
  for (const assign of citizenZoneAssignments) {
    for (const zoneName of assign.zoneNames) {
      await prisma.userZone.create({
        data: {
          userId: citizens[assign.citizenIdx].id,
          zoneId: zoneIds[zoneName],
          assignedAt: now,
        },
      });
    }
  }
  console.log(
    `✅ Asignaciones usuario-zona (${allZoneIds.length * 2 + 8} registros)`,
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // PUNTOS DE RECOJO
  // ═══════════════════════════════════════════════════════════════════════════

  const pickupPointsData = [
    {
      zoneName: 'Centro Histórico',
      name: 'Plaza de Armas - Principal',
      address: 'Plaza de Armas s/n',
      lat: -13.5167,
      lng: -71.9781,
    },
    {
      zoneName: 'Centro Histórico',
      name: 'Calle Triunfo',
      address: 'Calle Triunfo 124',
      lat: -13.5172,
      lng: -71.9788,
    },
    {
      zoneName: 'Centro Histórico',
      name: 'Av. El Sol',
      address: 'Av. El Sol 350',
      lat: -13.5185,
      lng: -71.9769,
    },
    {
      zoneName: 'San Blas',
      name: 'Plaza San Blas',
      address: 'Plaza San Blas s/n',
      lat: -13.5156,
      lng: -71.9756,
    },
    {
      zoneName: 'San Blas',
      name: 'Calle Suecia',
      address: 'Calle Suecia 340',
      lat: -13.5148,
      lng: -71.9744,
    },
    {
      zoneName: 'San Blas',
      name: 'Mirador San Blas',
      address: 'Calle Tandapata 120',
      lat: -13.5139,
      lng: -71.9739,
    },
    {
      zoneName: 'San Sebastián',
      name: 'Av. de la Cultura',
      address: 'Av. de la Cultura 1500',
      lat: -13.5278,
      lng: -71.9567,
    },
    {
      zoneName: 'San Sebastián',
      name: 'Mercado San Sebastián',
      address: 'Av. Túpac Amaru 200',
      lat: -13.5312,
      lng: -71.9501,
    },
    {
      zoneName: 'Santiago',
      name: 'Parque Santiago',
      address: 'Av. Santiago s/n',
      lat: -13.5345,
      lng: -71.989,
    },
    {
      zoneName: 'Santiago',
      name: 'Mercado Santiago',
      address: 'Av. Juan Velasco 500',
      lat: -13.5378,
      lng: -71.9912,
    },
    {
      zoneName: 'Santiago',
      name: 'Av. Grau',
      address: 'Av. Grau 400',
      lat: -13.536,
      lng: -71.9875,
    },
    {
      zoneName: 'Wanchaq',
      name: 'Parque Wanchaq',
      address: 'Av. Velasco Astete 300',
      lat: -13.5222,
      lng: -71.96,
    },
    {
      zoneName: 'Wanchaq',
      name: 'Real Plaza',
      address: 'Av. de la Cultura 700',
      lat: -13.5205,
      lng: -71.9589,
    },
  ];

  const pickupPointIds: string[] = [];
  for (const pp of pickupPointsData) {
    const created = await prisma.pickupPoint.create({
      data: {
        zoneId: zoneIds[pp.zoneName],
        name: pp.name,
        address: pp.address,
        latitude: pp.lat,
        longitude: pp.lng,
      },
    });
    pickupPointIds.push(created.id);
    console.log(`✅ PickupPoint ${pp.name}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HORARIOS DE RECOLECCIÓN
  // ═══════════════════════════════════════════════════════════════════════════

  const schedulesData = [
    // Centro Histórico — 3 días
    {
      zoneName: 'Centro Histórico',
      day: 'MONDAY',
      start: '06:00',
      end: '10:00',
      wasteCategory: 'ORGANIC',
    },
    {
      zoneName: 'Centro Histórico',
      day: 'WEDNESDAY',
      start: '06:00',
      end: '10:00',
      wasteCategory: 'RECYCLABLE',
    },
    {
      zoneName: 'Centro Histórico',
      day: 'FRIDAY',
      start: '06:00',
      end: '10:00',
      wasteCategory: 'NON_RECYCLABLE',
    },
    // San Blas — 3 días
    {
      zoneName: 'San Blas',
      day: 'TUESDAY',
      start: '07:00',
      end: '11:00',
      wasteCategory: 'ORGANIC',
    },
    {
      zoneName: 'San Blas',
      day: 'THURSDAY',
      start: '07:00',
      end: '11:00',
      wasteCategory: 'RECYCLABLE',
    },
    {
      zoneName: 'San Blas',
      day: 'SATURDAY',
      start: '08:00',
      end: '12:00',
      wasteCategory: 'NON_RECYCLABLE',
    },
    // San Sebastián — 3 días
    {
      zoneName: 'San Sebastián',
      day: 'MONDAY',
      start: '08:00',
      end: '12:00',
      wasteCategory: 'ORGANIC',
    },
    {
      zoneName: 'San Sebastián',
      day: 'WEDNESDAY',
      start: '08:00',
      end: '12:00',
      wasteCategory: 'RECYCLABLE',
    },
    {
      zoneName: 'San Sebastián',
      day: 'FRIDAY',
      start: '08:00',
      end: '12:00',
      wasteCategory: 'NON_RECYCLABLE',
    },
    // Santiago — 2 días
    {
      zoneName: 'Santiago',
      day: 'TUESDAY',
      start: '09:00',
      end: '13:00',
      wasteCategory: 'ORGANIC',
    },
    {
      zoneName: 'Santiago',
      day: 'THURSDAY',
      start: '09:00',
      end: '13:00',
      wasteCategory: 'RECYCLABLE',
    },
    // Wanchaq — 3 días
    {
      zoneName: 'Wanchaq',
      day: 'MONDAY',
      start: '07:00',
      end: '11:00',
      wasteCategory: 'ORGANIC',
    },
    {
      zoneName: 'Wanchaq',
      day: 'WEDNESDAY',
      start: '07:00',
      end: '11:00',
      wasteCategory: 'RECYCLABLE',
    },
    {
      zoneName: 'Wanchaq',
      day: 'FRIDAY',
      start: '07:00',
      end: '11:00',
      wasteCategory: 'NON_RECYCLABLE',
    },
    // Extra: orgánico sábados en todas las zonas
    {
      zoneName: 'Centro Histórico',
      day: 'SATURDAY',
      start: '07:00',
      end: '11:00',
      wasteCategory: 'ORGANIC',
    },
    {
      zoneName: 'San Sebastián',
      day: 'SATURDAY',
      start: '09:00',
      end: '13:00',
      wasteCategory: 'ORGANIC',
    },
    {
      zoneName: 'Wanchaq',
      day: 'SATURDAY',
      start: '08:00',
      end: '12:00',
      wasteCategory: 'ORGANIC',
    },
  ];

  for (const s of schedulesData) {
    const wasteTypeId = wasteTypes[s.wasteCategory];
    if (!wasteTypeId) continue;
    await prisma.collectionSchedule.create({
      data: {
        zoneId: zoneIds[s.zoneName],
        wasteTypeId,
        dayOfWeek: s.day,
        startTime: s.start,
        endTime: s.end,
      },
    });
  }
  console.log(`✅ Horarios (${schedulesData.length} registros)`);

  // ═══════════════════════════════════════════════════════════════════════════
  // INCIDENCIAS
  // ═══════════════════════════════════════════════════════════════════════════

  const incidentsData: {
    zoneName: string;
    type: string;
    description: string;
    status: string;
    citizenIdx: number;
    daysAgo: number;
  }[] = [
    // Abiertas (OPEN)
    {
      zoneName: 'Centro Histórico',
      type: 'CONTAINER_DAMAGED',
      description:
        'Contenedor de la Plaza de Armas tiene la tapa rota y desprende mal olor. Urge reemplazo.',
      status: 'OPEN',
      citizenIdx: 0,
      daysAgo: 1,
    },
    {
      zoneName: 'San Blas',
      type: 'ILLEGAL_DUMPING',
      description:
        'Escombros y restos de construcción abandonados en la esquina de Calle Suecia con Carmen Alto desde hace 3 días.',
      status: 'OPEN',
      citizenIdx: 1,
      daysAgo: 2,
    },
    {
      zoneName: 'Wanchaq',
      type: 'MISSED_COLLECTION',
      description:
        'No pasó el camión de reciclables el miércoles en Av. Velasco Astete. Los vecinos acumulan bolsas en la vereda.',
      status: 'OPEN',
      citizenIdx: 4,
      daysAgo: 1,
    },
    {
      zoneName: 'San Sebastián',
      type: 'OTHER',
      description:
        'Perros callejeros rompen las bolsas cada noche en el mercado. Se necesitan contenedores con tapa segura.',
      status: 'OPEN',
      citizenIdx: 2,
      daysAgo: 3,
    },
    {
      zoneName: 'Santiago',
      type: 'CONTAINER_DAMAGED',
      description:
        'Contenedor de orgánicos del parque tiene la base rota y derrama líquidos en toda la vereda.',
      status: 'OPEN',
      citizenIdx: 3,
      daysAgo: 1,
    },
    {
      zoneName: 'Centro Histórico',
      type: 'ILLEGAL_DUMPING',
      description:
        'Colchones y muebles viejos abandonados en la puerta del colegio San Francisco de Asís.',
      status: 'OPEN',
      citizenIdx: 0,
      daysAgo: 0,
    },

    // En progreso (IN_PROGRESS)
    {
      zoneName: 'San Blas',
      type: 'CONTAINER_DAMAGED',
      description:
        'Contenedor de reciclables de la Plaza San Blas tiene la puerta trabada y no se puede usar.',
      status: 'IN_PROGRESS',
      citizenIdx: 1,
      daysAgo: 5,
    },
    {
      zoneName: 'Wanchaq',
      type: 'ILLEGAL_DUMPING',
      description:
        'Punto crítico de arrojo de residuos en el parque bicentenario. Se ha programado limpieza.',
      status: 'IN_PROGRESS',
      citizenIdx: 4,
      daysAgo: 4,
    },
    {
      zoneName: 'San Sebastián',
      type: 'MISSED_COLLECTION',
      description:
        'Segunda semana consecutiva que no recogen los residuos reciclables en la Av. de la Cultura.',
      status: 'IN_PROGRESS',
      citizenIdx: 2,
      daysAgo: 6,
    },

    // Resueltas (RESOLVED)
    {
      zoneName: 'Santiago',
      type: 'CONTAINER_DAMAGED',
      description:
        'Contenedor de basura del mercado Santiago fue reemplazado por uno nuevo.',
      status: 'RESOLVED',
      citizenIdx: 3,
      daysAgo: 10,
    },
    {
      zoneName: 'Centro Histórico',
      type: 'MISSED_COLLECTION',
      description:
        'Recolección no realizada en la Calle Triunfo por avería del camión. Ya se reprogramó.',
      status: 'RESOLVED',
      citizenIdx: 0,
      daysAgo: 12,
    },
    {
      zoneName: 'San Blas',
      type: 'OTHER',
      description:
        'Acumulación de hojas secas y ramas en la Calle Tandapata. Se realizó poda y limpieza.',
      status: 'RESOLVED',
      citizenIdx: 1,
      daysAgo: 8,
    },

    // Cerradas (CLOSED)
    {
      zoneName: 'Wanchaq',
      type: 'CONTAINER_DAMAGED',
      description:
        'Contenedor dañado en Real Plaza reemplazado. Todo en orden.',
      status: 'CLOSED',
      citizenIdx: 4,
      daysAgo: 15,
    },
    {
      zoneName: 'San Sebastián',
      type: 'ILLEGAL_DUMPING',
      description:
        'Escombros retirados del Mercado San Sebastián. Se identificó al infractor.',
      status: 'CLOSED',
      citizenIdx: 2,
      daysAgo: 14,
    },
    {
      zoneName: 'Santiago',
      type: 'MISSED_COLLECTION',
      description: 'Recolección reprogramada y completada sin inconvenientes.',
      status: 'CLOSED',
      citizenIdx: 3,
      daysAgo: 20,
    },
    {
      zoneName: 'Centro Histórico',
      type: 'CONTAINER_DAMAGED',
      description: 'Contenedor de la Av. El Sol reparado. Reporte cerrado.',
      status: 'CLOSED',
      citizenIdx: 0,
      daysAgo: 18,
    },
  ];

  for (const inc of incidentsData) {
    await prisma.incident.create({
      data: {
        reportedBy: citizens[inc.citizenIdx].id,
        zoneId: zoneIds[inc.zoneName],
        type: inc.type,
        description: inc.description,
        status: inc.status,
        createdAt: day(inc.daysAgo),
      },
    });
  }
  console.log(`✅ Incidencias (${incidentsData.length} registros)`);

  // ═══════════════════════════════════════════════════════════════════════════
  // RUTAS
  // ═══════════════════════════════════════════════════════════════════════════

  const routeDefs: {
    zoneName: string;
    driverId: string;
    status: string;
    startedAt: Date | null;
    finishedAt: Date | null;
    completedStopIndices: number[];
  }[] = [
    {
      zoneName: 'Centro Histórico',
      driverId: driver1.id,
      status: 'IN_PROGRESS',
      startedAt: hour(3),
      finishedAt: null,
      completedStopIndices: [0],
    },
    {
      zoneName: 'San Blas',
      driverId: driver1.id,
      status: 'IN_PROGRESS',
      startedAt: hour(1),
      finishedAt: null,
      completedStopIndices: [0, 1],
    },
    {
      zoneName: 'Wanchaq',
      driverId: driver2.id,
      status: 'PENDING',
      startedAt: null,
      finishedAt: null,
      completedStopIndices: [],
    },
    {
      zoneName: 'San Sebastián',
      driverId: driver2.id,
      status: 'COMPLETED',
      startedAt: hour(8),
      finishedAt: hour(2),
      completedStopIndices: [0, 1],
    },
    {
      zoneName: 'Santiago',
      driverId: driver2.id,
      status: 'PENDING',
      startedAt: null,
      finishedAt: null,
      completedStopIndices: [],
    },
    {
      zoneName: 'Centro Histórico',
      driverId: driver1.id,
      status: 'COMPLETED',
      startedAt: hour(30),
      finishedAt: hour(24),
      completedStopIndices: [0, 1, 2],
    },
  ];

  // Group pickup points by zone
  const allPPs = await prisma.pickupPoint.findMany({
    orderBy: { name: 'asc' },
  });
  const ppByZone: Record<string, typeof allPPs> = {};
  for (const pp of allPPs) {
    if (!ppByZone[pp.zoneId]) ppByZone[pp.zoneId] = [];
    ppByZone[pp.zoneId].push(pp);
  }

  for (const rd of routeDefs) {
    const zoneId = zoneIds[rd.zoneName];
    const zonePPs = ppByZone[zoneId] ?? [];
    if (zonePPs.length === 0) continue;

    const route = await prisma.route.create({
      data: {
        zoneId,
        driverId: rd.driverId,
        status: rd.status,
        startedAt: rd.startedAt,
        finishedAt: rd.finishedAt,
        createdAt: day(
          rd.completedStopIndices.length === zonePPs.length ? 2 : 0,
        ),
      },
    });

    for (let i = 0; i < zonePPs.length; i++) {
      const isCompleted = rd.completedStopIndices.includes(i);
      const stop = await prisma.routeStop.create({
        data: {
          routeId: route.id,
          pickupPointId: zonePPs[i].id,
          orderIndex: i,
          status: isCompleted ? 'COMPLETED' : 'PENDING',
        },
      });

      // Create collection records for completed stops
      if (isCompleted) {
        await prisma.collection.create({
          data: {
            routeStopId: stop.id,
            wasteTypeId: wasteTypes['ORGANIC'],
            collectedAt: rd.startedAt ?? now,
            notes: 'Recolección completada sin novedades',
          },
        });
      }
    }
    console.log(
      `✅ Ruta ${rd.zoneName} (${rd.status}) — ${zonePPs.length} paradas, ${rd.completedStopIndices.length} completadas`,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════

  const counts = {
    users: await prisma.user.count(),
    zones: await prisma.zone.count(),
    pickupPoints: await prisma.pickupPoint.count(),
    schedules: await prisma.collectionSchedule.count(),
    incidents: await prisma.incident.count(),
    wasteTypes: await prisma.wasteType.count(),
    routes: await prisma.route.count(),
    routeStops: await prisma.routeStop.count(),
    collections: await prisma.collection.count(),
  };

  console.log('\n═══════════════════════════════════════');
  console.log('🎉 SEED COMPLETADO EXITOSAMENTE');
  console.log('═══════════════════════════════════════');
  console.log(`   Usuarios:      ${counts.users} (9)`);
  console.log(`   Zonas:         ${counts.zones} (5)`);
  console.log(`   Puntos Recojo: ${counts.pickupPoints} (13)`);
  console.log(`   Horarios:      ${counts.schedules} (17)`);
  console.log(`   Incidencias:   ${counts.incidents} (16)`);
  console.log(`   Tipos Residuo: ${counts.wasteTypes} (4)`);
  console.log(`   Rutas:         ${counts.routes} (6)`);
  console.log(`   Paradas:       ${counts.routeStops}`);
  console.log(`   Recolecciones: ${counts.collections}`);
  console.log('═══════════════════════════════════════');
  console.log('\n📧 CREDENCIALES:');
  console.log('   admin@terracivic.pe          / 123456  (Administrador)');
  console.log('   carlos.conductor@terracivic.pe / 123456  (Conductor)');
  console.log('   maria.conductor@terracivic.pe  / 123456  (Conductor)');
  console.log('   juan@terracivic.pe           / 123456  (Ciudadano)');
  console.log('   rosa@terracivic.pe           / 123456  (Ciudadano)');
  console.log('   pedro@terracivic.pe          / 123456  (Ciudadano)');
  console.log('   lucia@terracivic.pe          / 123456  (Ciudadano)');
  console.log('   miguel@terracivic.pe         / 123456  (Ciudadano)');
  console.log('   inactivo@terracivic.pe       / 123456  (Inactivo)');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
