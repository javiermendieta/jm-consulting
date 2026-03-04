'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronRight,
  Save,
  Settings,
  BarChart3,
  AlertCircle,
  Filter,
  X
} from 'lucide-react'

// ==================== TIPOS ====================
interface ForecastEntry {
  id?: string
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
  orden: number
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

// ==================== COMPONENTE PRINCIPAL ====================
export function ForecastModule() {
  const [activeTab, setActiveTab] = useState<'forecast' | 'config'>('forecast')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Forecast de Ventas</h2>
        <div className="flex bg-[#1a1a1a] rounded-lg p-1 border border-white/10">
          <button
            onClick={() => setActiveTab('forecast')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'forecast' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Forecast
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'config' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            Configuracion
          </button>
        </div>
      </div>

      {activeTab === 'forecast' ? <ForecastTab /> : <ConfigTab />}
    </div>
  )
}

// ==================== TAB: FORECAST ====================
function ForecastTab() {
  // Datos maestros
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([])
  const [canales, setCanales] = useState<Canal[]>([])
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [tiposDia, setTiposDia] = useState<TipoDia[]>([])
  const [normalTipoId, setNormalTipoId] = useState<string>('')
  
  // Estado de la UI
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Filtros
  const [selectedRestaurante, setSelectedRestaurante] = useState<string>('')
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  
  // Expansión
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())
  const [expandedTurnos, setExpandedTurnos] = useState<Set<string>>(new Set())
  
  // Filtros múltiples
  const [selectedTurnos, setSelectedTurnos] = useState<Set<string>>(new Set())
  const [selectedCanales, setSelectedCanales] = useState<Set<string>>(new Set())
  const [showTurnoFilter, setShowTurnoFilter] = useState(false)
  const [showCanalFilter, setShowCanalFilter] = useState(false)
  
  // ========== ESTADO DE DATOS - PATRÓN P&L ==========
  // Usamos Record<string, ForecastEntry> en lugar de Map
  const [entriesData, setEntriesData] = useState<Record<string, ForecastEntry>>({})
  const [entriesOriginal, setEntriesOriginal] = useState<Record<string, ForecastEntry>>({})
  
  // Detectar cambios - igual que P&L
  const hasChanges = JSON.stringify(entriesData) !== JSON.stringify(entriesOriginal)

  useEffect(() => {
    fetchMasterData()
  }, [])

  useEffect(() => {
    if (selectedRestaurante && selectedMonth && selectedYear) {
      fetchEntries()
    }
  }, [selectedRestaurante, selectedMonth, selectedYear])

  const fetchMasterData = async () => {
    setLoading(true)
    try {
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
      
      // Inicializar filtros con todos seleccionados
      if (Array.isArray(turnosData) && turnosData.length > 0) {
        setSelectedTurnos(new Set(turnosData.map((t: Turno) => t.id)))
      }
      if (Array.isArray(canalesData) && canalesData.length > 0) {
        setSelectedCanales(new Set(canalesData.map((c: Canal) => c.id)))
      }
      
      const normalTipo = (Array.isArray(tiposData) ? tiposData : []).find((t: TipoDia) => t.codigo === 'NORMAL')
      if (normalTipo) {
        setNormalTipoId(normalTipo.id)
      }

      if (restData.length > 0) setSelectedRestaurante(restData[0].id)
    } catch (error) {
      console.error('Error fetching master data:', error)
      setError('Error al cargar datos maestros')
    } finally {
      setLoading(false)
    }
  }

  const fetchEntries = async () => {
    if (!selectedRestaurante) return
    
    // Crear fechas como string ISO sin timezone - SOLO FECHA
    const fechaInicio = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`
    const lastDay = new Date(selectedYear, selectedMonth, 0).getDate()
    const fechaFin = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    
    try {
      const params = new URLSearchParams({
        fechaInicio: fechaInicio,
        fechaFin: fechaFin,
        restauranteId: selectedRestaurante
      })
      
      const res = await fetch(`/api/forecast/entries?${params}`)
      const data = await res.json()
      
      // Convertir array a Record - igual que P&L
      const entriesRecord: Record<string, ForecastEntry> = {}
      ;(Array.isArray(data) ? data : []).forEach((entry: ForecastEntry) => {
        const fechaStr = typeof entry.fecha === 'string' 
          ? (entry.fecha.includes('T') ? entry.fecha.split('T')[0] : entry.fecha)
          : new Date(entry.fecha).toISOString().split('T')[0]
        const key = `${fechaStr}-${entry.turnoId}-${entry.canalId}`
        entriesRecord[key] = { ...entry, fecha: fechaStr }
      })
      
      // Guardar en ambos estados - data y original
      setEntriesData(entriesRecord)
      setEntriesOriginal(entriesRecord)
      setError(null)
    } catch (error) {
      console.error('Error fetching entries:', error)
      setError('Error al cargar entradas')
      setEntriesData({})
      setEntriesOriginal({})
    }
  }

  // Obtener entry - devuelve existente o crea vacío
  const getEntry = (fecha: string, turnoId: string, canalId: string): ForecastEntry => {
    const key = `${fecha}-${turnoId}-${canalId}`
    if (entriesData[key]) return entriesData[key]
    
    return {
      fecha,
      turnoId,
      restauranteId: selectedRestaurante,
      canalId,
      tipoDiaId: normalTipoId,
      paxTeorico: null,
      paxReal: null,
      ventaTeorica: null,
      ventaReal: null,
      semana: 0,
      mes: selectedMonth,
      año: selectedYear
    }
  }

  // Actualizar valor local (sin guardar) - igual que P&L
  const updateEntryLocal = (fecha: string, turnoId: string, canalId: string, field: string, value: any) => {
    const key = `${fecha}-${turnoId}-${canalId}`
    const entry = getEntry(fecha, turnoId, canalId)
    
    setEntriesData(prev => ({
      ...prev,
      [key]: { ...entry, [field]: value }
    }))
  }

  // Actualizar tipo de día para todo un turno
  const updateTipoDiaForTurno = (fecha: string, turnoId: string, tipoDiaId: string) => {
    setEntriesData(prev => {
      const updated = { ...prev }
      canales.forEach(canal => {
        const key = `${fecha}-${turnoId}-${canal.id}`
        const existing = updated[key]
        if (existing) {
          updated[key] = { ...existing, tipoDiaId }
        } else {
          updated[key] = {
            fecha,
            turnoId,
            restauranteId: selectedRestaurante,
            canalId: canal.id,
            tipoDiaId,
            paxTeorico: null,
            paxReal: null,
            ventaTeorica: null,
            ventaReal: null,
            semana: 0,
            mes: selectedMonth,
            año: selectedYear
          }
        }
      })
      return updated
    })
  }

  // Guardar TODOS los cambios - igual que P&L
  const saveAllChanges = async () => {
    setSaving(true)
    try {
      // Encontrar entries modificadas
      const modifiedKeys = Object.keys(entriesData).filter(
        key => JSON.stringify(entriesData[key]) !== JSON.stringify(entriesOriginal[key])
      )

      console.log('Keys modificadas:', modifiedKeys.length)
      console.log('Restaurante ID:', selectedRestaurante)

      // Guardar cada una
      let savedCount = 0
      let errorCount = 0
      for (const key of modifiedKeys) {
        const entry = entriesData[key]
        
        console.log('Guardando entry:', {
          fecha: entry.fecha,
          turnoId: entry.turnoId,
          canalId: entry.canalId,
          tipoDiaId: entry.tipoDiaId,
          paxTeorico: entry.paxTeorico,
          paxReal: entry.paxReal,
          ventaTeorica: entry.ventaTeorica,
          ventaReal: entry.ventaReal
        })
        
        const res = await fetch('/api/forecast/entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fecha: entry.fecha,
            turnoId: entry.turnoId,
            canalId: entry.canalId,
            restauranteId: selectedRestaurante,
            tipoDiaId: entry.tipoDiaId,
            paxTeorico: entry.paxTeorico,
            paxReal: entry.paxReal,
            ventaTeorica: entry.ventaTeorica,
            ventaReal: entry.ventaReal
          })
        })
        
        const responseData = await res.json()
        console.log('Respuesta:', res.status, responseData)
        
        if (res.ok) savedCount++
        else errorCount++
      }

      console.log('Entries guardadas:', savedCount, 'Errores:', errorCount)

      // Actualizar original - igual que P&L
      setEntriesOriginal({ ...entriesData })
      
      if (errorCount > 0) {
        alert(`Se guardaron ${savedCount} entries con ${errorCount} errores`)
      }
      
    } catch (error) {
      console.error('Error saving changes:', error)
      alert('Error al guardar los cambios')
    } finally {
      setSaving(false)
    }
  }

  // Descartar cambios - igual que P&L
  const discardChanges = () => {
    setEntriesData({ ...entriesOriginal })
  }

  // Agrupar datos para visualización
  const groupedData = useMemo(() => {
    const groups: {
      fecha: string
      diaNombre: string
      diaNum: number
      turnos: {
        turnoId: string
        turnoNombre: string
        tipoDiaId: string
        tipoDiaNombre: string
        tipoDiaColor: string
        canales: {
          canalId: string
          canalNombre: string
          canalOrden: number
          entry: ForecastEntry
        }[]
      }[]
    }[] = []
    
    const firstDay = new Date(selectedYear, selectedMonth - 1, 1)
    const lastDay = new Date(selectedYear, selectedMonth, 0)
    const normalTipo = tiposDia.find(t => t.codigo === 'NORMAL')
    
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      const fechaStr = d.toISOString().split('T')[0]
      const diaNombre = d.toLocaleDateString('es-ES', { weekday: 'short' })
      const diaNum = d.getDate()
      
      const turnosData = turnos.map(turno => {
        const firstEntry = getEntry(fechaStr, turno.id, canales[0]?.id || '')
        const tipoDia = tiposDia.find(t => t.id === firstEntry.tipoDiaId) || normalTipo
        
        return {
          turnoId: turno.id,
          turnoNombre: turno.nombre,
          tipoDiaId: tipoDia?.id || '',
          tipoDiaNombre: tipoDia?.nombre || 'Normal',
          tipoDiaColor: tipoDia?.color || '#22c55e',
          canales: canales.map(canal => ({
            canalId: canal.id,
            canalNombre: canal.nombre,
            canalOrden: canal.orden,
            entry: getEntry(fechaStr, turno.id, canal.id)
          }))
        }
      })
      
      groups.push({ fecha: fechaStr, diaNombre, diaNum, turnos: turnosData })
    }
    
    return groups
  }, [entriesData, turnos, canales, tiposDia, selectedMonth, selectedYear, normalTipoId])

  const toggleDay = (fecha: string) => {
    const newExpanded = new Set(expandedDays)
    if (newExpanded.has(fecha)) newExpanded.delete(fecha)
    else newExpanded.add(fecha)
    setExpandedDays(newExpanded)
  }

  const toggleTurno = (key: string) => {
    const newExpanded = new Set(expandedTurnos)
    if (newExpanded.has(key)) newExpanded.delete(key)
    else newExpanded.add(key)
    setExpandedTurnos(newExpanded)
  }

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '-'
    return `$${value.toLocaleString()}`
  }

  const calcTicket = (venta: number | null, pax: number | null) => {
    if (!venta || !pax || pax === 0) return '-'
    return `$${Math.round(venta / pax).toLocaleString()}`
  }

  const calcGap = (real: number | null, teorico: number | null) => {
    if (!teorico || teorico === 0) return '-'
    const realValue = real || 0
    const gap = ((realValue - teorico) / teorico * 100).toFixed(1)
    return `${Number(gap) >= 0 ? '+' : ''}${gap}%`
  }

  const calcDayTotals = (dayGroup: typeof groupedData[0]) => {
    let paxFc = 0, paxRe = 0, ventaFc = 0, ventaRe = 0
    dayGroup.turnos.forEach(turno => {
      turno.canales.forEach(canal => {
        paxFc += canal.entry.paxTeorico || 0
        paxRe += canal.entry.paxReal || 0
        ventaFc += canal.entry.ventaTeorica || 0
        ventaRe += canal.entry.ventaReal || 0
      })
    })
    return { paxFc, paxRe, ventaFc, ventaRe }
  }

  const calcTurnoTotals = (turno: typeof groupedData[0]['turnos'][0]) => {
    let paxFc = 0, paxRe = 0, ventaFc = 0, ventaRe = 0
    turno.canales.forEach(canal => {
      paxFc += canal.entry.paxTeorico || 0
      paxRe += canal.entry.paxReal || 0
      ventaFc += canal.entry.ventaTeorica || 0
      ventaRe += canal.entry.ventaReal || 0
    })
    return { paxFc, paxRe, ventaFc, ventaRe }
  }

  // ========== FILTROS Y DATOS FILTRADOS ==========
  // Inicializar filtros cuando se cargan los datos maestros
  useEffect(() => {
    if (turnos.length > 0 && selectedTurnos.size === 0) {
      setSelectedTurnos(new Set(turnos.map(t => t.id)))
    }
  }, [turnos])
  
  useEffect(() => {
    if (canales.length > 0 && selectedCanales.size === 0) {
      setSelectedCanales(new Set(canales.map(c => c.id)))
    }
  }, [canales])

  // Datos filtrados según turnos y canales seleccionados
  const filteredData = useMemo(() => {
    return groupedData.map(day => ({
      ...day,
      turnos: day.turnos.filter(t => selectedTurnos.has(t.turnoId)).map(turno => ({
        ...turno,
        canales: turno.canales.filter(c => selectedCanales.has(c.canalId))
      }))
    }))
  }, [groupedData, selectedTurnos, selectedCanales])

  // Calcular totales del mes (basado en datos filtrados)
  const monthTotals = useMemo(() => {
    let paxFc = 0, paxRe = 0, ventaFc = 0, ventaRe = 0
    let gapsPax: number[] = [], gapsVenta: number[] = []
    
    filteredData.forEach(day => {
      day.turnos.forEach(turno => {
        turno.canales.forEach(canal => {
          const entry = canal.entry
          paxFc += entry.paxTeorico || 0
          paxRe += entry.paxReal || 0
          ventaFc += entry.ventaTeorica || 0
          ventaRe += entry.ventaReal || 0
          
          // Calcular gaps individuales para promedio
          if (entry.paxTeorico && entry.paxTeorico > 0) {
            gapsPax.push(((entry.paxReal || 0) - entry.paxTeorico) / entry.paxTeorico * 100)
          }
          if (entry.ventaTeorica && entry.ventaTeorica > 0) {
            gapsVenta.push(((entry.ventaReal || 0) - entry.ventaTeorica) / entry.ventaTeorica * 100)
          }
        })
      })
    })
    
    // Calcular promedios de gaps
    const avgGapPax = gapsPax.length > 0 ? gapsPax.reduce((a, b) => a + b, 0) / gapsPax.length : null
    const avgGapVenta = gapsVenta.length > 0 ? gapsVenta.reduce((a, b) => a + b, 0) / gapsVenta.length : null
    
    // Calcular tickets promedio (Total Venta / Total Pax)
    const ticketFc = paxFc > 0 ? ventaFc / paxFc : null
    const ticketRe = paxRe > 0 ? ventaRe / paxRe : null
    
    return { paxFc, paxRe, ventaFc, ventaRe, avgGapPax, avgGapVenta, ticketFc, ticketRe }
  }, [filteredData])

  // Toggle filtros
  const toggleTurnoFilter = (turnoId: string) => {
    const newSet = new Set(selectedTurnos)
    if (newSet.has(turnoId)) newSet.delete(turnoId)
    else newSet.add(turnoId)
    setSelectedTurnos(newSet)
  }

  const toggleCanalFilter = (canalId: string) => {
    const newSet = new Set(selectedCanales)
    if (newSet.has(canalId)) newSet.delete(canalId)
    else newSet.add(canalId)
    setSelectedCanales(newSet)
  }

  const selectAllTurnos = () => setSelectedTurnos(new Set(turnos.map(t => t.id)))
  const clearTurnoFilter = () => setSelectedTurnos(new Set())
  const selectAllCanales = () => setSelectedCanales(new Set(canales.map(c => c.id)))
  const clearCanalFilter = () => setSelectedCanales(new Set())

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    
      {/* Barra de filtros y acciones */}
      <div className="flex items-center justify-between bg-[#1a1a1a] rounded-xl border border-white/10 p-4">
        <div className="flex items-center gap-4">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          >
            {months.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          >
            {[2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            value={selectedRestaurante}
            onChange={(e) => setSelectedRestaurante(e.target.value)}
            className="px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          >
            {restaurantes.map(r => (
              <option key={r.id} value={r.id}>{r.nombre}</option>
            ))}
          </select>
          
          {/* Filtro múltiple de Turnos */}
          <div className="relative">
            <button
              onClick={() => setShowTurnoFilter(!showTurnoFilter)}
              className="flex items-center gap-2 px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white text-sm hover:border-white/30"
            >
              <Filter className="w-4 h-4" />
              Turnos ({selectedTurnos.size}/{turnos.length})
              <ChevronDown className="w-3 h-3" />
            </button>
            {showTurnoFilter && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-50">
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
                  <button onClick={selectAllTurnos} className="text-xs text-blue-400 hover:text-blue-300">Todos</button>
                  <button onClick={clearTurnoFilter} className="text-xs text-gray-400 hover:text-gray-300">Ninguno</button>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {turnos.map(turno => (
                    <label key={turno.id} className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedTurnos.has(turno.id)}
                        onChange={() => toggleTurnoFilter(turno.id)}
                        className="w-4 h-4 rounded border-white/20 bg-[#0d0d0d] text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-white">{turno.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Filtro múltiple de Canales */}
          <div className="relative">
            <button
              onClick={() => setShowCanalFilter(!showCanalFilter)}
              className="flex items-center gap-2 px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white text-sm hover:border-white/30"
            >
              <Filter className="w-4 h-4" />
              Canales ({selectedCanales.size}/{canales.length})
              <ChevronDown className="w-3 h-3" />
            </button>
            {showCanalFilter && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-50">
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
                  <button onClick={selectAllCanales} className="text-xs text-blue-400 hover:text-blue-300">Todos</button>
                  <button onClick={clearCanalFilter} className="text-xs text-gray-400 hover:text-gray-300">Ninguno</button>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {canales.map(canal => (
                    <label key={canal.id} className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCanales.has(canal.id)}
                        onChange={() => toggleCanalFilter(canal.id)}
                        className="w-4 h-4 rounded border-white/20 bg-[#0d0d0d] text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-white">{canal.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="text-yellow-400 text-sm">* Cambios sin guardar</span>
          )}
          <button
            onClick={fetchEntries}
            className="flex items-center gap-2 px-4 py-2 bg-[#2d2d2d] hover:bg-[#3d3d3d] rounded-lg text-white transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
          <button
            onClick={saveAllChanges}
            disabled={saving || !hasChanges}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar
          </button>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-4 px-2">
        <span className="text-xs text-gray-500">Tipos de dia:</span>
        {tiposDia.map(tipo => (
          <div key={tipo.id} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tipo.color }} />
            <span className="text-xs text-gray-400">{tipo.nombre}</span>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[1200px]">
            {/* HEADER */}
            <div className="flex bg-[#0d0d0d] border-b border-white/10">
              <div className="w-[140px] flex-shrink-0 px-4 py-3 text-xs font-medium text-gray-400 border-r border-white/10">Fecha</div>
              <div className="w-[100px] flex-shrink-0 px-2 py-3 text-xs font-medium text-gray-400 text-center border-r border-white/10">Tipo Dia</div>
              <div className="flex-shrink-0 border-r border-white/10">
                <div className="px-2 py-1 text-xs font-medium text-purple-400 text-center border-b border-white/10">Pax</div>
                <div className="flex">
                  <div className="w-[70px] px-1 py-1 text-xs text-blue-400 text-center">Fc</div>
                  <div className="w-[70px] px-1 py-1 text-xs text-green-400 text-center">Re</div>
                  <div className="w-[60px] px-1 py-1 text-xs text-gray-500 text-center">Gap</div>
                </div>
              </div>
              <div className="flex-shrink-0 border-r border-white/10">
                <div className="px-2 py-1 text-xs font-medium text-orange-400 text-center border-b border-white/10">Venta</div>
                <div className="flex">
                  <div className="w-[90px] px-1 py-1 text-xs text-blue-400 text-center">Fc</div>
                  <div className="w-[90px] px-1 py-1 text-xs text-green-400 text-center">Re</div>
                  <div className="w-[70px] px-1 py-1 text-xs text-gray-500 text-center">Gap</div>
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="px-2 py-1 text-xs font-medium text-emerald-400 text-center border-b border-white/10">Ticket</div>
                <div className="flex">
                  <div className="w-[80px] px-1 py-1 text-xs text-blue-400 text-center">Fc</div>
                  <div className="w-[80px] px-1 py-1 text-xs text-green-400 text-center">Re</div>
                </div>
              </div>
            </div>

            {/* BODY */}
            {groupedData.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-400">No hay datos para el periodo seleccionado</p>
              </div>
            ) : (
              <>
                {filteredData.map((dayGroup) => {
                  const isDayExpanded = expandedDays.has(dayGroup.fecha)
                  const dayTotals = calcDayTotals(dayGroup)

                return (
                  <div key={dayGroup.fecha}>
                    {/* FILA DIA */}
                    <div className="flex border-b border-white/5 hover:bg-white/5 cursor-pointer items-center" onClick={() => toggleDay(dayGroup.fecha)}>
                      <div className="w-[140px] flex-shrink-0 px-4 py-3 border-r border-white/10">
                        <div className="flex items-center gap-2">
                          {isDayExpanded ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                          <span className="text-white font-medium capitalize text-sm">{dayGroup.diaNombre} {dayGroup.diaNum}</span>
                        </div>
                      </div>
                      <div className="w-[100px] flex-shrink-0 px-2 py-3 border-r border-white/10"></div>
                      <div className="flex-shrink-0 border-r border-white/10 flex items-center">
                        <div className="w-[70px] px-1 text-center text-sm text-blue-400">{dayTotals.paxFc || '-'}</div>
                        <div className="w-[70px] px-1 text-center text-sm text-green-400">{dayTotals.paxRe || '-'}</div>
                        <div className="w-[60px] px-1 text-center text-xs text-gray-500">{calcGap(dayTotals.paxRe, dayTotals.paxFc)}</div>
                      </div>
                      <div className="flex-shrink-0 border-r border-white/10 flex items-center">
                        <div className="w-[90px] px-1 text-center text-sm text-blue-400">{formatCurrency(dayTotals.ventaFc)}</div>
                        <div className="w-[90px] px-1 text-center text-sm text-green-400">{formatCurrency(dayTotals.ventaRe)}</div>
                        <div className={`w-[70px] px-1 text-center text-xs ${dayTotals.ventaFc ? (dayTotals.ventaRe >= dayTotals.ventaFc ? 'text-green-400' : 'text-red-400') : 'text-gray-500'}`}>
                          {calcGap(dayTotals.ventaRe, dayTotals.ventaFc)}
                        </div>
                      </div>
                      <div className="flex-shrink-0 flex items-center">
                        <div className="w-[80px] px-1 text-center text-sm text-blue-400">{calcTicket(dayTotals.ventaFc, dayTotals.paxFc)}</div>
                        <div className="w-[80px] px-1 text-center text-sm text-green-400">{calcTicket(dayTotals.ventaRe, dayTotals.paxRe)}</div>
                      </div>
                    </div>

                    {/* TURNOS */}
                    {isDayExpanded && dayGroup.turnos.map((turno) => {
                      const turnoKey = `${dayGroup.fecha}-${turno.turnoId}`
                      const isTurnoExpanded = expandedTurnos.has(turnoKey)
                      const turnoTotals = calcTurnoTotals(turno)

                      return (
                        <div key={turnoKey} className="bg-[#0d0d0d]/50">
                          {/* Fila Turno */}
                          <div className="flex border-b border-white/5 hover:bg-white/5 cursor-pointer items-center" onClick={() => toggleTurno(turnoKey)}>
                            <div className="w-[140px] flex-shrink-0 px-4 py-2 pl-8 border-r border-white/10">
                              <div className="flex items-center gap-2">
                                {isTurnoExpanded ? <ChevronDown className="w-3 h-3 text-gray-400 flex-shrink-0" /> : <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />}
                                <span className="text-gray-300 text-sm font-medium">{turno.turnoNombre}</span>
                              </div>
                            </div>
                            <div className="w-[100px] flex-shrink-0 px-2 py-2 border-r border-white/10" onClick={(e) => e.stopPropagation()}>
                              <select
                                value={turno.tipoDiaId}
                                onChange={(e) => updateTipoDiaForTurno(dayGroup.fecha, turno.turnoId, e.target.value)}
                                className="w-full px-2 py-1.5 bg-[#2d2d2d] border border-white/10 rounded text-xs text-white"
                                style={{ borderLeft: `3px solid ${turno.tipoDiaColor}` }}
                              >
                                {tiposDia.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                              </select>
                            </div>
                            <div className="flex-shrink-0 border-r border-white/10 flex items-center">
                              <div className="w-[70px] px-1 text-center text-xs text-blue-400">{turnoTotals.paxFc || '-'}</div>
                              <div className="w-[70px] px-1 text-center text-xs text-green-400">{turnoTotals.paxRe || '-'}</div>
                              <div className="w-[60px] px-1 text-center text-xs text-gray-500">{calcGap(turnoTotals.paxRe, turnoTotals.paxFc)}</div>
                            </div>
                            <div className="flex-shrink-0 border-r border-white/10 flex items-center">
                              <div className="w-[90px] px-1 text-center text-xs text-blue-400">{formatCurrency(turnoTotals.ventaFc)}</div>
                              <div className="w-[90px] px-1 text-center text-xs text-green-400">{formatCurrency(turnoTotals.ventaRe)}</div>
                              <div className={`w-[70px] px-1 text-center text-xs ${turnoTotals.ventaFc ? (turnoTotals.ventaRe >= turnoTotals.ventaFc ? 'text-green-400' : 'text-red-400') : 'text-gray-500'}`}>
                                {calcGap(turnoTotals.ventaRe, turnoTotals.ventaFc)}
                              </div>
                            </div>
                            <div className="flex-shrink-0 flex items-center">
                              <div className="w-[80px] px-1 text-center text-xs text-blue-400">{calcTicket(turnoTotals.ventaFc, turnoTotals.paxFc)}</div>
                              <div className="w-[80px] px-1 text-center text-xs text-green-400">{calcTicket(turnoTotals.ventaRe, turnoTotals.paxRe)}</div>
                            </div>
                          </div>

                          {/* CANALES */}
                          {isTurnoExpanded && turno.canales.sort((a, b) => a.canalOrden - b.canalOrden).map((canal) => {
                            const entry = canal.entry

                            return (
                              <div key={canal.canalId} className="flex border-b border-white/5 hover:bg-white/5 items-center">
                                <div className="w-[140px] flex-shrink-0 px-4 py-2 pl-14 border-r border-white/10">
                                  <span className="text-gray-400 text-xs">{canal.canalNombre}</span>
                                </div>
                                <div className="w-[100px] flex-shrink-0 px-2 py-2 border-r border-white/10"></div>
                                
                                {/* Pax inputs */}
                                <div className="flex-shrink-0 border-r border-white/10 flex items-center">
                                  <div className="w-[70px] px-1">
                                    <input
                                      type="number"
                                      value={entry.paxTeorico ?? ''}
                                      onChange={(e) => updateEntryLocal(dayGroup.fecha, turno.turnoId, canal.canalId, 'paxTeorico', e.target.value ? Number(e.target.value) : null)}
                                      className="w-full px-2 py-1.5 bg-[#2d2d2d] border border-white/10 rounded text-white text-xs text-center focus:outline-none focus:border-blue-500"
                                      placeholder="-"
                                    />
                                  </div>
                                  <div className="w-[70px] px-1">
                                    <input
                                      type="number"
                                      value={entry.paxReal ?? ''}
                                      onChange={(e) => updateEntryLocal(dayGroup.fecha, turno.turnoId, canal.canalId, 'paxReal', e.target.value ? Number(e.target.value) : null)}
                                      className="w-full px-2 py-1.5 bg-[#2d2d2d] border border-white/10 rounded text-white text-xs text-center focus:outline-none focus:border-blue-500"
                                      placeholder="-"
                                    />
                                  </div>
                                  <div className="w-[60px] px-1 text-center text-xs text-gray-500">{calcGap(entry.paxReal, entry.paxTeorico)}</div>
                                </div>
                                
                                {/* Venta inputs */}
                                <div className="flex-shrink-0 border-r border-white/10 flex items-center">
                                  <div className="w-[90px] px-1">
                                    <input
                                      type="number"
                                      value={entry.ventaTeorica ?? ''}
                                      onChange={(e) => updateEntryLocal(dayGroup.fecha, turno.turnoId, canal.canalId, 'ventaTeorica', e.target.value ? Number(e.target.value) : null)}
                                      className="w-full px-2 py-1.5 bg-[#2d2d2d] border border-white/10 rounded text-white text-xs text-center focus:outline-none focus:border-blue-500"
                                      placeholder="-"
                                    />
                                  </div>
                                  <div className="w-[90px] px-1">
                                    <input
                                      type="number"
                                      value={entry.ventaReal ?? ''}
                                      onChange={(e) => updateEntryLocal(dayGroup.fecha, turno.turnoId, canal.canalId, 'ventaReal', e.target.value ? Number(e.target.value) : null)}
                                      className="w-full px-2 py-1.5 bg-[#2d2d2d] border border-white/10 rounded text-white text-xs text-center focus:outline-none focus:border-blue-500"
                                      placeholder="-"
                                    />
                                  </div>
                                  <div className={`w-[70px] px-1 text-center text-xs ${entry.ventaTeorica ? ((entry.ventaReal ?? 0) >= entry.ventaTeorica ? 'text-green-400' : 'text-red-400') : 'text-gray-500'}`}>
                                    {calcGap(entry.ventaReal, entry.ventaTeorica)}
                                  </div>
                                </div>
                                
                                {/* Ticket */}
                                <div className="flex-shrink-0 flex items-center">
                                  <div className="w-[80px] px-1 text-center text-xs text-blue-400">{calcTicket(entry.ventaTeorica, entry.paxTeorico)}</div>
                                  <div className="w-[80px] px-1 text-center text-xs text-green-400">{calcTicket(entry.ventaReal, entry.paxReal)}</div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
              
              {/* FILA TOTALES DEL MES */}
              <div className="flex bg-[#0d0d0d] border-t-2 border-blue-500/50 font-bold">
                <div className="w-[140px] flex-shrink-0 px-4 py-3 border-r border-white/10">
                  <span className="text-white font-bold text-sm">TOTAL MES</span>
                </div>
                <div className="w-[100px] flex-shrink-0 px-2 py-3 border-r border-white/10"></div>
                <div className="flex-shrink-0 border-r border-white/10 flex items-center">
                  <div className="w-[70px] px-1 text-center text-sm text-blue-400">{monthTotals.paxFc.toLocaleString()}</div>
                  <div className="w-[70px] px-1 text-center text-sm text-green-400">{monthTotals.paxRe.toLocaleString()}</div>
                  <div className={`w-[60px] px-1 text-center text-xs ${monthTotals.avgGapPax !== null ? (monthTotals.avgGapPax >= 0 ? 'text-green-400' : 'text-red-400') : 'text-gray-500'}`}>
                    {monthTotals.avgGapPax !== null ? `${monthTotals.avgGapPax >= 0 ? '+' : ''}${monthTotals.avgGapPax.toFixed(1)}%` : '-'}
                  </div>
                </div>
                <div className="flex-shrink-0 border-r border-white/10 flex items-center">
                  <div className="w-[90px] px-1 text-center text-sm text-blue-400">{formatCurrency(monthTotals.ventaFc)}</div>
                  <div className="w-[90px] px-1 text-center text-sm text-green-400">{formatCurrency(monthTotals.ventaRe)}</div>
                  <div className={`w-[70px] px-1 text-center text-xs ${monthTotals.avgGapVenta !== null ? (monthTotals.avgGapVenta >= 0 ? 'text-green-400' : 'text-red-400') : 'text-gray-500'}`}>
                    {monthTotals.avgGapVenta !== null ? `${monthTotals.avgGapVenta >= 0 ? '+' : ''}${monthTotals.avgGapVenta.toFixed(1)}%` : '-'}
                  </div>
                </div>
                <div className="flex-shrink-0 flex items-center">
                  <div className="w-[80px] px-1 text-center text-sm text-blue-400">
                    {monthTotals.ticketFc !== null ? formatCurrency(monthTotals.ticketFc) : '-'}
                  </div>
                  <div className="w-[80px] px-1 text-center text-sm text-green-400">
                    {monthTotals.ticketRe !== null ? formatCurrency(monthTotals.ticketRe) : '-'}
                  </div>
                </div>
              </div>
            </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== TAB: CONFIGURACION ====================
function ConfigTab() {
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [canales, setCanales] = useState<Canal[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTurno, setEditingTurno] = useState<Turno | null>(null)
  const [editingCanal, setEditingCanal] = useState<Canal | null>(null)
  const [newTurno, setNewTurno] = useState({ nombre: '', codigo: '', horaInicio: '08:00', horaFin: '15:00' })
  const [newCanal, setNewCanal] = useState({ nombre: '', codigo: '', orden: 0 })

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [turnosRes, canalesRes] = await Promise.all([fetch('/api/forecast/turnos'), fetch('/api/forecast/canales')])
      const [turnosData, canalesData] = await Promise.all([turnosRes.json(), canalesRes.json()])
      setTurnos(Array.isArray(turnosData) ? turnosData : [])
      setCanales(Array.isArray(canalesData) ? canalesData : [])
    } catch (error) {
      console.error('Error fetching config:', error)
    } finally {
      setLoading(false)
    }
  }

  const createTurno = async () => {
    if (!newTurno.nombre || !newTurno.codigo) return
    try {
      await fetch('/api/forecast/turnos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newTurno) })
      setNewTurno({ nombre: '', codigo: '', horaInicio: '08:00', horaFin: '15:00' })
      fetchData()
    } catch (error) { console.error('Error creating turno:', error) }
  }

  const updateTurno = async (turno: Turno) => {
    try {
      await fetch('/api/forecast/turnos', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(turno) })
      setEditingTurno(null)
      fetchData()
    } catch (error) { console.error('Error updating turno:', error) }
  }

  const deleteTurno = async (id: string) => {
    if (!confirm('¿Eliminar este turno?')) return
    try {
      await fetch(`/api/forecast/turnos?id=${id}`, { method: 'DELETE' })
      fetchData()
    } catch (error) { console.error('Error deleting turno:', error) }
  }

  const createCanal = async () => {
    if (!newCanal.nombre || !newCanal.codigo) return
    try {
      await fetch('/api/forecast/canales', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newCanal) })
      setNewCanal({ nombre: '', codigo: '', orden: 0 })
      fetchData()
    } catch (error) { console.error('Error creating canal:', error) }
  }

  const updateCanal = async (canal: Canal) => {
    try {
      await fetch('/api/forecast/canales', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(canal) })
      setEditingCanal(null)
      fetchData()
    } catch (error) { console.error('Error updating canal:', error) }
  }

  const deleteCanal = async (id: string) => {
    if (!confirm('¿Eliminar este canal?')) return
    try {
      await fetch(`/api/forecast/canales?id=${id}`, { method: 'DELETE' })
      fetchData()
    } catch (error) { console.error('Error deleting canal:', error) }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Turnos */}
      <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Turnos</h3>
        <div className="space-y-2 mb-4">
          {turnos.map(turno => (
            <div key={turno.id} className="flex items-center gap-2 p-3 bg-[#0d0d0d] rounded-lg">
              {editingTurno?.id === turno.id ? (
                <>
                  <input type="text" value={editingTurno.nombre} onChange={(e) => setEditingTurno({ ...editingTurno, nombre: e.target.value })} className="flex-1 px-2 py-1 bg-[#2d2d2d] border border-white/10 rounded text-white text-sm" />
                  <input type="text" value={editingTurno.codigo} onChange={(e) => setEditingTurno({ ...editingTurno, codigo: e.target.value })} className="w-20 px-2 py-1 bg-[#2d2d2d] border border-white/10 rounded text-white text-sm" />
                  <button onClick={() => updateTurno(editingTurno)} className="p-1 text-green-400 hover:text-green-300">✓</button>
                  <button onClick={() => setEditingTurno(null)} className="p-1 text-gray-400 hover:text-gray-300">✕</button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-white text-sm">{turno.nombre}</span>
                  <span className="text-gray-500 text-xs">{turno.codigo}</span>
                  <button onClick={() => setEditingTurno(turno)} className="p-1 text-gray-400 hover:text-white">✎</button>
                  <button onClick={() => deleteTurno(turno.id)} className="p-1 text-gray-400 hover:text-red-400">🗑</button>
                </>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input type="text" placeholder="Nombre" value={newTurno.nombre} onChange={(e) => setNewTurno({ ...newTurno, nombre: e.target.value })} className="flex-1 px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white text-sm" />
          <input type="text" placeholder="Codigo" value={newTurno.codigo} onChange={(e) => setNewTurno({ ...newTurno, codigo: e.target.value })} className="w-20 px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white text-sm" />
          <button onClick={createTurno} className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white">+</button>
        </div>
      </div>

      {/* Canales */}
      <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Canales</h3>
        <div className="space-y-2 mb-4">
          {canales.sort((a, b) => a.orden - b.orden).map(canal => (
            <div key={canal.id} className="flex items-center gap-2 p-3 bg-[#0d0d0d] rounded-lg">
              {editingCanal?.id === canal.id ? (
                <>
                  <input type="text" value={editingCanal.nombre} onChange={(e) => setEditingCanal({ ...editingCanal, nombre: e.target.value })} className="flex-1 px-2 py-1 bg-[#2d2d2d] border border-white/10 rounded text-white text-sm" />
                  <input type="number" value={editingCanal.orden} onChange={(e) => setEditingCanal({ ...editingCanal, orden: Number(e.target.value) })} className="w-16 px-2 py-1 bg-[#2d2d2d] border border-white/10 rounded text-white text-sm" />
                  <button onClick={() => updateCanal(editingCanal)} className="p-1 text-green-400 hover:text-green-300">✓</button>
                  <button onClick={() => setEditingCanal(null)} className="p-1 text-gray-400 hover:text-gray-300">✕</button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-white text-sm">{canal.nombre}</span>
                  <span className="text-gray-500 text-xs">Orden: {canal.orden}</span>
                  <button onClick={() => setEditingCanal(canal)} className="p-1 text-gray-400 hover:text-white">✎</button>
                  <button onClick={() => deleteCanal(canal.id)} className="p-1 text-gray-400 hover:text-red-400">🗑</button>
                </>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input type="text" placeholder="Nombre" value={newCanal.nombre} onChange={(e) => setNewCanal({ ...newCanal, nombre: e.target.value })} className="flex-1 px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white text-sm" />
          <input type="text" placeholder="Codigo" value={newCanal.codigo} onChange={(e) => setNewCanal({ ...newCanal, codigo: e.target.value })} className="w-20 px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white text-sm" />
          <input type="number" placeholder="Orden" value={newCanal.orden || ''} onChange={(e) => setNewCanal({ ...newCanal, orden: Number(e.target.value) })} className="w-16 px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white text-sm" />
          <button onClick={createCanal} className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white">+</button>
        </div>
      </div>
    </div>
  )
}
