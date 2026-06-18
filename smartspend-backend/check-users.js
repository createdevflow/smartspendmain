const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { email: true, role: true, status: true, deletedAt: true }});
  console.log(JSON.stringify(users, null, 2));
}

main().finally(() => prisma.$disconnect());
