import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Obtener forecasts de items para un período
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const periodo = searchParams.get('periodo')

    if (!periodo) {
      return NextResponse.json([])
    }

    const forecasts = await db.pLItemForecast.findMany({
      where: { periodo },
      include: {
        item: {
          include: {
            cuentaPL: true
          }
        }
      }
    })

    // Convertir a un record para fácil acceso
    const result: Record<string, number> = {}
    forecasts.forEach(f => {
      result[f.itemId] = f.forecastMonto || 0
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching item forecasts:', error)
    return NextResponse.json({})
  }
}

// POST - Guardar forecast de un item
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Buscar si ya existe
    const existing = await db.pLItemForecast.findFirst({
      where: {
        itemId: data.itemId,
        periodo: data.periodo
      }
    })

    let forecast
    if (existing) {
      forecast = await db.pLItemForecast.update({
        where: { id: existing.id },
        data: { forecastMonto: data.forecastMonto || 0 }
      })
    } else {
      forecast = await db.pLItemForecast.create({
        data: {
          itemId: data.itemId,
          periodo: data.periodo,
          forecastMonto: data.forecastMonto || 0
        }
      })
    }

    return NextResponse.json(forecast)
  } catch (error) {
    console.error('Error saving item forecast:', error)
    return NextResponse.json({ error: 'Error al guardar forecast' }, { status: 500 })
  }
}
