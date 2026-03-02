import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Insertar datos básicos de forecast manualmente
export async function POST() {
  try {
    console.log('Iniciando migración manual...')
    const results: string[] = []

    // 1. Crear restaurantes usando raw query
    try {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Restaurante" (
          "id" TEXT NOT NULL,
          "nombre" TEXT NOT NULL,
          "codigo" TEXT NOT NULL,
          "activo" BOOLEAN NOT NULL DEFAULT true,
          "orden" INTEGER NOT NULL DEFAULT 0,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Restaurante_pkey" PRIMARY KEY ("id")
        );
      `)
      results.push('Tabla Restaurante creada')
    } catch (e: any) {
      if (e.message?.includes('already exists')) {
        results.push('Tabla Restaurante ya existe')
      } else {
        results.push(`Error Restaurante: ${e.message}`)
      }
    }

    // 2. Crear unique index para Restaurante.codigo
    try {
      await db.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "Restaurante_codigo_key" ON "Restaurante"("codigo");
      `)
      results.push('Index Restaurante.codigo creado')
    } catch (e: any) {
      results.push(`Index Restaurante: ${e.message}`)
    }

    // 3. Crear TipoDia
    try {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "TipoDia" (
          "id" TEXT NOT NULL,
          "nombre" TEXT NOT NULL,
          "codigo" TEXT NOT NULL,
          "color" TEXT NOT NULL,
          "icono" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "TipoDia_pkey" PRIMARY KEY ("id")
        );
      `)
      results.push('Tabla TipoDia creada')
    } catch (e: any) {
      if (e.message?.includes('already exists')) {
        results.push('Tabla TipoDia ya existe')
      } else {
        results.push(`Error TipoDia: ${e.message}`)
      }
    }

    // 4. Crear unique index para TipoDia.codigo
    try {
      await db.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "TipoDia_codigo_key" ON "TipoDia"("codigo");
      `)
      results.push('Index TipoDia.codigo creado')
    } catch (e: any) {
      results.push(`Index TipoDia: ${e.message}`)
    }

    // 5. Insertar restaurantes básicos
    try {
      await db.$executeRawUnsafe(`
        INSERT INTO "Restaurante" (id, nombre, codigo, activo, orden)
        VALUES 
          ('rest-1', 'Local Principal', 'LP', true, 1),
          ('rest-2', 'Sucursal Centro', 'SC', true, 2)
        ON CONFLICT (id) DO NOTHING;
      `)
      results.push('Restaurantes insertados')
    } catch (e: any) {
      results.push(`Insert Restaurante: ${e.message}`)
    }

    // 6. Insertar tipos de día
    try {
      await db.$executeRawUnsafe(`
        INSERT INTO "TipoDia" (id, nombre, codigo, color)
        VALUES 
          ('td-1', 'Día Normal', 'NORMAL', '#3B82F6'),
          ('td-2', 'Fin de Semana', 'FINDE', '#10B981'),
          ('td-3', 'Feriado', 'FERIADO', '#F59E0B'),
          ('td-4', 'Especial', 'ESPECIAL', '#EF4444')
        ON CONFLICT (id) DO NOTHING;
      `)
      results.push('Tipos de día insertados')
    } catch (e: any) {
      results.push(`Insert TipoDia: ${e.message}`)
    }

    // Verificar resultado
    let restaurantes = 0
    let tiposDia = 0
    
    try {
      restaurantes = await db.restaurante.count()
    } catch {}
    
    try {
      tiposDia = await db.tipoDia.count()
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Migración completada',
      results,
      counts: { restaurantes, tiposDia }
    })

  } catch (error) {
    console.error('Error en migración:', error)
    return NextResponse.json({
      error: 'Error al ejecutar migración',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET - Verificar estado de las tablas
export async function GET() {
  const tables: Record<string, number | string> = {}
  
  const tryCount = async (model: string, table: string) => {
    try {
      const result = await (db as any)[model].count()
      return result
    } catch {
      return 'no existe'
    }
  }

  tables.nivelPL = await tryCount('nivelPL', 'NivelPL')
  tables.cuentaPL = await tryCount('cuentaPL', 'CuentaPL')
  tables.cashflowCategoria = await tryCount('cashflowCategoria', 'CashflowCategoria')
  tables.cashflowItem = await tryCount('cashflowItem', 'CashflowItem')
  tables.cashflowEntry = await tryCount('cashflowEntry', 'CashflowEntry')
  tables.restaurante = await tryCount('restaurante', 'Restaurante')
  tables.turno = await tryCount('turno', 'Turno')
  tables.canal = await tryCount('canal', 'Canal')
  tables.tipoDia = await tryCount('tipoDia', 'TipoDia')
  tables.forecastEntry = await tryCount('forecastEntry', 'ForecastEntry')

  return NextResponse.json({ tables })
}
