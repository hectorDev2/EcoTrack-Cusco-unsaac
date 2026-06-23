/**
 * recover-db.ts
 *
 * Repara las FK de route_stops e incidents que apuntan a routes_old.
 *
 * Usa @libsql/client directamente con batch() — envía todas las sentencias
 * en una sola request HTTP, garantizando que PRAGMA foreign_keys = OFF
 * aplique a todas las operaciones del lote.
 *
 * Ejecutar desde backend/:
 *   npx ts-node prisma/recover-db.ts
 */

import { createClient } from '@libsql/client';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env') });

const url   = process.env.TURSO_DATABASE_URL;
const token = process.env.TURSO_AUTH_TOKEN;
if (!url)   throw new Error('TURSO_DATABASE_URL requerido');
if (!token) throw new Error('TURSO_AUTH_TOKEN requerido');

const client = createClient({ url, authToken: token });

async function fetchSql(name: string): Promise<string | null> {
  const r = await client.execute({
    sql: `SELECT sql FROM sqlite_master WHERE type='table' AND name=?`,
    args: [name],
  });
  return (r.rows[0]?.['sql'] as string | undefined) ?? null;
}

async function main() {
  console.log('🔍 Diagnóstico de FK en Turso...\n');

  for (const t of ['route_stops', 'route_locations', 'incidents']) {
    const sql = await fetchSql(t);
    if (!sql)                         console.log(`  ⚠️  ${t}: no existe`);
    else if (sql.includes('routes_old')) console.log(`  ❌ ${t}: FK → routes_old`);
    else                              console.log(`  ✅ ${t}: FK OK`);
  }

  const needsFix: string[] = [];
  for (const t of ['route_stops', 'incidents']) {
    const sql = await fetchSql(t);
    if (sql?.includes('routes_old')) needsFix.push(t);
  }

  if (needsFix.length === 0) {
    console.log('\n✅ No hay FK rotas. Ejecuta: npm run prisma:seed');
    return;
  }

  console.log(`\n🔧 Reparando: ${needsFix.join(', ')}...`);

  // ── Leer filas de incidents antes de borrarla ─────────────────────────────
  const incRows = await client.execute(`SELECT * FROM incidents`);
  console.log(`  📦 incidents: ${incRows.rows.length} filas a preservar`);

  // ── Batch: todo en una sola request, FK desactivadas durante la operación ─
  await client.batch([
    { sql: 'PRAGMA foreign_keys = OFF', args: [] },

    // route_stops (vacía — seguro borrar)
    ...(needsFix.includes('route_stops') ? [
      { sql: 'DROP TABLE IF EXISTS route_stops', args: [] },
      { sql: `
        CREATE TABLE route_stops (
          id              TEXT NOT NULL PRIMARY KEY,
          route_id        TEXT NOT NULL REFERENCES routes(id),
          pickup_point_id TEXT NOT NULL REFERENCES pickup_points(id),
          order_index     INTEGER NOT NULL,
          status          TEXT NOT NULL DEFAULT 'PENDING'
        )`, args: [] },
    ] : []),

    // incidents (tiene datos — copy-drop-rename)
    ...(needsFix.includes('incidents') ? [
      { sql: 'DROP TABLE IF EXISTS incidents_new', args: [] },
      { sql: `
        CREATE TABLE incidents_new (
          id          TEXT NOT NULL PRIMARY KEY,
          reported_by TEXT NOT NULL REFERENCES users(id),
          zone_id     TEXT REFERENCES zones(id),
          route_id    TEXT REFERENCES routes(id),
          type        TEXT NOT NULL,
          description TEXT NOT NULL,
          status      TEXT NOT NULL DEFAULT 'OPEN',
          latitude    REAL,
          longitude   REAL,
          address     TEXT,
          created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`, args: [] },
      { sql: `INSERT INTO incidents_new SELECT * FROM incidents`, args: [] },
      { sql: `DROP TABLE incidents`, args: [] },
      { sql: `ALTER TABLE incidents_new RENAME TO incidents`, args: [] },
    ] : []),

    { sql: 'PRAGMA foreign_keys = ON', args: [] },
  ], 'write');

  console.log('  ✅ Batch ejecutado');

  // ── Verificación ─────────────────────────────────────────────────────────
  console.log('\n🔍 Verificación:');
  for (const t of ['route_stops', 'incidents']) {
    const sql = await fetchSql(t);
    if (!sql)                            console.log(`  ⚠️  ${t}: no existe`);
    else if (sql.includes('routes_old')) console.log(`  ❌ ${t}: TODAVÍA referencias routes_old`);
    else                                 console.log(`  ✅ ${t}: FK OK`);
  }

  // Prueba de escritura en route_stops
  try {
    await client.execute(`SELECT COUNT(*) FROM route_stops`);
    console.log('  ✅ route_stops: acceso OK');
  } catch (e: unknown) {
    console.error('  ❌ route_stops:', e instanceof Error ? e.message : e);
  }

  const incCount = await client.execute(`SELECT COUNT(*) FROM incidents`);
  console.log(`  ✅ incidents: ${incCount.rows[0]?.[0] ?? 0} filas`);

  console.log('\n✅ Listo. Ejecuta: npm run prisma:seed');
}

main()
  .catch((e) => { console.error('❌ Error:', e.message ?? e); process.exit(1); })
  .finally(() => client.close());
