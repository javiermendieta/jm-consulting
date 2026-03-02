import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Inicializar estructura P&L correcta
export async function POST() {
  try {
    // Limpiar estructura existente
    await db.pLValor.deleteMany({})
    await db.cashflowItem.updateMany({
      data: { cuentaPLId: null }
    })
    await db.cuentaPL.deleteMany({})
    await db.nivelPL.deleteMany({})

    // Crear la estructura P&L correcta
    const niveles = [
      { codigo: 'VB', nombre: 'VENTA BRUTA', orden: 1 },
      { codigo: 'CV', nombre: 'COSTO DE VENTAS', orden: 2 },
      { codigo: 'CM', nombre: 'CMV', orden: 3 },
      { codigo: 'VN', nombre: 'VENTA NETA', orden: 4 },
      { codigo: 'CT', nombre: 'CONTRIBUCIÓN MARGINAL', orden: 5 },
      { codigo: 'GO', nombre: 'GASTOS OPERATIVOS', orden: 6 },
      { codigo: 'PF', nombre: 'PROFIT', orden: 7 }
    ]

    const nivelesCreados = []
    for (const nivel of niveles) {
      const creado = await db.nivelPL.create({
        data: nivel
      })
      nivelesCreados.push(creado)
    }

    // Crear cuentas base para cada nivel
    const cuentasPorNivel: Record<string, Array<{nombre: string, orden: number, esResultado?: boolean, esSubtotal?: boolean}>> = {
      'VB': [
        { nombre: 'Venta Salón', orden: 1 },
        { nombre: 'Venta Delivery', orden: 2 },
        { nombre: 'Venta Takeaway', orden: 3 }
      ],
      'CV': [
        { nombre: 'Comisión Visa', orden: 1 },
        { nombre: 'Comisión Mastercard', orden: 2 },
        { nombre: 'Comisión PedidosYa', orden: 3 },
        { nombre: 'Comisión Rappi', orden: 4 },
        { nombre: 'Otros Costos de Venta', orden: 5 }
      ],
      'CM': [
        { nombre: 'Proteínas', orden: 1 },
        { nombre: 'Vegetales', orden: 2 },
        { nombre: 'Lácteos', orden: 3 },
        { nombre: 'Bebidas', orden: 4 },
        { nombre: 'Packaging', orden: 5 },
        { nombre: 'Otros Insumos', orden: 6 }
      ],
      'VN': [
        { nombre: 'VENTA NETA', orden: 1, esResultado: true }
      ],
      'CT': [
        { nombre: 'CONTRIBUCIÓN MARGINAL', orden: 1, esResultado: true }
      ],
      'GO': [
        { nombre: 'Personal', orden: 1 },
        { nombre: 'Alquiler', orden: 2 },
        { nombre: 'Servicios', orden: 3 },
        { nombre: 'Marketing', orden: 4 },
        { nombre: 'Administración', orden: 5 },
        { nombre: 'Mantenimiento', orden: 6 },
        { nombre: 'Otros Gastos', orden: 7 }
      ],
      'PF': [
        { nombre: 'PROFIT', orden: 1, esResultado: true }
      ]
    }

    for (const nivelCreado of nivelesCreados) {
      const cuentasDelNivel = cuentasPorNivel[nivelCreado.codigo] || []
      for (const cuenta of cuentasDelNivel) {
        await db.cuentaPL.create({
          data: {
            nivelId: nivelCreado.id,
            nombre: cuenta.nombre,
            orden: cuenta.orden,
            esResultado: cuenta.esResultado || false,
            esSubtotal: cuenta.esSubtotal || false
          }
        })
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Estructura P&L inicializada correctamente',
      niveles: nivelesCreados.length,
      cuentas: Object.values(cuentasPorNivel).flat().length
    })
  } catch (error) {
    console.error('Error inicializando P&L:', error)
    return NextResponse.json({ error: 'Error al inicializar P&L' }, { status: 500 })
  }
}
