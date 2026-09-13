import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

// ---------------------------------------------------------------------------
// Environment validation — fail fast at RUNTIME, not at BUILD time
// ---------------------------------------------------------------------------

function getDatabaseUrl(): string {
  // Prefer DIRECT_URL (no pgbouncer) — correct for server apps with their own pool.
  // Fall back to DATABASE_URL for backwards compatibility.
  const raw = process.env.DIRECT_URL || process.env.DATABASE_URL

  if (!raw) {
    throw new Error(
      '[DATABASE] FATAL: Neither DIRECT_URL nor DATABASE_URL is set. ' +
      'Configure at least DATABASE_URL in apphosting.yaml → env or in your .env file.'
    )
  }

  const source = process.env.DIRECT_URL ? 'DIRECT_URL' : 'DATABASE_URL'

  // Defense-in-depth: strip wrapping quotes that some secret managers inject
  const url = raw.replace(/^"|"$/g, '')

  if (url !== raw) {
    console.warn(
      `[DATABASE] WARNING: ${source} contains wrapping quotes. ` +
      'Fix the secret value in Google Cloud Secret Manager to remove them.'
    )
  }

  if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
    throw new Error(
      `[DATABASE] FATAL: ${source} is not a valid PostgreSQL connection string. ` +
      `Received prefix: "${url.substring(0, 15)}..."`
    )
  }

  // Warn if using pgbouncer with application-level pooling (double pooling)
  if (url.includes('pgbouncer=true') && source === 'DATABASE_URL') {
    console.warn(
      '[DATABASE] WARNING: DATABASE_URL uses pgbouncer (port 6543). ' +
      'This causes double-pooling since the app runs its own pg.Pool. ' +
      'Set DIRECT_URL (port 5432) in apphosting.yaml for optimal performance.'
    )
  }

  return url
}

// ---------------------------------------------------------------------------
// Connection pool factory — tuned for Cloud Run (Firebase App Hosting)
// ---------------------------------------------------------------------------

function createPool(connectionString: string): pg.Pool {
  let url = connectionString

  // Enforce SSL in production — non-negotiable for enterprise
  if (!url.includes('sslmode=')) {
    url += url.includes('?') ? '&sslmode=require' : '?sslmode=require'
  }

  const pool = new pg.Pool({
    connectionString: url,
    // Cloud Run: conservative pool — min 0 for cold starts, max 10 for concurrency
    max: 10,
    min: 0,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    // Let the pool close cleanly when Cloud Run kills the instance
    allowExitOnIdle: true,
  })

  // Surface connection errors — never swallow them
  pool.on('error', (err) => {
    console.error('[DATABASE] Pool error (connection lost or refused):', err.message)
  })

  return pool
}

// ---------------------------------------------------------------------------
// Lazy singleton — PrismaClient is created on FIRST USE, not on import.
// This prevents crashes during `next build` where DATABASE_URL is absent.
// ---------------------------------------------------------------------------

function createPrismaClient(): PrismaClient {
  const connectionString = getDatabaseUrl()
  const pool = createPool(connectionString)
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

declare const globalThis: {
  prismaGlobal: PrismaClient | undefined;
} & typeof global;

const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    // Lazily initialize on first property access
    if (!globalThis.prismaGlobal) {
      globalThis.prismaGlobal = createPrismaClient()
    }
    return Reflect.get(globalThis.prismaGlobal, prop)
  },
})

export default prisma
