import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Inicializar datos base del sistema
export async function POST() {
  try {
    console.log('Iniciando seed de datos...')
    
    // 1. Crear Niveles P&L
    const niveles = [
      { id: 'nl-vb', codigo: 'VB', nombre: 'VENTA BRUTA', orden: 1 },
      { id: 'nl-cv', codigo: 'CV', nombre: 'COSTO DE VENTA', orden: 2 },
      { id: 'nl-cmv', codigo: 'CMV', nombre: 'CMV', orden: 3 },
      { id: 'nl-go', codigo: 'GO', nombre: 'GASTOS OPERATIVOS', orden: 4 },
      { id: 'nl-pf', codigo: 'PF', nombre: 'PROFIT', orden: 5 }
    ]

    for (const n of niveles) {
      await db.nivelPL.upsert({
        where: { id: n.id },
        update: n,
        create: n
      })
    }
    console.log('✓ Niveles P&L creados')

    // 2. Crear Cuentas P&L
    const cuentas = [
      // VENTA BRUTA (Ingresos)
      { id: 'ct-venta-total', nivelId: 'nl-vb', nombre: 'Venta Total', orden: 1 },
      { id: 'ct-iva', nivelId: 'nl-vb', nombre: 'IVA', orden: 2 },
      { id: 'ct-descuentos', nivelId: 'nl-vb', nombre: 'Descuentos', orden: 3 },
      
      // COSTO DE VENTA
      { id: 'ct-comision-visa', nivelId: 'nl-cv', nombre: 'Comisión Visa', orden: 1 },
      { id: 'ct-comision-apps', nivelId: 'nl-cv', nombre: 'Comisiones APPs Delivery', orden: 2 },
      { id: 'ct-comision-mp', nivelId: 'nl-cv', nombre: 'MercadoPago', orden: 3 },
      
      // CMV
      { id: 'ct-proteinas', nivelId: 'nl-cmv', nombre: 'Proteínas', orden: 1 },
      { id: 'ct-vegetales', nivelId: 'nl-cmv', nombre: 'Vegetales', orden: 2 },
      { id: 'ct-packaging', nivelId: 'nl-cmv', nombre: 'Packaging', orden: 3 },
      { id: 'ct-bebidas', nivelId: 'nl-cmv', nombre: 'Bebidas', orden: 4 },
      
      // GASTOS OPERATIVOS
      { id: 'ct-personal', nivelId: 'nl-go', nombre: 'Personal', orden: 1 },
      { id: 'ct-estructura', nivelId: 'nl-go', nombre: 'Estructura', orden: 2 },
      { id: 'ct-comercial', nivelId: 'nl-go', nombre: 'Comercial', orden: 3 },
      { id: 'ct-admin', nivelId: 'nl-go', nombre: 'Administración', orden: 4 },
      
      // PROFIT (resultado)
      { id: 'ct-profit', nivelId: 'nl-pf', nombre: 'PROFIT', orden: 1, esResultado: true }
    ]

    for (const c of cuentas) {
      await db.cuentaPL.upsert({
        where: { id: c.id },
        update: c,
        create: c
      })
    }
    console.log('✓ Cuentas P&L creadas')

    // 3. Crear Categorías de Cashflow
    await db.cashflowCategoria.upsert({
      where: { id: 'cat-ingreso' },
      update: { nombre: 'INGRESOS', tipo: 'ingreso', orden: 0 },
      create: { id: 'cat-ingreso', nombre: 'INGRESOS', tipo: 'ingreso', orden: 0 }
    })
    
    await db.cashflowCategoria.upsert({
      where: { id: 'cat-egreso' },
      update: { nombre: 'EGRESOS', tipo: 'egreso', orden: 1 },
      create: { id: 'cat-egreso', nombre: 'EGRESOS', tipo: 'egreso', orden: 1 }
    })
    console.log('✓ Categorías Cashflow creadas')

    // 4. Crear Items de Cashflow
    const items = [
      // INGRESOS - Venta Bruta
      { id: 'cf-venta-local', categoriaId: 'cat-ingreso', nombre: 'Venta Local', cuentaPLId: 'ct-venta-total', orden: 0 },
      { id: 'cf-venta-delivery', categoriaId: 'cat-ingreso', nombre: 'Venta Delivery', cuentaPLId: 'ct-venta-total', orden: 1 },
      { id: 'cf-venta-mostrador', categoriaId: 'cat-ingreso', nombre: 'Venta Mostrador', cuentaPLId: 'ct-venta-total', orden: 2 },
      
      // EGRESOS - Costo de Venta
      { id: 'cf-visa', categoriaId: 'cat-egreso', nombre: 'Comisión Visa', cuentaPLId: 'ct-comision-visa', orden: 0 },
      { id: 'cf-pedidosya', categoriaId: 'cat-egreso', nombre: 'PedidosYa', cuentaPLId: 'ct-comision-apps', orden: 1 },
      { id: 'cf-rappi', categoriaId: 'cat-egreso', nombre: 'Rappi', cuentaPLId: 'ct-comision-apps', orden: 2 },
      { id: 'cf-mercadopago', categoriaId: 'cat-egreso', nombre: 'MercadoPago', cuentaPLId: 'ct-comision-mp', orden: 3 },
      
      // EGRESOS - CMV
      { id: 'cf-carne', categoriaId: 'cat-egreso', nombre: 'Carne', cuentaPLId: 'ct-proteinas', orden: 4 },
      { id: 'cf-pollo', categoriaId: 'cat-egreso', nombre: 'Pollo', cuentaPLId: 'ct-proteinas', orden: 5 },
      { id: 'cf-verduras', categoriaId: 'cat-egreso', nombre: 'Vegetales', cuentaPLId: 'ct-vegetales', orden: 6 },
      { id: 'cf-envases', categoriaId: 'cat-egreso', nombre: 'Envases', cuentaPLId: 'ct-packaging', orden: 7 },
      { id: 'cf-bebidas', categoriaId: 'cat-egreso', nombre: 'Bebidas', cuentaPLId: 'ct-bebidas', orden: 8 },
      
      // EGRESOS - Gastos Operativos
      { id: 'cf-sueldos', categoriaId: 'cat-egreso', nombre: 'Sueldos', cuentaPLId: 'ct-personal', orden: 9 },
      { id: 'cf-cargas', categoriaId: 'cat-egreso', nombre: 'Cargas Sociales', cuentaPLId: 'ct-personal', orden: 10 },
      { id: 'cf-alquiler', categoriaId: 'cat-egreso', nombre: 'Alquiler', cuentaPLId: 'ct-estructura', orden: 11 },
      { id: 'cf-luz', categoriaId: 'cat-egreso', nombre: 'Electricidad', cuentaPLId: 'ct-estructura', orden: 12 },
      { id: 'cf-gas', categoriaId: 'cat-egreso', nombre: 'Gas', cuentaPLId: 'ct-estructura', orden: 13 },
      { id: 'cf-marketing', categoriaId: 'cat-egreso', nombre: 'Marketing', cuentaPLId: 'ct-comercial', orden: 14 },
      { id: 'cf-contador', categoriaId: 'cat-egreso', nombre: 'Contador', cuentaPLId: 'ct-admin', orden: 15 },
      { id: 'cf-software', categoriaId: 'cat-egreso', nombre: 'Software', cuentaPLId: 'ct-admin', orden: 16 }
    ]

    for (const item of items) {
      await db.cashflowItem.upsert({
        where: { id: item.id },
        update: item,
        create: item
      })
    }
    console.log('✓ Items Cashflow creados')

    // 5. Crear algunos registros de ejemplo para enero 2025
    const entries = [
      // Ingresos
      { id: 'e1', itemId: 'cf-venta-local', mes: 1, anio: 2025, monto: 50000 },
      { id: 'e2', itemId: 'cf-venta-delivery', mes: 1, anio: 2025, monto: 30000 },
      { id: 'e3', itemId: 'cf-venta-mostrador', mes: 1, anio: 2025, monto: 10000 },
      
      // Costos de Venta
      { id: 'e4', itemId: 'cf-visa', mes: 1, anio: 2025, monto: 2500 },
      { id: 'e5', itemId: 'cf-pedidosya', mes: 1, anio: 2025, monto: 4500 },
      { id: 'e6', itemId: 'cf-rappi', mes: 1, anio: 2025, monto: 3000 },
      { id: 'e7', itemId: 'cf-mercadopago', mes: 1, anio: 2025, monto: 1200 },
      
      // CMV
      { id: 'e8', itemId: 'cf-carne', mes: 1, anio: 2025, monto: 15000 },
      { id: 'e9', itemId: 'cf-pollo', mes: 1, anio: 2025, monto: 8000 },
      { id: 'e10', itemId: 'cf-verduras', mes: 1, anio: 2025, monto: 5000 },
      { id: 'e11', itemId: 'cf-envases', mes: 1, anio: 2025, monto: 2000 },
      { id: 'e12', itemId: 'cf-bebidas', mes: 1, anio: 2025, monto: 3000 },
      
      // Gastos Operativos
      { id: 'e13', itemId: 'cf-sueldos', mes: 1, anio: 2025, monto: 12000 },
      { id: 'e14', itemId: 'cf-cargas', mes: 1, anio: 2025, monto: 3600 },
      { id: 'e15', itemId: 'cf-alquiler', mes: 1, anio: 2025, monto: 8000 },
      { id: 'e16', itemId: 'cf-luz', mes: 1, anio: 2025, monto: 1500 },
      { id: 'e17', itemId: 'cf-gas', mes: 1, anio: 2025, monto: 800 },
      { id: 'e18', itemId: 'cf-marketing', mes: 1, anio: 2025, monto: 2000 },
      { id: 'e19', itemId: 'cf-contador', mes: 1, anio: 2025, monto: 500 },
      { id: 'e20', itemId: 'cf-software', mes: 1, anio: 2025, monto: 300 }
    ]

    for (const e of entries) {
      await db.cashflowEntry.upsert({
        where: { id: e.id },
        update: e,
        create: e
      }).catch(() => {}) // Ignorar errores de duplicados
    }
    console.log('✓ Registros de ejemplo creados')

    return NextResponse.json({ 
      success: true, 
      message: 'Datos inicializados correctamente',
      data: {
        niveles: niveles.length,
        cuentas: cuentas.length,
        categorias: 2,
        items: items.length,
        entries: entries.length
      }
    })
  } catch (error) {
    console.error('Error en seed:', error)
    return NextResponse.json({ 
      error: 'Error al inicializar datos',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET - Verificar estado de datos
export async function GET() {
  try {
    const [niveles, cuentas, categorias, items] = await Promise.all([
      db.nivelPL.count(),
      db.cuentaPL.count(),
      db.cashflowCategoria.count(),
      db.cashflowItem.count()
    ])

    return NextResponse.json({
      initialized: niveles > 0,
      counts: { niveles, cuentas, categorias, items }
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Error al verificar datos',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
