import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar canales
export async function GET() {
  try {
    const canales = await db.canal.findMany({
      orderBy: { orden: 'asc' }
    })
    return NextResponse.json(canales)
  } catch (error) {
    console.error('Error fetching canales:', error)
    return NextResponse.json([])
  }
}

// POST - Crear canal
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const canal = await db.canal.create({
      data: {
        nombre: data.nombre,
        codigo: data.codigo,
        orden: data.orden || 0
      }
    })
    return NextResponse.json(canal)
  } catch (error) {
    console.error('Error creating canal:', error)
    return NextResponse.json({ error: 'Error al crear canal' }, { status: 500 })
  }
}

// DELETE - Eliminar canal
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    // Primero eliminar las entradas de forecast asociadas
    await db.forecastEntry.deleteMany({
      where: { canalId: id }
    })

    // Luego eliminar el canal
    await db.canal.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting canal:', error)
    return NextResponse.json({ error: 'Error al eliminar canal' }, { status: 500 })
  }
}

// PUT - Actualizar canal
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    
    if (!data.id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    const canal = await db.canal.update({
      where: { id: data.id },
      data: {
        nombre: data.nombre,
        codigo: data.codigo,
        orden: data.orden
      }
    })

    return NextResponse.json(canal)
  } catch (error) {
    console.error('Error updating canal:', error)
    return NextResponse.json({ error: 'Error al actualizar canal' }, { status: 500 })
  }
}
