// Carrega variáveis de ambiente do .env para o Prisma CLI (que roda fora do Next.js)
import { config } from 'dotenv'
config()

import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Usa DIRECT_URL (porta 5432, sem pgbouncer) quando disponível — ideal para Prisma CLI.
    // Falls back to DATABASE_URL para ambientes onde DIRECT_URL não está configurado.
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || '',
  },
})
