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
    if (!process.env[key]) {
      process.env[key] = val;
    }
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

  try {
    await prisma.$connect();
    console.log('✅ Conectado');

    const columns = ['latitude', 'longitude', 'address'];
    for (const col of columns) {
      const sql =
        col === 'address'
          ? `ALTER TABLE incidents ADD COLUMN ${col} TEXT;`
          : `ALTER TABLE incidents ADD COLUMN ${col} REAL;`;

      try {
        await prisma.$executeRawUnsafe(sql);
        console.log(`  ✅ Columna "${col}" agregada`);
      } catch (e: any) {
        if (e.message?.includes('duplicate column')) {
          console.log(`  ⏭️  Columna "${col}" ya existe`);
        } else {
          throw e;
        }
      }
    }

    console.log('✅ Migración completada');
  } finally {
    await prisma.$disconnect();
  }
}

migrate().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
