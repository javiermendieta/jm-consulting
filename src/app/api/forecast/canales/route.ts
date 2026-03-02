import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar todos los canales
export async function GET() {
  try {
    const canales = await db.canal.findMany({
      where: { activo: true },
      orderBy: { orden: 'asc' }
    })
    return NextResponse.json(canales)
  } catch (error) {
    console.error('Error fetching canales:', error)
    return NextResponse.json({ error: 'Error al obtener canales' }, { status: 500 })
  }
}

// POST - Crear nuevo canal
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const canal = await db.canal.create({
      data: {
        nombre: data.nombre,
        codigo: data.codigo,
        activo: data.activo ?? true,
        orden: data.orden ?? 0
      }
    })

    return NextResponse.json(canal)
  } catch (error) {
    console.error('Error creating canal:', error)
    return NextResponse.json({ error: 'Error al crear canal' }, { status: 500 })
  }
}
