import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Crear todas las tablas necesarias (seed inicial)
export async function POST() {
  try {
    const results: any = {}

    // 1. Crear niveles P&L
    const nivelesExistentes = await db.nivelPL.count()
    if (nivelesExistentes === 0) {
      const niveles = [
        { codigo: 'VB', nombre: 'VENTA BRUTA', orden: 1 },
        { codigo: 'CV', nombre: 'COSTO DE VENTA', orden: 2 },
        { codigo: 'VN', nombre: 'VENTA NETA', orden: 3 },
        { codigo: 'CMV', nombre: 'CMV', orden: 4 },
        { codigo: 'CM', nombre: 'CONTRIBUCIÓN MARGINAL', orden: 5 },
        { codigo: 'GO', nombre: 'GASTOS OPERATIVOS', orden: 6 },
        { codigo: 'PF', nombre: 'PROFIT', orden: 7 }
      ]
      for (const nivel of niveles) {
        await db.nivelPL.create({ data: nivel })
      }
      results.niveles = niveles.length
    }

    // 2. Crear categorías de cashflow
    const categoriasExistentes = await db.cashflowCategoria.count()
    if (categoriasExistentes === 0) {
      const categorias = [
        { nombre: 'Ventas', tipo: 'ingreso', orden: 1 },
        { nombre: 'Costo de Ventas', tipo: 'egreso', orden: 2 },
        { nombre: 'Gastos de Personal', tipo: 'egreso', orden: 3 },
        { nombre: 'Gastos Operativos', tipo: 'egreso', orden: 4 },
        { nombre: 'Impuestos', tipo: 'egreso', orden: 5 }
      ]
      for (const cat of categorias) {
        await db.cashflowCategoria.create({ data: cat })
      }
      results.categorias = categorias.length
    }

    // 3. Crear restaurantes
    const restaurantesExistentes = await db.restaurante.count()
    if (restaurantesExistentes === 0) {
      const restaurantes = [
        { nombre: 'Restaurante Central', codigo: 'RC', orden: 1 }
      ]
      for (const r of restaurantes) {
        await db.restaurante.create({ data: r })
      }
      results.restaurantes = restaurantes.length
    }

    // 4. Crear canales
    const canalesExistentes = await db.canal.count()
    if (canalesExistentes === 0) {
      const canales = [
        { nombre: 'Salón', codigo: 'SALON', orden: 1 },
        { nombre: 'Delivery', codigo: 'DELIVERY', orden: 2 },
        { nombre: 'Takeaway', codigo: 'TAKEAWAY', orden: 3 }
      ]
      for (const c of canales) {
        await db.canal.create({ data: c })
      }
      results.canales = canales.length
    }

    // 5. Crear turnos
    const turnosExistentes = await db.turno.count()
    if (turnosExistentes === 0) {
      const turnos = [
        { nombre: 'AM', codigo: 'AM', horaInicio: '08:00', horaFin: '15:00' },
        { nombre: 'PM', codigo: 'PM', horaInicio: '15:00', horaFin: '23:00' }
      ]
      for (const t of turnos) {
        await db.turno.create({ data: t })
      }
      results.turnos = turnos.length
    }

    // 6. Crear tipos de día
    const tiposDiaExistentes = await db.tipoDia.count()
    if (tiposDiaExistentes === 0) {
      const tiposDia = [
        { nombre: 'Normal', codigo: 'NORMAL', color: '#22c55e' },
        { nombre: 'Feriado', codigo: 'FERIADO', color: '#ef4444' },
        { nombre: 'Pre-Feriado', codigo: 'PRE_FERIADO', color: '#eab308' }
      ]
      for (const t of tiposDia) {
        await db.tipoDia.create({ data: t })
      }
      results.tiposDia = tiposDia.length
    }

    // Obtener conteos finales
    const counts = {
      niveles: await db.nivelPL.count(),
      cuentas: await db.cuentaPL.count(),
      categorias: await db.cashflowCategoria.count(),
      items: await db.cashflowItem.count(),
      restaurantes: await db.restaurante.count(),
      canales: await db.canal.count(),
      turnos: await db.turno.count(),
      tiposDia: await db.tipoDia.count()
    }

    return NextResponse.json({
      success: true,
      message: 'Base de datos inicializada correctamente',
      created: results,
      counts
    })
  } catch (error) {
    console.error('Error en setup:', error)
    return NextResponse.json({
      error: 'Error al inicializar base de datos',
      details: String(error)
    }, { status: 500 })
  }
}
