import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Obtener valores reales desde Cashflow agrupados por cuenta P&L
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mes = parseInt(searchParams.get('mes') || `${new Date().getMonth() + 1}`)
    const anio = parseInt(searchParams.get('anio') || `${new Date().getFullYear()}`)
    const tipoVista = searchParams.get('tipoVista') || 'mensual'

    let fechaInicio: Date
    let fechaFin: Date

    if (tipoVista === 'mensual') {
      fechaInicio = new Date(anio, mes - 1, 1)
      fechaFin = new Date(anio, mes, 0)
    } else if (tipoVista === 'trimestral') {
      const trimestre = Math.ceil(mes / 3)
      fechaInicio = new Date(anio, (trimestre - 1) * 3, 1)
      fechaFin = new Date(anio, trimestre * 3, 0)
    } else {
      fechaInicio = new Date(anio, 0, 1)
      fechaFin = new Date(anio, 11, 31)
    }

    // Obtener todas las cuentas P&L con sus items de cashflow asociados
    const cuentas = await db.cuentaPL.findMany({
      include: {
        nivel: true,
        cashflowItems: {
          include: {
            registros: {
              where: {
                OR: [
                  { fecha: { gte: fechaInicio, lte: fechaFin } },
                  { 
                    AND: [
                      { mes: { gte: fechaInicio.getMonth() + 1 } },
                      { mes: { lte: fechaFin.getMonth() + 1 } },
                      { anio: { gte: fechaInicio.getFullYear() } },
                      { anio: { lte: fechaFin.getFullYear() } }
                    ]
                  }
                ]
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
