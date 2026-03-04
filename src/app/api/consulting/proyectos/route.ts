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
        entregables: {
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
        },
        pendientes: {
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
        }
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
    
    // Validar campos requeridos
    if (!data.nombre || !data.cliente) {
      return NextResponse.json({ error: 'Nombre y cliente son requeridos' }, { status: 400 })
    }
    
    if (!data.fechaInicio || !data.fechaFin) {
      return NextResponse.json({ error: 'Fecha de inicio y fin son requeridas' }, { status: 400 })
    }
    
    const proyecto = await db.proyectoConsultoria.create({
      data: {
        nombre: data.nombre,
        cliente: data.cliente,
        fechaInicio: new Date(data.fechaInicio),
        fechaFin: new Date(data.fechaFin),
        estado: data.estado || 'activo',
        valorContrato: Number(data.valorContrato) || 0,
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

    // Devolver el proyecto con las relaciones incluidas
    const proyectoCompleto = await db.proyectoConsultoria.findUnique({
      where: { id: proyecto.id },
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
        entregables: {
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
        },
        pendientes: {
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
        }
      }
    })

    return NextResponse.json(proyectoCompleto)
  } catch (error) {
    console.error('Error creating proyecto:', error)
    return NextResponse.json({ error: 'Error al crear proyecto' }, { status: 500 })
  }
}

// PUT - Actualizar proyecto
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()

    if (!data.id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 })
    }

    const proyecto = await db.proyectoConsultoria.update({
      where: { id: data.id },
      data: {
        nombre: data.nombre,
        cliente: data.cliente,
        fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : undefined,
        fechaFin: data.fechaFin ? new Date(data.fechaFin) : undefined,
        estado: data.estado,
        valorContrato: data.valorContrato !== undefined ? Number(data.valorContrato) : undefined,
      },
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
        entregables: {
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
        },
        pendientes: {
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
        }
      }
    })

    return NextResponse.json(proyecto)
  } catch (error) {
    console.error('Error updating proyecto:', error)
    return NextResponse.json({ error: 'Error al actualizar proyecto' }, { status: 500 })
  }
}

// DELETE - Eliminar proyecto
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 })
    }

    // Las fases, semanas, tareas y entregables se eliminan en cascada por la relación
    await db.proyectoConsultoria.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting proyecto:', error)
    return NextResponse.json({ error: 'Error al eliminar proyecto' }, { status: 500 })
  }
}
