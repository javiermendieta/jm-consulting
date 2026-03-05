'use client'

import { useState, useEffect } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Filter,
  RefreshCw,
  Users,
  DollarSign,
  Ticket,
  X,
  ChevronDown,
  ChevronUp,
  BarChart3,
  LineChart,
  PieChart
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts'

interface Filtro {
  id: string
  nombre: string
  codigo: string
}

interface ComparativoItem {
  key: string
  nombre: string
  periodoA: {
    pax: number
    ventas: number
    ticket: number
    paxTeorico: number
    ventaTeorica: number
    ticketTeorico: number
    gapPax: number
    gapVentas: number
    registros?: number
  }
  periodoB: {
    pax: number
    ventas: number
    ticket: number
    paxTeorico: number
    ventaTeorica: number
    ticketTeorico: number
    gapPax: number
    gapVentas: number
    registros?: number
  }
  variacion: {
    pax: number
    ventas: number
    ticket: number
  }
  debug?: {
    registrosDetallados?: Array<{
      turno: string
      canal: string
      paxReal: number
      ventaReal: number
      paxTeorico: number
      ventaTeorica: number
    }>
  }
}

interface Resumen {
  periodoA: {
    totalPax: number
    totalVentas: number
    ticketPromedio: number
    totalPaxTeorico: number
    totalVentaTeorica: number
    ticketTeorico: number
    gapPax: number
    gapVentas: number
    registros: number
  }
  periodoB: {
    totalPax: number
    totalVentas: number
    ticketPromedio: number
    totalPaxTeorico: number
    totalVentaTeorica: number
    ticketTeorico: number
    gapPax: number
    gapVentas: number
    registros: number
  }
  variacionTotal: {
    pax: number
    ventas: number
    ticket: number
  }
}

interface ApiResult {
  dimension: string
  periodoA: { inicio: string; fin: string }
  periodoB: { inicio: string; fin: string }
  comparativo: ComparativoItem[]
  resumen: Resumen
  filtros: {
    turnos: Filtro[]
    canales: Filtro[]
    restaurantes: Filtro[]
  }
}

const DIMENSIONES = [
  { value: 'turno', label: 'Por Turno', icon: '🕐' },
  { value: 'canal', label: 'Por Canal', icon: '📍' },
  { value: 'restaurante', label: 'Por Restaurante', icon: '🏪' },
  { value: 'dia', label: 'Por Día', icon: '📅' },
  { value: 'diaSemana', label: 'Por Día de Semana', icon: '📆' },
  { value: 'semana', label: 'Por Semana', icon: '📆' },
  { value: 'mes', label: 'Por Mes', icon: '🗓️' }
]

const COLORS = ['#3b82f6', '#f97316', '#22c55e', '#a855f7', '#ef4444', '#06b6d4', '#eab308']

const getDefaultDates = () => {
  const today = new Date()
  const startOfCurrentWeek = new Date(today)
  startOfCurrentWeek.setDate(today.getDate() - today.getDay() + 1)
  
  const endOfCurrentWeek = new Date(startOfCurrentWeek)
  endOfCurrentWeek.setDate(startOfCurrentWeek.getDate() + 6)
  
  const startOfLastWeek = new Date(startOfCurrentWeek)
  startOfLastWeek.setDate(startOfCurrentWeek.getDate() - 7)
  
  const endOfLastWeek = new Date(endOfCurrentWeek)
  endOfLastWeek.setDate(endOfCurrentWeek.getDate() - 7)

  return {
    fechaInicioA: startOfCurrentWeek.toISOString().split('T')[0],
    fechaFinA: endOfCurrentWeek.toISOString().split('T')[0],
    fechaInicioB: startOfLastWeek.toISOString().split('T')[0],
    fechaFinB: endOfLastWeek.toISOString().split('T')[0]
  }
}

// Modos de visualización
  type ModoComparacion = 'solo' | 'periodos' | 'teorico'
  
const MODO_OPTIONS = [
  { value: 'solo', label: 'Solo Período', description: 'Ver datos de un único período', icon: '📊' },
  { value: 'periodos', label: 'Comparar Períodos', description: 'Comparar A vs B', icon: '⚖️' },
  { value: 'teorico', label: 'Real vs Teórico', description: 'Comparar contra presupuesto', icon: '🎯' }
] as const

export function ComparativosModule() {
  const defaultDates = getDefaultDates()
  
  // Estados
  const [dimension, setDimension] = useState('turno')
  const [modoComparacion, setModoComparacion] = useState<ModoComparacion>('solo')
  const [tipoGrafico, setTipoGrafico] = useState<'barras' | 'lineas' | 'pie'>('barras')
  const [metricaGrafico, setMetricaGrafico] = useState<'pax' | 'ventas' | 'ticket'>('pax')
  const [fechaInicioA, setFechaInicioA] = useState(defaultDates.fechaInicioA)
  const [fechaFinA, setFechaFinA] = useState(defaultDates.fechaFinA)
  const [fechaInicioB, setFechaInicioB] = useState(defaultDates.fechaInicioB)
  const [fechaFinB, setFechaFinB] = useState(defaultDates.fechaFinB)
  
  // Filtros
  const [restauranteId, setRestauranteId] = useState('')
  const [canalId, setCanalId] = useState('')
  const [turnoId, setTurnoId] = useState('')
  
  // Datos
  const [data, setData] = useState<ApiResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortField, setSortField] = useState<'nombre' | 'pax' | 'ventas' | 'ticket'>('nombre')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const fetchComparativos = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Determinar qué fechas enviar según el modo
      let inicioB = fechaInicioB
      let finB = fechaFinB
      
      if (modoComparacion === 'solo' || modoComparacion === 'teorico') {
        // En modo 'solo' y 'teorico', usamos las mismas fechas para B
        // La API devolverá los mismos datos, pero el frontend solo mostrará A
        inicioB = fechaInicioA
        finB = fechaFinA
      }
      
      const params = new URLSearchParams({
        dimension,
        fechaInicioA,
        fechaFinA,
        fechaInicioB: inicioB,
        fechaFinB: finB
      })
      
      if (restauranteId) params.append('restauranteId', restauranteId)
      if (canalId) params.append('canalId', canalId)
      if (turnoId) params.append('turnoId', turnoId)

      const res = await fetch(`/api/comparativos?${params}`)
      
      if (!res.ok) {
        throw new Error('Error al cargar comparativos')
      }
      
      const result = await res.json()
      setData(result)
    } catch (err: any) {
      setError(err.message || 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComparativos()
  }, [dimension, restauranteId, canalId, turnoId, modoComparacion])

  // Presets de períodos
  const aplicarPreset = (preset: string) => {
    const today = new Date()
    let startA: Date, endA: Date, startB: Date, endB: Date

    switch (preset) {
      case 'semana_actual_vs_anterior':
        startA = new Date(today)
        startA.setDate(today.getDate() - today.getDay() + 1)
        endA = new Date(startA)
        endA.setDate(startA.getDate() + 6)
        startB = new Date(startA)
        startB.setDate(startA.getDate() - 7)
        endB = new Date(endA)
        endB.setDate(endA.getDate() - 7)
        break
        
      case 'mes_actual_vs_anterior':
        startA = new Date(today.getFullYear(), today.getMonth(), 1)
        endA = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        startB = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        endB = new Date(today.getFullYear(), today.getMonth(), 0)
        break
        
      case 'ultimos_7_vs_anteriores_7':
        startA = new Date(today)
        startA.setDate(today.getDate() - 6)
        endA = new Date(today)
        startB = new Date(startA)
        startB.setDate(startA.getDate() - 7)
        endB = new Date(startB)
        endB.setDate(startB.getDate() + 6)
        break
        
      case 'mes_vs_mismo_mes_año_pasado':
        startA = new Date(today.getFullYear(), today.getMonth(), 1)
        endA = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        startB = new Date(today.getFullYear() - 1, today.getMonth(), 1)
        endB = new Date(today.getFullYear() - 1, today.getMonth() + 1, 0)
        break
        
      default:
        return
    }

    setFechaInicioA(startA.toISOString().split('T')[0])
    setFechaFinA(endA.toISOString().split('T')[0])
    setFechaInicioB(startB.toISOString().split('T')[0])
    setFechaFinB(endB.toISOString().split('T')[0])
  }

  // Ordenamiento inteligente según la dimensión
  const sortedComparativo = data?.comparativo 
    ? [...data.comparativo].sort((a, b) => {
        // Para dimensión "dia", ordenar por fecha (key) cronológicamente
        if (dimension === 'dia') {
          const dateA = new Date(a.key + 'T12:00:00')
          const dateB = new Date(b.key + 'T12:00:00')
          return sortDirection === 'asc' 
            ? dateA.getTime() - dateB.getTime() 
            : dateB.getTime() - dateA.getTime()
        }
        
        // Para dimensión "semana", ordenar por key (año-semana)
        if (dimension === 'semana') {
          return sortDirection === 'asc' 
            ? a.key.localeCompare(b.key) 
            : b.key.localeCompare(a.key)
        }
        
        // Para dimensión "mes", ordenar por key (año-mes)
        if (dimension === 'mes') {
          return sortDirection === 'asc' 
            ? a.key.localeCompare(b.key) 
            : b.key.localeCompare(a.key)
        }
        
        // Para dimensión "diaSemana", ordenar por número de día (Lunes=1 primero)
        if (dimension === 'diaSemana') {
          const ordenA = parseInt(a.key) === 0 ? 7 : parseInt(a.key)
          const ordenB = parseInt(b.key) === 0 ? 7 : parseInt(b.key)
          return sortDirection === 'asc' 
            ? ordenA - ordenB 
            : ordenB - ordenA
        }

        // Para otras dimensiones, ordenar según el campo seleccionado
        let valA: number | string
        let valB: number | string

        switch (sortField) {
          case 'nombre':
            valA = a.nombre
            valB = b.nombre
            break
          case 'pax':
            valA = a.periodoA.pax
            valB = b.periodoA.pax
            break
          case 'ventas':
            valA = a.periodoA.ventas
            valB = b.periodoA.ventas
            break
          case 'ticket':
            valA = a.periodoA.ticket
            valB = b.periodoA.ticket
            break
          default:
            return 0
        }

        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
        }
        return sortDirection === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number)
      })
    : []

  const handleSort = (field: 'nombre' | 'pax' | 'ventas' | 'ticket') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const formatNumber = (num: number, type: 'currency' | 'number' | 'decimal' = 'number') => {
    if (num === null || num === undefined) return '-'
    if (type === 'currency') return `$${num.toLocaleString()}`
    if (type === 'decimal') return num.toFixed(2)
    return num.toLocaleString()
  }

  const getVariacionColor = (val: number) => {
    if (val > 0) return 'text-green-400'
    if (val < 0) return 'text-red-400'
    return 'text-gray-400'
  }

  const getVariacionIcon = (val: number) => {
    if (val > 0) return <TrendingUp className="w-4 h-4 text-green-400" />
    if (val < 0) return <TrendingDown className="w-4 h-4 text-red-400" />
    return null
  }

  const limpiarFiltros = () => {
    setRestauranteId('')
    setCanalId('')
    setTurnoId('')
  }

  const tieneFiltrosActivos = restauranteId || canalId || turnoId

  // Helper para obtener el valor según la métrica seleccionada
  const getValorMetrica = (item: ComparativoItem, tipo: 'realA' | 'teoricoA' | 'realB' | 'teoricoB') => {
    switch (metricaGrafico) {
      case 'pax':
        if (tipo === 'realA') return item.periodoA.pax
        if (tipo === 'teoricoA') return item.periodoA.paxTeorico
        if (tipo === 'realB') return item.periodoB.pax
        if (tipo === 'teoricoB') return item.periodoB.paxTeorico
        return 0
      case 'ventas':
        if (tipo === 'realA') return item.periodoA.ventas
        if (tipo === 'teoricoA') return item.periodoA.ventaTeorica
        if (tipo === 'realB') return item.periodoB.ventas
        if (tipo === 'teoricoB') return item.periodoB.ventaTeorica
        return 0
      case 'ticket':
        if (tipo === 'realA') return item.periodoA.ticket
        if (tipo === 'teoricoA') return item.periodoA.ticketTeorico
        if (tipo === 'realB') return item.periodoB.ticket
        if (tipo === 'teoricoB') return item.periodoB.ticketTeorico
        return 0
      default:
        return 0
    }
  }

  // Preparar datos para gráficos según el modo y métrica (sin límite de items)
  const chartData = sortedComparativo.map(item => {
    const baseData: any = {
      nombre: item.nombre.length > 10 ? item.nombre.substring(0, 10) + '...' : item.nombre,
      nombreCompleto: item.nombre,
    }
    
    if (modoComparacion === 'teorico') {
      baseData['Real'] = getValorMetrica(item, 'realA')
      baseData['Teórico'] = getValorMetrica(item, 'teoricoA')
    } else if (modoComparacion === 'periodos') {
      baseData['Período A'] = getValorMetrica(item, 'realA')
      baseData['Período B'] = getValorMetrica(item, 'realB')
    } else {
      // modo 'solo' - solo mostrar período A
      baseData['Real'] = getValorMetrica(item, 'realA')
    }
    
    return baseData
  })

  // Datos para gráfico de torta según métrica (limitado a 10 para legibilidad)
  const pieDataA = sortedComparativo.slice(0, 10).map(item => ({
    name: item.nombre,
    value: getValorMetrica(item, 'realA')
  }))

  // Calcular ancho dinámico del gráfico basado en cantidad de items
  const chartItemsCount = chartData.length
  const minChartWidth = 600 // ancho mínimo
  const itemWidth = 50 // ancho por item
  const dynamicChartWidth = Math.max(minChartWidth, chartItemsCount * itemWidth)
  const needsScroll = chartItemsCount > 15 // más de 15 items requiere scroll

  // Etiqueta de métrica para mostrar en el gráfico
  const metricaLabel = {
    pax: 'Clientes (Pax)',
    ventas: 'Ventas ($)',
    ticket: 'Ticket Promedio'
  }[metricaGrafico]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Análisis Comparativo</h2>
          <p className="text-gray-400">
            {modoComparacion === 'solo' && 'Visualiza datos de un período'}
            {modoComparacion === 'periodos' && 'Compara dos períodos diferentes'}
            {modoComparacion === 'teorico' && 'Compara datos reales vs presupuesto teórico'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchComparativos}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 rounded-lg text-white"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Selector de Modo */}
      <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">Modo de visualización:</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {MODO_OPTIONS.map((modo) => (
            <button
              key={modo.value}
              onClick={() => setModoComparacion(modo.value)}
              className={`px-4 py-3 rounded-lg text-sm transition-all text-left ${
                modoComparacion === modo.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#0d0d0d] text-gray-400 hover:text-white border border-white/10'
              }`}
            >
              <span className="text-lg mr-2">{modo.icon}</span>
              <span className="font-medium">{modo.label}</span>
              <p className="text-xs opacity-70 mt-1">{modo.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Selector de Dimensión */}
      <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">Agrupar por:</span>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
          {DIMENSIONES.map((dim) => (
            <button
              key={dim.value}
              onClick={() => setDimension(dim.value)}
              className={`px-3 py-2 rounded-lg text-sm transition-all ${
                dimension === dim.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#0d0d0d] text-gray-400 hover:text-white border border-white/10'
              }`}
            >
              <span className="mr-1">{dim.icon}</span>
              {dim.label}
            </button>
          ))}
        </div>
      </div>

      {/* Selector de Períodos */}
      <div className={`grid grid-cols-1 gap-4 ${modoComparacion === 'periodos' ? 'md:grid-cols-2' : ''}`}>
        <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-blue-400">
              {modoComparacion === 'periodos' ? 'Período A (Base)' : 'Período'}
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Desde</label>
              <input
                type="date"
                value={fechaInicioA}
                onChange={(e) => setFechaInicioA(e.target.value)}
                className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Hasta</label>
              <input
                type="date"
                value={fechaFinA}
                onChange={(e) => setFechaFinA(e.target.value)}
                className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white text-sm"
              />
            </div>
          </div>
        </div>

        {modoComparacion === 'periodos' && (
          <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-orange-400">Período B (Comparar)</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Desde</label>
                <input
                  type="date"
                  value={fechaInicioB}
                  onChange={(e) => setFechaInicioB(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Hasta</label>
                <input
                  type="date"
                  value={fechaFinB}
                  onChange={(e) => setFechaFinB(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Presets - solo en modo periodos */}
      {modoComparacion === 'periodos' && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-gray-400 py-1">Presets:</span>
          {[
            { id: 'semana_actual_vs_anterior', label: 'Esta semana vs Anterior' },
            { id: 'mes_actual_vs_anterior', label: 'Este mes vs Anterior' },
            { id: 'ultimos_7_vs_anteriores_7', label: 'Últimos 7 días vs 7 anteriores' },
            { id: 'mes_vs_mismo_mes_año_pasado', label: 'vs Mismo mes año pasado' }
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => aplicarPreset(preset.id)}
              className="px-3 py-1 text-xs bg-[#1a1a1a] hover:bg-[#2d2d2d] border border-white/10 rounded-full text-gray-400 hover:text-white"
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
      
      {/* Presets para modo solo/teorico */}
      {(modoComparacion === 'solo' || modoComparacion === 'teorico') && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-gray-400 py-1">Presets:</span>
          {[
            { id: 'semana', label: 'Esta semana', getDates: () => {
              const today = new Date()
              const start = new Date(today)
              start.setDate(today.getDate() - today.getDay() + 1)
              const end = new Date(start)
              end.setDate(start.getDate() + 6)
              return { start, end }
            }},
            { id: 'mes', label: 'Este mes', getDates: () => {
              const today = new Date()
              const start = new Date(today.getFullYear(), today.getMonth(), 1)
              const end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
              return { start, end }
            }},
            { id: 'ultimos7', label: 'Últimos 7 días', getDates: () => {
              const today = new Date()
              const end = new Date(today)
              const start = new Date(today)
              start.setDate(today.getDate() - 6)
              return { start, end }
            }},
            { id: 'ultimos30', label: 'Últimos 30 días', getDates: () => {
              const today = new Date()
              const end = new Date(today)
              const start = new Date(today)
              start.setDate(today.getDate() - 29)
              return { start, end }
            }}
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => {
                const { start, end } = preset.getDates()
                setFechaInicioA(start.toISOString().split('T')[0])
                setFechaFinA(end.toISOString().split('T')[0])
              }}
              className="px-3 py-1 text-xs bg-[#1a1a1a] hover:bg-[#2d2d2d] border border-white/10 rounded-full text-gray-400 hover:text-white"
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}

      {/* Filtros Opcionales */}
      {data?.filtros && (
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-xs text-gray-400">Filtrar por:</span>
          
          {data.filtros.restaurantes.length > 1 && (
            <select
              value={restauranteId}
              onChange={(e) => setRestauranteId(e.target.value)}
              className="px-3 py-1.5 bg-[#0d0d0d] border border-white/10 rounded-lg text-white text-sm"
            >
              <option value="">Todos los restaurantes</option>
              {data.filtros.restaurantes.map(r => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>
          )}

          {data.filtros.canales.length > 0 && (
            <select
              value={canalId}
              onChange={(e) => setCanalId(e.target.value)}
              className="px-3 py-1.5 bg-[#0d0d0d] border border-white/10 rounded-lg text-white text-sm"
            >
              <option value="">Todos los canales</option>
              {data.filtros.canales.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          )}

          {data.filtros.turnos.length > 0 && (
            <select
              value={turnoId}
              onChange={(e) => setTurnoId(e.target.value)}
              className="px-3 py-1.5 bg-[#0d0d0d] border border-white/10 rounded-lg text-white text-sm"
            >
              <option value="">Todos los turnos</option>
              {data.filtros.turnos.map(t => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>
          )}

          {tieneFiltrosActivos && (
            <button
              onClick={limpiarFiltros}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 text-sm"
            >
              <X className="w-3 h-3" />
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      )}

      {/* Resultados */}
      {data && !loading && (
        <>
          {/* Resumen de Totales - Segun el modo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Clientes */}
            <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <span className="text-sm text-gray-400">Clientes (Pax)</span>
                </div>
                {modoComparacion === 'periodos' && (
                  <div className="flex items-center gap-1">
                    {getVariacionIcon(data.resumen.variacionTotal.pax)}
                    <span className={`text-sm font-medium ${getVariacionColor(data.resumen.variacionTotal.pax)}`}>
                      {data.resumen.variacionTotal.pax > 0 ? '+' : ''}{data.resumen.variacionTotal.pax}%
                    </span>
                  </div>
                )}
                {modoComparacion === 'teorico' && (
                  <div className="flex items-center gap-1">
                    {getVariacionIcon(data.resumen.periodoA.gapPax)}
                    <span className={`text-sm font-medium ${getVariacionColor(data.resumen.periodoA.gapPax)}`}>
                      Gap: {data.resumen.periodoA.gapPax > 0 ? '+' : ''}{data.resumen.periodoA.gapPax}%
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">
                    {formatNumber(data.resumen.periodoA.totalPax)}
                  </p>
                  <p className="text-xs text-gray-500">Real</p>
                </div>
                {(modoComparacion === 'periodos' || modoComparacion === 'teorico') && (
                  <div className="text-right">
                    <p className="text-lg text-gray-400">
                      {modoComparacion === 'teorico' 
                        ? formatNumber(data.resumen.periodoA.totalPaxTeorico)
                        : formatNumber(data.resumen.periodoB.totalPax)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {modoComparacion === 'teorico' ? 'Teórico' : 'Período B'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Ventas */}
            <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-gray-400">Ventas</span>
                </div>
                {modoComparacion === 'periodos' && (
                  <div className="flex items-center gap-1">
                    {getVariacionIcon(data.resumen.variacionTotal.ventas)}
                    <span className={`text-sm font-medium ${getVariacionColor(data.resumen.variacionTotal.ventas)}`}>
                      {data.resumen.variacionTotal.ventas > 0 ? '+' : ''}{data.resumen.variacionTotal.ventas}%
                    </span>
                  </div>
                )}
                {modoComparacion === 'teorico' && (
                  <div className="flex items-center gap-1">
                    {getVariacionIcon(data.resumen.periodoA.gapVentas)}
                    <span className={`text-sm font-medium ${getVariacionColor(data.resumen.periodoA.gapVentas)}`}>
                      Gap: {data.resumen.periodoA.gapVentas > 0 ? '+' : ''}{data.resumen.periodoA.gapVentas}%
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">
                    {formatNumber(data.resumen.periodoA.totalVentas, 'currency')}
                  </p>
                  <p className="text-xs text-gray-500">Real</p>
                </div>
                {(modoComparacion === 'periodos' || modoComparacion === 'teorico') && (
                  <div className="text-right">
                    <p className="text-lg text-gray-400">
                      {modoComparacion === 'teorico' 
                        ? formatNumber(data.resumen.periodoA.totalVentaTeorica, 'currency')
                        : formatNumber(data.resumen.periodoB.totalVentas, 'currency')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {modoComparacion === 'teorico' ? 'Teórico' : 'Período B'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Ticket Promedio */}
            <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-purple-400" />
                  <span className="text-sm text-gray-400">Ticket Promedio</span>
                </div>
                {modoComparacion === 'periodos' && (
                  <div className="flex items-center gap-1">
                    {getVariacionIcon(data.resumen.variacionTotal.ticket)}
                    <span className={`text-sm font-medium ${getVariacionColor(data.resumen.variacionTotal.ticket)}`}>
                      {data.resumen.variacionTotal.ticket > 0 ? '+' : ''}{data.resumen.variacionTotal.ticket}%
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">
                    {formatNumber(data.resumen.periodoA.ticketPromedio, 'currency')}
                  </p>
                  <p className="text-xs text-gray-500">Real</p>
                </div>
                {(modoComparacion === 'periodos' || modoComparacion === 'teorico') && (
                  <div className="text-right">
                    <p className="text-lg text-gray-400">
                      {modoComparacion === 'teorico' 
                        ? formatNumber(data.resumen.periodoA.ticketTeorico, 'currency')
                        : formatNumber(data.resumen.periodoB.ticketPromedio, 'currency')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {modoComparacion === 'teorico' ? 'Teórico' : 'Período B'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Gráficos con Recharts */}
          {sortedComparativo.length > 0 && (
            <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-5">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h3 className="text-lg font-semibold text-white">
                  Gráfico - {DIMENSIONES.find(d => d.value === dimension)?.label} - {metricaLabel}
                </h3>
                <div className="flex items-center gap-4">
                  {/* Selector de métrica */}
                  <div className="flex gap-1 bg-[#0d0d0d] rounded-lg p-1">
                    {[
                      { key: 'pax', label: 'Pax', icon: '👥' },
                      { key: 'ventas', label: 'Ventas', icon: '💰' },
                      { key: 'ticket', label: 'Ticket', icon: '🎫' }
                    ].map((m) => (
                      <button
                        key={m.key}
                        onClick={() => setMetricaGrafico(m.key as 'pax' | 'ventas' | 'ticket')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                          metricaGrafico === m.key 
                            ? 'bg-blue-600 text-white' 
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <span className="mr-1">{m.icon}</span>
                        {m.label}
                      </button>
                    ))}
                  </div>
                  {/* Selector de tipo de gráfico */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTipoGrafico('barras')}
                      className={`p-2 rounded-lg ${tipoGrafico === 'barras' ? 'bg-blue-600 text-white' : 'bg-[#0d0d0d] text-gray-400'}`}
                    >
                      <BarChart3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setTipoGrafico('lineas')}
                      className={`p-2 rounded-lg ${tipoGrafico === 'lineas' ? 'bg-blue-600 text-white' : 'bg-[#0d0d0d] text-gray-400'}`}
                    >
                      <LineChart className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setTipoGrafico('pie')}
                      className={`p-2 rounded-lg ${tipoGrafico === 'pie' ? 'bg-blue-600 text-white' : 'bg-[#0d0d0d] text-gray-400'}`}
                    >
                      <PieChart className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className={`${needsScroll && tipoGrafico !== 'pie' ? 'overflow-x-auto' : ''}`}>
                <div style={{ width: needsScroll && tipoGrafico !== 'pie' ? dynamicChartWidth : '100%', minWidth: '100%' }}>
                  <ResponsiveContainer width="100%" height={320}>
                    {tipoGrafico === 'barras' ? (
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="nombre" stroke="#888" fontSize={10} angle={-45} textAnchor="end" height={60} />
                        <YAxis stroke="#888" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                          labelStyle={{ color: '#fff' }}
                          formatter={(value: any) => metricaGrafico === 'ventas' || metricaGrafico === 'ticket' ? `$${Number(value).toLocaleString()}` : Number(value).toLocaleString()}
                        />
                        <Legend />
                        {modoComparacion === 'solo' && (
                          <Bar dataKey="Real" fill="#3b82f6" name="Real" />
                        )}
                        {modoComparacion === 'periodos' && (
                          <>
                            <Bar dataKey="Período A" fill="#3b82f6" name="Período A" />
                            <Bar dataKey="Período B" fill="#f97316" name="Período B" />
                          </>
                        )}
                        {modoComparacion === 'teorico' && (
                          <>
                            <Bar dataKey="Real" fill="#3b82f6" name="Real" />
                            <Bar dataKey="Teórico" fill="#a855f7" name="Teórico" />
                          </>
                        )}
                      </BarChart>
                    ) : tipoGrafico === 'lineas' ? (
                      <RechartsLineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="nombre" stroke="#888" fontSize={10} angle={-45} textAnchor="end" height={60} />
                        <YAxis stroke="#888" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                          labelStyle={{ color: '#fff' }}
                          formatter={(value: any) => metricaGrafico === 'ventas' || metricaGrafico === 'ticket' ? `$${Number(value).toLocaleString()}` : Number(value).toLocaleString()}
                        />
                        <Legend />
                        {modoComparacion === 'solo' && (
                          <Line type="monotone" dataKey="Real" stroke="#3b82f6" strokeWidth={2} name="Real" dot={chartItemsCount <= 31} />
                        )}
                        {modoComparacion === 'periodos' && (
                          <>
                            <Line type="monotone" dataKey="Período A" stroke="#3b82f6" strokeWidth={2} name="Período A" dot={chartItemsCount <= 31} />
                            <Line type="monotone" dataKey="Período B" stroke="#f97316" strokeWidth={2} name="Período B" dot={chartItemsCount <= 31} />
                          </>
                        )}
                        {modoComparacion === 'teorico' && (
                          <>
                            <Line type="monotone" dataKey="Real" stroke="#3b82f6" strokeWidth={2} name="Real" dot={chartItemsCount <= 31} />
                            <Line type="monotone" dataKey="Teórico" stroke="#a855f7" strokeWidth={2} name="Teórico" dot={chartItemsCount <= 31} />
                          </>
                        )}
                      </RechartsLineChart>
                    ) : (
                      <RechartsPieChart>
                        <Pie
                          data={pieDataA}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieDataA.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                          formatter={(value: any) => metricaGrafico === 'ventas' || metricaGrafico === 'ticket' ? `$${Number(value).toLocaleString()}` : Number(value).toLocaleString()}
                        />
                        <Legend />
                      </RechartsPieChart>
                    )}
                  </ResponsiveContainer>
                </div>
                {needsScroll && tipoGrafico !== 'pie' && (
                  <p className="text-xs text-gray-500 mt-2 text-center">← Desplazá para ver más datos →</p>
                )}
              </div>
            </div>
          )}

          {/* Tabla Comparativa Detallada */}
          <div className="bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">
                Comparativo {DIMENSIONES.find(d => d.value === dimension)?.label}
              </h3>
            </div>

            {sortedComparativo.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No hay datos para mostrar.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    {/* Header dinámico según el modo */}
                    {modoComparacion === 'solo' && (
                      <>
                        <tr className="bg-[#0d0d0d] text-sm text-gray-400">
                          <th 
                            className="px-4 py-3 text-left cursor-pointer hover:text-white"
                            onClick={() => handleSort('nombre')}
                          >
                            <div className="flex items-center gap-1">
                              {DIMENSIONES.find(d => d.value === dimension)?.label?.replace('Por ', '')}
                              {sortField === 'nombre' && (sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                            </div>
                          </th>
                          <th className="px-4 py-3 text-center text-blue-400" colSpan={3}>Real</th>
                        </tr>
                        <tr className="bg-[#0d0d0d] text-xs text-gray-500 border-b border-white/10">
                          <th></th>
                          <th className="px-3 py-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('pax')}>Pax</th>
                          <th className="px-3 py-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('ventas')}>Ventas</th>
                          <th className="px-3 py-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('ticket')}>Ticket</th>
                        </tr>
                      </>
                    )}
                    {modoComparacion === 'periodos' && (
                      <>
                        <tr className="bg-[#0d0d0d] text-sm text-gray-400">
                          <th 
                            className="px-4 py-3 text-left cursor-pointer hover:text-white"
                            onClick={() => handleSort('nombre')}
                          >
                            <div className="flex items-center gap-1">
                              {DIMENSIONES.find(d => d.value === dimension)?.label?.replace('Por ', '')}
                              {sortField === 'nombre' && (sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                            </div>
                          </th>
                          <th className="px-4 py-3 text-center text-blue-400" colSpan={3}>Período A</th>
                          <th className="px-4 py-3 text-center text-orange-400" colSpan={3}>Período B</th>
                          <th className="px-4 py-3 text-center" colSpan={3}>Variación</th>
                        </tr>
                        <tr className="bg-[#0d0d0d] text-xs text-gray-500 border-b border-white/10">
                          <th></th>
                          <th className="px-3 py-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('pax')}>Pax</th>
                          <th className="px-3 py-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('ventas')}>Ventas</th>
                          <th className="px-3 py-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('ticket')}>Ticket</th>
                          <th className="px-3 py-2 text-right">Pax</th>
                          <th className="px-3 py-2 text-right">Ventas</th>
                          <th className="px-3 py-2 text-right">Ticket</th>
                          <th className="px-3 py-2 text-right">Pax %</th>
                          <th className="px-3 py-2 text-right">Ventas %</th>
                          <th className="px-3 py-2 text-right">Ticket %</th>
                        </tr>
                      </>
                    )}
                    {modoComparacion === 'teorico' && (
                      <>
                        <tr className="bg-[#0d0d0d] text-sm text-gray-400">
                          <th 
                            className="px-4 py-3 text-left cursor-pointer hover:text-white"
                            onClick={() => handleSort('nombre')}
                          >
                            <div className="flex items-center gap-1">
                              {DIMENSIONES.find(d => d.value === dimension)?.label?.replace('Por ', '')}
                              {sortField === 'nombre' && (sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                            </div>
                          </th>
                          <th className="px-4 py-3 text-center text-blue-400" colSpan={3}>Real</th>
                          <th className="px-4 py-3 text-center text-purple-400" colSpan={3}>Teórico</th>
                          <th className="px-4 py-3 text-center" colSpan={2}>Gap</th>
                        </tr>
                        <tr className="bg-[#0d0d0d] text-xs text-gray-500 border-b border-white/10">
                          <th></th>
                          <th className="px-3 py-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('pax')}>Pax</th>
                          <th className="px-3 py-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('ventas')}>Ventas</th>
                          <th className="px-3 py-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('ticket')}>Ticket</th>
                          <th className="px-3 py-2 text-right">Pax</th>
                          <th className="px-3 py-2 text-right">Ventas</th>
                          <th className="px-3 py-2 text-right">Ticket</th>
                          <th className="px-3 py-2 text-right">Pax %</th>
                          <th className="px-3 py-2 text-right">Ventas %</th>
                        </tr>
                      </>
                    )}
                  </thead>
                  <tbody>
                    {sortedComparativo.map((item, idx) => (
                      <tr 
                        key={item.key}
                        className={`border-b border-white/5 hover:bg-white/5 ${idx % 2 === 0 ? 'bg-[#0d0d0d]/50' : ''}`}
                      >
                        <td className="px-4 py-3 text-white font-medium">
                          {item.nombre}
                        </td>
                        {/* Columnas según el modo */}
                        {modoComparacion === 'solo' && (
                          <>
                            <td className="px-3 py-3 text-right text-white">{formatNumber(item.periodoA.pax)}</td>
                            <td className="px-3 py-3 text-right text-white">{formatNumber(item.periodoA.ventas, 'currency')}</td>
                            <td className="px-3 py-3 text-right text-white">{formatNumber(item.periodoA.ticket, 'currency')}</td>
                          </>
                        )}
                        {modoComparacion === 'periodos' && (
                          <>
                            <td className="px-3 py-3 text-right text-white">{formatNumber(item.periodoA.pax)}</td>
                            <td className="px-3 py-3 text-right text-white">{formatNumber(item.periodoA.ventas, 'currency')}</td>
                            <td className="px-3 py-3 text-right text-white">{formatNumber(item.periodoA.ticket, 'currency')}</td>
                            <td className="px-3 py-3 text-right text-gray-400">{formatNumber(item.periodoB.pax)}</td>
                            <td className="px-3 py-3 text-right text-gray-400">{formatNumber(item.periodoB.ventas, 'currency')}</td>
                            <td className="px-3 py-3 text-right text-gray-400">{formatNumber(item.periodoB.ticket, 'currency')}</td>
                            <td className={`px-3 py-3 text-right font-medium ${getVariacionColor(item.variacion.pax)}`}>
                              {item.variacion.pax > 0 ? '+' : ''}{item.variacion.pax}%
                            </td>
                            <td className={`px-3 py-3 text-right font-medium ${getVariacionColor(item.variacion.ventas)}`}>
                              {item.variacion.ventas > 0 ? '+' : ''}{item.variacion.ventas}%
                            </td>
                            <td className={`px-3 py-3 text-right font-medium ${getVariacionColor(item.variacion.ticket)}`}>
                              {item.variacion.ticket > 0 ? '+' : ''}{item.variacion.ticket}%
                            </td>
                          </>
                        )}
                        {modoComparacion === 'teorico' && (
                          <>
                            <td className="px-3 py-3 text-right text-white">{formatNumber(item.periodoA.pax)}</td>
                            <td className="px-3 py-3 text-right text-white">{formatNumber(item.periodoA.ventas, 'currency')}</td>
                            <td className="px-3 py-3 text-right text-white">{formatNumber(item.periodoA.ticket, 'currency')}</td>
                            <td className="px-3 py-3 text-right text-gray-400">{formatNumber(item.periodoA.paxTeorico)}</td>
                            <td className="px-3 py-3 text-right text-gray-400">{formatNumber(item.periodoA.ventaTeorica, 'currency')}</td>
                            <td className="px-3 py-3 text-right text-gray-400">{formatNumber(item.periodoA.ticketTeorico, 'currency')}</td>
                            <td className={`px-3 py-3 text-right font-medium ${getVariacionColor(item.periodoA.gapPax)}`}>
                              {item.periodoA.gapPax > 0 ? '+' : ''}{item.periodoA.gapPax}%
                            </td>
                            <td className={`px-3 py-3 text-right font-medium ${getVariacionColor(item.periodoA.gapVentas)}`}>
                              {item.periodoA.gapVentas > 0 ? '+' : ''}{item.periodoA.gapVentas}%
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#0d0d0d] border-t-2 border-blue-500/50 font-bold">
                      <td className="px-4 py-3 text-white font-bold">TOTALES</td>
                      {modoComparacion === 'solo' && (
                        <>
                          <td className="px-3 py-3 text-right text-white">{formatNumber(data.resumen.periodoA.totalPax)}</td>
                          <td className="px-3 py-3 text-right text-white">{formatNumber(data.resumen.periodoA.totalVentas, 'currency')}</td>
                          <td className="px-3 py-3 text-right text-white">{formatNumber(data.resumen.periodoA.ticketPromedio, 'currency')}</td>
                        </>
                      )}
                      {modoComparacion === 'periodos' && (
                        <>
                          <td className="px-3 py-3 text-right text-white">{formatNumber(data.resumen.periodoA.totalPax)}</td>
                          <td className="px-3 py-3 text-right text-white">{formatNumber(data.resumen.periodoA.totalVentas, 'currency')}</td>
                          <td className="px-3 py-3 text-right text-white">{formatNumber(data.resumen.periodoA.ticketPromedio, 'currency')}</td>
                          <td className="px-3 py-3 text-right text-gray-300">{formatNumber(data.resumen.periodoB.totalPax)}</td>
                          <td className="px-3 py-3 text-right text-gray-300">{formatNumber(data.resumen.periodoB.totalVentas, 'currency')}</td>
                          <td className="px-3 py-3 text-right text-gray-300">{formatNumber(data.resumen.periodoB.ticketPromedio, 'currency')}</td>
                          <td className={`px-3 py-3 text-right font-bold ${getVariacionColor(data.resumen.variacionTotal.pax)}`}>
                            {data.resumen.variacionTotal.pax > 0 ? '+' : ''}{data.resumen.variacionTotal.pax}%
                          </td>
                          <td className={`px-3 py-3 text-right font-bold ${getVariacionColor(data.resumen.variacionTotal.ventas)}`}>
                            {data.resumen.variacionTotal.ventas > 0 ? '+' : ''}{data.resumen.variacionTotal.ventas}%
                          </td>
                          <td className={`px-3 py-3 text-right font-bold ${getVariacionColor(data.resumen.variacionTotal.ticket)}`}>
                            {data.resumen.variacionTotal.ticket > 0 ? '+' : ''}{data.resumen.variacionTotal.ticket}%
                          </td>
                        </>
                      )}
                      {modoComparacion === 'teorico' && (
                        <>
                          <td className="px-3 py-3 text-right text-white">{formatNumber(data.resumen.periodoA.totalPax)}</td>
                          <td className="px-3 py-3 text-right text-white">{formatNumber(data.resumen.periodoA.totalVentas, 'currency')}</td>
                          <td className="px-3 py-3 text-right text-white">{formatNumber(data.resumen.periodoA.ticketPromedio, 'currency')}</td>
                          <td className="px-3 py-3 text-right text-gray-300">{formatNumber(data.resumen.periodoA.totalPaxTeorico)}</td>
                          <td className="px-3 py-3 text-right text-gray-300">{formatNumber(data.resumen.periodoA.totalVentaTeorica, 'currency')}</td>
                          <td className="px-3 py-3 text-right text-gray-300">{formatNumber(data.resumen.periodoA.ticketTeorico, 'currency')}</td>
                          <td className={`px-3 py-3 text-right font-bold ${getVariacionColor(data.resumen.periodoA.gapPax)}`}>
                            {data.resumen.periodoA.gapPax > 0 ? '+' : ''}{data.resumen.periodoA.gapPax}%
                          </td>
                          <td className={`px-3 py-3 text-right font-bold ${getVariacionColor(data.resumen.periodoA.gapVentas)}`}>
                            {data.resumen.periodoA.gapVentas > 0 ? '+' : ''}{data.resumen.periodoA.gapVentas}%
                          </td>
                        </>
                      )}
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Info adicional */}
          <div className="text-xs text-gray-500 flex items-center justify-between">
            <span>
              {modoComparacion === 'periodos' ? (
                <>Registros Período A: {data.resumen.periodoA.registros} | Registros Período B: {data.resumen.periodoB.registros}</>
              ) : (
                <>Registros: {data.resumen.periodoA.registros}</>
              )}
            </span>
            <span>
              Ticket Promedio = Ventas / Pax
            </span>
          </div>
        </>
      )}
    </div>
  )
}
