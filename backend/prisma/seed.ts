import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';
import { resolve } from 'path';

// ⚠️  DEMO SEED ONLY — All users have password "123456"
// For production deployment, rotate all passwords before going live

config({ path: resolve(__dirname, '../.env') });

// Cargar el rutero oficial de compactadores de Wanchaq 2024
const ruteroWanchaq = JSON.parse(
  fs.readFileSync(resolve(__dirname, 'data/wanchaq-rutero.json'), 'utf-8'),
);

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
  await prisma.routeLocation.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.collectionSchedule.deleteMany();
  await prisma.pickupPoint.deleteMany();
  await prisma.frequencyConfig.deleteMany();
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
      email: 'admin@ecotrack.pe',
      fullName: 'Hector Mamani',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
    {
      email: 'carlos.conductor@ecotrack.pe',
      fullName: 'Carlos Quispe',
      role: 'DRIVER',
      status: 'ACTIVE',
    },
    {
      email: 'maria.conductora@ecotrack.pe',
      fullName: 'Maria Huaman',
      role: 'DRIVER',
      status: 'ACTIVE',
    },
    {
      email: 'juan@ecotrack.pe',
      fullName: 'Juan Quispe',
      role: 'CITIZEN',
      status: 'ACTIVE',
    },
    {
      email: 'rosa@ecotrack.pe',
      fullName: 'Rosa Mamani',
      role: 'CITIZEN',
      status: 'ACTIVE',
    },
    {
      email: 'pedro@ecotrack.pe',
      fullName: 'Pedro Ccahuana',
      role: 'CITIZEN',
      status: 'ACTIVE',
    },
    {
      email: 'lucia@ecotrack.pe',
      fullName: 'Lucia Huilca',
      role: 'CITIZEN',
      status: 'ACTIVE',
    },
    {
      email: 'miguel@ecotrack.pe',
      fullName: 'Miguel Sotomayor',
      role: 'CITIZEN',
      status: 'ACTIVE',
    },
    {
      email: 'inactivo@ecotrack.pe',
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

  const admin = users['admin@ecotrack.pe'];
  const driver1 = users['carlos.conductor@ecotrack.pe'];
  const driver2 = users['maria.conductora@ecotrack.pe'];
  const citizens = [
    users['juan@ecotrack.pe'],
    users['rosa@ecotrack.pe'],
    users['pedro@ecotrack.pe'],
    users['lucia@ecotrack.pe'],
    users['miguel@ecotrack.pe'],
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
  // ZONAS (Distrito de Wanchaq - Rutero de Compactadores 2024)
  // ═══════════════════════════════════════════════════════════════════════════

  // Única zona: el distrito completo de Wanchaq
  // Las "Zona 1-5" del rutero son rutas operativas dentro de Wanchaq,
  // no zonas independientes. Se crean como Routes al asignar conductores.
  const wanchaqZone = await prisma.zone.create({
    data: {
      name: 'Wanchaq',
      description: 'Distrito de Wanchaq - Zona de operación del sistema de compactadores',
      status: 'ACTIVE',
      createdAt: now,
    },
  });
  console.log(`✅ Zona Wanchaq`);

  // Todos los pickup points se asignan a Wanchaq.
  // La diferenciación por zona interna (1-5) se mantiene en el nombre del punto.
  const allZoneIds = [wanchaqZone.id];

  // ═══════════════════════════════════════════════════════════════════════════
  // ASIGNACIONES USUARIO-ZONA (todos los usuarios a Wanchaq)
  // ═══════════════════════════════════════════════════════════════════════════

  for (const userId of Object.values(users).map((u) => u.id)) {
    await prisma.userZone.create({
      data: { userId, zoneId: wanchaqZone.id, assignedAt: now },
    });
  }
  console.log(`✅ Asignaciones usuario-zona (9 usuarios → Wanchaq)`);

  // ═══════════════════════════════════════════════════════════════════════════
  // FRECUENCIAS (FrequencyConfig) - según rutero oficial
  // ═══════════════════════════════════════════════════════════════════════════
  const frequencyConfigs = [
    { code: 'LMV', label: 'Lunes, Miércoles y Viernes', days: 'MON,WED,FRI' },
    { code: 'MJS', label: 'Martes, Jueves y Sábado', days: 'TUE,THU,SAT' },
    { code: 'DOM', label: 'Solo Domingo', days: 'SUN' },
    { code: 'DOM_LUN', label: 'Domingo y Lunes', days: 'SUN,MON' },
    { code: 'TODOS', label: 'Todos los días', days: 'MON,TUE,WED,THU,FRI,SAT,SUN' },
  ] as const;

  const frequencyIds: Record<string, string> = {};
  for (const f of frequencyConfigs) {
    const created = await prisma.frequencyConfig.create({ data: f });
    frequencyIds[f.code] = created.id;
    console.log(`✅ Frequency ${f.code}: ${f.label}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUNTOS DE RECOJO (Rutero de Compactadores Wanchaq 2024)
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // El rutero tiene 6 turnos/secciones:
  //   - turnoManana: 5 zonas × 2 frecuencias (LMV, MJS)
  //   - repechaje: 2 frecuencias (LMV, MJS) — general, no por zona
  //   - turnoTarde: 2 frecuencias (LMV, MJS) — general
  //   - furgones: 2 frecuencias (LMV, MJS) — recojo de tierras
  //   - turnoDominical: 3 zonas (Mañana)
  //   - turnoNoche: 2 zonas (domingoYLunes, lunesADomingo)
  //
  // Para cada parada generamos un PickupPoint con los nuevos campos:
  //   shift, stopType, scheduledTime, frequencyId, orderIndex

  type ParadaInput = {
    nombre?: string;
    ubicacion?: string;
    hora?: string | null;
    lat?: number | null;
    lng?: number | null;
  };

  type ParadaConMeta = {
    nombre: string;
    hora?: string | null;
    lat?: number | null;
    lng?: number | null;
    zoneName: string;
    shift: 'MANANA' | 'TARDE' | 'NOCHE' | 'DOMINICAL';
    stopType: 'NORMAL' | 'CAMPANEO' | 'REPECHAJE' | 'VIA_PUBLICA' | 'DOMINICAL';
    frequencyCode: 'LMV' | 'MJS' | 'DOM' | 'DOM_LUN' | 'TODOS' | null;
    orderIndex: number;
  };

  // Normaliza ParadaInput → siempre tiene `nombre` (toma de `ubicacion` si falta)
  const normalizeParada = (p: ParadaInput): ParadaConMeta => ({
    nombre: p.nombre || p.ubicacion || '(sin nombre)',
    hora: p.hora,
    lat: p.lat,
    lng: p.lng,
    zoneName: '',
    shift: 'MANANA',
    stopType: 'NORMAL',
    frequencyCode: null,
    orderIndex: 0,
  });

  const paradas: ParadaConMeta[] = [];
  let globalOrder = 0;

  // Helper: detectar si es recojo de vía pública
  const isViaPublica = (n: string) =>
    /RECOJO DE RRSS/i.test(n) || /RECOJO RRSS/i.test(n) || /VIA PUBLICA/i.test(n);

  // Helper: detectar si es "campaneo" en el nombre (caso especial del JSON)
  const hasCampaneoInName = (n: string) => /CAMPANEO/i.test(n);

  // Helper: formatear hora (de "6:00" a "06:00")
  const fmtHora = (h?: string | null) => {
    if (!h) return null;
    const [hh, mm] = h.split(':');
    return `${hh.padStart(2, '0')}:${mm.padStart(2, '0')}`;
  };

  // Helper: agregar paradas normales de un array
  const addParadas = (
    items: ParadaInput[],
    zoneName: string,
    shift: ParadaConMeta['shift'],
    stopType: ParadaConMeta['stopType'],
    frequencyCode: ParadaConMeta['frequencyCode'],
  ) => {
    items.forEach((item: ParadaInput) => {
      globalOrder++;
      const nombre = item.nombre || item.ubicacion || '(sin nombre)';
      // Las que tienen "CAMPANEO" en el nombre se marcan como CAMPANEO
      const actualStopType = hasCampaneoInName(nombre) ? 'CAMPANEO' : stopType;
      paradas.push({
        nombre,
        hora: item.hora,
        lat: item.lat,
        lng: item.lng,
        zoneName,
        shift,
        stopType: actualStopType,
        frequencyCode,
        orderIndex: globalOrder,
      });
    });
  };

  // ═══ TURNO MAÑANA (5 zonas × 2 frecuencias) ═══
  const tm = ruteroWanchaq.rutas.turnoManana;
  (['zona01', 'zona02', 'zona03', 'zona04', 'zona05'] as const).forEach((zk) => {
    const zona = tm[zk];
    const zoneName = zk === 'zona01' ? 'Zona 1' : zk === 'zona02' ? 'Zona 2' : zk === 'zona03' ? 'Zona 3' : zk === 'zona04' ? 'Zona 4' : 'Zona 5';

    // LMV
    addParadas(zona.lunesMiercolesViernes.ruta, zoneName, 'MANANA', 'NORMAL', 'LMV');
    addParadas(zona.lunesMiercolesViernes.campaneo, zoneName, 'MANANA', 'CAMPANEO', 'LMV');
    // MJS
    addParadas(zona.martesJuevesSabado.ruta, zoneName, 'MANANA', 'NORMAL', 'MJS');
    addParadas(zona.martesJuevesSabado.campaneo, zoneName, 'MANANA', 'CAMPANEO', 'MJS');
  });

  // ═══ REPECHAJE (general, no por zona) ═══
  const rp = ruteroWanchaq.rutas.repechaje;
  rp.lunesMiercolesViernes.ruta.forEach((p: ParadaInput) => {
    globalOrder++;
    paradas.push({
      ...p,
      nombre: p.ubicacion || p.nombre || '(sin nombre)',
      zoneName: 'Wanchaq',
      shift: 'MANANA',
      stopType: 'REPECHAJE',
      frequencyCode: 'LMV',
      orderIndex: globalOrder,
    });
  });
  rp.martesJuevesSabado.ruta.forEach((p: ParadaInput) => {
    globalOrder++;
    paradas.push({
      ...p,
      nombre: p.ubicacion || p.nombre || '(sin nombre)',
      zoneName: 'Wanchaq',
      shift: 'MANANA',
      stopType: 'REPECHAJE',
      frequencyCode: 'MJS',
      orderIndex: globalOrder,
    });
  });

  // ═══ TURNO TARDE (general) ═══
  const tt = ruteroWanchaq.rutas.turnoTarde;
  tt.lunesMiercolesViernes.ruta.forEach((p: ParadaInput) => {
    globalOrder++;
    paradas.push({
      ...p,
      nombre: p.ubicacion || p.nombre || '(sin nombre)',
      zoneName: 'Wanchaq',
      shift: 'TARDE',
      stopType: isViaPublica(p.ubicacion ?? '') ? 'VIA_PUBLICA' : 'NORMAL',
      frequencyCode: 'LMV',
      orderIndex: globalOrder,
    });
  });
  tt.martesJuevesSabado.ruta.forEach((p: ParadaInput) => {
    globalOrder++;
    paradas.push({
      ...p,
      nombre: p.ubicacion || p.nombre || '(sin nombre)',
      zoneName: 'Wanchaq',
      shift: 'TARDE',
      stopType: isViaPublica(p.ubicacion ?? '') ? 'VIA_PUBLICA' : 'NORMAL',
      frequencyCode: 'MJS',
      orderIndex: globalOrder,
    });
  });

  // ═══ FURGONES (recojo de tierras, vehículo Hino/TKing) ═══
  const fg = ruteroWanchaq.rutas.furgones.hinoTking;
  fg.lunesMiercolesViernes.ruta.forEach((p: ParadaInput) => {
    globalOrder++;
    paradas.push({
      ...p,
      nombre: p.ubicacion || p.nombre || '(sin nombre)',
      zoneName: 'Wanchaq',
      shift: 'MANANA',
      stopType: isViaPublica(p.ubicacion ?? '') ? 'VIA_PUBLICA' : 'NORMAL',
      frequencyCode: 'LMV',
      orderIndex: globalOrder,
    });
  });
  fg.martesJuevesSabado.ruta.forEach((p: ParadaInput) => {
    globalOrder++;
    paradas.push({
      ...p,
      nombre: p.ubicacion || p.nombre || '(sin nombre)',
      zoneName: 'Wanchaq',
      shift: 'MANANA',
      stopType: isViaPublica(p.ubicacion ?? '') ? 'VIA_PUBLICA' : 'NORMAL',
      frequencyCode: 'MJS',
      orderIndex: globalOrder,
    });
  });

  // ═══ TURNO DOMINICAL (3 zonas, sin hora) ═══
  const td = ruteroWanchaq.rutas.turnoDominical;
  (['zona01', 'zona02', 'zona03'] as const).forEach((zk) => {
    const zoneName = zk === 'zona01' ? 'Zona 1' : zk === 'zona02' ? 'Zona 2' : 'Zona 3';
    td[zk].turnoManana.forEach((p: ParadaInput) => {
      globalOrder++;
      paradas.push({
        ...p,
        nombre: p.ubicacion || p.nombre || '(sin nombre)',
        zoneName,
        shift: 'DOMINICAL',
        stopType: 'DOMINICAL',
        frequencyCode: 'DOM',
        orderIndex: globalOrder,
      });
    });
  });

  // ═══ TURNO NOCHE (2 zonas) ═══
  const tn = ruteroWanchaq.rutas.turnoNoche;
  // zona02 domingoYLunes
  tn.zona02.domingoYLunes.forEach((p: ParadaInput) => {
    globalOrder++;
    paradas.push({
      ...p,
      nombre: p.ubicacion || p.nombre || '(sin nombre)',
      zoneName: 'Zona 2',
      shift: 'NOCHE',
      stopType: 'NORMAL',
      frequencyCode: 'DOM_LUN',
      orderIndex: globalOrder,
    });
  });
  // zona01 lunesADomingo
  tn.zona01.lunesADomingo.forEach((p: ParadaInput) => {
    globalOrder++;
    paradas.push({
      ...p,
      nombre: p.ubicacion || p.nombre || '(sin nombre)',
      zoneName: 'Zona 1',
      shift: 'NOCHE',
      stopType: 'NORMAL',
      frequencyCode: 'TODOS',
      orderIndex: globalOrder,
    });
  });
  console.log(`📍 ${paradas.length} paradas parseadas del rutero`);

  // Insertar en DB y agrupar IDs por (zoneName, shift, frequencyCode) para las rutas
  let pickupCount = 0;
  // key: "Zona 1|MANANA|LMV", value: array de pickupPoint ids en orden
  const pickupIdsByRoute: Record<string, string[]> = {};

  for (const p of paradas) {
    const hora = fmtHora(p.hora);
    // nombre limpio: solo la dirección, con hora si existe
    const fullName = hora ? `[${hora}] ${p.nombre}` : p.nombre;

    const created = await prisma.pickupPoint.create({
      data: {
        zoneId: wanchaqZone.id,
        name: fullName,
        address: p.nombre,
        latitude: p.lat ?? -13.5300,
        longitude: p.lng ?? -71.9565,
        shift: p.shift as any,
        stopType: p.stopType as any,
        scheduledTime: hora,
        frequencyId: p.frequencyCode ? frequencyIds[p.frequencyCode] : null,
        orderIndex: p.orderIndex,
        status: 'ACTIVE',
      },
    });

    // Agrupar para crear RouteStops más adelante
    const routeKey = `${p.zoneName}|${p.shift}|${p.frequencyCode ?? 'TODOS'}`;
    if (!pickupIdsByRoute[routeKey]) pickupIdsByRoute[routeKey] = [];
    pickupIdsByRoute[routeKey].push(created.id);

    pickupCount++;
  }
  console.log(` ${pickupCount} PickupPoints creados`);


  // ═══════════════════════════════════════════════════════════════════════════
  // RUTAS (plantillas del rutero oficial - sin conductor asignado)
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Cada combinación zoneName|shift|frequency del rutero se convierte en una
  // ruta plantilla. Los conductores se asignan operativamente desde /admin-rutas.
  //
  // Naming: "Zona 1 — Mañana LMV", "Repechaje — Mañana MJS", etc.

  const SHIFT_LABEL: Record<string, string> = {
    MANANA: 'Mañana', TARDE: 'Tarde', NOCHE: 'Noche', DOMINICAL: 'Dominical',
  };
  const FREQ_LABEL: Record<string, string> = {
    LMV: 'LMV', MJS: 'MJS', DOM: 'DOM', DOM_LUN: 'Dom+Lun', TODOS: 'Todos',
  };

  // Asignación de conductores por zona/turno:
  // Carlos → zonas impares (1, 3, 5), Repechaje LMV, Tarde LMV, Noche Zona 1, Dominical Z1
  // Maria  → zonas pares  (2, 4),     Repechaje MJS, Tarde MJS, Noche Zona 2, Dominical Z2-Z3, Furgón
  const getDriverId = (zoneName: string, freqCode: string): string => {
    const odd = ['Zona 1', 'Zona 2', 'Zona 3', 'Zona 4', 'Zona 5', 'Repechaje'];
    if (odd.includes(zoneName) && (freqCode === 'LMV' || freqCode === 'DOM' || freqCode === 'TODOS')) {
      return driver1.id;
    }
    return driver2.id;
  };

  let routeCount = 0;
  for (const [routeKey, ppIds] of Object.entries(pickupIdsByRoute)) {
    const [zoneName, shift, freqCode] = routeKey.split('|');
    const label = `${zoneName} — ${SHIFT_LABEL[shift] ?? shift} ${FREQ_LABEL[freqCode] ?? freqCode}`;
    const driverId = getDriverId(zoneName, freqCode);

    const route = await prisma.route.create({
      data: {
        zoneId: wanchaqZone.id,
        driverId,
        name: label,
        shift,
        frequency: freqCode,
        status: 'PENDING',
        createdAt: now,
      } as any,  // `name`, `shift`, `frequency` requieren migrate-turso antes del seed
    });

    // Crear RouteStops en orden
    for (let i = 0; i < ppIds.length; i++) {
      await prisma.routeStop.create({
        data: {
          routeId: route.id,
          pickupPointId: ppIds[i],
          orderIndex: i + 1,
          status: 'PENDING',
        },
      });
    }

    routeCount++;
  }
  console.log(` ${routeCount} Rutas plantilla creadas (del rutero oficial)`);

  // ═══════════════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════════════
  // HORARIOS DE RECOLECCIÓN (basado en las 5 frecuencias del rutero)
  // ═══════════════════════════════════════════════════════════════════════════
  const nonRecyclableId = wasteTypes['NON_RECYCLABLE'];
  for (const f of frequencyConfigs) {
    await prisma.collectionSchedule.create({
      data: {
        zoneId: wanchaqZone.id,
        wasteTypeId: nonRecyclableId,
        dayOfWeek: f.days,
        startTime: '04:00',
        endTime: '11:00',
        frequencyId: frequencyIds[f.code],
        status: 'ACTIVE',
      },
    });
  }
  console.log(` ${frequencyConfigs.length} CollectionSchedules creados`);

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
        zoneName: 'Wanchaq',
        type: 'CONTAINER_DAMAGED',
        description:
          'Contenedor de la Plaza de Armas tiene la tapa rota y desprende mal olor. Urge reemplazo.',
        status: 'OPEN',
        citizenIdx: 0,
        daysAgo: 1,
      },
      {
        zoneName: 'Wanchaq',
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
        zoneName: 'Wanchaq',
        type: 'OTHER',
        description:
          'Perros callejeros rompen las bolsas cada noche en el mercado. Se necesitan contenedores con tapa segura.',
        status: 'OPEN',
        citizenIdx: 2,
        daysAgo: 3,
      },
      {
        zoneName: 'Wanchaq',
        type: 'CONTAINER_DAMAGED',
        description:
          'Contenedor de orgánicos del parque tiene la base rota y derrama líquidos en toda la vereda.',
        status: 'OPEN',
        citizenIdx: 3,
        daysAgo: 1,
      },
      {
        zoneName: 'Wanchaq',
        type: 'ILLEGAL_DUMPING',
        description:
          'Colchones y muebles viejos abandonados en la puerta del colegio San Francisco de Asís.',
        status: 'OPEN',
        citizenIdx: 0,
        daysAgo: 0,
      },

      // En progreso (IN_PROGRESS)
      {
        zoneName: 'Wanchaq',
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
        zoneName: 'Wanchaq',
        type: 'MISSED_COLLECTION',
        description:
          'Segunda semana consecutiva que no recogen los residuos reciclables en la Av. de la Cultura.',
        status: 'IN_PROGRESS',
        citizenIdx: 2,
        daysAgo: 6,
      },

      // Resueltas (RESOLVED)
      {
        zoneName: 'Wanchaq',
        type: 'CONTAINER_DAMAGED',
        description:
          'Contenedor de basura del mercado Santiago fue reemplazado por uno nuevo.',
        status: 'RESOLVED',
        citizenIdx: 3,
        daysAgo: 10,
      },
      {
        zoneName: 'Wanchaq',
        type: 'MISSED_COLLECTION',
        description:
          'Recolección no realizada en la Calle Triunfo por avería del camión. Ya se reprogramó.',
        status: 'RESOLVED',
        citizenIdx: 0,
        daysAgo: 12,
      },
      {
        zoneName: 'Wanchaq',
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
        zoneName: 'Wanchaq',
        type: 'ILLEGAL_DUMPING',
        description:
          'Escombros retirados del Mercado San Sebastián. Se identificó al infractor.',
        status: 'CLOSED',
        citizenIdx: 2,
        daysAgo: 14,
      },
      {
        zoneName: 'Wanchaq',
        type: 'MISSED_COLLECTION',
        description: 'Recolección reprogramada y completada sin inconvenientes.',
        status: 'CLOSED',
        citizenIdx: 3,
        daysAgo: 20,
      },
      {
        zoneName: 'Wanchaq',
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
        zoneId: wanchaqZone.id,
        type: inc.type,
        description: inc.description,
        status: inc.status,
        createdAt: day(inc.daysAgo),
      },
    });
  }
  console.log(` Incidencias (${incidentsData.length} registros)`);

  // ═══════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════

  const counts = {
    users: await prisma.user.count(),
    zones: await prisma.zone.count(),
    pickupPoints: await prisma.pickupPoint.count(),
    routes: await prisma.route.count(),
    routeStops: await prisma.routeStop.count(),
    schedules: await prisma.collectionSchedule.count(),
    incidents: await prisma.incident.count(),
    wasteTypes: await prisma.wasteType.count(),
    frequencies: await prisma.frequencyConfig.count(),
  };

  console.log('\n═══════════════════════════════════════');
  console.log(' SEED COMPLETADO EXITOSAMENTE');
  console.log('═══════════════════════════════════════');
  console.log(`   Usuarios:       ${counts.users} (9)`);
  console.log(`   Zonas:          ${counts.zones} (1: Wanchaq)`);
  console.log(`   Puntos Recojo:  ${counts.pickupPoints} (del rutero de compactadores)`);
  console.log(`   Rutas:          ${counts.routes} (plantillas del rutero)`);
  console.log(`   Paradas (stops):${counts.routeStops}`);
  console.log(`   Horarios:       ${counts.schedules} (5 frecuencias)`);
  console.log(`   Incidencias:    ${counts.incidents} (16)`);
  console.log(`   Tipos Residuo:  ${counts.wasteTypes} (4)`);
  console.log(`   Frecuencias:    ${counts.frequencies} (LMV, MJS, DOM, DOM_LUN, TODOS)`);
  console.log('═══════════════════════════════════════');
  console.log('\n CREDENCIALES:');
  console.log('   admin@ecotrack.pe          / 123456  (Administrador)');
  console.log('   carlos.conductor@ecotrack.pe / 123456  (Conductor)');
  console.log('   maria.conductora@ecotrack.pe  / 123456  (Conductor)');
  console.log('   juan@ecotrack.pe           / 123456  (Ciudadano)');
  console.log('   rosa@ecotrack.pe           / 123456  (Ciudadano)');
  console.log('   pedro@ecotrack.pe          / 123456  (Ciudadano)');
  console.log('   lucia@ecotrack.pe          / 123456  (Ciudadano)');
  console.log('   miguel@ecotrack.pe         / 123456  (Ciudadano)');
  console.log('   inactivo@ecotrack.pe       / 123456  (Inactivo)');
}

main()
  .catch((e) => {
    console.error(' Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
