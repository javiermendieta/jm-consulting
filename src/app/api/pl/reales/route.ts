import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Obtener valores reales desde Cashflow agrupados por cuenta P&L
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mes = parseInt(searchParams.get('mes') || '1')
    const anio = parseInt(searchParams.get('anio') || new Date().getFullYear().toString())

    // Obtener todas las cuentas con sus items
    const cuentas = await db.cuentaPL.findMany({
      include: {
        cashflowItems: {
          include: {
            registros: {
              where: { mes, anio }
            }
          }
        }
      }
    })

    // Calcular totales por cuenta
    const result: Record<string, number> = {}
    
    for (const cuenta of cuentas) {
      let total = 0
      for (const item of cuenta.cashflowItems) {
        for (const registro of item.registros) {
          total += registro.monto || 0
        }
      }
      result[cuenta.id] = total
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching reales:', error)
    return NextResponse.json({})
  }
}
