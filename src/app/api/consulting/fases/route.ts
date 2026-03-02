import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar fases de un proyecto
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const proyectoId = searchParams.get('proyectoId')

    if (!proyectoId) {
      return NextResponse.json({ error: 'proyectoId es requerido' }, { status: 400 })
    }

    const fases = await db.fase.findMany({
      where: { proyectoId },
      include: {
        semanas: {
          include: {
            tareas: true
          },
          orderBy: { numero: 'asc' }
        }
      },
      orderBy: { orden: 'asc' }
    })

    return NextResponse.json(fases)
  } catch (error) {
    console.error('Error fetching fases:', error)
    return NextResponse.json({ error: 'Error al obtener fases' }, { status: 500 })
  }
}

// POST - Crear nueva fase
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const fase = await db.fase.create({
      data: {
        proyectoId: data.proyectoId,
        nombre: data.nombre,
        orden: data.orden,
        fechaInicio: new Date(data.fechaInicio),
        fechaFin: new Date(data.fechaFin),
        estado: data.estado || 'pendiente'
      }
    })

    return NextResponse.json(fase)
  } catch (error) {
    console.error('Error creating fase:', error)
    return NextResponse.json({ error: 'Error al crear fase' }, { status: 500 })
  }
}

// PUT - Actualizar fase
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    
    const fase = await db.fase.update({
      where: { id: data.id },
      data: {
        nombre: data.nombre,
        estado: data.estado,
        fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : undefined,
        fechaFin: data.fechaFin ? new Date(data.fechaFin) : undefined,
      }
    })

    return NextResponse.json(fase)
  } catch (error) {
    console.error('Error updating fase:', error)
    return NextResponse.json({ error: 'Error al actualizar fase' }, { status: 500 })
  }
}
