'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { 
  RefreshCw,
  Calendar,
  Plus,
  Loader2
} from 'lucide-react'

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
  semana: number
  mes: number
  año: number
}

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
}

interface TipoDia {
  id: string
  nombre: string
  codigo: string
  color: string
}

export function ForecastModule() {
  const { forecastFiltros, setForecastFiltros } = useStore()
  const [entries, setEntries] = useState<ForecastEntry[]>([])
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([])
  const [canales, setCanales] = useState<Canal[]>([])
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [tiposDia, setTiposDia] = useState<TipoDia[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedRestaurante, setSelectedRestaurante] = useState<string>('')
  const [selectedCanal, setSelectedCanal] = useState<string>('')
  const [selectedTurno, setSelectedTurno] = useState<string>('')

  useEffect(() => {
    fetchMasterData()
  }, [])

  useEffect(() => {
    if (forecastFiltros.fechaInicio && forecastFiltros.fechaFin && selectedRestaurante && selectedCanal && selectedTurno) {
      fetchEntries()
    }
  }, [forecastFiltros.fechaInicio, forecastFiltros.fechaFin, selectedRestaurante, selectedCanal, selectedTurno])

  const fetchMasterData = async () => {
    setLoading(true)
    try {
      // Initialize forecast data first
      await fetch('/api/forecast/init', { method: 'POST' })
      
      const [restRes, canalesRes, turnosRes, tiposRes] = await Promise.all([
        fetch('/api/forecast/restaurantes'),
        fetch('/api/forecast/canales'),
        fetch('/api/forecast/turnos'),
        fetch('/api/forecast/tipos-dia')
      ])

      const [restData, canalesData, turnosData, tiposData] = await Promise.all([
        restRes.json(),
        canalesRes.json(),
        turnosRes.json(),
        tiposRes.json()
      ])

      setRestaurantes(Array.isArray(restData) ? restData : [])
      setCanales(Array.isArray(canalesData) ? canalesData : [])
      setTurnos(Array.isArray(turnosData) ? turnosData : [])
      setTiposDia(Array.isArray(tiposData) ? tiposData : [])

      // Set defaults
      if (restData.length > 0) setSelectedRestaurante(restData[0].id)
      if (canalesData.length > 0) setSelectedCanal(canalesData[0].id)
      if (turnosData.length > 0) setSelectedTurno(turnosData[0].id)
      
      // Set default dates (current week)
      const today = new Date()
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay() + 1)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      
      setForecastFiltros({
        fechaInicio: startOfWeek,
        fechaFin: endOfWeek
      })
    } catch (error) {
      console.error('Error fetching master data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEntries = async () => {
    if (!forecastFiltros.fechaInicio || !forecastFiltros.fechaFin) return
    
    try {
      const params = new URLSearchParams({
        fechaInicio: forecastFiltros.fechaInicio.toISOString(),
        fechaFin: forecastFiltros.fechaFin.toISOString(),
        restauranteId: selectedRestaurante,
        canalId: selectedCanal,
        turnoId: selectedTurno
      })
      
      const res = await fetch(`/api/forecast/entries?${params}`)
      const data = await res.json()
      setEntries(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching entries:', error)
      setEntries([])
    }
  }

  const generateEntries = async () => {
    if (!forecastFiltros.fechaInicio || !forecastFiltros.fechaFin) {
      alert('Selecciona un rango de fechas')
      return
    }
    
    setGenerating(true)
    try {
      const res = await fetch('/api/forecast/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fechaInicio: forecastFiltros.fechaInicio.toISOString(),
          fechaFin: forecastFiltros.fechaFin.toISOString()
        })
      })
      const data = await res.json()
      alert(data.message || 'Entradas generadas')
      fetchEntries()
    } catch (error) {
      console.error('Error generating entries:', error)
      alert('Error al generar entradas')
    } finally {
      setGenerating(false)
    }
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
      fetchEntries()
    } catch (error) {
      console.error('Error updating entry:', error)
    }
  }

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '-'
    return `$${value.toLocaleString()}`
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
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
          <p className="text-gray-400">Proyección de ventas por día</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={generateEntries}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Generar Período
          </button>
          <button
            onClick={fetchEntries}
            className="flex items-center gap-2 px-3 py-2 bg-[#2d2d2d] hover:bg-[#3d3d3d] rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-4">
        <div className="grid grid-cols-5 gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={forecastFiltros.fechaInicio?.toISOString().split('T')[0] || ''}
              onChange={(e) => setForecastFiltros({ ...forecastFiltros, fechaInicio: new Date(e.target.value) })}
              className="px-3 py-1.5 bg-[#0d0d0d] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">a</span>
            <input
              type="date"
              value={forecastFiltros.fechaFin?.toISOString().split('T')[0] || ''}
              onChange={(e) => setForecastFiltros({ ...forecastFiltros, fechaFin: new Date(e.target.value) })}
              className="px-3 py-1.5 bg-[#0d0d0d] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={selectedRestaurante}
            onChange={(e) => setSelectedRestaurante(e.target.value)}
            className="px-3 py-1.5 bg-[#0d0d0d] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          >
            {restaurantes.map(r => (
              <option key={r.id} value={r.id}>{r.nombre}</option>
            ))}
          </select>
          <select
            value={selectedCanal}
            onChange={(e) => setSelectedCanal(e.target.value)}
            className="px-3 py-1.5 bg-[#0d0d0d] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          >
            {canales.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
          <select
            value={selectedTurno}
            onChange={(e) => setSelectedTurno(e.target.value)}
            className="px-3 py-1.5 bg-[#0d0d0d] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          >
            {turnos.map(t => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
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

      {/* Tabla */}
      <div className="bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden">
        <div className="grid grid-cols-8 gap-2 p-3 bg-[#0d0d0d] border-b border-white/10 text-sm font-medium text-gray-400">
          <div className="col-span-1">Fecha</div>
          <div className="col-span-1 text-center">Pax Teórico</div>
          <div className="col-span-1 text-center">Pax Real</div>
          <div className="col-span-1 text-center">Venta Teórica</div>
          <div className="col-span-1 text-center">Venta Real</div>
          <div className="col-span-1 text-center">Ticket Teórico</div>
          <div className="col-span-1 text-center">Ticket Real</div>
          <div className="col-span-1 text-center">Gap %</div>
        </div>

        {entries.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-400 mb-4">No hay datos para el período seleccionado</p>
            <button
              onClick={generateEntries}
              disabled={generating}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white disabled:opacity-50"
            >
              {generating ? 'Generando...' : 'Generar entradas'}
            </button>
          </div>
        ) : (
          entries.map((entry) => {
            const ticketTeorico = entry.paxTeorico && entry.ventaTeorica ? entry.ventaTeorica / entry.paxTeorico : null
            const ticketReal = entry.paxReal && entry.ventaReal ? entry.ventaReal / entry.paxReal : null
            const gap = entry.ventaTeorica && entry.ventaReal 
              ? ((entry.ventaReal - entry.ventaTeorica) / entry.ventaTeorica * 100).toFixed(1)
              : null

            return (
              <div key={entry.id} className="grid grid-cols-8 gap-2 p-3 border-b border-white/5 hover:bg-white/5">
                <div className="col-span-1 text-white text-sm">
                  {formatDate(entry.fecha)}
                </div>
                <div className="col-span-1 text-center">
                  <input
                    type="number"
                    value={entry.paxTeorico || ''}
                    onChange={(e) => updateEntry(entry, 'paxTeorico', Number(e.target.value))}
                    className="w-16 px-1 py-0.5 bg-[#2d2d2d] border border-white/10 rounded text-white text-sm text-center focus:outline-none focus:border-blue-500"
                    placeholder="-"
                  />
                </div>
                <div className="col-span-1 text-center">
                  <input
                    type="number"
                    value={entry.paxReal || ''}
                    onChange={(e) => updateEntry(entry, 'paxReal', Number(e.target.value))}
                    className="w-16 px-1 py-0.5 bg-[#2d2d2d] border border-white/10 rounded text-white text-sm text-center focus:outline-none focus:border-blue-500"
                    placeholder="-"
                  />
                </div>
                <div className="col-span-1 text-center">
                  <input
                    type="number"
                    value={entry.ventaTeorica || ''}
                    onChange={(e) => updateEntry(entry, 'ventaTeorica', Number(e.target.value))}
                    className="w-20 px-1 py-0.5 bg-[#2d2d2d] border border-white/10 rounded text-white text-sm text-center focus:outline-none focus:border-blue-500"
                    placeholder="-"
                  />
                </div>
                <div className="col-span-1 text-center">
                  <input
                    type="number"
                    value={entry.ventaReal || ''}
                    onChange={(e) => updateEntry(entry, 'ventaReal', Number(e.target.value))}
                    className="w-20 px-1 py-0.5 bg-[#2d2d2d] border border-white/10 rounded text-white text-sm text-center focus:outline-none focus:border-blue-500"
                    placeholder="-"
                  />
                </div>
                <div className="col-span-1 text-center text-sm text-gray-400">
                  {ticketTeorico ? `$${ticketTeorico.toFixed(0)}` : '-'}
                </div>
                <div className="col-span-1 text-center text-sm text-gray-400">
                  {ticketReal ? `$${ticketReal.toFixed(0)}` : '-'}
                </div>
                <div className={`col-span-1 text-center text-sm font-medium ${
                  gap !== null ? (Number(gap) >= 0 ? 'text-green-400' : 'text-red-400') : 'text-gray-500'
                }`}>
                  {gap ? `${Number(gap) >= 0 ? '+' : ''}${gap}%` : '-'}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
