import { NextResponse } from 'next/server'

// GET - Debug de variables de entorno (sin mostrar contraseña completa)
export async function GET() {
  const dbUrl = process.env.DATABASE_URL || ''
  const directUrl = process.env.DIRECT_DATABASE_URL || ''
  
  // Ocultar contraseña pero mostrar el host
  const maskPassword = (url: string) => {
    if (!url) return 'NOT_SET'
    try {
      const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@(.+)/)
      if (match) {
        const [, user, pass, host] = match
        const maskedPass = pass ? `${pass.substring(0, 3)}***` : 'none'
        return `postgresql://${user}:${maskedPass}@${host}`
      }
      return url.substring(0, 30) + '...'
    } catch {
      return 'PARSE_ERROR'
    }
  }

  return NextResponse.json({
    environment: process.env.NODE_ENV,
    databaseUrl: maskPassword(dbUrl),
    directUrl: maskPassword(directUrl),
    hasDbUrl: !!dbUrl,
    hasDirectUrl: !!directUrl,
    dbUrlLength: dbUrl.length,
    directUrlLength: directUrl.length,
    // Verificar si tiene pgbouncer
    hasPgBouncer: dbUrl.includes('pgbouncer'),
  })
}
