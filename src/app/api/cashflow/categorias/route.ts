import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar categorías con sus items
export async function GET() {
  try {
    const categorias = await db.cashflowCategoria.findMany({
      include: {
        items: {
          include: {
            cuentaPL: {
              include: {
                nivel: true
              }
            },
            registros: true
          },
          orderBy: { orden: 'asc' }
        }
      },
      orderBy: { orden: 'asc' }
    })

    return NextResponse.json(categorias)
  } catch (error) {
    console.error('Error fetching cashflow categorias:', error)
    return NextResponse.json({ error: 'Error al obtener categorías' }, { status: 500 })
  }
}

// POST - Crear nueva categoría
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Obtener el máximo orden
    const categoriasExistentes = await db.cashflowCategoria.findMany({
      orderBy: { orden: 'desc' },
      take: 1
    })
    
    const nuevoOrden = categoriasExistentes.length > 0 ? categoriasExistentes[0].orden + 1 : 0

    const categoria = await db.cashflowCategoria.create({
      data: {
        nombre: data.nombre,
        tipo: data.tipo || 'egreso',
        orden: nuevoOrden
      }
    })

    return NextResponse.json(categoria)
  } catch (error) {
    console.error('Error creating cashflow categoria:', error)
    return NextResponse.json({ error: 'Error al crear categoría' }, { status: 500 })
  }
}

// PUT - Actualizar categoría
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    
    const categoria = await db.cashflowCategoria.update({
      where: { id: data.id },
      data: {
        nombre: data.nombre,
        tipo: data.tipo,
        orden: data.orden
      }
    })

    return NextResponse.json(categoria)
  } catch (error) {
    console.error('Error updating cashflow categoria:', error)
    return NextResponse.json({ error: 'Error al actualizar categoría' }, { status: 500 })
  }
}

// DELETE - Eliminar categoría
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 })
    }

    await db.cashflowCategoria.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting cashflow categoria:', error)
    return NextResponse.json({ error: 'Error al eliminar categoría' }, { status: 500 })
  }
}
