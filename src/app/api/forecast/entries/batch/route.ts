import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Guardar múltiples entries de una vez
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { entries, restauranteId } = data
    
    console.log('Batch save - entries recibidas:', entries?.length)
    
    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ error: 'No hay entries para guardar' }, { status: 400 })
    }
    
    if (!restauranteId) {
      return NextResponse.json({ error: 'Falta restauranteId' }, { status: 400 })
    }
    
    // Buscar tipo NORMAL para entries nuevas
    const tipoNormal = await db.tipoDia.findFirst({
      where: { codigo: 'NORMAL' }
    })
    
    const results = []
    
    for (const entry of entries) {
      if (!entry.fecha || !entry.turnoId || !entry.canalId) {
        console.log('Skipping entry con datos faltantes:', entry)
        continue
      }
      
      const fecha = new Date(entry.fecha)
      const semana = getWeekNumber(fecha)
      const mes = fecha.getMonth() + 1
      const trimestre = Math.ceil(mes / 3)
      const año = fecha.getFullYear()
      
      // Determinar tipoDiaId
      let tipoDiaId = entry.tipoDiaId
      if (!tipoDiaId) {
        // Buscar si ya existe para preservar su tipoDiaId
        const existing = await db.forecastEntry.findUnique({
          where: {
            fecha_turnoId_restauranteId_canalId: {
              fecha,
              turnoId: entry.turnoId,
              restauranteId: restauranteId,
              canalId: entry.canalId
            }
          }
        })
        if (existing?.tipoDiaId) {
          tipoDiaId = existing.tipoDiaId
        } else {
          tipoDiaId = tipoNormal?.id
        }
      }
      
      const saved = await db.forecastEntry.upsert({
        where: {
          fecha_turnoId_restauranteId_canalId: {
            fecha,
            turnoId: entry.turnoId,
            restauranteId: restauranteId,
            canalId: entry.canalId
          }
        },
        update: {
          tipoDiaId: tipoDiaId,
          paxTeorico: entry.paxTeorico ?? null,
          paxReal: entry.paxReal ?? null,
          ventaTeorica: entry.ventaTeorica ?? null,
          ventaReal: entry.ventaReal ?? null,
        },
        create: {
          fecha,
          turnoId: entry.turnoId,
          restauranteId: restauranteId,
          canalId: entry.canalId,
          tipoDiaId: tipoDiaId,
          paxTeorico: entry.paxTeorico ?? null,
          paxReal: entry.paxReal ?? null,
          ventaTeorica: entry.ventaTeorica ?? null,
          ventaReal: entry.ventaReal ?? null,
          semana,
          mes,
          trimestre,
          año
        }
      })
      
      results.push(saved)
    }
    
    console.log('Batch save completado - entries guardadas:', results.length)
    
    return NextResponse.json({ 
      success: true, 
      count: results.length,
      message: `Se guardaron ${results.length} entradas correctamente` 
    })
    
  } catch (error: any) {
    console.error('Error in batch save:', error)
    return NextResponse.json({ error: error.message || 'Error al guardar' }, { status: 500 })
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
