'use client'

import { useState, useEffect, useMemo } from 'react'
import { useStore } from '@/store/useStore'
import { 
  ChevronRight, 
  ChevronDown,
  Calendar,
  Filter,
  RefreshCw,
  Edit3,
  Check
} from 'lucide-react'

interface Restaurante {
  id: string
  nombre: string
  codigo: string
}

interface Canal {
  id: string
  nombre: string
  codigo: string
}

interface Turno {
  id: string
  nombre: string
  codigo: string
  horaInicio: string
  horaFin: string
}

interface TipoDia {
  id: string
  nombre: string
  codigo: string
  color: string
}

interface ForecastEntry {
  id: string
  fecha: string
  turnoId: string
  restauranteId: string
  canalId: string
  tipoDiaId: string
  paxTeorico: number | null
  paxReal: number | null
  ventaTeorica: number | null
  ventaReal: number | null
  ticketTeorico: number | null
  ticketReal: number | null
  restaurante: Restaurante
  canal: Canal
  turno: Turno
  tipoDia: TipoDia
}

export function ForecastModule() {
  const { forecastFiltros, setForecastFiltros } = useStore()
  const [entries, setEntries] = useState<ForecastEntry[]>([])
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([])
  const [canales, setCanales] = useState<Canal[]>([])
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [tiposDia, setTiposDia] = useState<TipoDia[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())
  const [expandedRestaurants, setExpandedRestaurants] = useState<Set<string>>(new Set())
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')

  // Fecha por defecto: semana actual
  useEffect(() => {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)

    setForecastFiltros({
      fechaInicio: startOfWeek,
      fechaFin: endOfWeek
    })
  }, [])

  useEffect(() => {
    fetchData()
  }, [forecastFiltros.fechaInicio, forecastFiltros.fechaFin])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [entriesRes, restRes, canalesRes, turnosRes, tiposRes] = await Promise.all([
        fetch(`/api/forecast/entries?fechaInicio=${forecastFiltros.fechaInicio?.toISOString()}&fechaFin=${forecastFiltros.fechaFin?.toISOString()}`),
        fetch('/api/forecast/restaurantes'),
        fetch('/api/forecast/canales'),
        fetch('/api/forecast/turnos'),
        fetch('/api/forecast/tipos-dia')
      ])

      const [entriesData, restData, canalesData, turnosData, tiposData] = await Promise.all([
        entriesRes.json(),
        restRes.json(),
        canalesRes.json(),
        turnosRes.json(),
        tiposRes.json()
      ])

      // Si no hay datos maestros, crear datos de ejemplo
      if (restData.length === 0) {
        await createSeedData()
        fetchData()
        return
      }

      setEntries(entriesData)
      setRestaurantes(restData)
      setCanales(canalesData)
      setTurnos(turnosData)
      setTiposDia(tiposData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const createSeedData = async () => {
    // Crear restaurantes
    await fetch('/api/forecast/restaurantes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Restaurante Central', codigo: 'RC', orden: 1 })
    })
    await fetch('/api/forecast/restaurantes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Sucursal Norte', codigo: 'SN', orden: 2 })
    })
    await fetch('/api/forecast/restaurantes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Sucursal Sur', codigo: 'SS', orden: 3 })
    })

    // Crear canales
    const canalesData = [
      { nombre: 'Salón', codigo: 'SALON' },
      { nombre: 'Delivery', codigo: 'DELIVERY' },
      { nombre: 'Takeaway', codigo: 'TAKEAWAY' },
      { nombre: 'Apps', codigo: 'APPS' }
    ]
    for (const canal of canalesData) {
      await fetch('/api/forecast/canales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(canal)
      })
    }

    // Crear turnos
    await fetch('/api/forecast/turnos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'AM', codigo: 'AM', horaInicio: '08:00', horaFin: '15:00' })
    })
    await fetch('/api/forecast/turnos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'PM', codigo: 'PM', horaInicio: '15:00', horaFin: '23:00' })
    })

    // Crear tipos de día
    const tiposDiaData = [
      { nombre: 'Normal', codigo: 'NORMAL', color: '#22c55e' },
      { nombre: 'Feriado', codigo: 'FERIADO', color: '#ef4444' },
      { nombre: 'Pre-Feriado', codigo: 'PRE_FERIADO', color: '#eab308' },
      { nombre: 'Post-Feriado', codigo: 'POST_FERIADO', color: '#3b82f6' }
    ]
    for (const tipo of tiposDiaData) {
      await fetch('/api/forecast/tipos-dia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tipo)
      })
    }
  }

  // Agrupar datos jerárquicamente
  const groupedData = useMemo(() => {
    const groups: { [key: string]: { [key: string]: ForecastEntry[] } } = {}
    
    entries.forEach(entry => {
      const fecha = new Date(entry.fecha)
      const fechaKey = fecha.toISOString().split('T')[0]
      const fechaLabel = fecha.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
      const key = `${fechaLabel} - ${entry.turno?.nombre || 'N/A'}`
      
      if (!groups[key]) groups[key] = {}
      if (!groups[key][entry.restauranteId]) groups[key][entry.restauranteId] = []
      groups[key][entry.restauranteId].push(entry)
    })
    
    return groups
  }, [entries, turnos])

  const toggleDate = (key: string) => {
    const newSet = new Set(expandedDates)
    if (newSet.has(key)) {
      newSet.delete(key)
    } else {
      newSet.add(key)
    }
    setExpandedDates(newSet)
  }

  const toggleRestaurant = (key: string) => {
    const newSet = new Set(expandedRestaurants)
    if (newSet.has(key)) {
      newSet.delete(key)
    } else {
      newSet.add(key)
    }
    setExpandedRestaurants(newSet)
  }

  const updateEntry = async (entry: ForecastEntry, field: string, value: number) => {
    try {
      await fetch('/api/forecast/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...entry,
          [field]: value
        })
      })
      fetchData()
    } catch (error) {
      console.error('Error updating entry:', error)
    }
  }

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '-'
    return `$${value.toLocaleString()}`
  }

  const getTipoDiaColor = (tipoDiaId: string) => {
    const tipo = tiposDia.find(t => t.id === tipoDiaId)
    return tipo?.color || '#6b7280'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Forecast de Ventas</h2>
          <p className="text-gray-400">Proyección jerárquica por fecha, restaurante y canal</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 bg-[#2d2d2d] hover:bg-[#3d3d3d] rounded-lg text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={forecastFiltros.fechaInicio?.toISOString().split('T')[0] || ''}
              onChange={(e) => setForecastFiltros({ fechaInicio: new Date(e.target.value) })}
              className="px-3 py-1.5 bg-[#0d0d0d] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            />
            <span className="text-gray-400">a</span>
            <input
              type="date"
              value={forecastFiltros.fechaFin?.toISOString().split('T')[0] || ''}
              onChange={(e) => setForecastFiltros({ fechaFin: new Date(e.target.value) })}
              className="px-3 py-1.5 bg-[#0d0d0d] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-4">
        {tiposDia.map(tipo => (
          <div key={tipo.id} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: tipo.color }}
            />
            <span className="text-sm text-gray-400">{tipo.nombre}</span>
          </div>
        ))}
      </div>

      {/* Tabla Jerárquica */}
      <div className="bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 gap-2 p-3 bg-[#0d0d0d] border-b border-white/10 text-sm font-medium text-gray-400">
          <div className="col-span-3">Fecha / Restaurante / Canal</div>
          <div className="col-span-2 text-center">Pax Teórico</div>
          <div className="col-span-2 text-center">Pax Real</div>
          <div className="col-span-2 text-center">Venta Teórica</div>
          <div className="col-span-2 text-center">Venta Real</div>
          <div className="col-span-1 text-center">Gap</div>
        </div>

        {/* Body */}
        {Object.entries(groupedData).length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-400">No hay datos para el período seleccionado</p>
          </div>
        ) : (
          Object.entries(groupedData).map(([fechaKey, restaurantes]) => (
            <div key={fechaKey} className="border-b border-white/5">
              {/* Nivel 1: Fecha + Turno */}
              <button
                onClick={() => toggleDate(fechaKey)}
                className="w-full grid grid-cols-12 gap-2 p-3 hover:bg-white/5 items-center"
              >
                <div className="col-span-3 flex items-center gap-2">
                  {expandedDates.has(fechaKey) ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-white font-medium">{fechaKey}</span>
                </div>
                <div className="col-span-9"></div>
              </button>

              {/* Nivel 2: Restaurantes */}
              {expandedDates.has(fechaKey) && Object.entries(restaurantes).map(([restId, entries]) => {
                const restaurante = restaurantes.find(r => r.id === restId)
                const restKey = `${fechaKey}-${restId}`
                
                return (
                  <div key={restId} className="bg-[#0d0d0d]">
                    <button
                      onClick={() => toggleRestaurant(restKey)}
                      className="w-full grid grid-cols-12 gap-2 p-3 hover:bg-white/5 items-center pl-8"
                    >
                      <div className="col-span-3 flex items-center gap-2">
                        {expandedRestaurants.has(restKey) ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-gray-300">{restaurante?.nombre || 'Restaurante'}</span>
                      </div>
                      <div className="col-span-9"></div>
                    </button>

                    {/* Nivel 3: Canales */}
                    {expandedRestaurants.has(restKey) && entries.map(entry => (
                      <div 
                        key={entry.id} 
                        className="grid grid-cols-12 gap-2 p-2 pl-16 hover:bg-white/5 items-center"
                      >
                        <div className="col-span-3 flex items-center gap-2">
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: getTipoDiaColor(entry.tipoDiaId) }}
                          />
                          <span className="text-gray-400 text-sm">{entry.canal?.nombre}</span>
                        </div>
                        <div className="col-span-2 text-center">
                          <EditableCell
                            value={entry.paxTeorico}
                            onSave={(val) => updateEntry(entry, 'paxTeorico', val)}
                          />
                        </div>
                        <div className="col-span-2 text-center">
                          <EditableCell
                            value={entry.paxReal}
                            onSave={(val) => updateEntry(entry, 'paxReal', val)}
                          />
                        </div>
                        <div className="col-span-2 text-center">
                          <EditableCell
                            value={entry.ventaTeorica}
                            onSave={(val) => updateEntry(entry, 'ventaTeorica', val)}
                            isCurrency
                          />
                        </div>
                        <div className="col-span-2 text-center">
                          <EditableCell
                            value={entry.ventaReal}
                            onSave={(val) => updateEntry(entry, 'ventaReal', val)}
                            isCurrency
                          />
                        </div>
                        <div className="col-span-1 text-center">
                          <GapCell teorico={entry.ventaTeorica} real={entry.ventaReal} />
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// Componente de celda editable
function EditableCell({ 
  value, 
  onSave, 
  isCurrency = false 
}: { 
  value: number | null
  onSave: (val: number) => void
  isCurrency?: boolean
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')

  const handleStartEdit = () => {
    setEditValue(value?.toString() || '')
    setIsEditing(true)
  }

  const handleSave = () => {
    onSave(Number(editValue) || 0)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 justify-center">
        <input
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="w-16 px-1 py-0.5 bg-[#1a1a1a] border border-blue-500 rounded text-white text-sm text-center focus:outline-none"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
            if (e.key === 'Escape') setIsEditing(false)
          }}
        />
        <button onClick={handleSave} className="p-0.5 text-green-400 hover:text-green-300">
          <Check className="w-3 h-3" />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleStartEdit}
      className="px-2 py-1 hover:bg-white/10 rounded text-white text-sm"
    >
      {value === null || value === undefined ? '-' : isCurrency ? `$${value.toLocaleString()}` : value}
    </button>
  )
}

// Componente de Gap
function GapCell({ teorico, real }: { teorico: number | null; real: number | null }) {
  if (teorico === null || real === null) return <span className="text-gray-500">-</span>
  
  const gap = real - teorico
  const percentage = teorico > 0 ? ((gap / teorico) * 100).toFixed(1) : '0'
  
  return (
    <span className={`text-sm ${gap >= 0 ? 'text-green-400' : 'text-red-400'}`}>
      {gap >= 0 ? '+' : ''}{percentage}%
    </span>
  )
}
