import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar cuentas P&L con items de cashflow
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const nivelId = searchParams.get('nivelId')

    const where: any = {}
    if (nivelId) where.nivelId = nivelId

    // Obtener cuentas con sus items de cashflow
    const cuentas = await db.cuentaPL.findMany({
      where,
      include: {
        nivel: true,
        valores: true,
        cashflowItems: {
          include: {
            categoria: true,
            registros: true
          }
        }
      },
      orderBy: [{ orden: 'asc' }]
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

// DELETE - Eliminar cuenta
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 })
    }

    // Desasociar items de cashflow
    await db.cashflowItem.updateMany({
      where: { cuentaPLId: id },
      data: { cuentaPLId: null }
    })

    // Eliminar valores
    await db.pLValor.deleteMany({
      where: { cuentaId: id }
    })

    // Eliminar la cuenta
    await db.cuentaPL.delete({ where: { id } })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting cuenta PL:', error)
    return NextResponse.json({ error: 'Error al eliminar cuenta P&L' }, { status: 500 })
  }
}
