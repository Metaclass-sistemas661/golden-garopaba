const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const p = await prisma.property.findUnique({ where: { code: 'REF2703' } });
  console.log(p);
}

main().catch(console.error).finally(() => prisma.$disconnect());
