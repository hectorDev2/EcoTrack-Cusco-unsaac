import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSQL({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });
const prisma = new PrismaClient({ adapter });

async function migrate() {
  try {
    console.log('🚀 Aplicando schema a Turso...\n');

    // 1. Crear tabla frequency_configs
    console.log('📋 Creando tabla frequency_configs...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS frequency_configs (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        label TEXT NOT NULL,
        days TEXT NOT NULL
      );
    `);
    console.log('  ✅ frequency_configs creada');

    // 2. Agregar columnas nuevas a pickup_points
    console.log('\n📋 Agregando columnas a pickup_points...');
    const pickupColumns = [
      { name: 'shift', type: 'TEXT' },
      { name: 'stop_type', type: 'TEXT NOT NULL DEFAULT "NORMAL"' },
      { name: 'scheduled_time', type: 'TEXT' },
      { name: 'frequency_id', type: 'TEXT' },
      { name: 'order_index', type: 'INTEGER NOT NULL DEFAULT 0' },
    ];

    for (const col of pickupColumns) {
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE pickup_points ADD COLUMN ${col.name} ${col.type};`);
        console.log(`  ✅ Columna ${col.name} agregada`);
      } catch (e: any) {
        if (e.message?.includes('duplicate column') || e.message?.includes('already exists')) {
          console.log(`  ⏭️  Columna ${col.name} ya existe`);
        } else {
          throw e;
        }
      }
    }

    // 3. Agregar columna frequency_id a collection_schedules
    console.log('\n📋 Agregando columna frequency_id a collection_schedules...');
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE collection_schedules ADD COLUMN frequency_id TEXT;`);
      console.log('  ✅ Columna frequency_id agregada');
    } catch (e: any) {
      if (e.message?.includes('duplicate column') || e.message?.includes('already exists')) {
        console.log('  ⏭️  Columna frequency_id ya existe');
      } else {
        throw e;
      }
    }

    // 3b. Agregar columna status a collection_schedules (faltaba)
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE collection_schedules ADD COLUMN status TEXT NOT NULL DEFAULT 'ACTIVE';`);
      console.log('  ✅ Columna status agregada a collection_schedules');
    } catch (e: any) {
      if (e.message?.includes('duplicate column') || e.message?.includes('already exists')) {
        console.log('  ⏭️  Columna status ya existe en collection_schedules');
      } else {
        throw e;
      }
    }

    // 4. Crear índices
    console.log('\n📋 Creando índices...');
    try {
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS pickup_points_zone_id_shift_frequency_id_idx ON pickup_points(zone_id, shift, frequency_id);`);
      console.log('  ✅ Índice pickup_points(zone_id, shift, frequency_id) creado');
    } catch (e: any) {
      console.log(`  ⏭️  Índice: ${e.message}`);
    }
    try {
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS pickup_points_shift_stop_type_idx ON pickup_points(shift, stop_type);`);
      console.log('  ✅ Índice pickup_points(shift, stop_type) creado');
    } catch (e: any) {
      console.log(`  ⏭️  Índice: ${e.message}`);
    }

    console.log('\n✅ Migración completada');
  } catch (e: any) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
