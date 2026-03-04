import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar restaurantes
export async function GET() {
  try {
    const restaurantes = await db.restaurante.findMany({
      orderBy: { orden: 'asc' }
    })
    return NextResponse.json(restaurantes)
  } catch (error) {
    console.error('Error fetching restaurantes:', error)
    return NextResponse.json([])
  }
}

// POST - Crear restaurante
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const restaurante = await db.restaurante.create({
      data: {
        nombre: data.nombre,
        codigo: data.codigo,
        orden: data.orden || 0
      }
    })
    return NextResponse.json(restaurante)
  } catch (error) {
    console.error('Error creating restaurante:', error)
    return NextResponse.json({ error: 'Error al crear restaurante' }, { status: 500 })
  }
}
