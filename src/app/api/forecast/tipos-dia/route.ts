import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar tipos de día
export async function GET() {
  try {
    const tipos = await db.tipoDia.findMany({
      orderBy: { nombre: 'asc' }
    })
    return NextResponse.json(tipos)
  } catch (error) {
    console.error('Error fetching tipos de día:', error)
    return NextResponse.json([])
  }
}

// POST - Crear tipo de día
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const tipo = await db.tipoDia.create({
      data: {
        nombre: data.nombre,
        codigo: data.codigo,
        color: data.color || '#22c55e',
        icono: data.icono
      }
    })
    return NextResponse.json(tipo)
  } catch (error) {
    console.error('Error creating tipo de día:', error)
    return NextResponse.json({ error: 'Error al crear tipo de día' }, { status: 500 })
  }
}
