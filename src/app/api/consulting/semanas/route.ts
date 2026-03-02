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
    
    const semana = await db.semana.create({
      data: {
        faseId: data.faseId,
        numero: data.numero,
        fechaInicio: new Date(data.fechaInicio),
        fechaFin: new Date(data.fechaFin),
        estado: data.estado || 'pendiente',
        notas: data.notas
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
    
    const semana = await db.semana.update({
      where: { id: data.id },
      data: {
        numero: data.numero,
        estado: data.estado,
        notas: data.notas
      }
    })

    return NextResponse.json(semana)
  } catch (error) {
    console.error('Error updating semana:', error)
    return NextResponse.json({ error: 'Error al actualizar semana' }, { status: 500 })
  }
}
