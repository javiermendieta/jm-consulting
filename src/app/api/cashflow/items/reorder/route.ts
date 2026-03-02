import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Reordenar items
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const items = data.items as Array<{ id: string; orden: number; categoriaId?: string }>
    
    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Items inválidos' }, { status: 400 })
    }

    // Actualizar cada item
    for (const item of items) {
      await db.cashflowItem.update({
        where: { id: item.id },
        data: {
          orden: item.orden,
          ...(item.categoriaId && { categoriaId: item.categoriaId })
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering cashflow items:', error)
    return NextResponse.json({ error: 'Error al reordenar items' }, { status: 500 })
  }
}
