import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar entries de un item
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')
    const anio = searchParams.get('anio')

    const where: any = {}
    if (itemId) where.itemId = itemId
    if (anio) where.anio = Number(anio)

    const entries = await db.cashflowEntry.findMany({
      where,
      orderBy: [
        { mes: 'asc' },
        { fecha: 'asc' }
      ]
    })

    return NextResponse.json(entries)
  } catch (error) {
    console.error('Error fetching cashflow entries:', error)
    return NextResponse.json({ error: 'Error al obtener registros' }, { status: 500 })
  }
}

// POST - Crear nuevo entry
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const entry = await db.cashflowEntry.create({
      data: {
        itemId: data.itemId,
        fecha: data.fecha ? new Date(data.fecha) : null,
        observacion: data.observacion || null,
        mes: data.mes,
        anio: data.anio,
        monto: data.monto || 0
      }
    })

    return NextResponse.json(entry)
  } catch (error) {
    console.error('Error creating cashflow entry:', error)
    return NextResponse.json({ error: 'Error al crear registro' }, { status: 500 })
  }
}

// PUT - Actualizar entry
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    
    const entry = await db.cashflowEntry.update({
      where: { id: data.id },
      data: {
        fecha: data.fecha ? new Date(data.fecha) : null,
        observacion: data.observacion || null,
        mes: data.mes,
        anio: data.anio,
        monto: data.monto
      }
    })

    return NextResponse.json(entry)
  } catch (error) {
    console.error('Error updating cashflow entry:', error)
    return NextResponse.json({ error: 'Error al actualizar registro' }, { status: 500 })
  }
}

// DELETE - Eliminar entry
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 })
    }

    await db.cashflowEntry.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting cashflow entry:', error)
    return NextResponse.json({ error: 'Error al eliminar registro' }, { status: 500 })
  }
}
