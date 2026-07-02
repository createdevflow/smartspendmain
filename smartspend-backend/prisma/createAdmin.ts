import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@cashtro.in';
  const passwordHash = await bcrypt.hash('admin123', 10);
  
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      role: 'SUPER_ADMIN',
      isAdmin: true,
      passwordHash
    },
    create: {
      email,
      name: 'Super Admin',
      passwordHash,
      role: 'SUPER_ADMIN',
      isAdmin: true,
      isEmailVerified: true
    }
  });
  
  console.log(`✅ Admin user created/updated successfully!`);
  console.log(`Email: ${user.email}`);
  console.log(`Password: admin123`);
  console.log(`Role: ${user.role}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
