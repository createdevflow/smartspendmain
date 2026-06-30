const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testExport() {
  const transactions = await prisma.transaction.findMany({
    where: { type: 'EXPENSE', labels: { has: 'TAX_DEDUCTIBLE' } }
  });
  console.log('TAX DEDUCTIBLE TRANSACTIONS:', transactions.length);
  
  if (transactions.length > 0) {
    let totalAmount = 0;
    for(const tx of transactions) {
      totalAmount += Number(tx.amount);
    }
    console.log('Total amount:', totalAmount);
    
    // Try to create a log to see if it fails
    try {
      await prisma.taxExportLog.create({
        data: {
          userId: transactions[0].userId,
          year: 2026,
          txCount: transactions.length,
          totalAmount
        }
      });
      console.log('Log created successfully');
    } catch(e) {
      console.error('Failed to create log:', e);
    }
  }
}
testExport().finally(() => prisma.$disconnect());
