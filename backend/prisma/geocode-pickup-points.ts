/**
 * geocode-pickup-points.ts
 *
 * Corrige las coordenadas de los pickup_points que quedaron con el valor
 * "placeholder" del seed (-13.5300, -71.9565) o duplicadas entre sí —
 * geocodifica su dirección real vía Nominatim (OpenStreetMap) y actualiza
 * solo esos registros. Los puntos que ya tienen una coordenada única no se
 * tocan.
 *
 * Antes de escribir nada, guarda un backup de (id, name, lat, lng) en
 * geocode-backup.json para poder revertir si algo sale mal.
 *
 * Ejecutar con: npx ts-node prisma/geocode-pickup-points.ts
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

// Bounding box de Wanchaq (con margen) — más ajustado que "todo Cusco":
// evita aceptar un match de un homónimo en otro distrito/provincia (p. ej.
// una "Costanera" o "Tupac Amaru" que existe en varios lugares de Cusco).
// Obtenido consultando "Wanchaq, Cusco, Perú" en Nominatim y agregando
// ~0.02° (~2 km) de margen para no descartar paradas justo en el borde.
const WANCHAQ_BOUNDS = { minLat: -13.5606, maxLat: -13.4998, minLng: -71.9937, maxLng: -71.9185 };

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const REQUEST_DELAY_MS = 1100; // Nominatim: máx. ~1 req/seg

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Nominatim entiende mejor los nombres de calle expandidos que las
// abreviaturas típicas de estas direcciones ("JR." casi nunca matchea,
// "Jirón" sí).
const ABBREVIATIONS: [RegExp, string][] = [
  [/\bAV\.?\b/gi, 'Avenida'],
  [/\bJR\.?\b/gi, 'Jirón'],
  [/\bURB\.?\b/gi, 'Urbanización'],
  [/\bPSJE?\.?\b/gi, 'Pasaje'],
  [/\bPJ\.?\b/gi, 'Pasaje'],
  [/\bPZA\.?\b/gi, 'Plaza'],
  [/\bAPV\.?\b/gi, 'Urbanización'],
  [/\bCCHH\.?\b/gi, ''],
];

function cleanAddress(raw: string): string {
  // Quita el prefijo "[HH:MM]" que varios nombres traen pegado (es un
  // horario, no parte de la dirección).
  return raw.replace(/^\[\d{2}:\d{2}\]\s*/, '').trim();
}

function expandAbbreviations(address: string): string {
  let out = address;
  for (const [pattern, replacement] of ABBREVIATIONS) {
    out = out.replace(pattern, replacement);
  }
  return out.replace(/\s+/g, ' ').trim();
}

function withoutParenthetical(address: string): string {
  return address.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
}

// Quita las palabras de tipo-de-vía (AV./JR./URB./etc, sin expandir) — en
// las pruebas, Nominatim matcheaba MEJOR el nombre "pelado" de la calle
// ("Tomasa Ttito Condemayta") que con el tipo de vía adelante ("Avenida
// Tomasa Ttito Condemayta"), sobre todo combinado con el distrito.
function stripRoadType(address: string): string {
  return address
    .replace(/\b(AV\.?|AVENIDA|JR\.?|JIRON|JIRÓN|URB\.?|URBANIZACION|URBANIZACIÓN|PSJE?\.?|PASAJE|PJ\.?|PZA\.?|PLAZA|APV\.?|CCHH\.?|CALLE)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Muchas direcciones son en realidad varios lugares/calles pegados con
// comas, guiones o "Y" ("AV TUPAC AMARU, ESPINAR JR. CANAS...", "AV LOS
// INCAS - AV MICAELA BASTIDAS", "AV LIBERTAD AV. PERU AV. COSQO") — separar
// en segmentos y geocodificar cada uno por separado da mucho mejor resultado
// que la cadena completa (que el geocoder no puede interpretar).
function splitSegments(address: string): string[] {
  return address
    .split(/,|(?:\s+-\s+)|(?:\bY\b)/i)
    .map((s) => s.trim())
    .filter((s) => s.length >= 4);
}

async function nominatimSearch(query: string): Promise<{ lat: number; lng: number } | null> {
  const url = `${NOMINATIM_URL}?format=json&limit=1&countrycodes=pe&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'EcoTrackWanchaq-DataFix/1.0 (uso interno, corrigiendo coordenadas de vertederos)',
      'Accept-Language': 'es',
    },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { lat: string; lon: string }[];
  if (!data.length) return null;
  const lat = parseFloat(data[0].lat);
  const lng = parseFloat(data[0].lon);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  if (lat < WANCHAQ_BOUNDS.minLat || lat > WANCHAQ_BOUNDS.maxLat || lng < WANCHAQ_BOUNDS.minLng || lng > WANCHAQ_BOUNDS.maxLng) {
    return null; // fuera de Wanchaq — probablemente un homónimo en otro distrito, no confiar
  }
  return { lat, lng };
}

const MIN_QUERY_LEN = 4;

/** Variantes de consulta para UN segmento de dirección, de más a menos específica. */
function attemptsForSegment(segment: string): string[] {
  const bare = stripRoadType(segment);
  const expanded = expandAbbreviations(segment);
  return [
    `${bare}, Wanchaq, Cusco, Perú`,
    `${expanded}, Wanchaq, Cusco, Perú`,
    `${bare}, Cusco, Perú`,
  ].filter((q) => {
    const head = q.split(',')[0].trim();
    return head.length >= MIN_QUERY_LEN;
  });
}

/**
 * Intenta geocodificar una dirección probando, en orden: la dirección
 * completa, y luego cada segmento por separado (las direcciones compuestas
 * tipo "AV LIBERTAD AV. PERU AV. COSQO" no las interpreta Nominatim como un
 * todo, pero sí cada calle suelta). Siempre valida contra WANCHAQ_BOUNDS.
 */
async function geocode(rawAddress: string): Promise<{ lat: number; lng: number } | null> {
  const cleaned = withoutParenthetical(cleanAddress(rawAddress));
  const segments = [cleaned, ...splitSegments(cleaned)];
  // De-duplicar manteniendo orden (el string completo puede coincidir con
  // su único segmento si no había separadores).
  const seen = new Set<string>();
  const uniqueSegments = segments.filter((s) => {
    const key = s.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  let first = true;
  for (const segment of uniqueSegments) {
    for (const query of attemptsForSegment(segment)) {
      if (!first) await sleep(REQUEST_DELAY_MS);
      first = false;
      const result = await nominatimSearch(query);
      if (result) return result;
    }
  }
  return null;
}

async function main() {
  loadEnv();
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!tursoUrl || !authToken) {
    console.error('❌ Faltan TURSO_DATABASE_URL / TURSO_AUTH_TOKEN en .env');
    process.exit(1);
  }

  const prisma = new PrismaClient({
    adapter: new PrismaLibSQL({ url: tursoUrl, authToken }),
  });

  const points = await prisma.pickupPoint.findMany({
    select: { id: true, name: true, address: true, latitude: true, longitude: true },
  });
  console.log(`Total de vertederos: ${points.length}`);

  // Se reintenta un punto si: (a) sigue exactamente en el placeholder del
  // seed, o (b) su coordenada actual cae FUERA de Wanchaq (como el caso
  // "AV. COSTANERA" que la primera pasada emparejó con un homónimo lejano).
  // Los duplicados legítimos (mismo punto real, distintos horarios) que ya
  // caen dentro de Wanchaq NO se reprocesan — ya están bien y evita gastar
  // de más en la API de geocoding.
  const isPlaceholder = (p: (typeof points)[number]) =>
    Math.abs(p.latitude - -13.53) < 1e-6 && Math.abs(p.longitude - -71.9565) < 1e-6;
  const isOutsideWanchaq = (p: (typeof points)[number]) =>
    p.latitude < WANCHAQ_BOUNDS.minLat ||
    p.latitude > WANCHAQ_BOUNDS.maxLat ||
    p.longitude < WANCHAQ_BOUNDS.minLng ||
    p.longitude > WANCHAQ_BOUNDS.maxLng;

  const toFix = points.filter((p) => isPlaceholder(p) || isOutsideWanchaq(p));
  console.log(`Vertederos a (re)geocodificar: ${toFix.length}`);

  if (toFix.length === 0) {
    console.log('Nada que corregir.');
    await prisma.$disconnect();
    return;
  }

  const backupPath = path.resolve(__dirname, `geocode-backup-${Date.now()}.json`);
  fs.writeFileSync(
    backupPath,
    JSON.stringify(
      toFix.map((p) => ({ id: p.id, name: p.name, latitude: p.latitude, longitude: p.longitude })),
      null,
      2,
    ),
  );
  console.log(`Backup guardado en ${backupPath}`);

  let updated = 0;
  let failed: string[] = [];

  for (let i = 0; i < toFix.length; i++) {
    const p = toFix[i];
    const address = cleanAddress(p.address || p.name);

    process.stdout.write(`[${i + 1}/${toFix.length}] ${address} ... `);
    try {
      const result = await geocode(address);
      if (result) {
        await prisma.pickupPoint.update({
          where: { id: p.id },
          data: { latitude: result.lat, longitude: result.lng },
        });
        console.log(`OK -> ${result.lat}, ${result.lng}`);
        updated++;
      } else {
        console.log('SIN MATCH (se deja igual)');
        failed.push(p.name);
      }
    } catch (err) {
      console.log(`ERROR: ${err instanceof Error ? err.message : err}`);
      failed.push(p.name);
    }
    await sleep(REQUEST_DELAY_MS);
  }

  console.log('\n--- Resumen ---');
  console.log(`Actualizados: ${updated}`);
  console.log(`Sin match / error: ${failed.length}`);
  if (failed.length > 0) {
    console.log('Pendientes de revisión manual:');
    failed.forEach((n) => console.log(`  - ${n}`));
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
