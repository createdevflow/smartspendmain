const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

async function main() {
  const pw = await bcrypt.hash('SuperSecurePassword!123', 10);
  
  await prisma.user.upsert({
    where: { email: 'admin@smartspend.app' },
    update: { 
      role: 'SUPER_ADMIN', 
      passwordHash: pw,
      isEmailVerified: true,
      status: 'ACTIVE'
    },
    create: { 
      email: 'admin@smartspend.app', 
      fullName: 'Super Admin', 
      role: 'SUPER_ADMIN', 
      passwordHash: pw,
      isEmailVerified: true,
      status: 'ACTIVE',
      encryptionKeySalt: 'dummy_salt'
    }
  });
  console.log('Admin user ready');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
