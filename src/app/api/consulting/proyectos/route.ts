import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar todos los proyectos
export async function GET() {
  try {
    const proyectos = await db.proyectoConsultoria.findMany({
      include: {
        fases: {
          include: {
            semanas: {
              include: {
                tareas: true
              }
            }
          },
          orderBy: { orden: 'asc' }
        },
        entregables: true
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(proyectos)
  } catch (error) {
    console.error('Error fetching proyectos:', error)
    return NextResponse.json({ error: 'Error al obtener proyectos' }, { status: 500 })
  }
}

// POST - Crear nuevo proyecto
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const proyecto = await db.proyectoConsultoria.create({
      data: {
        nombre: data.nombre,
        cliente: data.cliente,
        fechaInicio: new Date(data.fechaInicio),
        fechaFin: new Date(data.fechaFin),
        estado: data.estado || 'activo',
        valorContrato: data.valorContrato || 0,
      }
    })

    // Crear fases automáticas (Mes 1, 2, 3)
    const fechaInicio = new Date(data.fechaInicio)
    for (let i = 0; i < 3; i++) {
      const faseInicio = new Date(fechaInicio)
      faseInicio.setMonth(faseInicio.getMonth() + i)
      const faseFin = new Date(faseInicio)
      faseFin.setMonth(faseFin.getMonth() + 1)
      faseFin.setDate(faseFin.getDate() - 1)

      await db.fase.create({
        data: {
          proyectoId: proyecto.id,
          nombre: `Mes ${i + 1}`,
          orden: i + 1,
          fechaInicio: faseInicio,
          fechaFin: faseFin,
          estado: 'pendiente'
        }
      })
    }

    return NextResponse.json(proyecto)
  } catch (error) {
    console.error('Error creating proyecto:', error)
    return NextResponse.json({ error: 'Error al crear proyecto' }, { status: 500 })
  }
}
