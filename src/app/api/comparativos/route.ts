import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper para crear fecha UTC correcta (evita problemas de timezone)
function createUTCDate(dateString: string, isEndOfDay = false): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  if (isEndOfDay) {
    return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999))
  }
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
}

// Helper para extraer fecha UTC de manera consistente
function getUTCDateString(date: Date): string {
  const utcYear = date.getUTCFullYear()
  const utcMonth = String(date.getUTCMonth() + 1).padStart(2, '0')
  const utcDay = String(date.getUTCDate()).padStart(2, '0')
  return `${utcYear}-${utcMonth}-${utcDay}`
}

// API de Comparativos - Compara períodos y dimensiones con datos reales del Forecast
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parámetros de período
    const fechaInicioA = searchParams.get('fechaInicioA')
    const fechaFinA = searchParams.get('fechaFinA')
    const fechaInicioB = searchParams.get('fechaInicioB')
    const fechaFinB = searchParams.get('fechaFinB')
    
    // Dimensión de comparación: turno, canal, restaurante, dia, semana, mes
    const dimension = searchParams.get('dimension') || 'turno'
    
    // Filtros opcionales
    const restauranteId = searchParams.get('restauranteId')
    const canalId = searchParams.get('canalId')
    const turnoId = searchParams.get('turnoId')

    if (!fechaInicioA || !fechaFinA || !fechaInicioB || !fechaFinB) {
      return NextResponse.json({ error: 'Fechas de ambos períodos son requeridas' }, { status: 400 })
    }

    // Construir filtros base con fechas UTC explícitas
    const buildWhere = (fechaInicio: string, fechaFin: string) => {
      const where: any = {
        fecha: {
          gte: createUTCDate(fechaInicio, false),
          lte: createUTCDate(fechaFin, true)
        }
      }
      if (restauranteId) where.restauranteId = restauranteId
      if (canalId) where.canalId = canalId
      if (turnoId) where.turnoId = turnoId
      return where
    }

    // Obtener datos de ambos períodos con relaciones
    const [datosA, datosB, turnos, canales, restaurantes] = await Promise.all([
      db.forecastEntry.findMany({
        where: buildWhere(fechaInicioA, fechaFinA),
        include: { turno: true, canal: true, restaurante: true, tipoDia: true }
      }),
      db.forecastEntry.findMany({
        where: buildWhere(fechaInicioB, fechaFinB),
        include: { turno: true, canal: true, restaurante: true, tipoDia: true }
      }),
      db.turno.findMany(),
      db.canal.findMany(),
      db.restaurante.findMany()
    ])

    // Función para agrupar datos según dimensión
    const agruparDatos = (datos: any[], dim: string) => {
      const grupos: { [key: string]: { 
        pax: number; 
        ventas: number; 
        paxTeorico: number;
        ventaTeorica: number;
        count: number; 
        nombre: string 
      } } = {}

      datos.forEach((entry) => {
        let key: string
        let nombre: string

        switch (dim) {
          case 'turno':
            key = entry.turnoId
            nombre = entry.turno?.nombre || 'Sin turno'
            break
          case 'canal':
            key = entry.canalId
            nombre = entry.canal?.nombre || 'Sin canal'
            break
          case 'restaurante':
            key = entry.restauranteId
            nombre = entry.restaurante?.nombre || 'Sin restaurante'
            break
          case 'dia':
            key = getUTCDateString(new Date(entry.fecha))
            nombre = new Date(entry.fecha).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', timeZone: 'UTC' })
            break
          case 'semana':
            // Mejorar nombre de semana con rango de fechas
            const semanaNum = entry.semana
            const año = entry.año
            // Calcular fecha inicio de la semana (ISO week)
            const jan4 = new Date(Date.UTC(año, 0, 4))
            const dayOfWeek = jan4.getUTCDay() || 7
            const startOfWeek = new Date(jan4)
            startOfWeek.setUTCDate(jan4.getUTCDate() + 1 - dayOfWeek + (semanaNum - 1) * 7)
            const endOfWeek = new Date(startOfWeek)
            endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6)
            
            key = `${año}-W${semanaNum.toString().padStart(2, '0')}`
            nombre = `Semana ${semanaNum} (${startOfWeek.getUTCDate()}/${startOfWeek.getUTCMonth() + 1} - ${endOfWeek.getUTCDate()}/${endOfWeek.getUTCMonth() + 1})`
            break
          case 'mes':
            key = `${entry.año}-${entry.mes.toString().padStart(2, '0')}`
            nombre = new Date(entry.año, entry.mes - 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
            break
          case 'diaSemana':
            // Agrupar por día de la semana (0=domingo, 1=lunes, ..., 6=sábado)
            const fechaObj = new Date(entry.fecha)
            const diaSemana = fechaObj.getUTCDay()
            const nombresDias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
            key = diaSemana.toString()
            nombre = nombresDias[diaSemana]
            break
          default:
            key = entry.turnoId
            nombre = entry.turno?.nombre || 'Sin turno'
        }

        if (!grupos[key]) {
          grupos[key] = { pax: 0, ventas: 0, paxTeorico: 0, ventaTeorica: 0, count: 0, nombre }
        }
        
        grupos[key].pax += entry.paxReal || 0
        grupos[key].ventas += entry.ventaReal || 0
        grupos[key].paxTeorico += entry.paxTeorico || 0
        grupos[key].ventaTeorica += entry.ventaTeorica || 0
        grupos[key].count += 1
      })

      return grupos
    }

    // Agrupar datos de ambos períodos
    const gruposA = agruparDatos(datosA, dimension)
    const gruposB = agruparDatos(datosB, dimension)

    // Obtener todas las claves únicas
    const todasLasClaves = new Set([...Object.keys(gruposA), ...Object.keys(gruposB)])

    // Ordenar claves según la dimensión
    const clavesOrdenadas = Array.from(todasLasClaves).sort((a, b) => {
      if (dimension === 'diaSemana') {
        // Ordenar de Lunes (1) a Domingo (0) - Lunes primero
        const ordenA = parseInt(a) === 0 ? 7 : parseInt(a)
        const ordenB = parseInt(b) === 0 ? 7 : parseInt(b)
        return ordenA - ordenB
      }
      return a.localeCompare(b)
    })

    // Construir comparativo
    const comparativo = clavesOrdenadas.map(key => {
      const datoA = gruposA[key] || { pax: 0, ventas: 0, paxTeorico: 0, ventaTeorica: 0, count: 0, nombre: key }
      const datoB = gruposB[key] || { pax: 0, ventas: 0, paxTeorico: 0, ventaTeorica: 0, count: 0, nombre: key }

      const ticketA = datoA.pax > 0 ? datoA.ventas / datoA.pax : 0
      const ticketB = datoB.pax > 0 ? datoB.ventas / datoB.pax : 0
      const ticketTeoricoA = datoA.paxTeorico > 0 ? datoA.ventaTeorica / datoA.paxTeorico : 0
      const ticketTeoricoB = datoB.paxTeorico > 0 ? datoB.ventaTeorica / datoB.paxTeorico : 0

      const variacionPax = datoB.pax > 0 ? ((datoA.pax - datoB.pax) / datoB.pax) * 100 : (datoA.pax > 0 ? 100 : 0)
      const variacionVentas = datoB.ventas > 0 ? ((datoA.ventas - datoB.ventas) / datoB.ventas) * 100 : (datoA.ventas > 0 ? 100 : 0)
      const variacionTicket = ticketB > 0 ? ((ticketA - ticketB) / ticketB) * 100 : (ticketA > 0 ? 100 : 0)
      
      // Variación Real vs Teórico
      const gapPaxA = datoA.paxTeorico > 0 ? ((datoA.pax - datoA.paxTeorico) / datoA.paxTeorico) * 100 : 0
      const gapVentasA = datoA.ventaTeorica > 0 ? ((datoA.ventas - datoA.ventaTeorica) / datoA.ventaTeorica) * 100 : 0
      const gapPaxB = datoB.paxTeorico > 0 ? ((datoB.pax - datoB.paxTeorico) / datoB.paxTeorico) * 100 : 0
      const gapVentasB = datoB.ventaTeorica > 0 ? ((datoB.ventas - datoB.ventaTeorica) / datoB.ventaTeorica) * 100 : 0

      // Debug: contar registros por grupo
      const registrosA = datosA.filter(d => {
        if (dimension === 'dia') return getUTCDateString(new Date(d.fecha)) === key
        if (dimension === 'turno') return d.turnoId === key
        if (dimension === 'canal') return d.canalId === key
        if (dimension === 'restaurante') return d.restauranteId === key
        return false
      })

      return {
        key,
        nombre: datoA.nombre || datoB.nombre,
        periodoA: {
          pax: Math.round(datoA.pax),
          ventas: Math.round(datoA.ventas),
          ticket: Math.round(ticketA * 100) / 100,
          paxTeorico: Math.round(datoA.paxTeorico),
          ventaTeorica: Math.round(datoA.ventaTeorica),
          ticketTeorico: Math.round(ticketTeoricoA * 100) / 100,
          gapPax: Math.round(gapPaxA * 10) / 10,
          gapVentas: Math.round(gapVentasA * 10) / 10,
          registros: datoA.count
        },
        periodoB: {
          pax: Math.round(datoB.pax),
          ventas: Math.round(datoB.ventas),
          ticket: Math.round(ticketB * 100) / 100,
          paxTeorico: Math.round(datoB.paxTeorico),
          ventaTeorica: Math.round(datoB.ventaTeorica),
          ticketTeorico: Math.round(ticketTeoricoB * 100) / 100,
          gapPax: Math.round(gapPaxB * 10) / 10,
          gapVentas: Math.round(gapVentasB * 10) / 10,
          registros: datoB.count
        },
        variacion: {
          pax: Math.round(variacionPax * 10) / 10,
          ventas: Math.round(variacionVentas * 10) / 10,
          ticket: Math.round(variacionTicket * 10) / 10
        },
        // Debug info
        debug: {
          registrosDetallados: dimension === 'dia' ? registrosA.map(r => ({
            turno: r.turno?.nombre,
            canal: r.canal?.nombre,
            paxReal: r.paxReal,
            ventaReal: r.ventaReal,
            paxTeorico: r.paxTeorico,
            ventaTeorica: r.ventaTeorica
          })) : undefined
        }
      }
    })

    // Calcular totales
    const totalesA = {
      pax: datosA.reduce((sum, e) => sum + (e.paxReal || 0), 0),
      ventas: datosA.reduce((sum, e) => sum + (e.ventaReal || 0), 0),
      paxTeorico: datosA.reduce((sum, e) => sum + (e.paxTeorico || 0), 0),
      ventaTeorica: datosA.reduce((sum, e) => sum + (e.ventaTeorica || 0), 0)
    }
    const totalesB = {
      pax: datosB.reduce((sum, e) => sum + (e.paxReal || 0), 0),
      ventas: datosB.reduce((sum, e) => sum + (e.ventaReal || 0), 0),
      paxTeorico: datosB.reduce((sum, e) => sum + (e.paxTeorico || 0), 0),
      ventaTeorica: datosB.reduce((sum, e) => sum + (e.ventaTeorica || 0), 0)
    }

    const ticketTotalA = totalesA.pax > 0 ? totalesA.ventas / totalesA.pax : 0
    const ticketTotalB = totalesB.pax > 0 ? totalesB.ventas / totalesB.pax : 0
    const ticketTeoricoA = totalesA.paxTeorico > 0 ? totalesA.ventaTeorica / totalesA.paxTeorico : 0
    const ticketTeoricoB = totalesB.paxTeorico > 0 ? totalesB.ventaTeorica / totalesB.paxTeorico : 0
    
    const gapTotalPaxA = totalesA.paxTeorico > 0 ? ((totalesA.pax - totalesA.paxTeorico) / totalesA.paxTeorico) * 100 : 0
    const gapTotalVentasA = totalesA.ventaTeorica > 0 ? ((totalesA.ventas - totalesA.ventaTeorica) / totalesA.ventaTeorica) * 100 : 0
    const gapTotalPaxB = totalesB.paxTeorico > 0 ? ((totalesB.pax - totalesB.paxTeorico) / totalesB.paxTeorico) * 100 : 0
    const gapTotalVentasB = totalesB.ventaTeorica > 0 ? ((totalesB.ventas - totalesB.ventaTeorica) / totalesB.ventaTeorica) * 100 : 0

    const resumen = {
      periodoA: {
        totalPax: Math.round(totalesA.pax),
        totalVentas: Math.round(totalesA.ventas),
        ticketPromedio: Math.round(ticketTotalA * 100) / 100,
        totalPaxTeorico: Math.round(totalesA.paxTeorico),
        totalVentaTeorica: Math.round(totalesA.ventaTeorica),
        ticketTeorico: Math.round(ticketTeoricoA * 100) / 100,
        gapPax: Math.round(gapTotalPaxA * 10) / 10,
        gapVentas: Math.round(gapTotalVentasA * 10) / 10,
        registros: datosA.length
      },
      periodoB: {
        totalPax: Math.round(totalesB.pax),
        totalVentas: Math.round(totalesB.ventas),
        ticketPromedio: Math.round(ticketTotalB * 100) / 100,
        totalPaxTeorico: Math.round(totalesB.paxTeorico),
        totalVentaTeorica: Math.round(totalesB.ventaTeorica),
        ticketTeorico: Math.round(ticketTeoricoB * 100) / 100,
        gapPax: Math.round(gapTotalPaxB * 10) / 10,
        gapVentas: Math.round(gapTotalVentasB * 10) / 10,
        registros: datosB.length
      },
      variacionTotal: {
        pax: totalesB.pax > 0 ? Math.round(((totalesA.pax - totalesB.pax) / totalesB.pax) * 1000) / 10 : 0,
        ventas: totalesB.ventas > 0 ? Math.round(((totalesA.ventas - totalesB.ventas) / totalesB.ventas) * 1000) / 10 : 0,
        ticket: ticketTotalB > 0 ? Math.round(((ticketTotalA - ticketTotalB) / ticketTotalB) * 1000) / 10 : 0
      }
    }

    return NextResponse.json({
      dimension,
      periodoA: { inicio: fechaInicioA, fin: fechaFinA },
      periodoB: { inicio: fechaInicioB, fin: fechaFinB },
      comparativo,
      resumen,
      filtros: { turnos, canales, restaurantes }
    })

  } catch (error) {
    console.error('Error en comparativos:', error)
    return NextResponse.json({ error: 'Error al generar comparativos' }, { status: 500 })
  }
}
