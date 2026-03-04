import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Diagnóstico para un registro específico: domingo 1.3.26, canal salón, turno PM
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get('fecha') || '2026-03-01'
    
    // 1. Buscar el turno PM y canal Salón
    const [turnoPM, canalSalon] = await Promise.all([
      db.turno.findFirst({ where: { nombre: { contains: 'PM' } } }),
      db.canal.findFirst({ where: { nombre: { contains: 'salón' } } })
    ])
    
    if (!turnoPM || !canalSalon) {
      return NextResponse.json({
        error: 'No se encontró turno PM o canal Salón',
        turnoPM,
        canalSalon
      })
    }

    // 2. Buscar TODOS los registros que coincidan con esa combinación
    // usando diferentes rangos de fecha para detectar el problema
    
    const [year, month, day] = fecha.split('-').map(Number)
    
    // Rango muy amplio para ver todos los posibles registros
    const fechaInicio = new Date(Date.UTC(year, month - 1, day - 2, 0, 0, 0, 0))
    const fechaFin = new Date(Date.UTC(year, month - 1, day + 2, 23, 59, 59, 999))
    
    const todosLosRegistros = await db.forecastEntry.findMany({
      where: {
        fecha: { gte: fechaInicio, lte: fechaFin },
        turnoId: turnoPM.id,
        canalId: canalSalon.id
      },
      include: { turno: true, canal: true, restaurante: true },
      orderBy: { fecha: 'asc' }
    })

    // 3. Analizar cada registro encontrado
    const analisis = todosLosRegistros.map(r => {
      const fechaObj = new Date(r.fecha)
      return {
        id: r.id,
        fechaISO: fechaObj.toISOString(),
        fechaUTC: fechaObj.toISOString().split('T')[0],
        horaUTC: fechaObj.toISOString().split('T')[1]?.split('.')[0],
        turno: r.turno?.nombre,
        canal: r.canal?.nombre,
        restaurante: r.restaurante?.nombre,
        paxReal: r.paxReal,
        ventaReal: r.ventaReal,
        paxTeorico: r.paxTeorico,
        ventaTeorica: r.ventaTeorica,
        semana: r.mes,
        mes: r.mes,
        año: r.año
      }
    })

    // 4. Totales por fecha UTC
    const porFecha: Record<string, { pax: number; venta: number; count: number }> = {}
    analisis.forEach(r => {
      if (!porFecha[r.fechaUTC]) {
        porFecha[r.fechaUTC] = { pax: 0, venta: 0, count: 0 }
      }
      porFecha[r.fechaUTC].pax += r.paxReal || 0
      porFecha[r.fechaUTC].venta += r.ventaReal || 0
      porFecha[r.fechaUTC].count += 1
    })

    // 5. Ver qué ve el Forecast exactamente
    // El Forecast guarda con hora 12:00:00 UTC
    const fechaForecast = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
    const registroForecast = await db.forecastEntry.findMany({
      where: {
        fecha: fechaForecast,
        turnoId: turnoPM.id,
        canalId: canalSalon.id
      },
      include: { turno: true, canal: true }
    })

    // 6. Ver qué ve el Comparativo
    // El comparativo ahora usa rango 00:00:00 a 23:59:59 UTC
    const fechaComparativoInicio = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
    const fechaComparativoFin = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999))
    const registroComparativo = await db.forecastEntry.findMany({
      where: {
        fecha: { gte: fechaComparativoInicio, lte: fechaComparativoFin },
        turnoId: turnoPM.id,
        canalId: canalSalon.id
      },
      include: { turno: true, canal: true }
    })

    return NextResponse.json({
      busqueda: {
        fecha,
        turnoPM: { id: turnoPM.id, nombre: turnoPM.nombre },
        canalSalon: { id: canalSalon.id, nombre: canalSalon.nombre }
      },
      
      todosLosRegistros: analisis,
      totalRegistros: todosLosRegistros.length,
      
      porFechaUTC: porFecha,
      
      forecast_ve: {
        descripcion: 'Fecha exacta 12:00:00 UTC (como guarda el Forecast)',
        fecha: fechaForecast.toISOString(),
        registros: registroForecast.length,
        totalPax: registroForecast.reduce((s, r) => s + (r.paxReal || 0), 0),
        totalVenta: registroForecast.reduce((s, r) => s + (r.ventaReal || 0), 0)
      },
      
      comparativo_ve: {
        descripcion: 'Rango 00:00:00 a 23:59:59 UTC',
        fechaInicio: fechaComparativoInicio.toISOString(),
        fechaFin: fechaComparativoFin.toISOString(),
        registros: registroComparativo.length,
        totalPax: registroComparativo.reduce((s, r) => s + (r.paxReal || 0), 0),
        totalVenta: registroComparativo.reduce((s, r) => s + (r.ventaReal || 0), 0)
      },
      
      diagnostico: {
        hayRegistrosDuplicados: todosLosRegistros.length > 1,
        horariosDeLosRegistros: analisis.map(a => a.horaUTC),
        problemaIdentificado: todosLosRegistros.length > 1 
          ? 'MÚLTIPLES REGISTROS ENCONTRADOS - Posible duplicación'
          : todosLosRegistros.length === 0 
            ? 'NO HAY REGISTROS para esa combinación'
            : 'OK - Un solo registro'
      }
    })

  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
