import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Inicializar estructura P&L
export async function POST() {
  try {
    // Verificar si ya existe
    const existingNiveles = await db.nivelPL.findMany()
    
    if (existingNiveles.length > 0) {
      return NextResponse.json({ message: 'Estructura ya existe', niveles: existingNiveles.length })
    }

    // Crear niveles P&L
    const niveles = [
      { codigo: 'VB', nombre: 'VENTA BRUTA', orden: 1 },
      { codigo: 'CV', nombre: 'COSTO DE VENTA', orden: 2 },
      { codigo: 'CM', nombre: 'CMV', orden: 3 },
      { codigo: 'VN', nombre: 'VENTA NETA', orden: 4 },
      { codigo: 'GO', nombre: 'GASTOS OPERATIVOS', orden: 5 },
      { codigo: 'PF', nombre: 'PROFIT', orden: 6 }
    ]

    for (const nivel of niveles) {
      await db.nivelPL.create({ data: nivel })
    }

    return NextResponse.json({ success: true, message: 'Estructura P&L creada', niveles: niveles.length })
  } catch (error) {
    console.error('Error initializing P&L:', error)
    return NextResponse.json({ error: 'Error al inicializar P&L' }, { status: 500 })
  }
}
