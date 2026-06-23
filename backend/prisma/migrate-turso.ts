/**
 * migrate-turso.ts
 *
 * Aplica migraciones incrementales a Turso (libSQL) vía SQL directo.
 * Solo usa ALTER TABLE ADD COLUMN — nunca reconstruye tablas.
 *
 * Ejecutar con: npm run prisma:push:turso
 */

import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import * as fs from 'fs';
import * as path from 'path';

function loadEnv() {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

async function migrate() {
  loadEnv();

  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!tursoUrl) {
    console.error('❌ TURSO_DATABASE_URL no está definida en .env');
    process.exit(1);
  }

  console.log('🚀 Conectando a Turso...');
  const adapter = new PrismaLibSQL({ url: tursoUrl, authToken: authToken! });
  const prisma = new PrismaClient({ adapter });

  async function addColumn(table: string, col: string, type: string) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`);
      console.log(`  ✅ ${table}.${col} agregada`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('duplicate column') || msg.includes('already exists')) {
        console.log(`  ⏭️  ${table}.${col} ya existe`);
      } else {
        throw e;
      }
    }
  }

  try {
    await prisma.$connect();
    console.log('✅ Conectado\n');

    // ── incidents: columnas de ubicación ─────────────────────────────────────
    console.log('📦 incidents:');
    await addColumn('incidents', 'latitude', 'REAL');
    await addColumn('incidents', 'longitude', 'REAL');
    await addColumn('incidents', 'address', 'TEXT');

    // ── routes: columnas para plantillas del rutero ───────────────────────────
    // Nota: driver_id sigue siendo NOT NULL en el esquema original de Turso.
    // El seed asigna siempre un conductor, así que no se necesita cambiar el constraint.
    console.log('\n📦 routes:');
    await addColumn('routes', 'name', 'TEXT');
    await addColumn('routes', 'shift', 'TEXT');
    await addColumn('routes', 'frequency', 'TEXT');

    console.log('\n✅ Migración completada');
  } finally {
    await prisma.$disconnect();
  }
}

migrate().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
