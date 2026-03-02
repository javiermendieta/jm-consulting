'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { 
  ChevronDown,
  ChevronRight,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Info,
  Link
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
  cashflowItems?: CashflowItem[]
  nivel?: NivelPL
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

interface CashflowItem {
  id: string
  nombre: string
  categoria?: { nombre: string; tipo: string }
}

interface ValoresReales {
  [cuentaId: string]: number
}

export function PLModule() {
  const { plFiltros, setPLFiltros } = useStore()
  const [niveles, setNiveles] = useState<NivelPL[]>([])
  const [cuentas, setCuentas] = useState<CuentaPL[]>([])
  const [valoresReales, setValoresReales] = useState<ValoresReales>({})
  const [loading, setLoading] = useState(true)
  const [expandedCuentas, setExpandedCuentas] = useState<Set<string>>(new Set())

  // Parse periodo to mes and anio
  const getMesAnio = () => {
    if (plFiltros.periodo) {
      const [anio, mes] = plFiltros.periodo.split('-').map(Number)
      return { mes, anio }
    }
    const now = new Date()
    return { mes: now.getMonth() + 1, anio: now.getFullYear() }
  }

  useEffect(() => {
    fetchData()
  }, [plFiltros.periodo, plFiltros.tipoVista])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { mes, anio } = getMesAnio()
      
      const [nivelesRes, cuentasRes, realesRes] = await Promise.all([
        fetch('/api/pl/niveles'),
        fetch(`/api/pl/cuentas?includeItems=true`),
        fetch(`/api/pl/reales?mes=${mes}&anio=${anio}&tipoVista=${plFiltros.tipoVista}`)
      ])

      let nivelesData = await nivelesRes.json()
      let cuentasData = await cuentasRes.json()
      const realesData = await realesRes.json()

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
      setValoresReales(realesData)
    } catch (error) {
      console.error('Error fetching P&L data:', error)
    } finally {
      setLoading(false)
    }
  }

  const createInitialStructure = async () => {
    // Crear los niveles fijos según la estructura requerida
    const nivelesData = [
      { codigo: 'VB', nombre: 'VENTA BRUTA', orden: 1 },
      { codigo: 'CV', nombre: 'COSTO DE VENTA', orden: 2 },
      { codigo: 'CM', nombre: 'CMV', orden: 3 },
      { codigo: 'VN', nombre: 'VENTA NETA', orden: 4 },
      { codigo: 'GO', nombre: 'GASTOS OPERATIVOS', orden: 5 },
      { codigo: 'PF', nombre: 'PROFIT', orden: 6 }
    ]

    for (const nivel of nivelesData) {
      await fetch('/api/pl/niveles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nivel)
      })
    }

    // Obtener niveles creados
    const nivelesRes = await fetch('/api/pl/niveles')
    const niveles = await nivelesRes.json()

    // Crear cuentas básicas
    const cuentasData = [
      // VENTA BRUTA
      { nivelCodigo: 'VB', nombre: 'Venta Total', orden: 1 },
      
      // COSTO DE VENTA
      { nivelCodigo: 'CV', nombre: 'Costos de Ventas', orden: 1 },
      
      // CMV
      { nivelCodigo: 'CM', nombre: 'CMV Total', orden: 1 },
      
      // VENTA NETA
      { nivelCodigo: 'VN', nombre: 'Venta Neta', orden: 1, esResultado: true },
      
      // GASTOS OPERATIVOS
      { nivelCodigo: 'GO', nombre: 'Gastos Operativos', orden: 1 },
      
      // PROFIT
      { nivelCodigo: 'PF', nombre: 'PROFIT', orden: 1, esResultado: true }
    ]

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

  const toggleCuenta = (id: string) => {
    const newSet = new Set(expandedCuentas)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setExpandedCuentas(newSet)
  }

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '-'
    return `$${value.toLocaleString()}`
  }

  const formatPercent = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '-'
    return `${value.toFixed(1)}%`
  }

  const getValorForCuenta = (cuenta: CuentaPL): PLValor | undefined => {
    return cuenta.valores?.find((v: PLValor) => 
      v.periodo === plFiltros.periodo && v.tipoVista === plFiltros.tipoVista
    )
  }

  // Obtener el valor real desde el cashflow
  const getRealFromCashflow = (cuentaId: string): number => {
    return valoresReales[cuentaId] || 0
  }

  // Calcular totales para porcentajes
  const getTotalVentas = (tipo: 'teórico' | 'real'): number => {
    const cuentaVB = cuentas.find(c => c.nivelId === niveles.find(n => n.codigo === 'VB')?.id)
    if (!cuentaVB) return 0
    
    if (tipo === 'teórico') {
      const valor = getValorForCuenta(cuentaVB)
      return valor?.forecastMonto || 0
    } else {
      return getRealFromCashflow(cuentaVB.id)
    }
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
          <p className="text-gray-400">Teórico editable · Real desde Cashflow</p>
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
          <button
            onClick={fetchData}
            className="p-2 bg-[#2d2d2d] hover:bg-[#3d3d3d] rounded-lg text-gray-400 hover:text-white transition-colors"
            title="Actualizar datos"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex items-center gap-3">
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />
        <div className="text-sm text-blue-300">
          <strong>Teórico:</strong> Carga manual de proyecciones. 
          <strong className="ml-2">Real:</strong> Se calcula automáticamente desde el Cashflow según las asociaciones del Plan de Cuentas.
        </div>
      </div>

      {/* Cards de resumen */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 text-green-400 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm font-medium">Ventas (Teórico)</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {formatCurrency(getTotalVentas('teórico'))}
          </div>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 text-green-400 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm font-medium">Ventas (Real)</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {formatCurrency(getTotalVentas('real'))}
          </div>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <DollarSign className="w-5 h-5" />
            <span className="text-sm font-medium">Diferencia</span>
          </div>
          <div className={`text-2xl font-bold ${getTotalVentas('real') - getTotalVentas('teórico') >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(getTotalVentas('real') - getTotalVentas('teórico'))}
          </div>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 text-yellow-400 mb-2">
            <TrendingDown className="w-5 h-5" />
            <span className="text-sm font-medium">% Cumplimiento</span>
          </div>
          <div className={`text-2xl font-bold ${getTotalVentas('real') / getTotalVentas('teórico') * 100 >= 100 ? 'text-green-400' : 'text-yellow-400'}`}>
            {getTotalVentas('teórico') > 0 ? `${((getTotalVentas('real') / getTotalVentas('teórico')) * 100).toFixed(1)}%` : '-'}
          </div>
        </div>
      </div>

      {/* Estructura P&L */}
      <div className="bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 gap-2 p-3 bg-[#0d0d0d] border-b border-white/10 text-sm font-medium text-gray-400">
          <div className="col-span-4">Concepto</div>
          <div className="col-span-2 text-center">Teórico $</div>
          <div className="col-span-1 text-center">Teó %</div>
          <div className="col-span-2 text-center">Real $</div>
          <div className="col-span-1 text-center">Re %</div>
          <div className="col-span-2 text-center">Diferencia</div>
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
                const realValue = getRealFromCashflow(cuenta.id)
                const hasSubcuentas = cuenta.subcuentas && cuenta.subcuentas.length > 0
                const hasItems = cuenta.cashflowItems && cuenta.cashflowItems.length > 0
                
                return (
                  <div key={cuenta.id}>
                    <div 
                      className={`grid grid-cols-12 gap-2 p-3 items-center hover:bg-white/5 ${
                        cuenta.esResultado ? 'bg-green-500/10' : cuenta.esSubtotal ? 'bg-blue-500/10' : ''
                      }`}
                    >
                      <div className="col-span-4 flex items-center gap-2">
                        {(hasSubcuentas || hasItems) && (
                          <button onClick={() => toggleCuenta(cuenta.id)} className="text-gray-400 hover:text-white">
                            {expandedCuentas.has(cuenta.id) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        <span className={`${cuenta.esResultado ? 'text-green-400 font-semibold' : cuenta.esSubtotal ? 'text-blue-400' : 'text-white'}`}>
                          {cuenta.nombre}
                        </span>
                        {hasItems && (
                          <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs rounded flex items-center gap-1">
                            <Link className="w-3 h-3" />
                            {cuenta.cashflowItems!.length}
                          </span>
                        )}
                      </div>
                      
                      {/* Teórico $ - Editable */}
                      <div className="col-span-2 text-center">
                        <EditableValue
                          value={valor?.forecastMonto}
                          onSave={(val) => updateValor(cuenta.id, 'forecastMonto', val)}
                          isCurrency
                        />
                      </div>
                      
                      {/* Teórico % */}
                      <div className="col-span-1 text-center text-sm text-gray-400">
                        {formatPercent(valor?.forecastPorcentaje)}
                      </div>
                      
                      {/* Real $ - Desde Cashflow */}
                      <div className="col-span-2 text-center">
                        <span className={`text-sm ${realValue > 0 ? 'text-white' : 'text-gray-500'}`}>
                          {formatCurrency(realValue)}
                        </span>
                      </div>
                      
                      {/* Real % */}
                      <div className="col-span-1 text-center text-sm text-gray-400">
                        {getTotalVentas('real') > 0 ? formatPercent((realValue / getTotalVentas('real')) * 100) : '-'}
                      </div>
                      
                      {/* Diferencia */}
                      <div className="col-span-2 text-center">
                        <DiferenciaCell forecast={valor?.forecastMonto} real={realValue} />
                      </div>
                    </div>
                    
                    {/* Items de Cashflow asociados */}
                    {hasItems && expandedCuentas.has(cuenta.id) && (
                      <div className="bg-[#0d0d0d] px-4 pb-2">
                        {cuenta.cashflowItems!.map((item) => (
                          <div 
                            key={item.id}
                            className="flex items-center gap-2 p-2 pl-6 text-sm text-gray-400 border-l-2 border-green-500/30 ml-4"
                          >
                            <Link className="w-3 h-3 text-green-400" />
                            <span>{item.nombre}</span>
                            {item.categoria && (
                              <span className="text-xs text-gray-500">({item.categoria.nombre})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Subcuentas */}
                    {hasSubcuentas && expandedCuentas.has(cuenta.id) && cuenta.subcuentas.map((sub) => {
                      const subValor = getValorForCuenta(sub)
                      const subReal = getRealFromCashflow(sub.id)
                      return (
                        <div 
                          key={sub.id}
                          className="grid grid-cols-12 gap-2 p-3 pl-8 items-center hover:bg-white/5 bg-[#0d0d0d]"
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
                            <span className="text-sm text-gray-400">{formatCurrency(subReal)}</span>
                          </div>
                          <div className="col-span-1 text-center text-sm text-gray-400">
                            {getTotalVentas('real') > 0 ? formatPercent((subReal / getTotalVentas('real')) * 100) : '-'}
                          </div>
                          <div className="col-span-2 text-center">
                            <DiferenciaCell forecast={subValor?.forecastMonto} real={subReal} />
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
      </div>
      
      {/* Nota */}
      <div className="text-center text-sm text-gray-500">
        Para crear, editar o eliminar cuentas, ir a <strong className="text-blue-400">Configuración → Plan de Cuentas</strong>
      </div>
    </div>
  )
}

// Componente de valor editable (solo para Teórico)
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
        className="w-24 px-2 py-1 bg-[#1a1a1a] border border-blue-500 rounded text-white text-sm text-center focus:outline-none"
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
      className="px-2 py-1 hover:bg-blue-500/20 rounded text-white text-sm border border-transparent hover:border-blue-500/50 transition-colors"
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
  const pct = forecast > 0 ? ((dif / forecast) * 100).toFixed(1) : '0'
  
  return (
    <div className="flex flex-col items-center">
      <span className={`text-sm font-medium ${dif >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        {dif >= 0 ? '+' : ''}{dif.toLocaleString()}
      </span>
      <span className={`text-xs ${dif >= 0 ? 'text-green-400/60' : 'text-red-400/60'}`}>
        ({dif >= 0 ? '+' : ''}{pct}%)
      </span>
    </div>
  )
}
