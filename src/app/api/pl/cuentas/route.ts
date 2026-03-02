import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar cuentas P&L
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const nivelId = searchParams.get('nivelId')
    const includeItems = searchParams.get('includeItems')

    const where: any = {}
    if (nivelId) where.nivelId = nivelId

    const cuentas = await db.cuentaPL.findMany({
      where,
      include: {
        nivel: true,
        subcuentas: {
          include: {
            valores: true,
            cashflowItems: {
              include: {
                categoria: true
              }
            }
          }
        },
        valores: true,
        padre: true,
        ...(includeItems === 'true' && {
          cashflowItems: {
            include: {
              categoria: true
            }
          }
        })
      },
      orderBy: [{ nivelId: 'asc' }, { orden: 'asc' }]
    })

    return NextResponse.json(cuentas)
  } catch (error) {
    console.error('Error fetching cuentas PL:', error)
    return NextResponse.json({ error: 'Error al obtener cuentas P&L' }, { status: 500 })
  }
}

// POST - Crear nueva cuenta
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const cuenta = await db.cuentaPL.create({
      data: {
        nivelId: data.nivelId,
        nombre: data.nombre,
        padreId: data.padreId || null,
        orden: data.orden ?? 0,
        esSubtotal: data.esSubtotal ?? false,
        esResultado: data.esResultado ?? false
      }
    })

    return NextResponse.json(cuenta)
  } catch (error) {
    console.error('Error creating cuenta PL:', error)
    return NextResponse.json({ error: 'Error al crear cuenta P&L' }, { status: 500 })
  }
}

// PUT - Actualizar cuenta
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    
    const cuenta = await db.cuentaPL.update({
      where: { id: data.id },
      data: {
        nombre: data.nombre,
        orden: data.orden,
        esSubtotal: data.esSubtotal,
        esResultado: data.esResultado
      }
    })

    return NextResponse.json(cuenta)
  } catch (error) {
    console.error('Error updating cuenta PL:', error)
    return NextResponse.json({ error: 'Error al actualizar cuenta P&L' }, { status: 500 })
  }
}

// DELETE - Eliminar cuenta
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 })
    }

    await db.cuentaPL.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting cuenta PL:', error)
    return NextResponse.json({ error: 'Error al eliminar cuenta P&L' }, { status: 500 })
  }
}
