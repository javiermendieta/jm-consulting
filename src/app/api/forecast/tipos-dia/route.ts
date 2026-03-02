import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar todos los tipos de día
export async function GET() {
  try {
    const tiposDia = await db.tipoDia.findMany()
    return NextResponse.json(tiposDia)
  } catch (error) {
    console.error('Error fetching tipos dia:', error)
    return NextResponse.json({ error: 'Error al obtener tipos de día' }, { status: 500 })
  }
}

// POST - Crear nuevo tipo de día
export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    const tipoDia = await db.tipoDia.create({
      data: {
        nombre: data.nombre,
        codigo: data.codigo,
        color: data.color,
        icono: data.icono
      }
    })

    return NextResponse.json(tipoDia)
  } catch (error) {
    console.error('Error creating tipo dia:', error)
    return NextResponse.json({ error: 'Error al crear tipo de día' }, { status: 500 })
  }
}
