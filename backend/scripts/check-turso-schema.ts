import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSQL({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });
const prisma = new PrismaClient({ adapter });

const EXPECTED_SCHEMA: Record<string, string[]> = {
  users: ['id', 'email', 'password_hash', 'full_name', 'role', 'status', 'created_at'],
  zones: ['id', 'name', 'description', 'status', 'created_at'],
  user_zones: ['id', 'user_id', 'zone_id', 'assigned_at'],
  waste_types: ['id', 'name', 'category', 'description', 'created_at'],
  pickup_points: ['id', 'zone_id', 'name', 'address', 'latitude', 'longitude', 'status', 'shift', 'stop_type', 'scheduled_time', 'frequency_id', 'order_index'],
  frequency_configs: ['id', 'code', 'label', 'days'],
  collection_schedules: ['id', 'zone_id', 'waste_type_id', 'day_of_week', 'start_time', 'end_time', 'status', 'frequency_id'],
  routes: ['id', 'zone_id', 'driver_id', 'status', 'started_at', 'finished_at', 'created_at'],
  route_stops: ['id', 'route_id', 'pickup_point_id', 'order_index', 'status'],
  collections: ['id', 'route_stop_id', 'waste_type_id', 'collected_at', 'notes'],
  vehicles: ['id', 'plate', 'brand', 'model', 'capacity', 'driver_id', 'status', 'created_at'],
  route_locations: ['id', 'route_id', 'latitude', 'longitude', 'recorded_at'],
  incidents: ['id', 'reported_by', 'zone_id', 'route_id', 'type', 'description', 'status', 'latitude', 'longitude', 'address', 'created_at'],
};

async function check() {
  try {
    console.log('🔍 Verificando schema de Turso vs schema.prisma...\n');

    const tables = await prisma.$queryRawUnsafe(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`) as any[];
    const existingTables = new Set(tables.map((t: any) => t.name));

    let allGood = true;
    for (const [tableName, expectedCols] of Object.entries(EXPECTED_SCHEMA)) {
      if (!existingTables.has(tableName)) {
        console.log(`❌ Tabla ${tableName} NO EXISTE`);
        allGood = false;
        continue;
      }

      const cols = await prisma.$queryRawUnsafe(`PRAGMA table_info(${tableName})`) as any[];
      const existingCols = new Set(cols.map((c: any) => c.name));

      const missing: string[] = [];
      for (const expected of expectedCols) {
        if (!existingCols.has(expected)) {
          missing.push(expected);
        }
      }

      if (missing.length > 0) {
        console.log(`❌ ${tableName}: faltan columnas: ${missing.join(', ')}`);
        allGood = false;
      } else {
        console.log(`✅ ${tableName}: OK (${expectedCols.length} columnas)`);
      }
    }

    if (allGood) {
      console.log('\n🎉 Schema completo y correcto');
    } else {
      console.log('\n⚠️  Hay diferencias — agregá las columnas faltantes antes de correr el seed');
    }
  } catch (e: any) {
    console.error('❌ Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
