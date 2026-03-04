import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// API de Diagnóstico - Ver diferencias de timezone y datos exactos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get('fecha') || '2026-03-01'
    
    // Parsear la fecha de búsqueda
    const [year, month, day] = fecha.split('-').map(Number)
    
    // Buscar en un rango de 3 días para detectar problemas de timezone
    const fechaInicio = new Date(Date.UTC(year, month - 1, day - 1, 0, 0, 0))
    const fechaFin = new Date(Date.UTC(year, month - 1, day + 1, 23, 59, 59))
    
    const registros = await db.forecastEntry.findMany({
      where: {
        fecha: {
          gte: fechaInicio,
          lte: fechaFin
        }
      },
      include: {
        turno: true,
        canal: true,
        restaurante: true
      },
      orderBy: [
        { fecha: 'asc' },
        { turno: { horaInicio: 'asc' } }
      ]
    })

    // Analizar cada registro
    const analisis = registros.map(r => {
      const fechaObj = new Date(r.fecha)
      const fechaISO = fechaObj.toISOString()
      const fechaLocal = fechaObj.toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })
      const fechaUTC = fechaISO.split('T')[0]
      
      return {
        id: r.id,
        // Fecha original en DB
        fechaDB: r.fecha,
        // Representación ISO (UTC)
        fechaISO,
        // Fecha extraída con toISOString().split('T')[0] (lo que usa comparativos)
        fechaUTC,
        // Fecha en timezone local Argentina
        fechaLocal,
        // Hora en UTC
        horaUTC: fechaISO.split('T')[1]?.split('.')[0] || 'N/A',
        // Datos del registro
        turno: r.turno?.nombre,
        canal: r.canal?.nombre,
        restaurante: r.restaurante?.nombre,
        paxReal: r.paxReal,
        ventaReal: r.ventaReal,
        // Detectar si hay discrepancia de fecha
        discrepancia: fechaUTC !== fechaLocal ? '⚠️ TIMEZONE ISSUE' : '✓ OK'
      }
    })

    // Agrupar por fecha UTC para ver totales
    const porFechaUTC: { [key: string]: { pax: number; ventas: number; count: number } } = {}
    analisis.forEach(r => {
      if (!porFechaUTC[r.fechaUTC]) {
        porFechaUTC[r.fechaUTC] = { pax: 0, ventas: 0, count: 0 }
      }
      porFechaUTC[r.fechaUTC].pax += r.paxReal || 0
      porFechaUTC[r.fechaUTC].ventas += r.ventaReal || 0
      porFechaUTC[r.fechaUTC].count += 1
    })

    return NextResponse.json({
      fechaBuscada: fecha,
      totalRegistros: registros.length,
      porFechaUTC,
      registros: analisis,
      explicacion: {
        fechaUTC: "Fecha extraída con toISOString().split('T')[0] - LO QUE USA COMPARATIVOS",
        fechaLocal: "Fecha en timezone Argentina - LO QUE VES EN EL FORECAST",
        discrepancia: "Si fechaUTC != fechaLocal, hay problema de timezone"
      }
    })

  } catch (error: any) {
    console.error('Error en diagnóstico:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
