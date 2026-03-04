import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Inicializar datos de forecast si no existen
export async function POST() {
  try {
    const resultados: any = {}

    // Crear restaurantes si no existen
    const restaurantesExistentes = await db.restaurante.count()
    if (restaurantesExistentes === 0) {
      const restaurantes = [
        { nombre: 'Restaurante Central', codigo: 'RC', orden: 1 },
        { nombre: 'Sucursal Norte', codigo: 'SN', orden: 2 }
      ]
      for (const r of restaurantes) {
        await db.restaurante.create({ data: r })
      }
      resultados.restaurantes = restaurantes.length
    } else {
      resultados.restaurantes = `${restaurantesExistentes} ya existen`
    }

    // Crear canales si no existen
    const canalesExistentes = await db.canal.count()
    if (canalesExistentes === 0) {
      const canales = [
        { nombre: 'Salón', codigo: 'SALON', orden: 1 },
        { nombre: 'Delivery', codigo: 'DELIVERY', orden: 2 },
        { nombre: 'Takeaway', codigo: 'TAKEAWAY', orden: 3 },
        { nombre: 'Apps', codigo: 'APPS', orden: 4 }
      ]
      for (const c of canales) {
        await db.canal.create({ data: c })
      }
      resultados.canales = canales.length
    } else {
      resultados.canales = `${canalesExistentes} ya existen`
    }

    // Crear turnos si no existen
    const turnosExistentes = await db.turno.count()
    if (turnosExistentes === 0) {
      const turnos = [
        { nombre: 'AM', codigo: 'AM', horaInicio: '08:00', horaFin: '15:00' },
        { nombre: 'PM', codigo: 'PM', horaInicio: '15:00', horaFin: '23:00' }
      ]
      for (const t of turnos) {
        await db.turno.create({ data: t })
      }
      resultados.turnos = turnos.length
    } else {
      resultados.turnos = `${turnosExistentes} ya existen`
    }

    // Crear tipos de día si no existen
    const tiposDiaExistentes = await db.tipoDia.count()
    if (tiposDiaExistentes === 0) {
      const tiposDia = [
        { nombre: 'Normal', codigo: 'NORMAL', color: '#22c55e' },
        { nombre: 'Feriado', codigo: 'FERIADO', color: '#ef4444' },
        { nombre: 'Pre-Feriado', codigo: 'PRE_FERIADO', color: '#eab308' },
        { nombre: 'Post-Feriado', codigo: 'POST_FERIADO', color: '#3b82f6' }
      ]
      for (const t of tiposDia) {
        await db.tipoDia.create({ data: t })
      }
      resultados.tiposDia = tiposDia.length
    } else {
      // Verificar si existe Post-Feriado y crearlo si no
      const postFeriado = await db.tipoDia.findUnique({ where: { codigo: 'POST_FERIADO' } })
      if (!postFeriado) {
        await db.tipoDia.create({
          data: { nombre: 'Post-Feriado', codigo: 'POST_FERIADO', color: '#3b82f6' }
        })
        resultados.tiposDia = 'Post-Feriado agregado'
      } else {
        resultados.tiposDia = `${tiposDiaExistentes} ya existen`
      }
    }

    // Obtener datos actuales
    const counts = {
      restaurantes: await db.restaurante.count(),
      canales: await db.canal.count(),
      turnos: await db.turno.count(),
      tiposDia: await db.tipoDia.count(),
      forecastEntries: await db.forecastEntry.count()
    }

    return NextResponse.json({
      success: true,
      message: 'Datos de forecast verificados/inicializados',
      resultados,
      counts
    })
  } catch (error) {
    console.error('Error inicializando forecast:', error)
    return NextResponse.json({ error: 'Error al inicializar forecast' }, { status: 500 })
  }
}
