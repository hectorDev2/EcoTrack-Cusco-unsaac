import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSQL({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });
const prisma = new PrismaClient({ adapter });

async function migrate() {
  try {
    console.log('🚀 Aplicando fixes al schema de Turso...\n');

    // 1. Agregar status a collection_schedules
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE collection_schedules ADD COLUMN status TEXT NOT NULL DEFAULT 'ACTIVE';`);
      console.log('✅ collection_schedules.status agregada');
    } catch (e: any) {
      if (e.message?.includes('duplicate column') || e.message?.includes('already exists')) {
        console.log('⏭️  collection_schedules.status ya existe');
      } else {
        throw e;
      }
    }

    // 2. Crear tabla vehicles
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id TEXT PRIMARY KEY,
        plate TEXT NOT NULL UNIQUE,
        brand TEXT,
        model TEXT,
        capacity REAL,
        driver_id TEXT,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        created_at TEXT NOT NULL
      );
    `);
    console.log('✅ vehicles creada');

    // 3. Crear tabla route_locations
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS route_locations (
        id TEXT PRIMARY KEY,
        route_id TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        recorded_at TEXT NOT NULL
      );
    `);
    console.log('✅ route_locations creada');

    // 4. Crear índices
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS route_locations_route_id_recorded_at_idx ON route_locations(route_id, recorded_at);`);
    console.log('✅ route_locations índice creado');

    console.log('\n🎉 Migración completada');
  } catch (e: any) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
