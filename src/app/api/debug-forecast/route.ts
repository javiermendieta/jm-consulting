import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Test 1: Simple count
    const count = await db.forecastEntry.count()
    
    // Test 2: Find first without includes
    const first = await db.forecastEntry.findFirst()
    
    // Test 3: Try with includes
    let withIncludes = null
    try {
      withIncludes = await db.forecastEntry.findFirst({
        include: {
          restaurante: true,
          canal: true,
          turno: true,
          tipoDia: true
        }
      })
    } catch (e: any) {
      return NextResponse.json({
        step: 'includes',
        error: e.message,
        count,
        first
      })
    }
    
    return NextResponse.json({
      success: true,
      count,
      first,
      withIncludes
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
