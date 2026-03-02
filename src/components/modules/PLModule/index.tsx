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
}

interface CuentaPL {
  id: string
  nivelId: string
  nombre: string
  orden: number
  esSubtotal: boolean
  esResultado: boolean
  nivel?: NivelPL
  valores: PLValor[]
  cashflowItems: CashflowItem[]
}

interface PLValor {
  id: string
  cuentaId: string
  periodo: string
  tipoVista: string
  forecastMonto: number | null
  realMonto: number | null
}

interface CashflowItem {
  id: string
  nombre: string
  categoria?: { nombre: string }
  registros: CashflowEntry[]
}

interface CashflowEntry {
  id: string
  mes: number
  anio: number
  monto: number
}

export function PLModule() {
  const { plFiltros, setPLFiltros } = useStore()
  const [niveles, setNiveles] = useState<NivelPL[]>([])
  const [cuentas, setCuentas] = useState<CuentaPL[]>([])
  const [valoresReales, setValoresReales] = useState<Record<string, number>>({})
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
  }, [plFiltros.periodo, plFiltros.tipoVista])

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

      // Si no hay datos, inicializar
      if (!nivelesData || nivelesData.length === 0) {
        await fetch('/api/pl/init', { method: 'POST' })
        setTimeout(() => fetchData(), 1000)
        return
      }

      setNiveles(Array.isArray(nivelesData) ? nivelesData : [])
      setCuentas(Array.isArray(cuentasData) ? cuentasData : [])
      setValoresReales(realesData && typeof realesData === 'object' && !realesData.error ? realesData : {})
    } catch (error) {
      console.error('Error fetching P&L data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateValor = async (cuentaId: string, value: number) => {
    try {
      await fetch('/api/pl/valores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cuentaId,
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
    if (value === null || value === undefined || value === 0) return '-'
    return `$${value.toLocaleString()}`
  }

  const getTeoricoCuenta = (cuenta: CuentaPL): number => {
    const valor = cuenta.valores?.find(v => 
      v.periodo === plFiltros.periodo && v.tipoVista === plFiltros.tipoVista
    )
    return valor?.forecastMonto || 0
  }

  const getRealCuenta = (cuentaId: string): number => {
    return valoresReales[cuentaId] || 0
  }

  const getRealItem = (item: CashflowItem): number => {
    const { mes, anio } = getMesAnio()
    return item.registros?.filter(r => r.mes === mes && r.anio === anio)
      .reduce((sum, r) => sum + (r.monto || 0), 0) || 0
  }

  const getTotalVentas = (tipo: 'teórico' | 'real'): number => {
    const vbNivel = niveles.find(n => n.codigo === 'VB')
    if (!vbNivel) return 0
    
    const cuentaVB = cuentas.find(c => c.nivelId === vbNivel.id)
    if (!cuentaVB) return 0
    
    return tipo === 'teórico' ? getTeoricoCuenta(cuentaVB) : getRealCuenta(cuentaVB.id)
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
          <strong>Teórico:</strong> Carga manual. <strong>Real:</strong> Desde Cashflow según asociaciones.
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 text-green-400 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm">Teórico</span>
          </div>
          <div className="text-2xl font-bold text-white">{formatCurrency(getTotalVentas('teórico'))}</div>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 text-green-400 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm">Real</span>
          </div>
          <div className="text-2xl font-bold text-white">{formatCurrency(getTotalVentas('real'))}</div>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <DollarSign className="w-5 h-5" />
            <span className="text-sm">Diferencia</span>
          </div>
          <div className={`text-2xl font-bold ${getTotalVentas('real') - getTotalVentas('teórico') >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(getTotalVentas('real') - getTotalVentas('teórico'))}
          </div>
        </div>
      </div>

      {/* Tabla P&L */}
      <div className="bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden">
        <div className="grid grid-cols-12 gap-2 p-3 bg-[#0d0d0d] border-b border-white/10 text-sm text-gray-400">
          <div className="col-span-4">Concepto</div>
          <div className="col-span-3 text-center">Teórico</div>
          <div className="col-span-3 text-center">Real</div>
          <div className="col-span-2 text-center">Diferencia</div>
        </div>

        {niveles.map((nivel) => {
          const cuentasNivel = cuentas.filter(c => c.nivelId === nivel.id)
          
          return (
            <div key={nivel.id} className="border-b border-white/10">
              <div className="p-3 bg-[#2d2d2d]">
                <h3 className="text-white font-semibold">{nivel.nombre}</h3>
              </div>
              
              {cuentasNivel.map((cuenta) => {
                const hasItems = cuenta.cashflowItems && cuenta.cashflowItems.length > 0
                const teorico = getTeoricoCuenta(cuenta)
                const real = getRealCuenta(cuenta.id)
                
                return (
                  <div key={cuenta.id}>
                    <div className={`grid grid-cols-12 gap-2 p-3 items-center hover:bg-white/5 ${cuenta.esResultado ? 'bg-green-500/10' : ''}`}>
                      <div className="col-span-4 flex items-center gap-2">
                        {hasItems && (
                          <button onClick={() => toggleCuenta(cuenta.id)} className="text-gray-400">
                            {expandedCuentas.has(cuenta.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        )}
                        <span className={cuenta.esResultado ? 'text-green-400 font-semibold' : 'text-white'}>
                          {cuenta.nombre}
                        </span>
                        {hasItems && <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">{cuenta.cashflowItems.length}</span>}
                      </div>
                      
                      <div className="col-span-3 text-center">
                        <input
                          type="number"
                          value={teorico || ''}
                          onChange={(e) => {
                            const newCuentas = cuentas.map(c => 
                              c.id === cuenta.id 
                                ? { ...c, valores: [{ ...c.valores[0], forecastMonto: Number(e.target.value) }] }
                                : c
                            )
                            setCuentas(newCuentas)
                          }}
                          onBlur={(e) => updateValor(cuenta.id, Number(e.target.value) || 0)}
                          className="w-24 px-2 py-1 bg-transparent border border-white/10 rounded text-white text-sm text-center focus:border-blue-500 focus:outline-none"
                          placeholder="0"
                        />
                      </div>
                      
                      <div className="col-span-3 text-center text-sm text-white">
                        {formatCurrency(real)}
                      </div>
                      
                      <div className="col-span-2 text-center">
                        <span className={`text-sm ${real >= teorico ? 'text-green-400' : 'text-red-400'}`}>
                          {real - teorico >= 0 ? '+' : ''}{real - teorico}
                        </span>
                      </div>
                    </div>
                    
                    {/* Items expandidos */}
                    {hasItems && expandedCuentas.has(cuenta.id) && (
                      <div className="bg-[#0d0d0d]">
                        {cuenta.cashflowItems.map((item) => {
                          const realItem = getRealItem(item)
                          return (
                            <div key={item.id} className="grid grid-cols-12 gap-2 p-2 pl-10 items-center border-l-2 border-green-500/30 ml-4">
                              <div className="col-span-4 flex items-center gap-2">
                                <Link className="w-3 h-3 text-green-400" />
                                <span className="text-gray-300 text-sm">{item.nombre}</span>
                              </div>
                              <div className="col-span-3 text-center text-sm text-gray-500">-</div>
                              <div className="col-span-3 text-center text-sm text-gray-400">{formatCurrency(realItem)}</div>
                              <div className="col-span-2"></div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
      
      <div className="text-center text-sm text-gray-500">
        Para crear/editar cuentas: <strong className="text-blue-400">Configuración → Plan de Cuentas</strong>
      </div>
    </div>
  )
}
