import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Inicializar datos de forecast
export async function POST() {
  try {
    console.log('Iniciando seed de forecast...')

    // 1. Crear restaurantes si no existen
    const restaurantesExistentes = await db.restaurante.count()
    let restaurantesCreados = 0

    if (restaurantesExistentes === 0) {
      const restaurantes = [
        { id: 'rest-1', nombre: 'Local Principal', codigo: 'LP', activo: true, orden: 1 },
        { id: 'rest-2', nombre: 'Sucursal Centro', codigo: 'SC', activo: true, orden: 2 },
      ]

      for (const r of restaurantes) {
        try {
          await db.restaurante.create({ data: r })
          restaurantesCreados++
        } catch (e) {
          console.log(`Restaurante ${r.nombre} ya existe`)
        }
      }
    }
    console.log(`✓ ${restaurantesCreados} restaurantes creados`)

    // 2. Crear tipos de día si no existen
    const tiposDiaExistentes = await db.tipoDia.count()
    let tiposDiaCreados = 0

    if (tiposDiaExistentes === 0) {
      const tiposDia = [
        { id: 'td-1', nombre: 'Día Normal', codigo: 'NORMAL', color: '#3B82F6' },
        { id: 'td-2', nombre: 'Fin de Semana', codigo: 'FINDE', color: '#10B981' },
        { id: 'td-3', nombre: 'Feriado', codigo: 'FERIADO', color: '#F59E0B' },
        { id: 'td-4', nombre: 'Especial', codigo: 'ESPECIAL', color: '#EF4444' },
      ]

      for (const td of tiposDia) {
        try {
          await db.tipoDia.create({ data: td })
          tiposDiaCreados++
        } catch (e) {
          console.log(`Tipo día ${td.nombre} ya existe`)
        }
      }
    }
    console.log(`✓ ${tiposDiaCreados} tipos de día creados`)

    // Verificar resultados
    const [restaurantes, turnos, canales, tiposDia] = await Promise.all([
      db.restaurante.count(),
      db.turno.count(),
      db.canal.count(),
      db.tipoDia.count()
    ])

    return NextResponse.json({
      success: true,
      message: 'Forecast inicializado correctamente',
      data: {
        restaurantes,
        turnos,
        canales,
        tiposDia,
        restaurantesCreados,
        tiposDiaCreados
      }
    })
  } catch (error) {
    console.error('Error en seed forecast:', error)
    return NextResponse.json({
      error: 'Error al inicializar forecast',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET - Verificar estado
export async function GET() {
  try {
    const [restaurantes, turnos, canales, tiposDia, entries] = await Promise.all([
      db.restaurante.count(),
      db.turno.count(),
      db.canal.count(),
      db.tipoDia.count(),
      db.forecastEntry.count()
    ])

    return NextResponse.json({
      initialized: restaurantes > 0,
      counts: { restaurantes, turnos, canales, tiposDia, entries }
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Error al verificar forecast',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
