import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar todos los restaurantes
export async function GET() {
  try {
    const restaurantes = await db.restaurante.findMany({
      where: { activo: true },
      orderBy: { orden: 'asc' }
    })
    return NextResponse.json(restaurantes)
  } catch (error) {
    console.error('Error fetching restaurantes:', error)
    return NextResponse.json({ error: 'Error al obtener restaurantes' }, { status: 500 })
  }
}

// POST - Crear nuevo restaurante
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const restaurante = await db.restaurante.create({
      data: {
        nombre: data.nombre,
        codigo: data.codigo,
        activo: data.activo ?? true,
        orden: data.orden ?? 0
      }
    })

    return NextResponse.json(restaurante)
  } catch (error) {
    console.error('Error creating restaurante:', error)
    return NextResponse.json({ error: 'Error al crear restaurante' }, { status: 500 })
  }
}

// PUT - Actualizar restaurante
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    
    const restaurante = await db.restaurante.update({
      where: { id: data.id },
      data: {
        nombre: data.nombre,
        codigo: data.codigo,
        activo: data.activo,
        orden: data.orden
      }
    })

    return NextResponse.json(restaurante)
  } catch (error) {
    console.error('Error updating restaurante:', error)
    return NextResponse.json({ error: 'Error al actualizar restaurante' }, { status: 500 })
  }
}
