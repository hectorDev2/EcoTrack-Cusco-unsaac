/**
 * fix-zones.ts
 *
 * Limpia la BD de Turso: elimina Zona 1-5 como zonas y reasigna
 * todos sus pickup_points a la zona Wanchaq.
 *
 * Ejecutar UNA SOLA VEZ desde el directorio backend/:
 *   npx ts-node -r tsconfig-paths/register prisma/fix-zones.ts
 */

import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env') });

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl) throw new Error('TURSO_DATABASE_URL requerido');
if (!tursoToken) throw new Error('TURSO_AUTH_TOKEN requerido');

const prisma = new PrismaClient({
  adapter: new PrismaLibSQL({ url: tursoUrl, authToken: tursoToken }),
});

async function main() {
  console.log('🔍 Leyendo zonas actuales...');

  const allZones = await prisma.zone.findMany({ orderBy: { name: 'asc' } });
  console.log('Zonas encontradas:', allZones.map((z) => `${z.name} (${z.id})`).join(', '));

  const wanchaq = allZones.find((z) => z.name === 'Wanchaq');
  if (!wanchaq) {
    console.error('❌ No se encontró la zona Wanchaq. ¿Ya corriste el seed?');
    process.exit(1);
  }

  const internalZones = allZones.filter((z) =>
    ['Zona 1', 'Zona 2', 'Zona 3', 'Zona 4', 'Zona 5'].includes(z.name),
  );

  if (internalZones.length === 0) {
    console.log('✅ No hay zonas internas que limpiar. BD ya está correcta.');
    return;
  }

  const internalIds = internalZones.map((z) => z.id);
  console.log(`\n📦 Zonas a eliminar: ${internalZones.map((z) => z.name).join(', ')}`);

  // 1. Reasignar pickup_points
  const ppResult = await prisma.pickupPoint.updateMany({
    where: { zoneId: { in: internalIds } },
    data: { zoneId: wanchaq.id },
  });
  console.log(`✅ ${ppResult.count} pickup_points reasignados → Wanchaq`);

  // 2. Reasignar collection_schedules (por si acaso)
  const csResult = await prisma.collectionSchedule.updateMany({
    where: { zoneId: { in: internalIds } },
    data: { zoneId: wanchaq.id },
  });
  console.log(`✅ ${csResult.count} collection_schedules reasignados → Wanchaq`);

  // 3. Reasignar routes (por si acaso)
  const routeResult = await prisma.route.updateMany({
    where: { zoneId: { in: internalIds } },
    data: { zoneId: wanchaq.id },
  });
  console.log(`✅ ${routeResult.count} routes reasignados → Wanchaq`);

  // 4. Reasignar incidents (por si acaso)
  const incResult = await prisma.incident.updateMany({
    where: { zoneId: { in: internalIds } },
    data: { zoneId: wanchaq.id },
  });
  console.log(`✅ ${incResult.count} incidents reasignados → Wanchaq`);

  // 5. Eliminar user_zones de zonas internas
  await prisma.userZone.deleteMany({ where: { zoneId: { in: internalIds } } });
  console.log(`✅ UserZones de zonas internas eliminadas`);

  // 6. Eliminar las zonas internas
  await prisma.zone.deleteMany({ where: { id: { in: internalIds } } });
  console.log(`✅ Zona 1-5 eliminadas de la BD`);

  // Verificar resultado
  const remaining = await prisma.zone.findMany({ orderBy: { name: 'asc' } });
  console.log('\n📋 Zonas restantes:', remaining.map((z) => z.name).join(', '));

  const ppCount = await prisma.pickupPoint.count({ where: { zoneId: wanchaq.id } });
  console.log(`📍 Total pickup_points en Wanchaq: ${ppCount}`);

  console.log('\n✅ Limpieza completada.');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
