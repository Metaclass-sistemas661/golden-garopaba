import prisma from '../src/lib/prisma';
async function run() {
  const props = await prisma.property.findMany({ select: { title: true, featured: true, status: true } });
  console.log(JSON.stringify(props, null, 2));
}
run();
