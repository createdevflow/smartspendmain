const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.systemSetting.update({
    where: { key: 'feature_tax_export_active' },
    data: { value: 'true' }
  });
  console.log('Updated feature_tax_export_active to true');
}

main().catch(console.error).finally(() => prisma.$disconnect());
