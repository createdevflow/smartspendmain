const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.mediaAsset.findFirst({where: {module: 'chat'}}).then(console.log).finally(() => prisma.$disconnect());
