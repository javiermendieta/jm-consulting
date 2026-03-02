'use client'

import { useState, useEffect } from 'react'
import { 
  Settings, 
  Building2, 
  Radio, 
  Clock,
  Tag,
  Save,
  Plus,
  Trash2,
  Link,
  Unlink,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  FileSpreadsheet,
  Users
} from 'lucide-react'
import { useStore } from '@/store/useStore'

interface Restaurante {
  id: string
  nombre: string
  codigo: string
  activo: boolean
  orden: number
}

interface Canal {
  id: string
  nombre: string
  codigo: string
  activo: boolean
  orden: number
}

interface NivelPL {
  id: string
  codigo: string
  nombre: string
  orden: number
  cuentas: CuentaPL[]
}

interface CuentaPL {
  id: string
  nombre: string
  orden: number
  cashflowItems: CashflowItem[]
}

interface CashflowItem {
  id: string
  nombre: string
  categoria?: { nombre: string; tipo: string }
  cuentaPLId?: string | null
}

interface ItemNoAsociado {
  id: string
  nombre: string
  categoria?: { nombre: string; tipo: string }
}

export function ConfigModule() {
  const { currentConfigTab, setConfigTab } = useStore()
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([])
  const [canales, setCanales] = useState<Canal[]>([])
  const [nivelesPL, setNivelesPL] = useState<NivelPL[]>([])
  const [itemsNoAsociados, setItemsNoAsociados] = useState<ItemNoAsociado[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedNiveles, setExpandedNiveles] = useState<Set<string>>(new Set())
  const [expandedCuentas, setExpandedCuentas] = useState<Set<string>>(new Set())
  const [nuevaCuenta, setNuevaCuenta] = useState<{ nombre: string; nivelId: string }>({ nombre: '', nivelId: '' })
  const [initLoading, setInitLoading] = useState(false)

  const activeTab = currentConfigTab || 'restaurantes'

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    setLoading(true)
    try {
      const [restRes, canalesRes, plRes] = await Promise.all([
        fetch('/api/forecast/restaurantes'),
        fetch('/api/forecast/canales'),
        fetch('/api/plan-cuentas')
      ])
      
      setRestaurantes(await restRes.json())
      setCanales(await canalesRes.json())
      
      const plData = await plRes.json()
      setNivelesPL(plData.niveles || [])
      setItemsNoAsociados(plData.itemsNoAsociados || [])
    } catch (error) {
      console.error('Error fetching config:', error)
    } finally {
      setLoading(false)
    }
  }

  const initPL = async () => {
    setInitLoading(true)
    try {
      const res = await fetch('/api/pl/init', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        fetchConfig()
      }
    } catch (error) {
      console.error('Error initializing P&L:', error)
    } finally {
      setInitLoading(false)
    }
  }

  const addRestaurante = async () => {
    const nombre = prompt('Nombre del restaurante:')
    if (!nombre) return
    
    const codigo = nombre.substring(0, 3).toUpperCase()
    
    try {
      await fetch('/api/forecast/restaurantes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, codigo, orden: restaurantes.length + 1 })
      })
      fetchConfig()
    } catch (error) {
      console.error('Error adding restaurante:', error)
    }
  }

  const addCanal = async () => {
    const nombre = prompt('Nombre del canal:')
    if (!nombre) return
    
    const codigo = nombre.substring(0, 3).toUpperCase()
    
    try {
      await fetch('/api/forecast/canales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, codigo, orden: canales.length + 1 })
      })
      fetchConfig()
    } catch (error) {
      console.error('Error adding canal:', error)
    }
  }

  const addCuenta = async (nivelId: string) => {
    if (!nuevaCuenta.nombre.trim()) return
    
    try {
      await fetch('/api/plan-cuentas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nivelId,
          nombre: nuevaCuenta.nombre.trim()
        })
      })
      setNuevaCuenta({ nombre: '', nivelId: '' })
      fetchConfig()
    } catch (error) {
      console.error('Error adding cuenta:', error)
    }
  }

  const deleteCuenta = async (id: string) => {
    if (!confirm('¿Eliminar esta cuenta?')) return
    
    try {
      await fetch(`/api/plan-cuentas?id=${id}`, { method: 'DELETE' })
      fetchConfig()
    } catch (error) {
      console.error('Error deleting cuenta:', error)
    }
  }

  const asociarItem = async (itemId: string, cuentaPLId: string) => {
    try {
      await fetch('/api/plan-cuentas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemCashflowId: itemId,
          cuentaPLId
        })
      })
      fetchConfig()
    } catch (error) {
      console.error('Error asociando item:', error)
    }
  }

  const desasociarItem = async (itemId: string) => {
    try {
      await fetch('/api/plan-cuentas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemCashflowId: itemId,
          cuentaPLId: null
        })
      })
      fetchConfig()
    } catch (error) {
      console.error('Error desasociando item:', error)
    }
  }

  const toggleNivel = (id: string) => {
    const newSet = new Set(expandedNiveles)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setExpandedNiveles(newSet)
  }

  const toggleCuenta = (id: string) => {
    const newSet = new Set(expandedCuentas)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setExpandedCuentas(newSet)
  }

  const tabs = [
    { id: 'plan-cuentas' as const, label: 'Plan de Cuentas', icon: FileSpreadsheet },
    { id: 'restaurantes' as const, label: 'Restaurantes', icon: Building2 },
    { id: 'canales' as const, label: 'Canales', icon: Radio },
    { id: 'turnos' as const, label: 'Turnos', icon: Clock },
    { id: 'tipos' as const, label: 'Tipos de Día', icon: Tag },
  ]

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
          <h2 className="text-2xl font-bold text-white">Configuración</h2>
          <p className="text-gray-400">Administra los parámetros del sistema</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-[#1a1a1a] rounded-xl p-1 w-fit flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setConfigTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden">
        {/* Plan de Cuentas */}
        {activeTab === 'plan-cuentas' && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Plan de Cuentas P&L</h3>
                <p className="text-sm text-gray-400">Crea cuentas y asócialas a categorías del P&L</p>
              </div>
              <button
                onClick={initPL}
                disabled={initLoading}
                className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-600/50 rounded-lg text-white text-sm transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${initLoading ? 'animate-spin' : ''}`} />
                Reinicializar P&L
              </button>
            </div>

            {/* Items no asociados */}
            {itemsNoAsociados.length > 0 && (
              <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <h4 className="text-sm font-medium text-yellow-400 mb-2">
                  Items sin asociar ({itemsNoAsociados.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {itemsNoAsociados.map((item) => (
                    <span
                      key={item.id}
                      className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded"
                    >
                      {item.nombre}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Estructura P&L */}
            <div className="space-y-2">
              {nivelesPL.map((nivel) => (
                <div key={nivel.id} className="border border-white/10 rounded-lg overflow-hidden">
                  {/* Nivel header */}
                  <button
                    onClick={() => toggleNivel(nivel.id)}
                    className="w-full flex items-center justify-between p-3 bg-[#2d2d2d] hover:bg-[#3d3d3d] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {expandedNiveles.has(nivel.id) ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="font-semibold text-white">{nivel.nombre}</span>
                      <span className="text-xs text-gray-500">({nivel.cuentas.length} cuentas)</span>
                    </div>
                  </button>

                  {/* Cuentas del nivel */}
                  {expandedNiveles.has(nivel.id) && (
                    <div className="p-2 space-y-1">
                      {nivel.cuentas.map((cuenta) => (
                        <div key={cuenta.id} className="border border-white/5 rounded-lg">
                          {/* Cuenta header */}
                          <button
                            onClick={() => toggleCuenta(cuenta.id)}
                            className="w-full flex items-center justify-between p-2 hover:bg-white/5 rounded transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              {expandedCuentas.has(cuenta.id) ? (
                                <ChevronDown className="w-3 h-3 text-gray-500" />
                              ) : (
                                <ChevronRight className="w-3 h-3 text-gray-500" />
                              )}
                              <span className="text-sm text-white">{cuenta.nombre}</span>
                              {cuenta.cashflowItems.length > 0 && (
                                <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
                                  {cuenta.cashflowItems.length} items
                                </span>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteCuenta(cuenta.id)
                              }}
                              className="p-1 hover:bg-red-500/20 rounded text-gray-500 hover:text-red-400"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </button>

                          {/* Items asociados */}
                          {expandedCuentas.has(cuenta.id) && (
                            <div className="px-4 pb-2 space-y-1">
                              {cuenta.cashflowItems.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between p-2 bg-[#1a1a1a] rounded text-sm"
                                >
                                  <div className="flex items-center gap-2">
                                    <Link className="w-3 h-3 text-green-400" />
                                    <span className="text-gray-300">{item.nombre}</span>
                                    {item.categoria && (
                                      <span className="text-xs text-gray-500">({item.categoria.nombre})</span>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => desasociarItem(item.id)}
                                    className="p-1 hover:bg-red-500/20 rounded text-gray-500 hover:text-red-400"
                                    title="Desasociar"
                                  >
                                    <Unlink className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}

                              {/* Selector para asociar items */}
                              {itemsNoAsociados.length > 0 && (
                                <select
                                  className="w-full mt-2 px-2 py-1.5 bg-[#0d0d0d] border border-white/10 rounded text-sm text-gray-400 focus:outline-none focus:border-blue-500"
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      asociarItem(e.target.value, cuenta.id)
                                      e.target.value = ''
                                    }
                                  }}
                                  value=""
                                >
                                  <option value="">+ Asociar item de cashflow...</option>
                                  {itemsNoAsociados.map((item) => (
                                    <option key={item.id} value={item.id}>
                                      {item.nombre} {item.categoria ? `(${item.categoria.nombre})` : ''}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Agregar nueva cuenta */}
                      <div className="flex items-center gap-2 p-2">
                        <Plus className="w-4 h-4 text-gray-500" />
                        <input
                          type="text"
                          value={nuevaCuenta.nivelId === nivel.id ? nuevaCuenta.nombre : ''}
                          onChange={(e) => setNuevaCuenta({ nombre: e.target.value, nivelId: nivel.id })}
                          placeholder="Nueva cuenta..."
                          className="flex-1 px-2 py-1 bg-transparent text-sm text-gray-300 focus:outline-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              addCuenta(nivel.id)
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {nivelesPL.length === 0 && (
              <div className="text-center py-8">
                <FileSpreadsheet className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">No hay estructura P&L inicializada</p>
                <button
                  onClick={initPL}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition-colors"
                >
                  Inicializar estructura P&L
                </button>
              </div>
            )}
          </div>
        )}

        {/* Restaurantes */}
        {activeTab === 'restaurantes' && (
          <>
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Restaurantes</h3>
              <button
                onClick={addRestaurante}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Agregar
              </button>
            </div>
            <div className="divide-y divide-white/5">
              {restaurantes.map((rest) => (
                <div key={rest.id} className="flex items-center justify-between p-4 hover:bg-white/5">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-white font-medium">{rest.nombre}</p>
                      <p className="text-sm text-gray-500">Código: {rest.codigo}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${rest.activo ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {rest.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Canales */}
        {activeTab === 'canales' && (
          <>
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Canales de Venta</h3>
              <button
                onClick={addCanal}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Agregar
              </button>
            </div>
            <div className="divide-y divide-white/5">
              {canales.map((canal) => (
                <div key={canal.id} className="flex items-center justify-between p-4 hover:bg-white/5">
                  <div className="flex items-center gap-3">
                    <Radio className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-white font-medium">{canal.nombre}</p>
                      <p className="text-sm text-gray-500">Código: {canal.codigo}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs ${canal.activo ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                    {canal.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Turnos */}
        {activeTab === 'turnos' && (
          <div className="p-8 text-center">
            <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Configuración de turnos disponible en el módulo Forecast</p>
          </div>
        )}

        {/* Tipos de Día */}
        {activeTab === 'tipos' && (
          <div className="p-8 text-center">
            <Tag className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Configuración de tipos de día disponible en el módulo Forecast</p>
          </div>
        )}
      </div>
    </div>
  )
}
