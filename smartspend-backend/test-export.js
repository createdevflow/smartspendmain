const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');
const { ExportService } = require('./dist/export/export.service');

async function testExport() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const exportService = app.get(ExportService);
  
  // get a random user
  const { PrismaService } = require('./dist/prisma/prisma.service');
  const prisma = app.get(PrismaService);
  const user = await prisma.user.findFirst();
  
  if (!user) {
    console.log('No user found');
    await app.close();
    return;
  }
  
  try {
    const res = await exportService.generateTaxReport(user.id, 2026);
    console.log('Success! CSV length:', res.csv.length);
  } catch(e) {
    console.error('Error:', e);
  }
  await app.close();
}
testExport();
