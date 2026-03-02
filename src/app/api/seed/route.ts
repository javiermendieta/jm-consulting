import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Inicializar categorías e items de Cashflow basados en P&L existente
export async function POST() {
  try {
    console.log('Iniciando seed de cashflow...')
    
    // 1. Obtener niveles P&L existentes
    const niveles = await db.nivelPL.findMany({
      orderBy: { orden: 'asc' }
    })
    
    if (niveles.length === 0) {
      return NextResponse.json({ 
        error: 'No hay niveles P&L. Configure primero el Plan de Cuentas.',
        hint: 'Vaya a Configuración → Plan de Cuentas'
      }, { status: 400 })
    }
    
    // 2. Crear/actualizar categorías de cashflow
    const catIngreso = await db.cashflowCategoria.upsert({
      where: { id: 'cat-ingreso' },
      update: { nombre: 'INGRESOS', tipo: 'ingreso', orden: 0 },
      create: { id: 'cat-ingreso', nombre: 'INGRESOS', tipo: 'ingreso', orden: 0 }
    })
    
    const catEgreso = await db.cashflowCategoria.upsert({
      where: { id: 'cat-egreso' },
      update: { nombre: 'EGRESOS', tipo: 'egreso', orden: 1 },
      create: { id: 'cat-egreso', nombre: 'EGRESOS', tipo: 'egreso', orden: 1 }
    })
    
    console.log('✓ Categorías creadas')

    // 3. Obtener cuentas P&L existentes
    const cuentas = await db.cuentaPL.findMany({
      include: { nivel: true }
    })
    
    // Mapear nombres de cuentas a IDs
    const cuentaMap = new Map(cuentas.map(c => [c.nombre.toLowerCase(), c.id]))
    const nivelMap = new Map(niveles.map(n => [n.codigo, n.id]))

    // 4. Crear items de cashflow
    const items = [
      // INGRESOS - Venta Bruta (VB)
      { id: 'cf-venta-local', categoriaId: 'cat-ingreso', nombre: 'Venta Local', nivelCodigo: 'VB', cuentaNombre: 'venta total', orden: 0 },
      { id: 'cf-venta-delivery', categoriaId: 'cat-ingreso', nombre: 'Venta Delivery', nivelCodigo: 'VB', cuentaNombre: 'venta total', orden: 1 },
      
      // EGRESOS - Costo de Venta (CV)
      { id: 'cf-visa', categoriaId: 'cat-egreso', nombre: 'Comisión Visa', nivelCodigo: 'CV', cuentaNombre: 'comision tarjetas', orden: 0 },
      { id: 'cf-pedidosya', categoriaId: 'cat-egreso', nombre: 'PedidosYa', nivelCodigo: 'CV', cuentaNombre: 'comision apps delivery', orden: 1 },
      { id: 'cf-rappi', categoriaId: 'cat-egreso', nombre: 'Rappi', nivelCodigo: 'CV', cuentaNombre: 'comision apps delivery', orden: 2 },
      
      // EGRESOS - CMV
      { id: 'cf-carne', categoriaId: 'cat-egreso', nombre: 'Carne', nivelCodigo: 'CMV', cuentaNombre: 'materia prima', orden: 3 },
      { id: 'cf-pollo', categoriaId: 'cat-egreso', nombre: 'Pollo', nivelCodigo: 'CMV', cuentaNombre: 'materia prima', orden: 4 },
      { id: 'cf-verduras', categoriaId: 'cat-egreso', nombre: 'Vegetales', nivelCodigo: 'CMV', cuentaNombre: 'materia prima', orden: 5 },
      { id: 'cf-envases', categoriaId: 'cat-egreso', nombre: 'Envases', nivelCodigo: 'CMV', cuentaNombre: 'packaging', orden: 6 },
      
      // EGRESOS - Gastos Operativos (GO)
      { id: 'cf-sueldos', categoriaId: 'cat-egreso', nombre: 'Sueldos', nivelCodigo: 'GO', cuentaNombre: 'costo laboral', orden: 7 },
      { id: 'cf-cargas', categoriaId: 'cat-egreso', nombre: 'Cargas Sociales', nivelCodigo: 'GO', cuentaNombre: 'costo laboral', orden: 8 },
      { id: 'cf-alquiler', categoriaId: 'cat-egreso', nombre: 'Alquiler', nivelCodigo: 'GO', cuentaNombre: 'costos fijos', orden: 9 },
      { id: 'cf-luz', categoriaId: 'cat-egreso', nombre: 'Electricidad', nivelCodigo: 'GO', cuentaNombre: 'costos fijos', orden: 10 },
      { id: 'cf-gas', categoriaId: 'cat-egreso', nombre: 'Gas', nivelCodigo: 'GO', cuentaNombre: 'costos variables', orden: 11 },
      { id: 'cf-marketing', categoriaId: 'cat-egreso', nombre: 'Marketing', nivelCodigo: 'GO', cuentaNombre: 'overheads operativos', orden: 12 },
      { id: 'cf-contador', categoriaId: 'cat-egreso', nombre: 'Contador', nivelCodigo: 'GO', cuentaNombre: 'overheads operativos', orden: 13 },
      { id: 'cf-software', categoriaId: 'cat-egreso', nombre: 'Software', nivelCodigo: 'GO', cuentaNombre: 'overheads operativos', orden: 14 }
    ]

    let itemsCreados = 0
    for (const item of items) {
      const nivelId = nivelMap.get(item.nivelCodigo)
      // Buscar cuenta por nombre y nivel
      const cuenta = cuentas.find(c => 
        c.nivelId === nivelId && 
        c.nombre.toLowerCase().includes(item.cuentaNombre.toLowerCase())
      )
      
      try {
        await db.cashflowItem.upsert({
          where: { id: item.id },
          update: {
            categoriaId: item.categoriaId,
            nombre: item.nombre,
            cuentaPLId: cuenta?.id || null,
            orden: item.orden
          },
          create: {
            id: item.id,
            categoriaId: item.categoriaId,
            nombre: item.nombre,
            cuentaPLId: cuenta?.id || null,
            orden: item.orden
          }
        })
        itemsCreados++
      } catch (e) {
        console.log(`Error creando item ${item.nombre}:`, e)
      }
    }
    console.log(`✓ ${itemsCreados} items creados`)

    // 5. Crear registros de ejemplo para enero 2025
    const entries = [
      // Ingresos
      { id: 'e1', itemId: 'cf-venta-local', mes: 1, anio: 2025, monto: 50000 },
      { id: 'e2', itemId: 'cf-venta-delivery', mes: 1, anio: 2025, monto: 30000 },
      
      // Costos de Venta
      { id: 'e3', itemId: 'cf-visa', mes: 1, anio: 2025, monto: 2500 },
      { id: 'e4', itemId: 'cf-pedidosya', mes: 1, anio: 2025, monto: 4500 },
      { id: 'e5', itemId: 'cf-rappi', mes: 1, anio: 2025, monto: 3000 },
      
      // CMV
      { id: 'e6', itemId: 'cf-carne', mes: 1, anio: 2025, monto: 15000 },
      { id: 'e7', itemId: 'cf-pollo', mes: 1, anio: 2025, monto: 8000 },
      { id: 'e8', itemId: 'cf-verduras', mes: 1, anio: 2025, monto: 5000 },
      { id: 'e9', itemId: 'cf-envases', mes: 1, anio: 2025, monto: 2000 },
      
      // Gastos Operativos
      { id: 'e10', itemId: 'cf-sueldos', mes: 1, anio: 2025, monto: 12000 },
      { id: 'e11', itemId: 'cf-cargas', mes: 1, anio: 2025, monto: 3600 },
      { id: 'e12', itemId: 'cf-alquiler', mes: 1, anio: 2025, monto: 8000 },
      { id: 'e13', itemId: 'cf-luz', mes: 1, anio: 2025, monto: 1500 },
      { id: 'e14', itemId: 'cf-gas', mes: 1, anio: 2025, monto: 800 },
      { id: 'e15', itemId: 'cf-marketing', mes: 1, anio: 2025, monto: 2000 },
      { id: 'e16', itemId: 'cf-contador', mes: 1, anio: 2025, monto: 500 },
      { id: 'e17', itemId: 'cf-software', mes: 1, anio: 2025, monto: 300 }
    ]

    let entriesCreados = 0
    for (const e of entries) {
      try {
        await db.cashflowEntry.upsert({
          where: { id: e.id },
          update: e,
          create: e
        })
        entriesCreados++
      } catch (err) {
        // Ignorar errores
      }
    }
    console.log(`✓ ${entriesCreados} registros creados`)

    return NextResponse.json({ 
      success: true, 
      message: 'Cashflow inicializado correctamente',
      data: {
        niveles: niveles.length,
        cuentas: cuentas.length,
        categorias: 2,
        items: itemsCreados,
        entries: entriesCreados
      }
    })
  } catch (error) {
    console.error('Error en seed:', error)
    return NextResponse.json({ 
      error: 'Error al inicializar cashflow',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET - Verificar estado
export async function GET() {
  try {
    const [niveles, cuentas, categorias, items, entries] = await Promise.all([
      db.nivelPL.count(),
      db.cuentaPL.count(),
      db.cashflowCategoria.count(),
      db.cashflowItem.count(),
      db.cashflowEntry.count()
    ])

    return NextResponse.json({
      initialized: niveles > 0,
      counts: { niveles, cuentas, categorias, items, entries }
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Error al verificar datos',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
