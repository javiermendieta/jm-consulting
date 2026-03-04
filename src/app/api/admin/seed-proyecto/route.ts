import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Token de seguridad para ejecutar el seed
const SEED_TOKEN = 'jm-seed-2026-secure'

// Fechas del proyecto: 1/3/2026 - 31/5/2026
const fechaInicio = new Date(2026, 2, 1) // 1 de marzo 2026
const fechaFin = new Date(2026, 4, 31)   // 31 de mayo 2026

// Helper para crear fechas
function createDate(days: number, month: number, year: number = 2026): Date {
  return new Date(Date.UTC(year, month - 1, days, 12, 0, 0))
}

export async function POST(request: NextRequest) {
  try {
    // Verificar token de seguridad
    const body = await request.json()
    if (body.token !== SEED_TOKEN) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Verificar si ya existe el proyecto
    const proyectoExistente = await db.proyectoConsultoria.findFirst({
      where: { cliente: 'Sebastian Ovando' }
    })

    if (proyectoExistente) {
      return NextResponse.json({ 
        message: 'El proyecto ya existe',
        proyectoId: proyectoExistente.id 
      })
    }

    // 1. Crear el proyecto
    const proyecto = await db.proyectoConsultoria.create({
      data: {
        nombre: 'Plan Trimestral de Crecimiento',
        cliente: 'Sebastian Ovando',
        fechaInicio: fechaInicio,
        fechaFin: fechaFin,
        estado: 'activo',
        valorContrato: 600000 * 3,
      }
    })

    // 2. Crear las 3 fases (meses)
    const fasesData = [
      {
        nombre: 'MES 1 – Orden, Control y Base de Crecimiento',
        orden: 1,
        fechaInicio: createDate(1, 3),
        fechaFin: createDate(31, 3),
        objetivo: 'Instalar sistema de dirección comercial y financiera. Detectar fricciones antes de escalar ventas.',
        focoEstrategico: 'Medir todo antes de acelerar. Ordenar antes de crecer.',
        dedicacion: '2 días semanales en el local. Dirección estratégica y análisis remoto continuo.'
      },
      {
        nombre: 'MES 2 – Ejecución Comercial y Aceleración',
        orden: 2,
        fechaInicio: createDate(1, 4),
        fechaFin: createDate(30, 4),
        objetivo: 'Generar aumento real de volumen y consolidar crecimiento.',
        focoEstrategico: 'Escalar con control.',
        dedicacion: '2 días semanales en el local. Seguimiento y planificación remota continua.'
      },
      {
        nombre: 'MES 3 – Consolidación y Sostenibilidad',
        orden: 3,
        fechaInicio: createDate(1, 5),
        fechaFin: createDate(31, 5),
        objetivo: 'Alcanzar y sostener +15% mensual sin deteriorar margen.',
        focoEstrategico: 'Hacer el crecimiento predecible.',
        dedicacion: '2 días semanales en el local. Dirección estratégica remota continua.'
      }
    ]

    for (const faseData of fasesData) {
      await db.fase.create({
        data: {
          proyectoId: proyecto.id,
          ...faseData
        }
      })
    }

    // Obtener fases creadas
    const fasesCreadas = await db.fase.findMany({
      where: { proyectoId: proyecto.id },
      orderBy: { orden: 'asc' }
    })

    // 3. Datos de semanas
    const semanasData = [
      // MES 1 - Semanas 1-4
      { faseOrden: 1, numero: 1, inicio: createDate(1, 3), fin: createDate(7, 3), tareas: [
        { titulo: 'Auditoría presencial integral', prioridad: 'alta' },
        { titulo: 'Relevamiento por canal y turno', prioridad: 'alta' },
        { titulo: 'Inicio construcción P&L real', prioridad: 'alta' },
        { titulo: 'Recolección de datos para Forecast', prioridad: 'alta' },
        { titulo: 'Análisis preliminar de CMV y mix', prioridad: 'media' },
        { titulo: 'Diseño de tablero de control', prioridad: 'media' },
        { titulo: 'Diseño de modelo de briefing diario', prioridad: 'media' },
        { titulo: 'Revisión inicial carpeta legal', prioridad: 'baja' }
      ], entregables: [
        { nombre: 'Esquema base de P&L', tipo: 'documento' },
        { nombre: 'Estructura inicial de Forecast', tipo: 'documento' },
        { nombre: 'Primer informe diagnóstico', tipo: 'informe' },
        { nombre: 'Modelo de briefing diario listo para implementar', tipo: 'plantilla' }
      ]},
      { faseOrden: 1, numero: 2, inicio: createDate(8, 3), fin: createDate(14, 3), tareas: [
        { titulo: 'Finalización P&L real', prioridad: 'alta' },
        { titulo: 'Desarrollo completo Forecast por canal/día/turno', prioridad: 'alta' },
        { titulo: 'Implementación control de CMV', prioridad: 'alta' },
        { titulo: 'Análisis profundo de márgenes', prioridad: 'media' },
        { titulo: 'Instalación seguimiento diario ventas vs Forecast', prioridad: 'alta' },
        { titulo: 'Implementación activa de briefings', prioridad: 'media' }
      ], entregables: [
        { nombre: 'P&L validado', tipo: 'documento' },
        { nombre: 'Forecast operativo', tipo: 'sistema' },
        { nombre: 'Tablero de control activo', tipo: 'sistema' },
        { nombre: 'Primer informe semanal completo con desvíos', tipo: 'informe' }
      ]},
      { faseOrden: 1, numero: 3, inicio: createDate(15, 3), fin: createDate(21, 3), tareas: [
        { titulo: 'Seguimiento diario y análisis por turno', prioridad: 'alta' },
        { titulo: 'Detección de fricciones comerciales', prioridad: 'alta' },
        { titulo: 'Análisis de reclamos y tiempos', prioridad: 'media' },
        { titulo: 'Evaluación capacidad ante +15%', prioridad: 'alta' },
        { titulo: 'Ajustes sobre CMV si hay desvíos', prioridad: 'media' },
        { titulo: 'Medición impacto de decisiones comerciales', prioridad: 'media' }
      ], entregables: [
        { nombre: 'Informe de fricciones detectadas', tipo: 'informe' },
        { nombre: 'Informe de desvíos financieros', tipo: 'informe' },
        { nombre: 'Plan de correcciones operativas/comerciales', tipo: 'plan' }
      ]},
      { faseOrden: 1, numero: 4, inicio: createDate(22, 3), fin: createDate(31, 3), tareas: [
        { titulo: 'Cierre mensual del P&L', prioridad: 'alta' },
        { titulo: 'Comparación real vs Forecast', prioridad: 'alta' },
        { titulo: 'Análisis evolución CMV', prioridad: 'media' },
        { titulo: 'Análisis actualizado del mix', prioridad: 'media' },
        { titulo: 'Definición foco estratégico Mes 2', prioridad: 'alta' }
      ], entregables: [
        { nombre: 'P&L Mes 1 cerrado', tipo: 'documento' },
        { nombre: 'Informe de avance hacia +15%', tipo: 'informe' },
        { nombre: 'Plan estratégico de aceleración Mes 2', tipo: 'plan' }
      ]},

      // MES 2 - Semanas 5-8
      { faseOrden: 2, numero: 5, inicio: createDate(1, 4), fin: createDate(7, 4), tareas: [
        { titulo: 'Activaciones estratégicas en PedidosYa', prioridad: 'alta' },
        { titulo: 'Optimización venta por WhatsApp', prioridad: 'alta' },
        { titulo: 'Diseño estrategia captación 2.600 departamentos', prioridad: 'alta' },
        { titulo: 'Inicio contacto nuevos canales (empresas, fábricas, salones)', prioridad: 'media' }
      ], entregables: [
        { nombre: 'Plan de activación por canal', tipo: 'plan' },
        { nombre: 'Calendario de acciones comerciales', tipo: 'plan' },
        { nombre: 'Primer reporte de impacto', tipo: 'informe' }
      ]},
      { faseOrden: 2, numero: 6, inicio: createDate(8, 4), fin: createDate(14, 4), tareas: [
        { titulo: 'Seguimiento resultados por canal', prioridad: 'alta' },
        { titulo: 'Ajustes dinámicos según conversión', prioridad: 'media' },
        { titulo: 'Control permanente de CMV', prioridad: 'alta' },
        { titulo: 'Análisis rentabilidad por canal', prioridad: 'alta' }
      ], entregables: [
        { nombre: 'Informe comparativo semana 5 vs semana 6', tipo: 'informe' },
        { nombre: 'Ajustes estratégicos documentados', tipo: 'documento' }
      ]},
      { faseOrden: 2, numero: 7, inicio: createDate(15, 4), fin: createDate(21, 4), tareas: [
        { titulo: 'Acompañamiento presencial en reuniones si aplica', prioridad: 'media' },
        { titulo: 'Intensificación de canales con mejor rendimiento', prioridad: 'alta' },
        { titulo: 'Optimización mix de venta', prioridad: 'media' }
      ], entregables: [
        { nombre: 'Reporte de nuevos acuerdos', tipo: 'informe' },
        { nombre: 'Informe evolución de ticket promedio', tipo: 'informe' }
      ]},
      { faseOrden: 2, numero: 8, inicio: createDate(22, 4), fin: createDate(30, 4), tareas: [
        { titulo: 'Análisis mensual completo', prioridad: 'alta' },
        { titulo: 'Medición impacto sobre margen', prioridad: 'alta' },
        { titulo: 'Validación sostenibilidad del crecimiento', prioridad: 'alta' }
      ], entregables: [
        { nombre: 'P&L Mes 2', tipo: 'documento' },
        { nombre: 'Informe de crecimiento acumulado', tipo: 'informe' },
        { nombre: 'Plan consolidación Mes 3', tipo: 'plan' }
      ]},

      // MES 3 - Semanas 9-12
      { faseOrden: 3, numero: 9, inicio: createDate(1, 5), fin: createDate(7, 5), tareas: [
        { titulo: 'Intensificación canales más efectivos', prioridad: 'alta' },
        { titulo: 'Control de rentabilidad por pedido', prioridad: 'alta' },
        { titulo: 'Ajustes finos de Forecast', prioridad: 'media' }
      ], entregables: [
        { nombre: 'Informe de rentabilidad por canal', tipo: 'informe' },
        { nombre: 'Forecast optimizado', tipo: 'sistema' }
      ]},
      { faseOrden: 3, numero: 10, inicio: createDate(8, 5), fin: createDate(14, 5), tareas: [
        { titulo: 'Corrección de desvíos detectados', prioridad: 'alta' },
        { titulo: 'Ajustes en CMV si es necesario', prioridad: 'media' },
        { titulo: 'Mejora continua del mix', prioridad: 'media' }
      ], entregables: [
        { nombre: 'Informe de desvíos corregidos', tipo: 'informe' },
        { nombre: 'Actualización tablero de control', tipo: 'sistema' }
      ]},
      { faseOrden: 3, numero: 11, inicio: createDate(15, 5), fin: createDate(21, 5), tareas: [
        { titulo: 'Profesionalización tablero mensual', prioridad: 'media' },
        { titulo: 'Estandarización de briefings', prioridad: 'media' },
        { titulo: 'Documentación del sistema implementado', prioridad: 'alta' }
      ], entregables: [
        { nombre: 'Manual básico de gestión comercial', tipo: 'documento' },
        { nombre: 'Tablero mensual definitivo', tipo: 'sistema' }
      ]},
      { faseOrden: 3, numero: 12, inicio: createDate(22, 5), fin: createDate(31, 5), tareas: [
        { titulo: 'Cierre P&L Mes 3', prioridad: 'alta' },
        { titulo: 'Medición cumplimiento +15%', prioridad: 'alta' },
        { titulo: 'Proyección trimestre siguiente', prioridad: 'media' }
      ], entregables: [
        { nombre: 'Informe final trimestral', tipo: 'informe' },
        { nombre: 'Plan de continuidad', tipo: 'plan' }
      ]}
    ]

    // Crear semanas con tareas y entregables
    let totalTareas = 0
    let totalEntregables = 0

    for (const semanaData of semanasData) {
      const fase = fasesCreadas.find(f => f.orden === semanaData.faseOrden)!
      
      const semana = await db.semana.create({
        data: {
          faseId: fase.id,
          numero: semanaData.numero,
          fechaInicio: semanaData.inicio,
          fechaFin: semanaData.fin,
          estado: 'pendiente'
        }
      })

      for (const tarea of semanaData.tareas) {
        await db.tarea.create({
          data: {
            semanaId: semana.id,
            titulo: tarea.titulo,
            estado: 'pendiente',
            prioridad: tarea.prioridad
          }
        })
        totalTareas++
      }

      for (const entregable of semanaData.entregables) {
        await db.entregable.create({
          data: {
            proyectoId: proyecto.id,
            nombre: entregable.nombre,
            tipo: entregable.tipo,
            estado: 'pendiente',
            semanaId: semana.id
          }
        })
        totalEntregables++
      }
    }

    // 4. Crear pendientes del cliente
    const pendientesCliente = [
      { descripcion: 'Entrega de carpeta de inspección y documentación legal vigente', prioridad: 'alta' },
      { descripcion: 'Acceso a información contable necesaria para construcción del P&L', prioridad: 'alta' },
      { descripcion: 'Acceso a reportes de ventas por canal', prioridad: 'alta' },
      { descripcion: 'Acceso a métricas de PedidosYa y canales digitales', prioridad: 'alta' },
      { descripcion: 'Información de estructura de costos y compras', prioridad: 'alta' },
      { descripcion: 'Acceso a datos diarios de venta', prioridad: 'media' },
      { descripcion: 'Información de reclamos y tiempos de despacho', prioridad: 'media' },
      { descripcion: 'Acceso a responsables por turno para implementación de briefings', prioridad: 'media' },
      { descripcion: 'Definición de día y horario fijo de Meet semanal', prioridad: 'alta' },
      { descripcion: 'Coordinación de 2 días semanales presenciales en el local', prioridad: 'alta' },
      { descripcion: 'Disponibilidad para reuniones comerciales externas', prioridad: 'media' }
    ]

    for (const pendiente of pendientesCliente) {
      await db.pendienteCliente.create({
        data: {
          proyectoId: proyecto.id,
          descripcion: pendiente.descripcion,
          estado: 'pendiente',
          prioridad: pendiente.prioridad
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Proyecto creado exitosamente',
      resumen: {
        proyecto: proyecto.nombre,
        cliente: proyecto.cliente,
        fases: fasesCreadas.length,
        semanas: semanasData.length,
        tareas: totalTareas,
        entregables: totalEntregables,
        pendientes: pendientesCliente.length
      }
    })

  } catch (error) {
    console.error('Error en seed:', error)
    return NextResponse.json({ 
      error: 'Error al crear proyecto',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
