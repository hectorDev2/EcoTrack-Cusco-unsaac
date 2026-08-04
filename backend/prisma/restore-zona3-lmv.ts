import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env') });

const prisma = new PrismaClient({
  adapter: new PrismaLibSQL({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  }),
});

// Bloque exacto de PickupPoint identificado por orderIndex (asignado por
// prisma/seed.ts en el orden original del rutero, zona03 LMV: ruta + campaneo)
// — verificado con check-pp.ts, orderIndex 54..73, frequencyId de LMV,
// shift MANANA, 20 filas contiguas.
const ORDER_INDEX_MIN = 54;
const ORDER_INDEX_MAX = 73;

async function main() {
  const zone = await prisma.zone.findFirst({ where: { name: 'Wanchaq' } });
  if (!zone) throw new Error('Zona "Wanchaq" no encontrada');

  const route = await prisma.route.findFirst({
    where: { zoneId: zone.id, shift: 'MANANA', frequency: 'LMV', name: 'Zona 3 — Mañana LMV' },
    include: { stops: true },
  });
  if (!route) throw new Error('Ruta "Zona 3 — Mañana LMV" no encontrada');

  console.log(`Ruta encontrada: ${route.id} (${route.stops.length} paradas actuales)`);

  const freq = await prisma.frequencyConfig.findUnique({ where: { code: 'LMV' } });
  if (!freq) throw new Error('FrequencyConfig LMV no encontrada');

  const points = await prisma.pickupPoint.findMany({
    where: {
      shift: 'MANANA',
      frequencyId: freq.id,
      orderIndex: { gte: ORDER_INDEX_MIN, lte: ORDER_INDEX_MAX },
    },
    orderBy: { orderIndex: 'asc' },
  });

  if (points.length !== ORDER_INDEX_MAX - ORDER_INDEX_MIN + 1) {
    console.error(`Se esperaban 20 puntos, se encontraron ${points.length}. Abortando, no se modifica nada.`);
    points.forEach((p) => console.error(`  ${p.orderIndex}: ${p.name}`));
    process.exit(1);
  }

  console.log('Puntos a restaurar (en orden):');
  points.forEach((p, i) => console.log(`  ${i + 1}. ${p.name} -> ${p.id}`));

  if (process.env.DRY_RUN === '1') {
    console.log('DRY_RUN=1: no se modifica nada.');
    return;
  }

  console.log('Restaurando...');
  await prisma.routeStop.deleteMany({ where: { routeId: route.id } });
  await prisma.routeStop.createMany({
    data: points.map((p, i) => ({
      routeId: route.id,
      pickupPointId: p.id,
      orderIndex: i,
      status: 'PENDING',
    })),
  });

  console.log(`✅ Restauradas ${points.length} paradas en orden original para ${route.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
