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
  Link,
  Calculator,
  Percent,
  ArrowDown
} from 'lucide-react'

interface NivelPL {
  id: string
  codigo: string
  nombre: string
  orden: number
}

interface CuentaPL {
  id: string
  nivelId: string
  nombre: string
  orden: number
  esSubtotal: boolean
  esResultado: boolean
  nivel?: NivelPL
  cashflowItems: CashflowItem[]
}

interface CashflowItem {
  id: string
  nombre: string
  categoria?: { nombre: string; tipo: string }
  registros: CashflowEntry[]
}

interface CashflowEntry {
  id: string
  mes: number
  anio: number
  monto: number
}

// Niveles que se cargan manualmente
const NIVELES_MANUALES = ['VB', 'CV', 'CMV', 'GO']
// Niveles que se calculan automáticamente
const NIVELES_CALCULADOS = ['VN', 'CM', 'PF']

export function PLModule() {
  const { plFiltros, setPLFiltros } = useStore()
  const [niveles, setNiveles] = useState<NivelPL[]>([])
  const [cuentas, setCuentas] = useState<CuentaPL[]>([])
  const [valoresReales, setValoresReales] = useState<Record<string, number>>({})
  const [forecastsItems, setForecastsItems] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [expandedCuentas, setExpandedCuentas] = useState<Set<string>>(new Set())

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
  }, [plFiltros.periodo])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { mes, anio } = getMesAnio()
      
      // Fetch niveles
      const nivelesRes = await fetch('/api/pl/niveles')
      const nivelesData = await nivelesRes.json()
      
      // Fetch cuentas con items
      const cuentasRes = await fetch('/api/pl/cuentas')
      const cuentasData = await cuentasRes.json()
      
      // Fetch valores reales
      const realesRes = await fetch(`/api/pl/reales?mes=${mes}&anio=${anio}`)
      const realesData = await realesRes.json()
      
      // Fetch forecasts de items
      const forecastsRes = await fetch(`/api/pl/item-forecast?periodo=${plFiltros.periodo}`)
      const forecastsData = await forecastsRes.json()

      // Si no hay datos, inicializar
      if (!nivelesData || nivelesData.length === 0) {
        await fetch('/api/pl/init', { method: 'POST' })
        setTimeout(() => fetchData(), 1000)
        return
      }

      setNiveles(Array.isArray(nivelesData) ? nivelesData : [])
      setCuentas(Array.isArray(cuentasData) ? cuentasData : [])
      setValoresReales(realesData && typeof realesData === 'object' && !realesData.error ? realesData : {})
      setForecastsItems(forecastsData && typeof forecastsData === 'object' ? forecastsData : {})
    } catch (error) {
      console.error('Error fetching P&L data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Guardar forecast de un item
  const saveItemForecast = async (itemId: string, value: number) => {
    try {
      await fetch('/api/pl/item-forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          periodo: plFiltros.periodo,
          forecastMonto: value
        })
      })
    } catch (error) {
      console.error('Error saving forecast:', error)
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
    if (value === null || value === undefined || value === 0) return '-'
    return `$${value.toLocaleString()}`
  }

  const formatPercent = (value: number | null | undefined, total: number) => {
    if (value === null || value === undefined || value === 0 || total === 0) return '-'
    const percent = (value / total) * 100
    return `${percent.toFixed(1)}%`
  }

  // Calcular teórico de cuenta sumando forecasts de items
  const getTeoricoCuenta = (cuenta: CuentaPL): number => {
    if (!cuenta.cashflowItems || cuenta.cashflowItems.length === 0) return 0
    return cuenta.cashflowItems.reduce((sum, item) => sum + (forecastsItems[item.id] || 0), 0)
  }

  const getRealCuenta = (cuentaId: string): number => {
    return valoresReales[cuentaId] || 0
  }

  const getRealItem = (item: CashflowItem): number => {
    const { mes, anio } = getMesAnio()
    return item.registros?.filter(r => r.mes === mes && r.anio === anio)
      .reduce((sum, r) => sum + (r.monto || 0), 0) || 0
  }

  // Obtener total de un nivel por código (teórico)
  const getTotalNivelByCodigo = (codigo: string): number => {
    const nivel = niveles.find(n => n.codigo === codigo)
    if (!nivel) return 0
    const cuentasNivel = cuentas.filter(c => c.nivelId === nivel.id)
    return cuentasNivel.reduce((sum, cuenta) => sum + getTeoricoCuenta(cuenta), 0)
  }

  // Obtener total de un nivel por código (real)
  const getTotalNivelRealByCodigo = (codigo: string): number => {
    const nivel = niveles.find(n => n.codigo === codigo)
    if (!nivel) return 0
    const cuentasNivel = cuentas.filter(c => c.nivelId === nivel.id)
    return cuentasNivel.reduce((sum, cuenta) => sum + getRealCuenta(cuenta.id), 0)
  }

  // Calcular valores automáticos TEÓRICOS
  const getCalculadoTeorico = (codigo: string): number => {
    const vb = getTotalNivelByCodigo('VB')
    const cv = getTotalNivelByCodigo('CV')
    const cmv = getTotalNivelByCodigo('CMV')
    const go = getTotalNivelByCodigo('GO')

    switch (codigo) {
      case 'VN':
        return vb - cv  // Venta Neta = Venta Bruta - Costo de Venta
      case 'CM':
        return (vb - cv) - cmv  // Contribución Marginal = Venta Neta - CMV
      case 'PF':
        return ((vb - cv) - cmv) - go  // Profit = CM - Gastos Operativos
      default:
        return 0
    }
  }

  // Calcular valores automáticos REALES
  const getCalculadoReal = (codigo: string): number => {
    const vb = getTotalNivelRealByCodigo('VB')
    const cv = getTotalNivelRealByCodigo('CV')
    const cmv = getTotalNivelRealByCodigo('CMV')
    const go = getTotalNivelRealByCodigo('GO')

    switch (codigo) {
      case 'VN':
        return vb - cv  // Venta Neta = Venta Bruta - Costo de Venta
      case 'CM':
        return (vb - cv) - cmv  // Contribución Marginal = Venta Neta - CMV
      case 'PF':
        return ((vb - cv) - cmv) - go  // Profit = CM - Gastos Operativos
      default:
        return 0
    }
  }

  // Total de ventas para porcentajes
  const totalVentasTeorico = getTotalNivelByCodigo('VB')
  const totalVentasReal = getTotalNivelRealByCodigo('VB')

  // Total por nivel (considerando si es calculado o manual)
  const getTotalNivel = (nivelId: string, tipo: 'teórico' | 'real'): number => {
    const nivel = niveles.find(n => n.id === nivelId)
    if (!nivel) return 0

    if (NIVELES_CALCULADOS.includes(nivel.codigo)) {
      return tipo === 'teórico' ? getCalculadoTeorico(nivel.codigo) : getCalculadoReal(nivel.codigo)
    }

    const cuentasNivel = cuentas.filter(c => c.nivelId === nivelId)
    return cuentasNivel.reduce((sum, cuenta) => {
      return sum + (tipo === 'teórico' ? getTeoricoCuenta(cuenta) : getRealCuenta(cuenta.id))
    }, 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // Cálculos para cards de resumen
  const ventaNetaTeorico = getCalculadoTeorico('VN')
  const ventaNetaReal = getCalculadoReal('VN')
  const contribMarginalTeorico = getCalculadoTeorico('CM')
  const contribMarginalReal = getCalculadoReal('CM')
  const profitTeorico = getCalculadoTeorico('PF')
  const profitReal = getCalculadoReal('PF')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Estado de Resultados (P&L)</h2>
          <p className="text-gray-400">Carga el teórico por item · Cálculos automáticos · % sobre ventas</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={plFiltros.periodo}
            onChange={(e) => setPLFiltros({ periodo: e.target.value })}
            className="px-3 py-2 bg-[#2d2d2d] border border-white/10 rounded-lg text-white text-sm"
          >
            {Array.from({ length: 12 }, (_, i) => {
              const date = new Date()
              date.setMonth(date.getMonth() - i)
              const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
              const label = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
              return <option key={value} value={value}>{label}</option>
            })}
          </select>
          <button onClick={fetchData} className="p-2 bg-[#2d2d2d] hover:bg-[#3d3d3d] rounded-lg text-gray-400">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex items-center gap-3">
        <Info className="w-5 h-5 text-blue-400" />
        <div className="text-sm text-blue-300">
          <strong>Cálculos automáticos:</strong> Venta Neta = VB - CV | Contrib. Marginal = VN - CMV | Profit = CM - GO
        </div>
      </div>

      {/* Cards de Resumen */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <DollarSign className="w-5 h-5" />
            <span className="text-sm">Venta Neta</span>
          </div>
          <div className="text-xl font-bold text-white">{formatCurrency(ventaNetaTeorico)}</div>
          <div className="text-sm text-gray-400">Real: {formatCurrency(ventaNetaReal)}</div>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 text-purple-400 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm">Contrib. Marginal</span>
          </div>
          <div className="text-xl font-bold text-white">{formatCurrency(contribMarginalTeorico)}</div>
          <div className="text-sm text-gray-400">Real: {formatCurrency(contribMarginalReal)}</div>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 text-green-400 mb-2">
            <Calculator className="w-5 h-5" />
            <span className="text-sm">Profit</span>
          </div>
          <div className={`text-xl font-bold ${profitTeorico >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(profitTeorico)}
          </div>
          <div className={`text-sm ${profitReal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            Real: {formatCurrency(profitReal)}
          </div>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 text-yellow-400 mb-2">
            <Percent className="w-5 h-5" />
            <span className="text-sm">Margen Profit</span>
          </div>
          <div className={`text-xl font-bold ${profitTeorico >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalVentasTeorico > 0 ? `${((profitTeorico / totalVentasTeorico) * 100).toFixed(1)}%` : '-'}
          </div>
          <div className="text-sm text-gray-400">
            Real: {totalVentasReal > 0 ? `${((profitReal / totalVentasReal) * 100).toFixed(1)}%` : '-'}
          </div>
        </div>
      </div>

      {/* Tabla P&L */}
      <div className="bg-[#1a1a1a] rounded-xl border border-white/10 overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Header */}
          <div className="grid grid-cols-14 gap-1 p-3 bg-[#0d0d0d] border-b border-white/10 text-xs text-gray-400 font-medium">
            <div className="col-span-4">Concepto</div>
            <div className="col-span-2 text-center text-blue-400">Teórico</div>
            <div className="col-span-1 text-center text-blue-400">% T</div>
            <div className="col-span-2 text-center text-green-400">Real</div>
            <div className="col-span-1 text-center text-green-400">% R</div>
            <div className="col-span-2 text-center text-yellow-400">Diferencia</div>
            <div className="col-span-2 text-center text-purple-400">% Cumpl.</div>
          </div>

          {niveles.map((nivel) => {
            const esCalculado = NIVELES_CALCULADOS.includes(nivel.codigo)
            const cuentasNivel = cuentas.filter(c => c.nivelId === nivel.id)
            const totalNivelTeorico = getTotalNivel(nivel.id, 'teórico')
            const totalNivelReal = getTotalNivel(nivel.id, 'real')
            
            // Determinar colores especiales por tipo
            const getNivelColor = () => {
              if (nivel.codigo === 'PF') return 'bg-green-500/20 border-green-500/30'
              if (nivel.codigo === 'VN' || nivel.codigo === 'CM') return 'bg-purple-500/10 border-purple-500/20'
              return 'bg-[#2d2d2d]'
            }

            const getNivelTextStyle = () => {
              if (nivel.codigo === 'PF') return 'text-green-400'
              if (nivel.codigo === 'VN' || nivel.codigo === 'CM') return 'text-purple-400'
              return 'text-white'
            }
            
            return (
              <div key={nivel.id} className="border-b border-white/10">
                {/* Header del Nivel con total */}
                <div className={`grid grid-cols-14 gap-1 p-3 ${getNivelColor()} items-center`}>
                  <div className="col-span-4 flex items-center gap-2">
                    {esCalculado && <Calculator className="w-4 h-4 text-yellow-400" />}
                    <h3 className={`font-semibold ${getNivelTextStyle()}`}>
                      {nivel.nombre}
                    </h3>
                    {esCalculado && (
                      <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">AUTO</span>
                    )}
                  </div>
                  <div className="col-span-2 text-center text-blue-400 font-bold">
                    {formatCurrency(totalNivelTeorico)}
                  </div>
                  <div className="col-span-1 text-center text-blue-400 font-bold text-sm">
                    {formatPercent(totalNivelTeorico, totalVentasTeorico)}
                  </div>
                  <div className="col-span-2 text-center text-green-400 font-bold">
                    {formatCurrency(totalNivelReal)}
                  </div>
                  <div className="col-span-1 text-center text-green-400 font-bold text-sm">
                    {formatPercent(totalNivelReal, totalVentasReal)}
                  </div>
                  <div className="col-span-2 text-center">
                    <span className={`font-bold ${totalNivelReal >= totalNivelTeorico ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(totalNivelReal - totalNivelTeorico)}
                    </span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className={`font-bold ${totalNivelReal >= totalNivelTeorico ? 'text-green-400' : 'text-red-400'}`}>
                      {totalNivelTeorico !== 0 ? `${((totalNivelReal / totalNivelTeorico) * 100).toFixed(0)}%` : '-'}
                    </span>
                  </div>
                </div>
                
                {/* Si es nivel calculado, mostrar fórmula */}
                {esCalculado && (
                  <div className="px-4 py-2 bg-yellow-500/5 border-b border-white/5">
                    <div className="flex items-center gap-2 text-xs text-yellow-300">
                      <ArrowDown className="w-3 h-3" />
                      {nivel.codigo === 'VN' && 'Venta Bruta - Costo de Venta'}
                      {nivel.codigo === 'CM' && 'Venta Neta - CMV'}
                      {nivel.codigo === 'PF' && 'Contribución Marginal - Gastos Operativos'}
                    </div>
                  </div>
                )}
                
                {/* Cuentas del nivel (solo si no es calculado) */}
                {!esCalculado && cuentasNivel.map((cuenta) => {
                  const hasItems = cuenta.cashflowItems && cuenta.cashflowItems.length > 0
                  const teoricoTotal = getTeoricoCuenta(cuenta)
                  const realTotal = getRealCuenta(cuenta.id)
                  
                  return (
                    <div key={cuenta.id}>
                      {/* Fila de cuenta */}
                      <div 
                        className={`grid grid-cols-14 gap-1 p-3 items-center hover:bg-white/5 cursor-pointer`}
                        onClick={() => hasItems && toggleCuenta(cuenta.id)}
                      >
                        <div className="col-span-4 flex items-center gap-2">
                          {hasItems && (
                            <span className="text-gray-400">
                              {expandedCuentas.has(cuenta.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </span>
                          )}
                          <span className={`text-white ${hasItems ? '' : 'ml-6'}`}>
                            {cuenta.nombre}
                          </span>
                          {hasItems && <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">{cuenta.cashflowItems.length}</span>}
                        </div>
                        
                        <div className="col-span-2 text-center">
                          <span className="text-blue-400 font-medium">{formatCurrency(teoricoTotal)}</span>
                        </div>
                        
                        <div className="col-span-1 text-center">
                          <span className="text-blue-300 text-sm">{formatPercent(teoricoTotal, totalVentasTeorico)}</span>
                        </div>
                        
                        <div className="col-span-2 text-center text-white">
                          {formatCurrency(realTotal)}
                        </div>
                        
                        <div className="col-span-1 text-center">
                          <span className="text-green-300 text-sm">{formatPercent(realTotal, totalVentasReal)}</span>
                        </div>
                        
                        <div className="col-span-2 text-center">
                          <span className={`text-sm ${realTotal >= teoricoTotal ? 'text-green-400' : 'text-red-400'}`}>
                            {realTotal - teoricoTotal >= 0 ? '+' : ''}{formatCurrency(realTotal - teoricoTotal)}
                          </span>
                        </div>
                        
                        <div className="col-span-2 text-center">
                          <span className={`text-sm ${realTotal >= teoricoTotal ? 'text-green-400' : 'text-red-400'}`}>
                            {teoricoTotal > 0 ? `${((realTotal / teoricoTotal) * 100).toFixed(0)}%` : '-'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Items expandidos */}
                      {hasItems && expandedCuentas.has(cuenta.id) && (
                        <div className="bg-[#0d0d0d]">
                          {cuenta.cashflowItems.map((item) => {
                            const teoricoItem = forecastsItems[item.id] || 0
                            const realItem = getRealItem(item)
                            
                            return (
                              <div key={item.id} className="grid grid-cols-14 gap-1 p-2 pl-12 items-center border-l-2 border-blue-500/30 hover:bg-white/5">
                                <div className="col-span-4 flex items-center gap-2">
                                  <Link className="w-3 h-3 text-blue-400" />
                                  <span className="text-gray-300 text-sm">{item.nombre}</span>
                                </div>
                                
                                {/* Teórico del item - EDITABLE */}
                                <div className="col-span-2 text-center">
                                  <input
                                    type="number"
                                    value={teoricoItem || ''}
                                    onChange={(e) => {
                                      const newForecasts = { ...forecastsItems }
                                      newForecasts[item.id] = Number(e.target.value) || 0
                                      setForecastsItems(newForecasts)
                                    }}
                                    onBlur={(e) => saveItemForecast(item.id, Number(e.target.value) || 0)}
                                    className="w-20 px-2 py-1 bg-[#1a1a1a] border border-blue-500/50 rounded text-white text-sm text-center focus:border-blue-500 focus:outline-none"
                                    placeholder="0"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                                
                                {/* % Teórico del item */}
                                <div className="col-span-1 text-center">
                                  <span className="text-blue-300 text-xs">{formatPercent(teoricoItem, totalVentasTeorico)}</span>
                                </div>
                                
                                {/* Real del item */}
                                <div className="col-span-2 text-center text-sm text-gray-400">
                                  {formatCurrency(realItem)}
                                </div>
                                
                                {/* % Real del item */}
                                <div className="col-span-1 text-center">
                                  <span className="text-green-300 text-xs">{formatPercent(realItem, totalVentasReal)}</span>
                                </div>
                                
                                {/* Diferencia item */}
                                <div className="col-span-2 text-center">
                                  <span className={`text-xs ${realItem >= teoricoItem ? 'text-green-400' : 'text-red-400'}`}>
                                    {formatCurrency(realItem - teoricoItem)}
                                  </span>
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
                          
                          {/* Total de la cuenta */}
                          <div className="grid grid-cols-14 gap-1 p-2 pl-8 bg-[#1a1a1a] border-t border-white/10">
                            <div className="col-span-4 flex items-center gap-2">
                              <Calculator className="w-4 h-4 text-blue-400" />
                              <span className="text-blue-400 text-sm font-medium">TOTAL {cuenta.nombre}</span>
                            </div>
                            <div className="col-span-2 text-center text-blue-400 font-medium">{formatCurrency(teoricoTotal)}</div>
                            <div className="col-span-1 text-center text-blue-300 text-sm font-medium">{formatPercent(teoricoTotal, totalVentasTeorico)}</div>
                            <div className="col-span-2 text-center text-white font-medium">{formatCurrency(realTotal)}</div>
                            <div className="col-span-1 text-center text-green-300 text-sm font-medium">{formatPercent(realTotal, totalVentasReal)}</div>
                            <div className="col-span-2 text-center">
                              <span className={`text-sm font-medium ${realTotal >= teoricoTotal ? 'text-green-400' : 'text-red-400'}`}>
                                {formatCurrency(realTotal - teoricoTotal)}
                              </span>
                            </div>
                            <div className="col-span-2 text-center">
                              <span className={`text-sm font-medium ${realTotal >= teoricoTotal ? 'text-green-400' : 'text-red-400'}`}>
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
      </div>
      
      <div className="text-center text-sm text-gray-500">
        Para asociar items a cuentas: <strong className="text-blue-400">Configuración → Plan de Cuentas</strong>
      </div>
    </div>
  )
}
