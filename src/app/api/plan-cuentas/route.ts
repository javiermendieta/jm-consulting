import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Obtener estructura completa del Plan de Cuentas
export async function GET() {
  try {
    // Obtener todos los niveles con sus cuentas
    const niveles = await db.nivelPL.findMany({
      include: {
        cuentas: {
          include: {
            cashflowItems: {
              include: {
                categoria: true,
                registros: true
              }
            }
          },
          orderBy: { orden: 'asc' }
        }
      },
      orderBy: { orden: 'asc' }
    })

    // Obtener todos los items de cashflow no asociados
    const itemsNoAsociados = await db.cashflowItem.findMany({
      where: { cuentaPLId: null },
      include: {
        categoria: true,
        registros: true
      },
      orderBy: { nombre: 'asc' }
    })

    return NextResponse.json({
      niveles,
      itemsNoAsociados
    })
  } catch (error) {
    console.error('Error fetching plan de cuentas:', error)
    return NextResponse.json({ error: 'Error al obtener plan de cuentas' }, { status: 500 })
  }
}

// POST - Crear nueva cuenta en el plan
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const cuenta = await db.cuentaPL.create({
      data: {
        nivelId: data.nivelId,
        nombre: data.nombre,
        orden: data.orden ?? 999,
        esResultado: false,
        esSubtotal: false
      },
      include: {
        nivel: true
      }
    })

    return NextResponse.json(cuenta)
  } catch (error) {
    console.error('Error creating cuenta:', error)
    return NextResponse.json({ error: 'Error al crear cuenta' }, { status: 500 })
  }
}

// PUT - Actualizar cuenta (incluyendo asociar items de cashflow)
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    
    if (data.itemCashflowId && data.cuentaPLId !== undefined) {
      // Asociar/desasociar item de cashflow a cuenta P&L
      const item = await db.cashflowItem.update({
        where: { id: data.itemCashflowId },
        data: { cuentaPLId: data.cuentaPLId || null },
        include: {
          categoria: true,
          cuentaPL: {
            include: { nivel: true }
          }
        }
      })
      return NextResponse.json(item)
    }
    
    // Actualizar nombre de cuenta
    if (data.id && data.nombre) {
      const cuenta = await db.cuentaPL.update({
        where: { id: data.id },
        data: { nombre: data.nombre }
      })
      return NextResponse.json(cuenta)
    }

    return NextResponse.json({ error: 'Datos insuficientes' }, { status: 400 })
  } catch (error) {
    console.error('Error updating cuenta:', error)
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }
}

// DELETE - Eliminar cuenta del plan
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 })
    }

    // Desasociar items de cashflow primero
    await db.cashflowItem.updateMany({
      where: { cuentaPLId: id },
      data: { cuentaPLId: null }
    })

    // Eliminar la cuenta
    await db.cuentaPL.delete({ where: { id } })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting cuenta:', error)
    return NextResponse.json({ error: 'Error al eliminar cuenta' }, { status: 500 })
  }
}
