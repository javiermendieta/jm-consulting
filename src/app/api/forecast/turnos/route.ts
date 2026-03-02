import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar todos los turnos
export async function GET() {
  try {
    const turnos = await db.turno.findMany({
      orderBy: { horaInicio: 'asc' }
    })
    return NextResponse.json(turnos)
  } catch (error) {
    console.error('Error fetching turnos:', error)
    return NextResponse.json({ error: 'Error al obtener turnos' }, { status: 500 })
  }
}

// POST - Crear nuevo turno
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const turno = await db.turno.create({
      data: {
        nombre: data.nombre,
        codigo: data.codigo,
        horaInicio: data.horaInicio,
        horaFin: data.horaFin
      }
    })

    return NextResponse.json(turno)
  } catch (error) {
    console.error('Error creating turno:', error)
    return NextResponse.json({ error: 'Error al crear turno' }, { status: 500 })
  }
}
