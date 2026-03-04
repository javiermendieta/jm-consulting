import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Arreglar datos de forecast
export async function POST() {
  try {
    const results: string[] = []

    // 1. Verificar y arreglar tipoDiaId en ForecastEntry
    const entries = await db.forecastEntry.findMany()
    results.push(`Encontrados ${entries.length} registros de ForecastEntry`)

    // Obtener un tipoDia válido
    const tipoDia = await db.tipoDia.findFirst()
    
    if (!tipoDia) {
      // Crear tipoDia si no existe
      const nuevoTipoDia = await db.tipoDia.create({
        data: {
          id: 'td-default',
          nombre: 'Día Normal',
          codigo: 'NORMAL',
          color: '#3B82F6'
        }
      })
      results.push('TipoDia por defecto creado')
      
      // Actualizar todos los ForecastEntry
      await db.forecastEntry.updateMany({
        data: { tipoDiaId: nuevoTipoDia.id }
      })
      results.push('ForecastEntry actualizados con nuevo tipoDia')
    } else {
      // Actualizar todos los ForecastEntry con el tipoDia existente
      await db.forecastEntry.updateMany({
        data: { tipoDiaId: tipoDia.id }
      })
      results.push(`ForecastEntry actualizados con tipoDia: ${tipoDia.nombre}`)
    }

    // 2. Verificar restauranteId
    const restaurante = await db.restaurante.findFirst()
    
    if (!restaurante) {
      const nuevoRestaurante = await db.restaurante.create({
        data: {
          id: 'rest-default',
          nombre: 'Restaurante Principal',
          codigo: 'RP',
          activo: true,
          orden: 1
        }
      })
      results.push('Restaurante por defecto creado')
      
      await db.forecastEntry.updateMany({
        data: { restauranteId: nuevoRestaurante.id }
      })
      results.push('ForecastEntry actualizados con nuevo restaurante')
    } else {
      await db.forecastEntry.updateMany({
        data: { restauranteId: restaurante.id }
      })
      results.push(`ForecastEntry actualizados con restaurante: ${restaurante.nombre}`)
    }

    // 3. Verificar resultados
    const forecastEntries = await db.forecastEntry.count()
    const restaurantes = await db.restaurante.count()
    const tiposDia = await db.tipoDia.count()

    return NextResponse.json({
      success: true,
      results,
      counts: { forecastEntries, restaurantes, tiposDia }
    })

  } catch (error) {
    console.error('Error arreglando forecast:', error)
    return NextResponse.json({
      error: 'Error al arreglar forecast',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET - Verificar estado
export async function GET() {
  try {
    const entries = await db.forecastEntry.findMany({
      include: {
        tipoDia: true,
        restaurante: true,
        turno: true,
        canal: true
      }
    })

    const issues: string[] = []
    
    entries.forEach(entry => {
      if (!entry.tipoDia) issues.push(`Entry ${entry.id} sin tipoDia`)
      if (!entry.restaurante) issues.push(`Entry ${entry.id} sin restaurante`)
      if (!entry.turno) issues.push(`Entry ${entry.id} sin turno`)
      if (!entry.canal) issues.push(`Entry ${entry.id} sin canal`)
    })

    return NextResponse.json({
      total: entries.length,
      issues,
      sample: entries.slice(0, 3).map(e => ({
        id: e.id,
        fecha: e.fecha,
        tipoDia: e.tipoDia?.nombre || 'SIN TIPO',
        restaurante: e.restaurante?.nombre || 'SIN RESTAURANTE'
      }))
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Error verificando forecast',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
