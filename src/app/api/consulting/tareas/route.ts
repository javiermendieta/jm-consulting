import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar tareas de una semana
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const semanaId = searchParams.get('semanaId')

    if (!semanaId) {
      return NextResponse.json({ error: 'semanaId es requerido' }, { status: 400 })
    }

    const tareas = await db.tarea.findMany({
      where: { semanaId },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json(tareas)
  } catch (error) {
    console.error('Error fetching tareas:', error)
    return NextResponse.json({ error: 'Error al obtener tareas' }, { status: 500 })
  }
}

// POST - Crear nueva tarea
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const tarea = await db.tarea.create({
      data: {
        semanaId: data.semanaId,
        titulo: data.titulo,
        descripcion: data.descripcion,
        estado: data.estado || 'pendiente',
        prioridad: data.prioridad || 'media',
        responsable: data.responsable
      }
    })

    return NextResponse.json(tarea)
  } catch (error) {
    console.error('Error creating tarea:', error)
    return NextResponse.json({ error: 'Error al crear tarea' }, { status: 500 })
  }
}

// PUT - Actualizar tarea
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    
    const tarea = await db.tarea.update({
      where: { id: data.id },
      data: {
        titulo: data.titulo,
        descripcion: data.descripcion,
        estado: data.estado,
        prioridad: data.prioridad,
        responsable: data.responsable
      }
    })

    return NextResponse.json(tarea)
  } catch (error) {
    console.error('Error updating tarea:', error)
    return NextResponse.json({ error: 'Error al actualizar tarea' }, { status: 500 })
  }
}

// DELETE - Eliminar tarea
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 })
    }

    await db.tarea.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting tarea:', error)
    return NextResponse.json({ error: 'Error al eliminar tarea' }, { status: 500 })
  }
}
