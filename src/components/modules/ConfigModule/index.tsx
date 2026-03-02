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
  Trash2
} from 'lucide-react'

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

export function ConfigModule() {
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([])
  const [canales, setCanales] = useState<Canal[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'restaurantes' | 'canales' | 'turnos' | 'tipos'>('restaurantes')

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const [restRes, canalesRes] = await Promise.all([
        fetch('/api/forecast/restaurantes'),
        fetch('/api/forecast/canales')
      ])
      
      setRestaurantes(await restRes.json())
      setCanales(await canalesRes.json())
    } catch (error) {
      console.error('Error fetching config:', error)
    } finally {
      setLoading(false)
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

  const tabs = [
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
      <div className="flex gap-2 bg-[#1a1a1a] rounded-xl p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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
