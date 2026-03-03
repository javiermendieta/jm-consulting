import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Generar entradas de forecast para un período
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { fechaInicio, fechaFin, restauranteId, canalId, turnoId } = data

    if (!fechaInicio || !fechaFin) {
      return NextResponse.json({ error: 'Fechas requeridas' }, { status: 400 })
    }

    // Obtener datos maestros
    let restaurantes = restauranteId 
      ? await db.restaurante.findMany({ where: { id: restauranteId } })
      : await db.restaurante.findMany()
    
    let canales = canalId
      ? await db.canal.findMany({ where: { id: canalId } })
      : await db.canal.findMany()
    
    let turnos = turnoId
      ? await db.turno.findMany({ where: { id: turnoId } })
      : await db.turno.findMany()

    const tiposDia = await db.tipoDia.findMany()

    if (restaurantes.length === 0 || canales.length === 0 || turnos.length === 0) {
      return NextResponse.json({ error: 'Faltan datos maestros' }, { status: 400 })
    }

    // Tipo de día por defecto
    const tipoNormal = tiposDia.find(t => t.codigo === 'NORMAL') || tiposDia[0]

    if (!tipoNormal) {
      return NextResponse.json({ error: 'No hay tipo de día configurado' }, { status: 400 })
    }

    const start = new Date(fechaInicio)
    const end = new Date(fechaFin)
    
    let creados = 0
    let errores = 0

    // Iterar por cada día del período
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const fecha = new Date(d)
      const semana = getWeekNumber(fecha)
      const mes = fecha.getMonth() + 1
      const trimestre = Math.ceil(mes / 3)
      const año = fecha.getFullYear()

      // Para cada combinación restaurante/canal/turno
      for (const restaurante of restaurantes) {
        for (const canal of canales) {
          for (const turno of turnos) {
            try {
              // Intentar crear (si ya existe, ignorar)
              await db.forecastEntry.create({
                data: {
                  fecha,
                  turnoId: turno.id,
                  restauranteId: restaurante.id,
                  canalId: canal.id,
                  tipoDiaId: tipoNormal.id,
                  semana,
                  mes,
                  trimestre,
                  año
                }
              })
              creados++
            } catch (e: any) {
              // Si ya existe (unique constraint), es normal
              if (e.code !== 'P2002') {
                errores++
              }
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Entradas generadas: ${creados} nuevas${errores > 0 ? `, ${errores} errores` : ''}`,
      creados,
      errores
    })
  } catch (error) {
    console.error('Error generando forecast:', error)
    return NextResponse.json({ error: 'Error al generar entradas de forecast' }, { status: 500 })
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
