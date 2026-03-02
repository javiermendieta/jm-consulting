import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar valores P&L
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const periodo = searchParams.get('periodo')
    const tipoVista = searchParams.get('tipoVista') || 'mensual'

    const where: any = { tipoVista }
    if (periodo) where.periodo = periodo

    const valores = await db.pLValor.findMany({
      where,
      include: {
        cuenta: {
          include: {
            nivel: true,
            padre: true
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

// POST - Crear/Actualizar valor P&L (upsert)
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const valor = await db.pLValor.upsert({
      where: {
        cuentaId_periodo_tipoVista: {
          cuentaId: data.cuentaId,
          periodo: data.periodo,
          tipoVista: data.tipoVista
        }
      },
      update: {
        forecastMonto: data.forecastMonto,
        forecastPorcentaje: data.forecastPorcentaje,
        realMonto: data.realMonto,
        realPorcentaje: data.realPorcentaje,
        atribucion: data.atribucion
      },
      create: {
        cuentaId: data.cuentaId,
        periodo: data.periodo,
        tipoVista: data.tipoVista,
        forecastMonto: data.forecastMonto,
        forecastPorcentaje: data.forecastPorcentaje,
        realMonto: data.realMonto,
        realPorcentaje: data.realPorcentaje,
        atribucion: data.atribucion
      }
    })

    return NextResponse.json(valor)
  } catch (error) {
    console.error('Error creating/updating valor PL:', error)
    return NextResponse.json({ error: 'Error al guardar valor P&L' }, { status: 500 })
  }
}
