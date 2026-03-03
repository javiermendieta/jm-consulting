import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar entradas de forecast
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fechaInicio = searchParams.get('fechaInicio')
    const fechaFin = searchParams.get('fechaFin')
    const restauranteId = searchParams.get('restauranteId')
    const canalId = searchParams.get('canalId')
    const turnoId = searchParams.get('turnoId')

    if (!fechaInicio || !fechaFin || fechaInicio === 'undefined') {
      return NextResponse.json([])
    }

    const where: any = {
      fecha: {
        gte: new Date(fechaInicio),
        lte: new Date(fechaFin)
      }
    }
    
    if (restauranteId && restauranteId !== 'undefined') where.restauranteId = restauranteId
    if (canalId && canalId !== 'undefined') where.canalId = canalId
    if (turnoId && turnoId !== 'undefined') where.turnoId = turnoId

    const entries = await db.forecastEntry.findMany({
      where,
      orderBy: { fecha: 'asc' }
    })

    return NextResponse.json(entries)
  } catch (error) {
    console.error('Error fetching forecast entries:', error)
    return NextResponse.json([])
  }
}

// POST - Crear/Actualizar entrada de forecast (upsert)
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const fecha = new Date(data.fecha)
    
    // Calcular semana, mes, trimestre, año
    const semana = getWeekNumber(fecha)
    const mes = fecha.getMonth() + 1
    const trimestre = Math.ceil(mes / 3)
    const año = fecha.getFullYear()

    // Buscar tipo de día por defecto si no viene
    let tipoDiaId = data.tipoDiaId
    if (!tipoDiaId) {
      const tipoNormal = await db.tipoDia.findFirst({
        where: { codigo: 'NORMAL' }
      })
      tipoDiaId = tipoNormal?.id
    }

    const entry = await db.forecastEntry.upsert({
      where: {
        fecha_turnoId_restauranteId_canalId: {
          fecha: fecha,
          turnoId: data.turnoId,
          restauranteId: data.restauranteId,
          canalId: data.canalId
        }
      },
      update: {
        tipoDiaId: tipoDiaId,
        paxTeorico: data.paxTeorico ?? null,
        paxReal: data.paxReal ?? null,
        ventaTeorica: data.ventaTeorica ?? null,
        ventaReal: data.ventaReal ?? null
      },
      create: {
        fecha: fecha,
        turnoId: data.turnoId,
        restauranteId: data.restauranteId,
        canalId: data.canalId,
        tipoDiaId: tipoDiaId!,
        paxTeorico: data.paxTeorico ?? null,
        paxReal: data.paxReal ?? null,
        ventaTeorica: data.ventaTeorica ?? null,
        ventaReal: data.ventaReal ?? null,
        semana,
        mes,
        trimestre,
        año
      }
    })

    return NextResponse.json(entry)
  } catch (error) {
    console.error('Error creating/updating forecast entry:', error)
    return NextResponse.json({ error: 'Error al guardar entrada de forecast' }, { status: 500 })
  }
}

// Helper: obtener número de semana
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}
