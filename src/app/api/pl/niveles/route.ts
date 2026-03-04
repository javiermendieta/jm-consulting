import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar todos los niveles P&L
export async function GET() {
  try {
    const niveles = await db.nivelPL.findMany({
      include: {
        cuentas: true
      },
      orderBy: { orden: 'asc' }
    })
    return NextResponse.json(niveles)
  } catch (error) {
    console.error('Error fetching niveles PL:', error)
    return NextResponse.json([])
  }
}

// POST - Crear nuevo nivel
export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    const nivel = await db.nivelPL.create({
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        orden: data.orden
      }
    })

    return NextResponse.json(nivel)
  } catch (error) {
    console.error('Error creating nivel PL:', error)
    return NextResponse.json({ error: 'Error al crear nivel P&L' }, { status: 500 })
  }
}
