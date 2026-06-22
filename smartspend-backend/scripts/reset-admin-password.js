const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('SuperSecurePassword!123', 10);
  await prisma.user.updateMany({
    where: { role: 'SUPER_ADMIN' },
    data: { passwordHash: hash }
  });
  console.log('Successfully reset local SUPER_ADMIN password to: SuperSecurePassword!123');
  await prisma.$disconnect();
}
main().catch(console.error);
