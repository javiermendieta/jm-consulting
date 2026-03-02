import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Fix for Supabase PgBouncer - add pgbouncer=true to disable prepared statements
let databaseUrl = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL || ''
if (databaseUrl && !databaseUrl.includes('pgbouncer=')) {
  const separator = databaseUrl.includes('?') ? '&' : '?'
  databaseUrl = `${databaseUrl}${separator}pgbouncer=true`
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
    datasourceUrl: databaseUrl,
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db