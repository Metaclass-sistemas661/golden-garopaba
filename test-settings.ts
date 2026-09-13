import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'
config()

import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const settings = await prisma.systemSettings.findMany()
  console.log('Settings in DB:', settings)
}

main().catch(console.error).finally(() => prisma.$disconnect())
