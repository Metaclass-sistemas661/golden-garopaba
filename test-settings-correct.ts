import prisma from './src/lib/prisma'

async function main() {
  const settings = await prisma.systemSettings.findMany()
  console.log('Settings in DB:', settings)
}

main().catch(console.error)
