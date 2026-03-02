import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Obtener valores reales desde Cashflow agrupados por cuenta P&L
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mes = parseInt(searchParams.get('mes') || `${new Date().getMonth() + 1}`)
    const anio = parseInt(searchParams.get('anio') || `${new Date().getFullYear()}`)

    // Obtener todas las cuentas P&L con sus items de cashflow
    const cuentas = await db.cuentaPL.findMany({
      include: {
        cashflowItems: {
          include: {
            registros: {
              where: {
                mes: mes,
                anio: anio
              }
            }
          }
        }
      }
    })

    // Calcular totales por cuenta
    const valoresReales: Record<string, number> = {}
    
    for (const cuenta of cuentas) {
      const total = cuenta.cashflowItems.reduce((sum, item) => {
        return sum + item.registros.reduce((s, r) => s + (r.monto || 0), 0)
      }, 0)
      valoresReales[cuenta.id] = total
    }

    return NextResponse.json(valoresReales)
  } catch (error) {
    console.error('Error fetching valores reales:', error)
    return NextResponse.json({ error: 'Error al obtener valores reales' }, { status: 500 })
  }
}
