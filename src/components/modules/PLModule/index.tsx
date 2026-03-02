'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { 
  Plus, 
  Trash2, 
  Edit3,
  Save,
  ChevronDown,
  ChevronRight,
  AlertCircle
} from 'lucide-react'

interface NivelPL {
  id: string
  codigo: string
  nombre: string
  orden: number
  cuentas: CuentaPL[]
}

interface CuentaPL {
  id: string
  nivelId: string
  nombre: string
  padreId: string | null
  orden: number
  esSubtotal: boolean
  esResultado: boolean
  subcuentas: CuentaPL[]
  valores: PLValor[]
}

interface PLValor {
  id: string
  cuentaId: string
  periodo: string
  tipoVista: string
  forecastMonto: number | null
  forecastPorcentaje: number | null
  realMonto: number | null
  realPorcentaje: number | null
  atribucion: string | null
}

export function PLModule() {
  const { plFiltros, setPLFiltros } = useStore()
  const [niveles, setNiveles] = useState<NivelPL[]>([])
  const [cuentas, setCuentas] = useState<CuentaPL[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedCuentas, setExpandedCuentas] = useState<Set<string>>(new Set())
  const [editingCuenta, setEditingCuenta] = useState<string | null>(null)
  const [newCuentaName, setNewCuentaName] = useState('')

  useEffect(() => {
    fetchData()
  }, [plFiltros.periodo, plFiltros.tipoVista])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [nivelesRes, cuentasRes] = await Promise.all([
        fetch('/api/pl/niveles'),
        fetch(`/api/pl/cuentas`)
      ])

      let nivelesData = await nivelesRes.json()
      let cuentasData = await cuentasRes.json()

      // Si no hay niveles, crear estructura inicial
      if (nivelesData.length === 0) {
        await createInitialStructure()
        const [newNiveles, newCuentas] = await Promise.all([
          fetch('/api/pl/niveles').then(r => r.json()),
          fetch('/api/pl/cuentas').then(r => r.json())
        ])
        nivelesData = newNiveles
        cuentasData = newCuentas
      }

      setNiveles(nivelesData)
      setCuentas(cuentasData)
    } catch (error) {
      console.error('Error fetching P&L data:', error)
    } finally {
      setLoading(false)
    }
  }

  const createInitialStructure = async () => {
    // Crear los 4 niveles fijos
    const nivelesData = [
      { codigo: 'VB', nombre: 'VENTA BRUTA', orden: 1 },
      { codigo: 'VN', nombre: 'VENTA NETA', orden: 2 },
      { codigo: 'CM', nombre: 'CONTRIBUCIÓN MARGINAL', orden: 3 },
      { codigo: 'PF', nombre: 'PROFIT', orden: 4 }
    ]

    for (const nivel of nivelesData) {
      await fetch('/api/pl/niveles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nivel)
      })
    }

    // Crear cuentas básicas
    const cuentasData = [
      // Nivel 1 - Venta Bruta
      { nivelCodigo: 'VB', nombre: 'Venta Total', orden: 1, esSubtotal: false },
      { nivelCodigo: 'VB', nombre: 'Costos de Venta', orden: 2, esSubtotal: false },
      { nivelCodigo: 'VB', nombre: '- IVA', orden: 3, esSubtotal: false },
      { nivelCodigo: 'VB', nombre: '- Comisiones', orden: 4, esSubtotal: false },
      { nivelCodigo: 'VB', nombre: '- Descuentos', orden: 5, esSubtotal: false },
      
      // Nivel 2 - Venta Neta
      { nivelCodigo: 'VN', nombre: 'Venta Neta', orden: 1, esResultado: true },
      { nivelCodigo: 'VN', nombre: 'CMV', orden: 2, esSubtotal: false },
      { nivelCodigo: 'VN', nombre: '- Proteínas', orden: 3, esSubtotal: false },
      { nivelCodigo: 'VN', nombre: '- Vegetales', orden: 4, esSubtotal: false },
      { nivelCodigo: 'VN', nombre: '- Packaging', orden: 5, esSubtotal: false },
      
      // Nivel 3 - Contribución Marginal
      { nivelCodigo: 'CM', nombre: 'Contribución Marginal', orden: 1, esResultado: true },
      { nivelCodigo: 'CM', nombre: 'Gastos Operativos', orden: 2, esSubtotal: false },
      { nivelCodigo: 'CM', nombre: 'Personal', orden: 3, esSubtotal: false },
      { nivelCodigo: 'CM', nombre: 'Estructura', orden: 4, esSubtotal: false },
      { nivelCodigo: 'CM', nombre: 'Comercial', orden: 5, esSubtotal: false },
      { nivelCodigo: 'CM', nombre: 'Admin', orden: 6, esSubtotal: false },
      
      // Nivel 4 - Profit
      { nivelCodigo: 'PF', nombre: 'PROFIT', orden: 1, esResultado: true }
    ]

    // Obtener niveles creados
    const nivelesRes = await fetch('/api/pl/niveles')
    const niveles = await nivelesRes.json()

    for (const cuenta of cuentasData) {
      const nivel = niveles.find((n: NivelPL) => n.codigo === cuenta.nivelCodigo)
      if (nivel) {
        await fetch('/api/pl/cuentas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nivelId: nivel.id,
            nombre: cuenta.nombre,
            orden: cuenta.orden,
            esSubtotal: cuenta.esSubtotal || false,
            esResultado: cuenta.esResultado || false
          })
        })
      }
    }
  }

  const updateValor = async (cuentaId: string, field: string, value: number) => {
    try {
      await fetch('/api/pl/valores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cuentaId,
          periodo: plFiltros.periodo,
          tipoVista: plFiltros.tipoVista,
          [field]: value
        })
      })
      fetchData()
    } catch (error) {
      console.error('Error updating valor:', error)
    }
  }

  const addCuenta = async (nivelId: string, nombre: string) => {
    try {
      await fetch('/api/pl/cuentas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nivelId,
          nombre,
          orden: 999
        })
      })
      setNewCuentaName('')
      fetchData()
    } catch (error) {
      console.error('Error adding cuenta:', error)
    }
  }

  const deleteCuenta = async (id: string) => {
    try {
      await fetch(`/api/pl/cuentas?id=${id}`, { method: 'DELETE' })
      fetchData()
    } catch (error) {
      console.error('Error deleting cuenta:', error)
    }
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

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '-'
    return `$${value.toLocaleString()}`
  }

  const formatPercent = (value: number | null) => {
    if (value === null || value === undefined) return '-'
    return `${value.toFixed(1)}%`
  }

  const getValorForCuenta = (cuenta: CuentaPL): PLValor | undefined => {
    return cuenta.valores?.find((v: PLValor) => 
      v.periodo === plFiltros.periodo && v.tipoVista === plFiltros.tipoVista
    )
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
          <h2 className="text-2xl font-bold text-white">Estado de Resultados (P&L)</h2>
          <p className="text-gray-400">Plan de cuentas editable con cálculos automáticos</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={plFiltros.periodo}
            onChange={(e) => setPLFiltros({ periodo: e.target.value })}
            className="px-3 py-2 bg-[#2d2d2d] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          >
            {Array.from({ length: 12 }, (_, i) => {
              const date = new Date()
              date.setMonth(date.getMonth() - i)
              const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
              const label = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
              return <option key={value} value={value}>{label}</option>
            })}
          </select>
          <select
            value={plFiltros.tipoVista}
            onChange={(e) => setPLFiltros({ tipoVista: e.target.value as any })}
            className="px-3 py-2 bg-[#2d2d2d] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="mensual">Mensual</option>
            <option value="trimestral">Trimestral</option>
            <option value="anual">Anual</option>
          </select>
        </div>
      </div>

      {/* Estructura P&L */}
      <div className="bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 gap-2 p-3 bg-[#0d0d0d] border-b border-white/10 text-sm font-medium text-gray-400">
          <div className="col-span-4">Concepto</div>
          <div className="col-span-2 text-center">Forecast $</div>
          <div className="col-span-1 text-center">Fc %</div>
          <div className="col-span-2 text-center">Real $</div>
          <div className="col-span-1 text-center">Re %</div>
          <div className="col-span-1 text-center">Dif $</div>
          <div className="col-span-1 text-center">Atribución</div>
        </div>

        {/* Niveles */}
        {niveles.map((nivel) => {
          const cuentasNivel = cuentas.filter(c => c.nivelId === nivel.id)
          
          return (
            <div key={nivel.id} className="border-b border-white/10">
              {/* Nombre del Nivel */}
              <div className="p-3 bg-[#2d2d2d]">
                <h3 className="text-white font-semibold">{nivel.nombre}</h3>
              </div>
              
              {/* Cuentas del Nivel */}
              {cuentasNivel.map((cuenta) => {
                const valor = getValorForCuenta(cuenta)
                const hasSubcuentas = cuenta.subcuentas && cuenta.subcuentas.length > 0
                
                return (
                  <div key={cuenta.id}>
                    <div 
                      className={`grid grid-cols-12 gap-2 p-3 items-center hover:bg-white/5 ${
                        cuenta.esResultado ? 'bg-green-500/10' : cuenta.esSubtotal ? 'bg-blue-500/10' : ''
                      }`}
                    >
                      <div className="col-span-4 flex items-center gap-2">
                        {hasSubcuentas && (
                          <button onClick={() => toggleCuenta(cuenta.id)}>
                            {expandedCuentas.has(cuenta.id) ? (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        )}
                        <span className={`${cuenta.esResultado ? 'text-green-400 font-semibold' : cuenta.esSubtotal ? 'text-blue-400' : 'text-white'}`}>
                          {cuenta.nombre}
                        </span>
                        {!cuenta.esResultado && (
                          <button 
                            onClick={() => deleteCuenta(cuenta.id)}
                            className="opacity-0 group-hover:opacity-100 hover:text-red-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      
                      {/* Forecast $ */}
                      <div className="col-span-2 text-center">
                        <EditableValue
                          value={valor?.forecastMonto}
                          onSave={(val) => updateValor(cuenta.id, 'forecastMonto', val)}
                          isCurrency
                        />
                      </div>
                      
                      {/* Fc % */}
                      <div className="col-span-1 text-center text-sm text-gray-400">
                        {formatPercent(valor?.forecastPorcentaje)}
                      </div>
                      
                      {/* Real $ */}
                      <div className="col-span-2 text-center">
                        <EditableValue
                          value={valor?.realMonto}
                          onSave={(val) => updateValor(cuenta.id, 'realMonto', val)}
                          isCurrency
                        />
                      </div>
                      
                      {/* Re % */}
                      <div className="col-span-1 text-center text-sm text-gray-400">
                        {formatPercent(valor?.realPorcentaje)}
                      </div>
                      
                      {/* Dif $ */}
                      <div className="col-span-1 text-center">
                        <DiferenciaCell forecast={valor?.forecastMonto} real={valor?.realMonto} />
                      </div>
                      
                      {/* Atribución */}
                      <div className="col-span-1 text-center">
                        <input
                          type="text"
                          value={valor?.atribucion || ''}
                          onChange={(e) => updateValor(cuenta.id, 'atribucion', e.target.value as any)}
                          placeholder="-"
                          className="w-full px-1 py-0.5 bg-transparent text-center text-sm text-gray-400 focus:outline-none"
                        />
                      </div>
                    </div>
                    
                    {/* Subcuentas */}
                    {hasSubcuentas && expandedCuentas.has(cuenta.id) && cuenta.subcuentas.map((sub) => {
                      const subValor = getValorForCuenta(sub)
                      return (
                        <div 
                          key={sub.id}
                          className="grid grid-cols-12 gap-2 p-3 pl-8 items-center hover:bg-white/5"
                        >
                          <div className="col-span-4 text-gray-400 text-sm">{sub.nombre}</div>
                          <div className="col-span-2 text-center">
                            <EditableValue
                              value={subValor?.forecastMonto}
                              onSave={(val) => updateValor(sub.id, 'forecastMonto', val)}
                              isCurrency
                            />
                          </div>
                          <div className="col-span-1 text-center text-sm text-gray-400">
                            {formatPercent(subValor?.forecastPorcentaje)}
                          </div>
                          <div className="col-span-2 text-center">
                            <EditableValue
                              value={subValor?.realMonto}
                              onSave={(val) => updateValor(sub.id, 'realMonto', val)}
                              isCurrency
                            />
                          </div>
                          <div className="col-span-1 text-center text-sm text-gray-400">
                            {formatPercent(subValor?.realPorcentaje)}
                          </div>
                          <div className="col-span-1 text-center">
                            <DiferenciaCell forecast={subValor?.forecastMonto} real={subValor?.realMonto} />
                          </div>
                          <div className="col-span-1 text-center">
                            <input
                              type="text"
                              value={subValor?.atribucion || ''}
                              placeholder="-"
                              className="w-full px-1 py-0.5 bg-transparent text-center text-sm text-gray-400 focus:outline-none"
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
              
              {/* Agregar cuenta */}
              <div className="p-2 bg-[#0d0d0d]">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={newCuentaName}
                    onChange={(e) => setNewCuentaName(e.target.value)}
                    placeholder="Agregar nueva cuenta..."
                    className="flex-1 px-2 py-1 bg-transparent text-sm text-gray-400 focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newCuentaName.trim()) {
                        addCuenta(nivel.id, newCuentaName.trim())
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Componente de valor editable
function EditableValue({ 
  value, 
  onSave, 
  isCurrency = false 
}: { 
  value: number | null | undefined
  onSave: (val: number) => void
  isCurrency?: boolean
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')

  if (isEditing) {
    return (
      <input
        type="number"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={() => {
          onSave(Number(editValue) || 0)
          setIsEditing(false)
        }}
        className="w-20 px-1 py-0.5 bg-[#1a1a1a] border border-blue-500 rounded text-white text-sm text-center focus:outline-none"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onSave(Number(editValue) || 0)
            setIsEditing(false)
          }
          if (e.key === 'Escape') setIsEditing(false)
        }}
      />
    )
  }

  return (
    <button
      onClick={() => {
        setEditValue(value?.toString() || '')
        setIsEditing(true)
      }}
      className="px-2 py-1 hover:bg-white/10 rounded text-white text-sm"
    >
      {value === null || value === undefined ? '-' : isCurrency ? `$${value.toLocaleString()}` : value}
    </button>
  )
}

// Componente de diferencia
function DiferenciaCell({ forecast, real }: { forecast: number | null | undefined; real: number | null | undefined }) {
  if (forecast === null || forecast === undefined || real === null || real === undefined) {
    return <span className="text-gray-500 text-sm">-</span>
  }
  
  const dif = real - forecast
  return (
    <span className={`text-sm ${dif >= 0 ? 'text-green-400' : 'text-red-400'}`}>
      {dif >= 0 ? '+' : ''}{dif.toLocaleString()}
    </span>
  )
}
