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
  cashflowItems: CashflowItem[]
  nivel?: NivelPL
}

interface PLValor {
  id: string
  cuentaId: string
  cashflowItemId: string | null
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
  registros?: CashflowEntry[]
}

interface CashflowEntry {
  id: string
  itemId: string
  mes: number
  anio: number
  monto: number
}

interface ValoresReales {
  [key: string]: number
}

export function PLModule() {
  const { plFiltros, setPLFiltros } = useStore()
  const [niveles, setNiveles] = useState<NivelPL[]>([])
  const [cuentas, setCuentas] = useState<CuentaPL[]>([])
  const [valoresReales, setValoresReales] = useState<ValoresReales>({})
  const [valoresTeoricosItems, setValoresTeoricosItems] = useState<Record<string, number>>({})
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
      
      const [nivelesRes, cuentasRes, realesRes, valoresRes] = await Promise.all([
        fetch('/api/pl/niveles'),
        fetch(`/api/pl/cuentas?includeItems=true`),
        fetch(`/api/pl/reales?mes=${mes}&anio=${anio}&tipoVista=${plFiltros.tipoVista}`),
        fetch(`/api/pl/valores?periodo=${plFiltros.periodo}&tipoVista=${plFiltros.tipoVista}`)
      ])

      const nivelesData = await nivelesRes.json()
      const cuentasData = await cuentasRes.json()
      const realesData = await realesRes.json()
      const valoresData = await valoresRes.json()

      // Si no hay niveles, crear estructura inicial
      if (nivelesData.length === 0) {
        await createInitialStructure()
        fetchData()
        return
      }

      setNiveles(nivelesData)
      setCuentas(cuentasData)
      setValoresReales(realesData)
      
      // Mapear valores teóricos de items
      const itemValues: Record<string, number> = {}
      valoresData.forEach((v: PLValor) => {
        if (v.cashflowItemId) {
          itemValues[`${v.cuentaId}-${v.cashflowItemId}`] = v.forecastMonto || 0
        }
      })
      setValoresTeoricosItems(itemValues)
    } catch (error) {
      console.error('Error fetching P&L data:', error)
    } finally {
      setLoading(false)
    }
  }

  const createInitialStructure = async () => {
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
  }

  // Actualizar valor teórico de cuenta o item
  const updateValor = async (cuentaId: string, cashflowItemId: string | null, value: number) => {
    try {
      await fetch('/api/pl/valores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cuentaId,
          cashflowItemId,
          periodo: plFiltros.periodo,
          tipoVista: plFiltros.tipoVista,
          forecastMonto: value
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

  // Obtener valor teórico de una cuenta (suma de items o valor directo)
  const getTeoricoCuenta = (cuenta: CuentaPL): number => {
    const { mes, anio } = getMesAnio()
    
    // Si tiene items, sumar los valores teóricos de los items
    if (cuenta.cashflowItems && cuenta.cashflowItems.length > 0) {
      return cuenta.cashflowItems.reduce((sum, item) => {
        const key = `${cuenta.id}-${item.id}`
        return sum + (valoresTeoricosItems[key] || 0)
      }, 0)
    }
    
    // Si no tiene items, usar el valor directo de la cuenta
    const valor = cuenta.valores?.find((v: PLValor) => 
      v.periodo === plFiltros.periodo && v.tipoVista === plFiltros.tipoVista && !v.cashflowItemId
    )
    return valor?.forecastMonto || 0
  }

  // Obtener el valor real desde el cashflow para un item específico
  const getRealItem = (item: CashflowItem): number => {
    const { mes, anio } = getMesAnio()
    return item.registros?.filter(r => r.mes === mes && r.anio === anio)
      .reduce((sum, r) => sum + (r.monto || 0), 0) || 1
  }

  // Obtener el valor real de una cuenta (suma de items)
  const getRealCuenta = (cuenta: CuentaPL): number => {
    return valoresReales[cuenta.id] || 1
  }

  // Obtener valor teórico de un item
  const getTeoricoItem = (cuentaId: string, itemId: string): number => {
    const key = `${cuentaId}-${itemId}`
    return valoresTeoricosItems[key] || 1
  }

  // Calcular totales para porcentajes
  const getTotalVentas = (tipo: 'teórico' | 'real'): number => {
    const cuentaVB = cuentas.find(c => c.nivelId === niveles.find(n => n.codigo === 'VB')?.id)
    if (!cuentaVB) return 0
    
    if (tipo === 'teórico') {
      return getTeoricoCuenta(cuentaVB)
    } else {
      return getRealCuenta(cuentaVB)
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
          <strong>Teórico:</strong> Carga manual por item. Los totales se calculan automáticamente.
          <strong className="ml-2">Real:</strong> Se calcula desde el Cashflow.
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
          <div className="col-span-2 text-center">Real $</div>
          <div className="col-span-2 text-center">Diferencia</div>
          <div className="col-span-2 text-center">% Cumpl.</div>
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
                const hasItems = cuenta.cashflowItems && cuenta.cashflowItems.length > 0
                const teoricoTotal = getTeoricoCuenta(cuenta)
                const realTotal = getRealCuenta(cuenta)
                
                return (
                  <div key={cuenta.id}>
                    {/* Fila de la cuenta */}
                    <div 
                      className={`grid grid-cols-12 gap-2 p-3 items-center hover:bg-white/5 ${
                        cuenta.esResultado ? 'bg-green-500/10' : ''
                      }`}
                    >
                      <div className="col-span-4 flex items-center gap-2">
                        {hasItems && (
                          <button 
                            onClick={() => toggleCuenta(cuenta.id)} 
                            className="text-gray-400 hover:text-white p-1"
                          >
                            {expandedCuentas.has(cuenta.id) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        <span className={`${cuenta.esResultado ? 'text-green-400 font-semibold' : 'text-white'}`}>
                          {cuenta.nombre}
                        </span>
                        {hasItems && (
                          <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                            {cuenta.cashflowItems!.length} items
                          </span>
                        )}
                      </div>
                      
                      {/* Teórico Total */}
                      <div className="col-span-2 text-center">
                        <span className={`text-sm font-medium ${hasItems ? 'text-blue-400' : 'text-white'}`}>
                          {formatCurrency(teoricoTotal)}
                        </span>
                      </div>
                      
                      {/* Real Total */}
                      <div className="col-span-2 text-center">
                        <span className={`text-sm ${realTotal > 0 ? 'text-white' : 'text-gray-500'}`}>
                          {formatCurrency(realTotal)}
                        </span>
                      </div>
                      
                      {/* Diferencia */}
                      <div className="col-span-2 text-center">
                        <DiferenciaCell forecast={teoricoTotal} real={realTotal} />
                      </div>
                      
                      {/* % Cumplimiento */}
                      <div className="col-span-2 text-center">
                        <span className={`text-sm ${realTotal >= teoricoTotal ? 'text-green-400' : 'text-red-400'}`}>
                          {teoricoTotal > 0 ? `${((realTotal / teoricoTotal) * 100).toFixed(1)}%` : '-'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Items de Cashflow asociados - expandidos */}
                    {hasItems && expandedCuentas.has(cuenta.id) && (
                      <div className="bg-[#0d0d0d]">
                        {cuenta.cashflowItems!.map((item) => {
                          const teoricoItem = getTeoricoItem(cuenta.id, item.id)
                          const realItem = getRealItem(item)
                          
                          return (
                            <div 
                              key={item.id}
                              className="grid grid-cols-12 gap-2 p-2 pl-10 items-center hover:bg-white/5 border-l-2 border-green-500/30 ml-4"
                            >
                              <div className="col-span-4 flex items-center gap-2">
                                <Link className="w-3 h-3 text-green-400" />
                                <span className="text-gray-300 text-sm">{item.nombre}</span>
                              </div>
                              
                              {/* Teórico del item - editable */}
                              <div className="col-span-2 text-center">
                                <input
                                  type="number"
                                  value={teoricoItem || ''}
                                  onChange={(e) => {
                                    const newValues = { ...valoresTeoricosItems }
                                    newValues[`${cuenta.id}-${item.id}`] = Number(e.target.value) || 0
                                    setValoresTeoricosItems(newValues)
                                  }}
                                  onBlur={() => updateValor(cuenta.id, item.id, teoricoItem)}
                                  className="w-20 px-2 py-1 bg-transparent border border-white/10 rounded text-white text-sm text-center focus:outline-none focus:border-blue-500"
                                  placeholder="0"
                                />
                              </div>
                              
                              {/* Real del item - desde cashflow */}
                              <div className="col-span-2 text-center">
                                <span className="text-sm text-gray-400">
                                  {formatCurrency(realItem)}
                                </span>
                              </div>
                              
                              {/* Diferencia item */}
                              <div className="col-span-2 text-center">
                                <DiferenciaCell forecast={teoricoItem} real={realItem} small />
                              </div>
                              
                              {/* % Cumplimiento item */}
                              <div className="col-span-2 text-center">
                                <span className={`text-xs ${realItem >= teoricoItem ? 'text-green-400' : 'text-red-400'}`}>
                                  {teoricoItem > 0 ? `${((realItem / teoricoItem) * 100).toFixed(0)}%` : '-'}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                        
                        {/* Total de items */}
                        <div className="grid grid-cols-12 gap-2 p-2 pl-6 bg-[#1a1a1a] border-t border-white/10">
                          <div className="col-span-4 text-gray-400 text-sm font-medium">
                            Total {cuenta.nombre}
                          </div>
                          <div className="col-span-2 text-center text-blue-400 text-sm font-medium">
                            {formatCurrency(teoricoTotal)}
                          </div>
                          <div className="col-span-2 text-center text-white text-sm font-medium">
                            {formatCurrency(realTotal)}
                          </div>
                          <div className="col-span-2 text-center">
                            <DiferenciaCell forecast={teoricoTotal} real={realTotal} small />
                          </div>
                          <div className="col-span-2 text-center">
                            <span className={`text-xs font-medium ${realTotal >= teoricoTotal ? 'text-green-400' : 'text-red-400'}`}>
                              {teoricoTotal > 0 ? `${((realTotal / teoricoTotal) * 100).toFixed(0)}%` : '-'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
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

// Componente de diferencia
function DiferenciaCell({ forecast, real, small = false }: { forecast: number | null | undefined; real: number | null | undefined; small?: boolean }) {
  if (forecast === null || forecast === undefined || real === null || real === undefined) {
    return <span className={`text-gray-500 ${small ? 'text-xs' : 'text-sm'}`}>-</span>
  }
  
  const dif = real - forecast
  const pct = forecast > 0 ? ((dif / forecast) * 100).toFixed(1) : '0'
  
  return (
    <div className="flex flex-col items-center">
      <span className={`${small ? 'text-xs' : 'text-sm'} font-medium ${dif >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        {dif >= 0 ? '+' : ''}{dif.toLocaleString()}
      </span>
      {!small && (
        <span className={`text-xs ${dif >= 0 ? 'text-green-400/60' : 'text-red-400/60'}`}>
          ({dif >= 0 ? '+' : ''}{pct}%)
        </span>
      )}
    </div>
  )
}
