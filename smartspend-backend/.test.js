const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.appConfig.update({ where: { key: 'feature_ocr_active' }, data: { teaseMode: true, value: 'false' } }).then(c => {
  console.log('Updated to teaseMode=true', c);
  p.$disconnect();
});
