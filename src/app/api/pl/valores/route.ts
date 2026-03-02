import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar valores P&L
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const periodo = searchParams.get('periodo')
    const tipoVista = searchParams.get('tipoVista') || 'mensual'
    const cuentaId = searchParams.get('cuentaId')

    const where: any = { tipoVista }
    if (periodo) where.periodo = periodo
    if (cuentaId) where.cuentaId = cuentaId

    const valores = await db.pLValor.findMany({
      where,
      include: {
        cuenta: {
          include: {
            nivel: true
          }
        }
      }
    })

    return NextResponse.json(valores)
  } catch (error) {
    console.error('Error fetching valores PL:', error)
    return NextResponse.json({ error: 'Error al obtener valores P&L' }, { status: 500 })
  }
}

// POST - Crear/Actualizar valor P&L (upsert manual)
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Buscar si existe un valor con estos parámetros
    const existing = await db.pLValor.findFirst({
      where: {
        cuentaId: data.cuentaId,
        periodo: data.periodo,
        tipoVista: data.tipoVista,
        cashflowItemId: data.cashflowItemId || null
      }
    })

    let valor
    if (existing) {
      valor = await db.pLValor.update({
        where: { id: existing.id },
        data: {
          forecastMonto: data.forecastMonto,
          forecastPorcentaje: data.forecastPorcentaje,
          realMonto: data.realMonto,
          realPorcentaje: data.realPorcentaje,
          atribucion: data.atribucion
        }
      })
    } else {
      valor = await db.pLValor.create({
        data: {
          cuentaId: data.cuentaId,
          cashflowItemId: data.cashflowItemId || null,
          periodo: data.periodo,
          tipoVista: data.tipoVista,
          forecastMonto: data.forecastMonto,
          forecastPorcentaje: data.forecastPorcentaje,
          realMonto: data.realMonto,
          realPorcentaje: data.realPorcentaje,
          atribucion: data.atribucion
        }
      })
    }

    return NextResponse.json(valor)
  } catch (error) {
    console.error('Error creating/updating valor PL:', error)
    return NextResponse.json({ error: 'Error al guardar valor P&L' }, { status: 500 })
  }
}
