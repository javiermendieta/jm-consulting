import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Health check de la base de datos
export async function GET() {
  try {
    // Intentar una consulta simple
    const start = Date.now()
    
    // Contar registros de varias tablas
    const counts = {
      niveles: await db.nivelPL.count(),
      cuentas: await db.cuentaPL.count(),
      restaurantes: await db.restaurante.count(),
      canales: await db.canal.count(),
      turnos: await db.turno.count(),
      cashflowCategorias: await db.cashflowCategoria.count(),
      cashflowItems: await db.cashflowItem.count(),
    }
    
    const duration = Date.now() - start
    
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      responseTime: `${duration}ms`,
      counts,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json({
      status: 'error',
      database: 'disconnected',
      error: String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
