require('dotenv').config();
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testApi() {
  const user = await prisma.user.findFirst();
  if (!user) return console.log('No user');

  const secret = process.env.JWT_ACCESS_SECRET; // from configuration.ts it's JWT_ACCESS_SECRET
  console.log('Secret exists?', !!secret);
  const token = jwt.sign({ sub: user.id, email: user.email }, secret, { expiresIn: '1h' });
  
  const axios = require('axios');
  try {
    const res = await axios.get('http://127.0.0.1:3000/api/v1/export/tax-report/preview?year=2026', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('API SUCCESS. CSV length:', res.data.data.csv.length);
  } catch (e) {
    console.error('API ERROR:', e.response?.status, e.response?.data || e.message);
  }
}
testApi().finally(() => prisma.$disconnect());
