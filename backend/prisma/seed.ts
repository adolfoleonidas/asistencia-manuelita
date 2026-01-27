import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create default admin user
  // Password meets policy: min 8 chars, uppercase, lowercase, number
  const passwordHash = await bcrypt.hash('Admin123', 12);

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash,
      nombre: 'Administrador Principal',
      rol: 'super_admin',
      activo: true,
    },
  });

  // Create default system config
  await prisma.systemConfig.upsert({
    where: { key: 'sheets_sync_enabled' },
    update: {},
    create: {
      key: 'sheets_sync_enabled',
      value: 'false',
    },
  });

  console.log('Seed completed: default admin user and system config created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
