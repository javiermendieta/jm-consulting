import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// API para crear la tabla PendienteCliente en Supabase
// Llamar una sola vez: GET /api/migrate-pendientes

export async function GET() {
  try {
    // Verificar si la tabla ya existe intentando hacer una consulta
    try {
      await db.pendienteCliente.findFirst()
      return NextResponse.json({ 
        success: true, 
        message: 'La tabla PendienteCliente ya existe' 
      })
    } catch {
      // La tabla no existe, necesitamos crearla
    }
    
    // Ejecutar SQL raw para crear la tabla
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PendienteCliente" (
        "id" TEXT NOT NULL,
        "proyectoId" TEXT NOT NULL,
        "descripcion" TEXT NOT NULL,
        "estado" TEXT NOT NULL DEFAULT 'pendiente',
        "prioridad" TEXT NOT NULL DEFAULT 'media',
        "fechaLimite" DATETIME,
        "responsable" TEXT,
        "notas" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        
        CONSTRAINT "PendienteCliente_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "PendienteCliente_proyectoId_fkey" 
          FOREIGN KEY ("proyectoId") REFERENCES "ProyectoConsultoria"("id") 
          ON DELETE CASCADE ON UPDATE CASCADE
      );
    `)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Tabla PendienteCliente creada exitosamente' 
    })
  } catch (error) {
    console.error('Error en migración:', error)
    return NextResponse.json({ 
      success: false, 
      error: String(error) 
    }, { status: 500 })
  }
}
