import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar entregables de un proyecto
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const proyectoId = searchParams.get('proyectoId')

    if (!proyectoId) {
      return NextResponse.json({ error: 'proyectoId es requerido' }, { status: 400 })
    }

    const entregables = await db.entregable.findMany({
      where: { proyectoId },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json(entregables)
  } catch (error) {
    console.error('Error fetching entregables:', error)
    return NextResponse.json({ error: 'Error al obtener entregables' }, { status: 500 })
  }
}

// POST - Crear nuevo entregable
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const entregable = await db.entregable.create({
      data: {
        proyectoId: data.proyectoId,
        nombre: data.nombre,
        tipo: data.tipo,
        estado: data.estado || 'pendiente',
        fechaEntrega: data.fechaEntrega ? new Date(data.fechaEntrega) : null,
        configuracion: data.configuracion
      }
    })

    return NextResponse.json(entregable)
  } catch (error) {
    console.error('Error creating entregable:', error)
    return NextResponse.json({ error: 'Error al crear entregable' }, { status: 500 })
  }
}

// PUT - Actualizar entregable
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    
    const entregable = await db.entregable.update({
      where: { id: data.id },
      data: {
        nombre: data.nombre,
        tipo: data.tipo,
        estado: data.estado,
        fechaEntrega: data.fechaEntrega ? new Date(data.fechaEntrega) : null,
        configuracion: data.configuracion
      }
    })

    return NextResponse.json(entregable)
  } catch (error) {
    console.error('Error updating entregable:', error)
    return NextResponse.json({ error: 'Error al actualizar entregable' }, { status: 500 })
  }
}

// DELETE - Eliminar entregable
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 })
    }

    await db.entregable.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting entregable:', error)
    return NextResponse.json({ error: 'Error al eliminar entregable' }, { status: 500 })
  }
}
