import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env') });
const prisma = new PrismaClient({ adapter: new PrismaLibSQL({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! }) });
async function main() {
  const pp = await prisma.pickupPoint.findMany({
    where: { shift: 'MANANA', orderIndex: { gte: 50, lte: 76 } },
    orderBy: { orderIndex: 'asc' },
  });
  for (const p of pp) console.log(p.orderIndex, p.stopType, p.frequencyId, '|', p.name);
}
main().finally(()=>prisma.$disconnect());
