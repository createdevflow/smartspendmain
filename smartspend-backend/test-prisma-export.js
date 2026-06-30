const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testExport() {
  const user = await prisma.user.findFirst();
  if (!user) return console.log('No user');

  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        type: 'EXPENSE',
        labels: { has: 'TAX_DEDUCTIBLE' },
        deletedAt: null,
      }
    });

    let totalAmount = 0;
    for (const tx of transactions) {
      totalAmount += Number(tx.amount);
    }
    console.log('Found txs:', transactions.length, 'Total Amount:', totalAmount);
    
    // Test creating log
    const log = await prisma.taxExportLog.create({
      data: {
        userId: user.id,
        year: 2026,
        txCount: transactions.length,
        totalAmount,
      }
    });
    console.log('Created log:', log);
  } catch (e) {
    console.error('ERROR:', e);
  }
}
testExport().finally(() => prisma.$disconnect());
