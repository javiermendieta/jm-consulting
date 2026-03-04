import pkg from '@prisma/client'
const { PrismaClient } = pkg

const prisma = new PrismaClient()

// Fechas del proyecto: 1/3/2026 - 31/5/2026
const fechaInicio = new Date(2026, 2, 1) // 1 de marzo 2026
const fechaFin = new Date(2026, 4, 31)   // 31 de mayo 2026

// Tipo para Fase
type FaseType = {
  id: string
  proyectoId: string
  nombre: string
  orden: number
  fechaInicio: Date
  fechaFin: Date
  estado: string
  objetivo: string | null
  focoEstrategico: string | null
  dedicacion: string | null
  createdAt: Date
  updatedAt: Date
}

async function main() {
  console.log('🚀 Iniciando carga del plan de trabajo...')

  // 1. Crear el proyecto
  const proyecto = await prisma.proyectoConsultoria.create({
    data: {
      nombre: 'Plan Trimestral de Trabajo',
      cliente: 'Sebastian Ovando',
      fechaInicio,
      fechaFin,
      estado: 'activo',
      valorContrato: 1800000, // $600.000 x 3 meses
    }
  })
  console.log('✅ Proyecto creado:', proyecto.id)

  // 2. Crear las 3 fases (meses)
  const fasesData = [
    {
      nombre: 'MES 1 – Orden, Control y Base de Crecimiento',
      orden: 1,
      fechaInicio: new Date(2026, 2, 1),
      fechaFin: new Date(2026, 2, 31),
      objetivo: 'Instalar sistema de dirección comercial y financiera. Detectar fricciones antes de escalar ventas.',
      focoEstrategico: 'Medir todo antes de acelerar. Ordenar antes de crecer.',
      dedicacion: '2 días semanales en el local. Dirección estratégica y análisis remoto continuo durante la semana.',
    },
    {
      nombre: 'MES 2 – Ejecución Comercial y Aceleración',
      orden: 2,
      fechaInicio: new Date(2026, 3, 1),
      fechaFin: new Date(2026, 3, 30),
      objetivo: 'Generar aumento real de volumen y consolidar crecimiento.',
      focoEstrategico: 'Escalar con control.',
      dedicacion: '2 días semanales en el local. Seguimiento y planificación remota continua.',
    },
    {
      nombre: 'MES 3 – Consolidación y Sostenibilidad',
      orden: 3,
      fechaInicio: new Date(2026, 4, 1),
      fechaFin: new Date(2026, 4, 31),
      objetivo: 'Alcanzar y sostener +15% mensual sin deteriorar margen.',
      focoEstrategico: 'Hacer el crecimiento predecible.',
      dedicacion: '2 días semanales en el local. Dirección estratégica y control remoto continuo.',
    },
  ]

  const fases: Fase[] = []
  for (const faseData of fasesData) {
    const fase = await prisma.fase.create({
      data: {
        proyectoId: proyecto.id,
        ...faseData,
      }
    })
    fases.push(fase)
    console.log('✅ Fase creada:', fase.nombre)
  }

  // 3. Crear semanas y tareas
  // MES 1
  const mes1Semanas = [
    {
      numero: 1,
      fechaInicio: new Date(2026, 2, 2),
      fechaFin: new Date(2026, 2, 8),
      tareas: [
        { titulo: 'Auditoría presencial integral', prioridad: 'alta' },
        { titulo: 'Relevamiento por canal y turno', prioridad: 'alta' },
        { titulo: 'Inicio construcción P&L real', prioridad: 'alta' },
        { titulo: 'Recolección de datos para Forecast', prioridad: 'alta' },
        { titulo: 'Análisis preliminar de CMV y mix', prioridad: 'media' },
        { titulo: 'Diseño de tablero de control', prioridad: 'media' },
        { titulo: 'Diseño de modelo de briefing diario', prioridad: 'media' },
        { titulo: 'Revisión inicial carpeta legal', prioridad: 'baja' },
      ],
      entregables: [
        { nombre: 'Esquema base de P&L', tipo: 'documento' },
        { nombre: 'Estructura inicial de Forecast', tipo: 'documento' },
        { nombre: 'Primer informe diagnóstico', tipo: 'informe' },
        { nombre: 'Modelo de briefing diario listo para implementar', tipo: 'documento' },
      ],
    },
    {
      numero: 2,
      fechaInicio: new Date(2026, 2, 9),
      fechaFin: new Date(2026, 2, 15),
      tareas: [
        { titulo: 'Finalización P&L real', prioridad: 'alta' },
        { titulo: 'Desarrollo completo Forecast por canal/día/turno', prioridad: 'alta' },
        { titulo: 'Implementación control de CMV', prioridad: 'alta' },
        { titulo: 'Análisis profundo de márgenes', prioridad: 'alta' },
        { titulo: 'Instalación seguimiento diario ventas vs Forecast', prioridad: 'alta' },
        { titulo: 'Implementación activa de briefings', prioridad: 'media' },
      ],
      entregables: [
        { nombre: 'P&L validado', tipo: 'documento' },
        { nombre: 'Forecast operativo', tipo: 'documento' },
        { nombre: 'Tablero de control activo', tipo: 'tablero' },
        { nombre: 'Primer informe semanal completo con desvíos', tipo: 'informe' },
      ],
    },
    {
      numero: 3,
      fechaInicio: new Date(2026, 2, 16),
      fechaFin: new Date(2026, 2, 22),
      tareas: [
        { titulo: 'Seguimiento diario y análisis por turno', prioridad: 'alta' },
        { titulo: 'Detección de fricciones comerciales', prioridad: 'alta' },
        { titulo: 'Análisis de reclamos y tiempos', prioridad: 'media' },
        { titulo: 'Evaluación capacidad ante +15%', prioridad: 'alta' },
        { titulo: 'Ajustes sobre CMV si hay desvíos', prioridad: 'media' },
        { titulo: 'Medición impacto de decisiones comerciales', prioridad: 'media' },
      ],
      entregables: [
        { nombre: 'Informe de fricciones detectadas', tipo: 'informe' },
        { nombre: 'Informe de desvíos financieros', tipo: 'informe' },
        { nombre: 'Plan de correcciones operativas/comerciales', tipo: 'documento' },
      ],
    },
    {
      numero: 4,
      fechaInicio: new Date(2026, 2, 23),
      fechaFin: new Date(2026, 2, 29),
      tareas: [
        { titulo: 'Cierre mensual del P&L', prioridad: 'alta' },
        { titulo: 'Comparación real vs Forecast', prioridad: 'alta' },
        { titulo: 'Análisis evolución CMV', prioridad: 'media' },
        { titulo: 'Análisis actualizado del mix', prioridad: 'media' },
        { titulo: 'Definición foco estratégico Mes 2', prioridad: 'alta' },
      ],
      entregables: [
        { nombre: 'P&L Mes 1 cerrado', tipo: 'documento' },
        { nombre: 'Informe de avance hacia +15%', tipo: 'informe' },
        { nombre: 'Plan estratégico de aceleración Mes 2', tipo: 'documento' },
      ],
    },
  ]

  // MES 2
  const mes2Semanas = [
    {
      numero: 5,
      fechaInicio: new Date(2026, 3, 1),
      fechaFin: new Date(2026, 3, 5),
      tareas: [
        { titulo: 'Activaciones estratégicas en PedidosYa', prioridad: 'alta' },
        { titulo: 'Optimización venta por WhatsApp', prioridad: 'alta' },
        { titulo: 'Diseño estrategia captación 2.600 departamentos', prioridad: 'alta' },
        { titulo: 'Inicio contacto nuevos canales (empresas, fábricas, salones)', prioridad: 'media' },
      ],
      entregables: [
        { nombre: 'Plan de activación por canal', tipo: 'documento' },
        { nombre: 'Calendario de acciones comerciales', tipo: 'documento' },
        { nombre: 'Primer reporte de impacto', tipo: 'informe' },
      ],
    },
    {
      numero: 6,
      fechaInicio: new Date(2026, 3, 6),
      fechaFin: new Date(2026, 3, 12),
      tareas: [
        { titulo: 'Seguimiento resultados por canal', prioridad: 'alta' },
        { titulo: 'Ajustes dinámicos según conversión', prioridad: 'media' },
        { titulo: 'Control permanente de CMV', prioridad: 'alta' },
        { titulo: 'Análisis rentabilidad por canal', prioridad: 'alta' },
      ],
      entregables: [
        { nombre: 'Informe comparativo semana 5 vs semana 6', tipo: 'informe' },
        { nombre: 'Ajustes estratégicos documentados', tipo: 'documento' },
      ],
    },
    {
      numero: 7,
      fechaInicio: new Date(2026, 3, 13),
      fechaFin: new Date(2026, 3, 19),
      tareas: [
        { titulo: 'Acompañamiento presencial en reuniones si aplica', prioridad: 'media' },
        { titulo: 'Intensificación de canales con mejor rendimiento', prioridad: 'alta' },
        { titulo: 'Optimización mix de venta', prioridad: 'media' },
      ],
      entregables: [
        { nombre: 'Reporte de nuevos acuerdos', tipo: 'informe' },
        { nombre: 'Informe evolución de ticket promedio', tipo: 'informe' },
      ],
    },
    {
      numero: 8,
      fechaInicio: new Date(2026, 3, 20),
      fechaFin: new Date(2026, 3, 30),
      tareas: [
        { titulo: 'Análisis mensual completo', prioridad: 'alta' },
        { titulo: 'Medición impacto sobre margen', prioridad: 'alta' },
        { titulo: 'Validación sostenibilidad del crecimiento', prioridad: 'alta' },
      ],
      entregables: [
        { nombre: 'P&L Mes 2', tipo: 'documento' },
        { nombre: 'Informe de crecimiento acumulado', tipo: 'informe' },
        { nombre: 'Plan consolidación Mes 3', tipo: 'documento' },
      ],
    },
  ]

  // MES 3
  const mes3Semanas = [
    {
      numero: 9,
      fechaInicio: new Date(2026, 4, 1),
      fechaFin: new Date(2026, 4, 3),
      tareas: [
        { titulo: 'Intensificación canales más efectivos', prioridad: 'alta' },
        { titulo: 'Control de rentabilidad por pedido', prioridad: 'alta' },
        { titulo: 'Ajustes finos de Forecast', prioridad: 'media' },
      ],
      entregables: [
        { nombre: 'Informe de rentabilidad por canal', tipo: 'informe' },
        { nombre: 'Forecast optimizado', tipo: 'documento' },
      ],
    },
    {
      numero: 10,
      fechaInicio: new Date(2026, 4, 4),
      fechaFin: new Date(2026, 4, 10),
      tareas: [
        { titulo: 'Corrección de desvíos detectados', prioridad: 'alta' },
        { titulo: 'Ajustes en CMV si es necesario', prioridad: 'media' },
        { titulo: 'Mejora continua del mix', prioridad: 'media' },
      ],
      entregables: [
        { nombre: 'Informe de desvíos corregidos', tipo: 'informe' },
        { nombre: 'Actualización tablero de control', tipo: 'tablero' },
      ],
    },
    {
      numero: 11,
      fechaInicio: new Date(2026, 4, 11),
      fechaFin: new Date(2026, 4, 17),
      tareas: [
        { titulo: 'Profesionalización tablero mensual', prioridad: 'media' },
        { titulo: 'Estandarización de briefings', prioridad: 'media' },
        { titulo: 'Documentación del sistema implementado', prioridad: 'alta' },
      ],
      entregables: [
        { nombre: 'Manual básico de gestión comercial', tipo: 'documento' },
        { nombre: 'Tablero mensual definitivo', tipo: 'tablero' },
      ],
    },
    {
      numero: 12,
      fechaInicio: new Date(2026, 4, 18),
      fechaFin: new Date(2026, 4, 31),
      tareas: [
        { titulo: 'Cierre P&L Mes 3', prioridad: 'alta' },
        { titulo: 'Medición cumplimiento +15%', prioridad: 'alta' },
        { titulo: 'Proyección trimestre siguiente', prioridad: 'media' },
      ],
      entregables: [
        { nombre: 'Informe final trimestral', tipo: 'informe' },
        { nombre: 'Plan de continuidad', tipo: 'documento' },
      ],
    },
  ]

  // Crear semanas para cada fase
  const todasLasSemanas = [mes1Semanas, mes2Semanas, mes3Semanas]

  for (let faseIdx = 0; faseIdx < fases.length; faseIdx++) {
    const fase = fases[faseIdx]
    const semanasFase = todasLasSemanas[faseIdx]

    for (const semanaData of semanasFase) {
      const semana = await prisma.semana.create({
        data: {
          faseId: fase.id,
          numero: semanaData.numero,
          fechaInicio: semanaData.fechaInicio,
          fechaFin: semanaData.fechaFin,
          estado: 'pendiente',
        }
      })
      console.log(`  ✅ Semana ${semana.numero} creada`)

      // Crear tareas
      for (const tareaData of semanaData.tareas) {
        await prisma.tarea.create({
          data: {
            semanaId: semana.id,
            titulo: tareaData.titulo,
            estado: 'pendiente',
            prioridad: tareaData.prioridad,
          }
        })
      }

      // Crear entregables
      for (const entregableData of semanaData.entregables) {
        await prisma.entregable.create({
          data: {
            proyectoId: proyecto.id,
            nombre: entregableData.nombre,
            tipo: entregableData.tipo,
            estado: 'pendiente',
          }
        })
      }
    }
  }

  // 4. Crear pendientes del cliente
  const pendientesCliente = [
    { descripcion: 'Entrega de carpeta de inspección y documentación legal vigente', prioridad: 'alta' },
    { descripcion: 'Acceso a información contable necesaria para construcción del P&L', prioridad: 'alta' },
    { descripcion: 'Acceso a reportes de ventas por canal', prioridad: 'alta' },
    { descripcion: 'Acceso a métricas de PedidosYa y canales digitales', prioridad: 'alta' },
    { descripcion: 'Información de estructura de costos y compras', prioridad: 'alta' },
    { descripcion: 'Acceso a datos diarios de venta', prioridad: 'alta' },
    { descripcion: 'Información de reclamos y tiempos de despacho', prioridad: 'media' },
    { descripcion: 'Acceso a responsables por turno para implementación de briefings', prioridad: 'media' },
    { descripcion: 'Definición de un día y horario fijo de Meet semanal', prioridad: 'alta' },
    { descripcion: 'Coordinación de 2 días semanales presenciales en el local', prioridad: 'alta' },
    { descripcion: 'Disponibilidad para reuniones comerciales externas cuando se activen nuevos canales', prioridad: 'media' },
  ]

  for (const pendienteData of pendientesCliente) {
    await prisma.pendienteCliente.create({
      data: {
        proyectoId: proyecto.id,
        descripcion: pendienteData.descripcion,
        estado: 'pendiente',
        prioridad: pendienteData.prioridad,
      }
    })
  }
  console.log('✅ Pendientes del cliente creados:', pendientesCliente.length)

  // 5. Crear rutinas semanales
  const rutinas = [
    { diaSemana: 1, horaInicio: '09:00', horaFin: '10:00', tipo: 'llamada', titulo: 'Reunión semanal de análisis (Meet)' },
    { diaSemana: 3, horaInicio: '10:00', horaFin: '18:00', tipo: 'presencial', titulo: 'Día presencial en local (turno estratégico)' },
    { diaSemana: 5, horaInicio: '10:00', horaFin: '18:00', tipo: 'presencial', titulo: 'Día presencial en local (turno estratégico)' },
  ]

  for (const rutinaData of rutinas) {
    await prisma.rutinaSemanal.create({
      data: {
        proyectoId: proyecto.id,
        ...rutinaData,
        activo: true,
      }
    })
  }
  console.log('✅ Rutinas semanales creadas:', rutinas.length)

  console.log('\n🎉 ¡Plan de trabajo cargado exitosamente!')
  console.log('📊 Resumen:')
  console.log('   - Proyecto:', proyecto.nombre)
  console.log('   - Cliente:', proyecto.cliente)
  console.log('   - Fases:', fases.length)
  console.log('   - Semanas: 12')
  console.log('   - Tareas: ~50')
  console.log('   - Entregables: ~30')
  console.log('   - Pendientes del cliente:', pendientesCliente.length)
  console.log('   - Rutinas semanales:', rutinas.length)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
