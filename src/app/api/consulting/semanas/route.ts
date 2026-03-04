import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar semanas de una fase
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const faseId = searchParams.get('faseId')

    if (!faseId) {
      return NextResponse.json({ error: 'faseId es requerido' }, { status: 400 })
    }

    const semanas = await db.semana.findMany({
      where: { faseId },
      include: {
        tareas: true
      },
      orderBy: { numero: 'asc' }
    })

    return NextResponse.json(semanas)
  } catch (error) {
    console.error('Error fetching semanas:', error)
    return NextResponse.json({ error: 'Error al obtener semanas' }, { status: 500 })
  }
}

// POST - Crear nueva semana
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    if (!data.faseId) {
      return NextResponse.json({ error: 'faseId es requerido' }, { status: 400 })
    }

    // Obtener el último número de semana
    const ultimaSemana = await db.semana.findFirst({
      where: { faseId: data.faseId },
      orderBy: { numero: 'desc' }
    })

    const numero = ultimaSemana ? ultimaSemana.numero + 1 : 1

    const semana = await db.semana.create({
      data: {
        faseId: data.faseId,
        numero,
        fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : new Date(),
        fechaFin: data.fechaFin ? new Date(data.fechaFin) : new Date(),
        estado: data.estado || 'pendiente',
        notas: data.notas || null
      },
      include: {
        tareas: true
      }
    })

    return NextResponse.json(semana)
  } catch (error) {
    console.error('Error creating semana:', error)
    return NextResponse.json({ error: 'Error al crear semana' }, { status: 500 })
  }
}

// PUT - Actualizar semana
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()

    if (!data.id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 })
    }

    const semana = await db.semana.update({
      where: { id: data.id },
      data: {
        numero: data.numero,
        fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : undefined,
        fechaFin: data.fechaFin ? new Date(data.fechaFin) : undefined,
        estado: data.estado,
        notas: data.notas
      },
      include: {
        tareas: true
      }
    })

    return NextResponse.json(semana)
  } catch (error) {
    console.error('Error updating semana:', error)
    return NextResponse.json({ error: 'Error al actualizar semana' }, { status: 500 })
  }
}

// DELETE - Eliminar semana
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 })
    }

    await db.semana.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting semana:', error)
    return NextResponse.json({ error: 'Error al eliminar semana' }, { status: 500 })
  }
}
