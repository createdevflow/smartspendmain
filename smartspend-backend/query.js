const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 

async function main() { 
  const txs = await prisma.transaction.findMany({ 
    orderBy: { createdAt: 'desc' }, 
    take: 5, 
    select: { id: true, merchant: true, receiptUrl: true, receiptKey: true } 
  }); 
  console.log(JSON.stringify(txs, null, 2)); 
} 

main().finally(() => prisma.$disconnect());
