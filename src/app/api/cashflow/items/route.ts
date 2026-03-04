import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar items de cashflow
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoriaId = searchParams.get('categoriaId')

    const where: any = {}
    if (categoriaId) where.categoriaId = categoriaId

    const items = await db.cashflowItem.findMany({
      where,
      include: {
        cuentaPL: {
          include: {
            nivel: true
          }
        },
        categoria: true,
        registros: true
      },
      orderBy: { orden: 'asc' }
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error('Error fetching cashflow items:', error)
    return NextResponse.json({ error: 'Error al obtener items' }, { status: 500 })
  }
}

// POST - Crear nuevo item
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Obtener el máximo orden para la categoría
    const itemsExistentes = await db.cashflowItem.findMany({
      where: { categoriaId: data.categoriaId },
      orderBy: { orden: 'desc' },
      take: 1
    })
    
    const nuevoOrden = itemsExistentes.length > 0 ? itemsExistentes[0].orden + 1 : 0

    const item = await db.cashflowItem.create({
      data: {
        categoriaId: data.categoriaId,
        nombre: data.nombre,
        codigo: data.codigo || null,
        cuentaPLId: data.cuentaPLId || null,
        orden: nuevoOrden
      },
      include: {
        cuentaPL: {
          include: { nivel: true }
        }
      }
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error creating cashflow item:', error)
    return NextResponse.json({ error: 'Error al crear item' }, { status: 500 })
  }
}

// PUT - Actualizar item
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    
    const item = await db.cashflowItem.update({
      where: { id: data.id },
      data: {
        nombre: data.nombre,
        cuentaPLId: data.cuentaPLId || null,
        categoriaId: data.categoriaId,
        orden: data.orden
      },
      include: {
        cuentaPL: {
          include: { nivel: true }
        }
      }
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error updating cashflow item:', error)
    return NextResponse.json({ error: 'Error al actualizar item' }, { status: 500 })
  }
}

// DELETE - Eliminar item
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 })
    }

    await db.cashflowItem.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting cashflow item:', error)
    return NextResponse.json({ error: 'Error al eliminar item' }, { status: 500 })
  }
}
