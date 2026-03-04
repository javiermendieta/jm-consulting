import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Diagnóstico completo del problema de timezone y datos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get('fecha') || '2026-03-01'
    
    // Parsear fecha
    const [year, month, day] = fecha.split('-').map(Number)
    
    // 1. Obtener TODOS los registros de esa fecha (usando diferentes métodos)
    
    // Método 1: Usando new Date(string) - como comparativos ORIGINALMENTE
    const fechaGte1 = new Date(fecha)
    const fechaLte1 = new Date(fecha)
    fechaLte1.setHours(23, 59, 59, 999)
    
    // Método 2: Usando UTC explícito - como comparativos CORREGIDO
    const fechaGte2 = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
    const fechaLte2 = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999))
    
    // Método 3: Rango amplio para ver todos los registros cercanos
    const fechaInicio = new Date(Date.UTC(year, month - 1, day - 1, 0, 0, 0, 0))
    const fechaFin = new Date(Date.UTC(year, month - 1, day + 1, 23, 59, 59, 999))
    
    const [registrosMetodo1, registrosMetodo2, registrosRangoAmplio] = await Promise.all([
      db.forecastEntry.findMany({
        where: {
          fecha: { gte: fechaGte1, lte: fechaLte1 }
        },
        include: { turno: true, canal: true }
      }),
      db.forecastEntry.findMany({
        where: {
          fecha: { gte: fechaGte2, lte: fechaLte2 }
        },
        include: { turno: true, canal: true }
      }),
      db.forecastEntry.findMany({
        where: {
          fecha: { gte: fechaInicio, lte: fechaFin }
        },
        include: { turno: true, canal: true },
        orderBy: { fecha: 'asc' }
      })
    ])

    // 2. Analizar cada registro del rango amplio
    const analisisRegistros = registrosRangoAmplio.map(r => {
      const fechaObj = new Date(r.fecha)
      return {
        id: r.id.substring(0, 8),
        fechaOriginal: r.fecha,
        fechaISO: fechaObj.toISOString(),
        fechaUTC: fechaObj.toISOString().split('T')[0],
        horaUTC: fechaObj.toISOString().split('T')[1]?.split('.')[0],
        turno: r.turno?.nombre,
        canal: r.canal?.nombre,
        paxReal: r.paxReal,
        ventaReal: r.ventaReal,
        semana: r.semana,
        mes: r.mes,
        año: r.año
      }
    })

    // 3. Totales por fecha UTC
    const totalesPorFechaUTC: Record<string, { pax: number; ventas: number; count: number }> = {}
    registrosRangoAmplio.forEach(r => {
      const fechaUTC = new Date(r.fecha).toISOString().split('T')[0]
      if (!totalesPorFechaUTC[fechaUTC]) {
        totalesPorFechaUTC[fechaUTC] = { pax: 0, ventas: 0, count: 0 }
      }
      totalesPorFechaUTC[fechaUTC].pax += r.paxReal || 0
      totalesPorFechaUTC[fechaUTC].ventas += r.ventaReal || 0
      totalesPorFechaUTC[fechaUTC].count += 1
    })

    // 4. Verificar el Forecast Module - cómo ve los datos
    // El forecast usa UTC mediodía (12:00:00)
    const fechaForecast = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
    const registrosForecast = await db.forecastEntry.findMany({
      where: {
        fecha: fechaForecast
      },
      include: { turno: true, canal: true }
    })

    return NextResponse.json({
      fechaBuscada: fecha,
      
      explicacion: {
        metodo1: "new Date('2026-03-01') - medianoche LOCAL o UTC según el entorno",
        metodo2: "Date.UTC(2026, 2, 1, 0, 0, 0) - medianoche UTC explícito",
        forecast: "Date.UTC(2026, 2, 1, 12, 0, 0) - MEDIODÍA UTC (como guarda el forecast)"
      },
      
      resultados: {
        metodo1_original: {
          descripcion: "Comparativos ORIGINAL (new Date string)",
          fechaGte: fechaGte1.toISOString(),
          fechaLte: fechaLte1.toISOString(),
          registrosEncontrados: registrosMetodo1.length,
          totalPax: registrosMetodo1.reduce((s, r) => s + (r.paxReal || 0), 0),
          totalVentas: registrosMetodo1.reduce((s, r) => s + (r.ventaReal || 0), 0)
        },
        
        metodo2_corregido: {
          descripcion: "Comparativos CORREGIDO (UTC explícito)",
          fechaGte: fechaGte2.toISOString(),
          fechaLte: fechaLte2.toISOString(),
          registrosEncontrados: registrosMetodo2.length,
          totalPax: registrosMetodo2.reduce((s, r) => s + (r.paxReal || 0), 0),
          totalVentas: registrosMetodo2.reduce((s, r) => s + (r.ventaReal || 0), 0)
        },
        
        forecast_module: {
          descripcion: "Como el módulo Forecast ve los datos (UTC mediodía)",
          fecha: fechaForecast.toISOString(),
          registrosEncontrados: registrosForecast.length,
          totalPax: registrosForecast.reduce((s, r) => s + (r.paxReal || 0), 0),
          totalVentas: registrosForecast.reduce((s, r) => s + (r.ventaReal || 0), 0)
        }
      },
      
      totalesPorFechaUTC,
      
      registrosDetallados: analisisRegistros,
      
      diagnostico: {
        hayDiscrepancia: registrosMetodo1.length !== registrosMetodo2.length || 
                         registrosMetodo1.length !== registrosForecast.length,
        registrosSoloMetodo1: registrosMetodo1.length - registrosMetodo2.length,
        fechaHoraDeLosDatos: registrosRangoAmplio.length > 0 
          ? registrosRangoAmplio[0].fecha.toISOString() 
          : "Sin datos"
      }
    })

  } catch (error: any) {
    console.error('Error en diagnóstico:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
