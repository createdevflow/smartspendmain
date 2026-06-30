const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'feature_tax_export_active' },
  });
  console.log('setting:', setting);
}

main().catch(console.error).finally(() => prisma.$disconnect());
