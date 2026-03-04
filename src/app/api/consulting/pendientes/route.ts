import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar pendientes de un proyecto
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const proyectoId = searchParams.get('proyectoId')

    if (!proyectoId) {
      return NextResponse.json({ error: 'proyectoId es requerido' }, { status: 400 })
    }

    const pendientes = await db.pendienteCliente.findMany({
      where: { proyectoId },
      include: {
        semana: {
          include: {
            fase: {
              select: {
                id: true,
                nombre: true
              }
            }
          }
        }
      },
      orderBy: [
        { prioridad: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(pendientes)
  } catch (error) {
    console.error('Error fetching pendientes:', error)
    return NextResponse.json({ error: 'Error al obtener pendientes' }, { status: 500 })
  }
}

// POST - Crear nuevo pendiente
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    if (!data.proyectoId || !data.descripcion) {
      return NextResponse.json({ error: 'proyectoId y descripcion son requeridos' }, { status: 400 })
    }

    const pendiente = await db.pendienteCliente.create({
      data: {
        proyectoId: data.proyectoId,
        descripcion: data.descripcion,
        estado: data.estado || 'pendiente',
        prioridad: data.prioridad || 'media',
        fechaLimite: data.fechaLimite ? new Date(data.fechaLimite) : null,
        responsable: data.responsable || null,
        notas: data.notas || null,
        semanaId: data.semanaId || null
      },
      include: {
        semana: {
          include: {
            fase: {
              select: {
                id: true,
                nombre: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(pendiente)
  } catch (error) {
    console.error('Error creating pendiente:', error)
    return NextResponse.json({ error: 'Error al crear pendiente' }, { status: 500 })
  }
}

// PUT - Actualizar pendiente
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()

    if (!data.id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 })
    }

    const pendiente = await db.pendienteCliente.update({
      where: { id: data.id },
      data: {
        descripcion: data.descripcion,
        estado: data.estado,
        prioridad: data.prioridad,
        fechaLimite: data.fechaLimite ? new Date(data.fechaLimite) : null,
        responsable: data.responsable,
        notas: data.notas,
        semanaId: data.semanaId || null
      },
      include: {
        semana: {
          include: {
            fase: {
              select: {
                id: true,
                nombre: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(pendiente)
  } catch (error) {
    console.error('Error updating pendiente:', error)
    return NextResponse.json({ error: 'Error al actualizar pendiente' }, { status: 500 })
  }
}

// DELETE - Eliminar pendiente
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 })
    }

    await db.pendienteCliente.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting pendiente:', error)
    return NextResponse.json({ error: 'Error al eliminar pendiente' }, { status: 500 })
  }
}
