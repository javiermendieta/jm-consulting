import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar turnos
export async function GET() {
  try {
    const turnos = await db.turno.findMany({
      orderBy: { nombre: 'asc' }
    })
    return NextResponse.json(turnos)
  } catch (error) {
    console.error('Error fetching turnos:', error)
    return NextResponse.json([])
  }
}

// POST - Crear turno
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const turno = await db.turno.create({
      data: {
        nombre: data.nombre,
        codigo: data.codigo,
        horaInicio: data.horaInicio || '00:00',
        horaFin: data.horaFin || '23:59'
      }
    })
    return NextResponse.json(turno)
  } catch (error) {
    console.error('Error creating turno:', error)
    return NextResponse.json({ error: 'Error al crear turno' }, { status: 500 })
  }
}

// DELETE - Eliminar turno
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    // Primero eliminar las entradas de forecast asociadas
    await db.forecastEntry.deleteMany({
      where: { turnoId: id }
    })

    // Luego eliminar el turno
    await db.turno.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting turno:', error)
    return NextResponse.json({ error: 'Error al eliminar turno' }, { status: 500 })
  }
}

// PUT - Actualizar turno
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    
    if (!data.id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    const turno = await db.turno.update({
      where: { id: data.id },
      data: {
        nombre: data.nombre,
        codigo: data.codigo,
        horaInicio: data.horaInicio,
        horaFin: data.horaFin
      }
    })

    return NextResponse.json(turno)
  } catch (error) {
    console.error('Error updating turno:', error)
    return NextResponse.json({ error: 'Error al actualizar turno' }, { status: 500 })
  }
}
