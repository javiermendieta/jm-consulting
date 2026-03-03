import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Inicializar o resetear estructura P&L
export async function POST(request: Request) {
  try {
    const url = new URL(request.url)
    const reset = url.searchParams.get('reset') === 'true'

    // Si reset=true, eliminar niveles existentes
    if (reset) {
      // Eliminar cuentas primero (cascade)
      await db.cuentaPL.deleteMany()
      await db.nivelPL.deleteMany()
    } else {
      // Verificar si ya existe
      const existingNiveles = await db.nivelPL.findMany()
      if (existingNiveles.length > 0) {
        return NextResponse.json({ message: 'Estructura ya existe', niveles: existingNiveles.length })
      }
    }

    // Estructura P&L:
    // VB = Venta Bruta (se carga)
    // CV = Costo de Venta (se carga)  
    // VN = Venta Neta (CALCULADO: VB - CV)
    // CMV = Costo de Mercadería Vendida (se carga)
    // CM = Contribución Marginal (CALCULADO: VN - CMV)
    // GO = Gastos Operativos (se cargan)
    // PF = Profit (CALCULADO: CM - GO)
    
    const niveles = [
      { codigo: 'VB', nombre: 'VENTA BRUTA', orden: 1 },
      { codigo: 'CV', nombre: 'COSTO DE VENTA', orden: 2 },
      { codigo: 'VN', nombre: 'VENTA NETA', orden: 3 },
      { codigo: 'CMV', nombre: 'CMV', orden: 4 },
      { codigo: 'CM', nombre: 'CONTRIBUCIÓN MARGINAL', orden: 5 },
      { codigo: 'GO', nombre: 'GASTOS OPERATIVOS', orden: 6 },
      { codigo: 'PF', nombre: 'PROFIT', orden: 7 }
    ]

    for (const nivel of niveles) {
      await db.nivelPL.create({ data: nivel })
    }

    return NextResponse.json({ 
      success: true, 
      message: reset ? 'Estructura P&L reseteada' : 'Estructura P&L creada', 
      niveles: niveles.length 
    })
  } catch (error) {
    console.error('Error initializing P&L:', error)
    return NextResponse.json({ error: 'Error al inicializar P&L' }, { status: 500 })
  }
}
