import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Obtener cuentas con items de cashflow asociados
export async function GET() {
  try {
    const cuentas = await db.cuentaPL.findMany({
      include: {
        nivel: true,
        cashflowItems: {
          include: {
            categoria: true,
            registros: true
          }
        }
      },
      orderBy: { orden: 'asc' }
    })

    return NextResponse.json(cuentas)
  } catch (error) {
    console.error('Error fetching cuentas:', error)
    return NextResponse.json([])
  }
}

// POST - Crear nueva cuenta
export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    const cuenta = await db.cuentaPL.create({
      data: {
        nivelId: data.nivelId,
        nombre: data.nombre,
        orden: data.orden ?? 0
      }
    })

    return NextResponse.json(cuenta)
  } catch (error) {
    console.error('Error creating cuenta:', error)
    return NextResponse.json({ error: 'Error al crear cuenta' }, { status: 500 })
  }
}

// DELETE - Eliminar cuenta
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id requerido' }, { status: 400 })
    }

    // Desasociar items
    await db.cashflowItem.updateMany({
      where: { cuentaPLId: id },
      data: { cuentaPLId: null }
    })

    // Eliminar cuenta
    await db.cuentaPL.delete({ where: { id } })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting cuenta:', error)
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
}
