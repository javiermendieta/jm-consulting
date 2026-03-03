import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Usar DATABASE_URL (puerto 6543 con pgbouncer) para conexiones desde Vercel
const databaseUrl = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL || ''

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
    datasourceUrl: databaseUrl,
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
