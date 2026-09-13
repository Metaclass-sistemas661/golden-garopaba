import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  let connectionString = process.env.DATABASE_URL?.replace(/^"|"$/g, '') || ''
  if (connectionString && !connectionString.includes('sslmode=')) {
    connectionString += connectionString.includes('?') ? '&sslmode=require' : '?sslmode=require'
  }
  
  return new PrismaClient({
    datasources: {
      db: {
        url: connectionString,
      },
    },
  })
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
