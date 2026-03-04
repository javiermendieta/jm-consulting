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

    // Parsear fechas como UTC para evitar problemas de timezone
    // Si viene como '2026-03-01', crear fecha UTC
    const parseDate = (dateStr: string) => {
      if (dateStr.includes('T')) {
        return new Date(dateStr)
      }
      // Crear fecha como UTC mediodía para evitar timezone issues
      const [year, month, day] = dateStr.split('-').map(Number)
      return new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
    }

    const where: any = {
      fecha: {
        gte: parseDate(fechaInicio),
        lte: parseDate(fechaFin)
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
    
    console.log('POST forecast/entries - data recibida:', data)
    
    if (!data.fecha || !data.turnoId || !data.restauranteId || !data.canalId) {
      console.error('Faltan datos requeridos:', { 
        fecha: data.fecha, 
        turnoId: data.turnoId, 
        restauranteId: data.restauranteId, 
        canalId: data.canalId 
      })
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
    }
    
    // Parsear fecha como UTC para evitar timezone issues
    let fecha: Date
    if (typeof data.fecha === 'string') {
      if (data.fecha.includes('T')) {
        fecha = new Date(data.fecha)
      } else {
        // Crear fecha como UTC mediodía
        const [year, month, day] = data.fecha.split('-').map(Number)
        fecha = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
      }
    } else {
      fecha = new Date(data.fecha)
    }
    
    // Calcular semana, mes, trimestre, año en UTC para consistencia
    const semana = getWeekNumber(fecha)
    const mes = fecha.getUTCMonth() + 1
    const trimestre = Math.ceil(mes / 3)
    const año = fecha.getUTCFullYear()

    // Buscar entry existente para preservar tipoDiaId si no viene explícitamente
    const existingEntry = await db.forecastEntry.findUnique({
      where: {
        fecha_turnoId_restauranteId_canalId: {
          fecha: fecha,
          turnoId: data.turnoId,
          restauranteId: data.restauranteId,
          canalId: data.canalId
        }
      }
    })
    
    // Determinar tipoDiaId:
    // 1. Si viene explícitamente en el request, usarlo
    // 2. Si existe entry previo, preservar su tipoDiaId
    // 3. Si es nuevo, usar NORMAL por defecto
    let tipoDiaId = data.tipoDiaId
    if (!tipoDiaId) {
      if (existingEntry?.tipoDiaId) {
        tipoDiaId = existingEntry.tipoDiaId
        console.log('Preservando tipoDiaId existente:', tipoDiaId)
      } else {
        const tipoNormal = await db.tipoDia.findFirst({
          where: { codigo: 'NORMAL' }
        })
        tipoDiaId = tipoNormal?.id
        console.log('Usando tipo NORMAL para nuevo entry:', tipoDiaId)
      }
    }
    
    if (!tipoDiaId) {
      console.error('No se encontró tipo de día')
      return NextResponse.json({ error: 'No se encontró tipo de día' }, { status: 500 })
    }

    console.log('Upsert con:', {
      fecha,
      turnoId: data.turnoId,
      restauranteId: data.restauranteId,
      canalId: data.canalId,
      tipoDiaId,
      existingTipoDiaId: existingEntry?.tipoDiaId
    })

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
        // Solo actualizar tipoDiaId si viene explícitamente en el request
        ...(data.tipoDiaId ? { tipoDiaId: data.tipoDiaId } : {}),
        paxTeorico: data.paxTeorico !== undefined ? (data.paxTeorico || null) : undefined,
        paxReal: data.paxReal !== undefined ? (data.paxReal || null) : undefined,
        ventaTeorica: data.ventaTeorica !== undefined ? (data.ventaTeorica || null) : undefined,
        ventaReal: data.ventaReal !== undefined ? (data.ventaReal || null) : undefined,
      },
      create: {
        fecha: fecha,
        turnoId: data.turnoId,
        restauranteId: data.restauranteId,
        canalId: data.canalId,
        tipoDiaId: tipoDiaId,
        paxTeorico: data.paxTeorico || null,
        paxReal: data.paxReal || null,
        ventaTeorica: data.ventaTeorica || null,
        ventaReal: data.ventaReal || null,
        semana,
        mes,
        trimestre,
        año
      }
    })

    console.log('Entry guardada:', entry)

    return NextResponse.json(entry)
  } catch (error: any) {
    console.error('Error creating/updating forecast entry:', error)
    return NextResponse.json({ error: error.message || 'Error al guardar entrada de forecast' }, { status: 500 })
  }
}

// Helper: obtener número de semana (usando UTC consistentemente)
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}
