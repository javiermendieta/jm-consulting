import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Test basic connection
    const niveles = await db.nivelPL.findMany({
      take: 5,
      orderBy: { orden: 'asc' }
    })
    
    const cuentasCount = await db.cuentaPL.count()
    const itemsCount = await db.cashflowItem.count()
    const entriesCount = await db.cashflowEntry.count()
    
    return NextResponse.json({
      status: 'connected',
      counts: {
        niveles: niveles.length,
        cuentas: cuentasCount,
        items: itemsCount,
        entries: entriesCount
      },
      sampleNiveles: niveles.map(n => ({ id: n.id, codigo: n.codigo, nombre: n.nombre }))
    })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
