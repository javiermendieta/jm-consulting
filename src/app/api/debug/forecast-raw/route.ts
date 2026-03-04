import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// API de Debug - Ver todos los registros crudos para una fecha
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get('fecha') // formato: 2026-03-01
    
    if (!fecha) {
      return NextResponse.json({ error: 'Fecha requerida (formato: 2026-03-01)' }, { status: 400 })
    }

    // Crear fecha como UTC mediodía
    const [year, month, day] = fecha.split('-').map(Number)
    const fechaUTC = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
    
    // Buscar registros en un rango amplio para detectar problemas de timezone
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
        restaurante: true,
        tipoDia: true
      },
      orderBy: [
        { fecha: 'asc' },
        { turno: { horaInicio: 'asc' } },
        { canal: { nombre: 'asc' } }
      ]
    })

    // Resumen
    const resumen = {
      fechaBuscada: fecha,
      fechaUTC: fechaUTC.toISOString(),
      totalRegistros: registros.length,
      totalPaxReal: registros.reduce((sum, r) => sum + (r.paxReal || 0), 0),
      totalVentaReal: registros.reduce((sum, r) => sum + (r.ventaReal || 0), 0),
      fechasEncontradas: [...new Set(registros.map(r => r.fecha.toISOString().split('T')[0]))]
    }

    return NextResponse.json({
      resumen,
      registros: registros.map(r => ({
        id: r.id,
        fecha: r.fecha.toISOString(),
        fechaStr: r.fecha.toISOString().split('T')[0],
        turno: r.turno?.nombre,
        canal: r.canal?.nombre,
        restaurante: r.restaurante?.nombre,
        tipoDia: r.tipoDia?.nombre,
        paxTeorico: r.paxTeorico,
        paxReal: r.paxReal,
        ventaTeorica: r.ventaTeorica,
        ventaReal: r.ventaReal,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt
      }))
    })

  } catch (error: any) {
    console.error('Error en debug:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Eliminar registros por ID o por fecha
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const fecha = searchParams.get('fecha')
    
    if (id) {
      // Eliminar por ID específico
      await db.forecastEntry.delete({ where: { id } })
      return NextResponse.json({ success: true, message: `Registro ${id} eliminado` })
    }
    
    if (fecha) {
      // Eliminar todos los registros de una fecha (buscando en rango)
      const [year, month, day] = fecha.split('-').map(Number)
      const fechaInicio = new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
      const fechaFin = new Date(Date.UTC(year, month - 1, day, 23, 59, 59))
      
      const result = await db.forecastEntry.deleteMany({
        where: {
          fecha: {
            gte: fechaInicio,
            lte: fechaFin
          }
        }
      })
      
      return NextResponse.json({ 
        success: true, 
        message: `Eliminados ${result.count} registros de ${fecha}` 
      })
    }
    
    return NextResponse.json({ error: 'Se requiere id o fecha' }, { status: 400 })
    
  } catch (error: any) {
    console.error('Error eliminando:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
