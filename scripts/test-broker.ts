import prisma from '../src/lib/prisma';
async function run() {
  const b = await prisma.broker.findFirst();
  if (b) {
    console.log("Before:", b.status);
    await prisma.broker.update({ where: { id: b.id }, data: { status: 'INACTIVE' } });
    const b2 = await prisma.broker.findUnique({ where: { id: b.id } });
    console.log("After:", b2?.status);
    await prisma.broker.update({ where: { id: b.id }, data: { status: b.status } });
  }
}
run();
