import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('123456', 10);
  const now = new Date().toISOString();

  const users = [
    {
      email: 'admin@terracivic.pe',
      passwordHash,
      fullName: 'Admin Eco Track Cusco',
      role: 'ADMIN',
      status: 'ACTIVE',
      createdAt: now,
    },
    {
      email: 'conductor@terracivic.pe',
      passwordHash,
      fullName: 'Carlos Conductor',
      role: 'DRIVER',
      status: 'ACTIVE',
      createdAt: now,
    },
    {
      email: 'ciudadano@terracivic.pe',
      passwordHash,
      fullName: 'María Ciudadano',
      role: 'CITIZEN',
      status: 'ACTIVE',
      createdAt: now,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
    console.log(`✅ Usuario ${user.email} (${user.role}) creado/verificado`);
  }

  console.log('\n🎉 Seed completado. Usuarios por defecto:');
  console.log('   admin@terracivic.pe / 123456 (Administrador)');
  console.log('   conductor@terracivic.pe / 123456 (Conductor)');
  console.log('   ciudadano@terracivic.pe / 123456 (Ciudadano)');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
