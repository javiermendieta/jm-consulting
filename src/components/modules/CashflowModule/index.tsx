'use client'

import { useState, useEffect, Fragment } from 'react'
import { useStore } from '@/store/useStore'
import { 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  ChevronLeft,
  Link,
  AlertCircle,
  Save,
  Edit2,
  X,
  GripVertical,
  Search,
  Filter,
  Folder,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

interface CashflowCategoria {
  id: string
  nombre: string
  tipo: string
  orden: number
  items: CashflowItem[]
}

interface CashflowItem {
  id: string
  categoriaId: string
  nombre: string
  codigo: string | null
  cuentaPLId: string | null
  cuentaPL?: CuentaPLSimple
  orden: number
  registros?: CashflowEntry[]
}

interface CashflowEntry {
  id: string
  itemId: string
  fecha: string | null
  observacion: string | null
  mes: number
  anio: number
  monto: number
}

interface CuentaPLSimple {
  id: string
  nombre: string
  nivelId: string
  padreId: string | null
  nivel?: {
    id: string
    nombre: string
    codigo: string
  }
  padre?: {
    id: string
    nombre: string
    padreId: string | null
  }
}

interface GrupoPL {
  id: string
  nombre: string
  nivelId: string
  tipo: 'ingreso' | 'egreso'
  items: CashflowItem[]
}

const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']

type Vista = 'resumen' | 'item'

export function CashflowModule() {
  const { cashflowAnio, setCashflowAnio } = useStore()
  const [categorias, setCategorias] = useState<CashflowCategoria[]>([])
  const [cuentasPL, setCuentasPL] = useState<CuentaPLSimple[]>([])
  const [loading, setLoading] = useState(true)
  const [vista, setVista] = useState<Vista>('resumen')
  const [itemSeleccionado, setItemSeleccionado] = useState<CashflowItem | null>(null)
  const [registros, setRegistros] = useState<CashflowEntry[]>([])
  const [registrosOriginales, setRegistrosOriginales] = useState<CashflowEntry[]>([])
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Filtros
  const [filtroTexto, setFiltroTexto] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'ingreso' | 'egreso'>('todos')
  const [showFiltros, setShowFiltros] = useState(false)
  const [expandedGrupos, setExpandedGrupos] = useState<Set<string>>(new Set())
  
  // Drag and Drop
  const [draggedItem, setDraggedItem] = useState<CashflowItem | null>(null)
  const [dragOverItem, setDragOverItem] = useState<string | null>(null)
  
  // Modales
  const [showNewItemModal, setShowNewItemModal] = useState(false)
  const [showEditItemModal, setShowEditItemModal] = useState(false)
  const [editingItem, setEditingItem] = useState<CashflowItem | null>(null)
  const [newItemData, setNewItemData] = useState({ nombre: '', cuentaPLId: '', categoriaId: '' })

  const anio = cashflowAnio || new Date().getFullYear()

  useEffect(() => {
    fetchData()
  }, [anio])

  useEffect(() => {
    if (itemSeleccionado) {
      fetchRegistros(itemSeleccionado.id)
    }
  }, [itemSeleccionado, anio])

  useEffect(() => {
    if (JSON.stringify(registros) !== JSON.stringify(registrosOriginales)) {
      setHasChanges(true)
    } else {
      setHasChanges(false)
    }
  }, [registros, registrosOriginales])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [categoriasRes, cuentasRes] = await Promise.all([
        fetch('/api/cashflow/categorias'),
        fetch('/api/pl/cuentas')
      ])

      const categoriasData = await categoriasRes.json()
      const cuentasData = await cuentasRes.json()

      setCategorias(Array.isArray(categoriasData) ? categoriasData : [])
      
      // Procesar cuentas P&L
      const cuentasArray = Array.isArray(cuentasData) ? cuentasData : []
      setCuentasPL(cuentasArray.map((c: any) => ({
        id: c.id,
        nombre: c.nombre,
        nivelId: c.nivelId,
        padreId: c.padreId,
        nivel: c.nivel,
        padre: c.padre
      })))
      
      // Expandir todos los grupos por defecto
      const gruposIds = new Set<string>()
      cuentasArray.forEach((c: any) => {
        if (c.padreId) gruposIds.add(c.padreId)
      })
      setExpandedGrupos(gruposIds)
      
    } catch (error) {
      console.error('Error fetching cashflow data:', error)
      setCategorias([])
      setCuentasPL([])
    } finally {
      setLoading(false)
    }
  }

  const fetchRegistros = async (itemId: string) => {
    try {
      const res = await fetch(`/api/cashflow/entries?itemId=${itemId}&anio=${anio}`)
      const data = await res.json()
      setRegistros(data)
      setRegistrosOriginales(data)
      setHasChanges(false)
    } catch (error) {
      console.error('Error fetching registros:', error)
    }
  }

  // === CÁLCULOS ===

  const getTotalItemMes = (item: CashflowItem, mes: number): number => {
    const registrosDelMes = item.registros?.filter(r => r.mes === mes && r.anio === anio) || []
    return registrosDelMes.reduce((sum, r) => sum + (r.monto || 0), 0)
  }

  const getTotalItemAnual = (item: CashflowItem): number => {
    return MESES.reduce((sum, _, i) => sum + getTotalItemMes(item, i + 1), 0)
  }

  const getTotalIngresosAnual = (): number => {
    return categorias
      .filter(c => c.tipo === 'ingreso')
      .reduce((sum, cat) => sum + cat.items.reduce((s, i) => s + getTotalItemAnual(i), 0), 0)
  }

  const getTotalIngresosMes = (mes: number): number => {
    return categorias
      .filter(c => c.tipo === 'ingreso')
      .reduce((sum, cat) => sum + cat.items.reduce((s, i) => s + getTotalItemMes(i, mes), 0), 0)
  }

  const getPorcentajeSobreIngresos = (item: CashflowItem, mes?: number): number => {
    const totalIngresos = mes ? getTotalIngresosMes(mes) : getTotalIngresosAnual()
    if (totalIngresos === 0) return 0
    const montoItem = mes ? getTotalItemMes(item, mes) : getTotalItemAnual(item)
    return (montoItem / totalIngresos) * 100
  }

  const getSaldoMes = (mes: number): number => {
    const ingresos = categorias.filter(c => c.tipo === 'ingreso').reduce((sum, c) => 
      sum + c.items.reduce((s, i) => s + getTotalItemMes(i, mes), 0), 0
    )
    const egresos = categorias.filter(c => c.tipo === 'egreso').reduce((sum, c) => 
      sum + c.items.reduce((s, i) => s + getTotalItemMes(i, mes), 0), 0
    )
    return ingresos - egresos
  }

  const formatCurrency = (value: number) => {
    if (value === 0) return '-'
    return `$${value.toLocaleString()}`
  }

  const formatPercent = (value: number) => {
    if (value === 0) return '-'
    return `${value.toFixed(1)}%`
  }

  // === AGRUPACIÓN POR CUENTA P&L ===

  const getGrupoPL = (item: CashflowItem): { id: string; nombre: string; tipo: 'ingreso' | 'egreso' } | null => {
    if (!item.cuentaPL) return null
    
    // Si la cuenta tiene padre, usar el padre como grupo
    if (item.cuentaPL.padreId) {
      const padre = cuentasPL.find(c => c.id === item.cuentaPL!.padreId)
      if (padre) {
        return {
          id: padre.id,
          nombre: padre.nombre,
          tipo: 'egreso'
        }
      }
    }
    
    // Si no tiene padre, usar la cuenta misma
    const nivel = item.cuentaPL.nivel
    const esIngreso = nivel?.codigo === 'VB' || nivel?.nombre?.toLowerCase().includes('venta')
    
    return {
      id: item.cuentaPL.id,
      nombre: item.cuentaPL.nombre,
      tipo: esIngreso ? 'ingreso' : 'egreso'
    }
  }

  const getItemsAgrupados = (tipo: 'ingreso' | 'egreso'): GrupoPL[] => {
    const categoria = categorias.find(c => c.tipo === tipo)
    if (!categoria) return []

    const grupos: Map<string, GrupoPL> = new Map()
    const itemsSinGrupo: CashflowItem[] = []

    categoria.items.forEach(item => {
      const grupo = getGrupoPL(item)
      if (grupo) {
        if (!grupos.has(grupo.id)) {
          grupos.set(grupo.id, {
            id: grupo.id,
            nombre: grupo.nombre,
            nivelId: '',
            tipo: tipo,
            items: []
          })
        }
        grupos.get(grupo.id)!.items.push(item)
      } else {
        itemsSinGrupo.push(item)
      }
    })

    // Agregar items sin grupo a un grupo "Otros"
    if (itemsSinGrupo.length > 0) {
      grupos.set('sin-grupo-' + tipo, {
        id: 'sin-grupo-' + tipo,
        nombre: tipo === 'ingreso' ? 'Otros Ingresos' : 'Otros Gastos',
        nivelId: '',
        tipo: tipo,
        items: itemsSinGrupo
      })
    }

    return Array.from(grupos.values())
  }

  const toggleGrupo = (grupoId: string) => {
    const newSet = new Set(expandedGrupos)
    if (newSet.has(grupoId)) {
      newSet.delete(grupoId)
    } else {
      newSet.add(grupoId)
    }
    setExpandedGrupos(newSet)
  }

  // === FILTROS ===
  
  const filtrarItems = (items: CashflowItem[]): CashflowItem[] => {
    let filtrados = [...items]
    
    if (filtroTexto.trim()) {
      const texto = filtroTexto.toLowerCase()
      filtrados = filtrados.filter(item => 
        item.nombre.toLowerCase().includes(texto) ||
        item.cuentaPL?.nombre?.toLowerCase().includes(texto)
      )
    }
    
    return filtrados
  }

  // === DRAG AND DROP ===

  const handleDragStart = (e: React.DragEvent, item: CashflowItem) => {
    setDraggedItem(item)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', item.id)
  }

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedItem || draggedItem.id === targetId) return
    setDragOverItem(targetId)
  }

  const handleDragLeave = () => {
    setDragOverItem(null)
  }

  const handleDrop = async (e: React.DragEvent, targetItem: CashflowItem) => {
    e.preventDefault()
    
    if (!draggedItem || draggedItem.id === targetItem.id) {
      setDraggedItem(null)
      setDragOverItem(null)
      return
    }

    const nuevasCategorias = [...categorias]
    const categoriaOrigen = nuevasCategorias.find(c => c.id === draggedItem.categoriaId)
    const categoriaDestino = nuevasCategorias.find(c => c.id === targetItem.categoriaId)
    
    if (!categoriaOrigen || !categoriaDestino) return
    
    const itemIndex = categoriaOrigen.items.findIndex(i => i.id === draggedItem.id)
    if (itemIndex === -1) return
    const [itemMovido] = categoriaOrigen.items.splice(itemIndex, 1)
    
    const targetIndex = categoriaDestino.items.findIndex(i => i.id === targetItem.id)
    categoriaDestino.items.splice(targetIndex, 0, itemMovido)
    
    if (draggedItem.categoriaId !== targetItem.categoriaId) {
      itemMovido.categoriaId = targetItem.categoriaId
    }
    
    categoriaDestino.items.forEach((item, idx) => {
      item.orden = idx
    })
    
    setCategorias(nuevasCategorias)
    
    try {
      await fetch('/api/cashflow/items/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: categoriaDestino.items.map((item, idx) => ({
            id: item.id,
            orden: idx,
            categoriaId: item.categoriaId
          }))
        })
      })
    } catch (error) {
      console.error('Error reordering items:', error)
    }
    
    setDraggedItem(null)
    setDragOverItem(null)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDragOverItem(null)
  }

  // === CRUD ITEMS ===
  
  const createItem = async () => {
    if (!newItemData.nombre || !newItemData.cuentaPLId || !newItemData.categoriaId) {
      alert('Complete todos los campos')
      return
    }

    try {
      const res = await fetch('/api/cashflow/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItemData)
      })
      
      if (!res.ok) {
        const error = await res.json()
        alert(error.error || 'Error al crear item')
        return
      }

      setShowNewItemModal(false)
      setNewItemData({ nombre: '', cuentaPLId: '', categoriaId: '' })
      fetchData()
    } catch (error) {
      console.error('Error creating item:', error)
    }
  }

  const updateItem = async () => {
    if (!editingItem || !editingItem.nombre || !editingItem.cuentaPLId) {
      alert('Complete todos los campos')
      return
    }

    try {
      const res = await fetch('/api/cashflow/items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem)
      })
      
      if (!res.ok) {
        const error = await res.json()
        alert(error.error || 'Error al actualizar item')
        return
      }

      setShowEditItemModal(false)
      setEditingItem(null)
      fetchData()
    } catch (error) {
      console.error('Error updating item:', error)
    }
  }

  const deleteItem = async (id: string) => {
    if (!confirm('¿Eliminar este item y todos sus registros?')) return
    
    try {
      await fetch(`/api/cashflow/items?id=${id}`, { method: 'DELETE' })
      fetchData()
      if (itemSeleccionado?.id === id) {
        setItemSeleccionado(null)
        setVista('resumen')
      }
    } catch (error) {
      console.error('Error deleting item:', error)
    }
  }

  // === CRUD REGISTROS ===

  const addRegistro = (mes: number) => {
    const newEntry: CashflowEntry = {
      id: `temp-${Date.now()}`,
      itemId: itemSeleccionado?.id || '',
      fecha: null,
      observacion: '',
      mes,
      anio,
      monto: 0
    }
    setRegistros(prev => [...prev, newEntry])
  }

  const updateRegistroLocal = (id: string, field: string, value: any) => {
    setRegistros(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  const deleteRegistroLocal = (id: string) => {
    setRegistros(prev => prev.filter(r => r.id !== id))
  }

  const guardarCambios = async () => {
    if (!itemSeleccionado) return
    setSaving(true)

    try {
      const nuevos = registros.filter(r => r.id.startsWith('temp-'))
      const existentes = registros.filter(r => !r.id.startsWith('temp-'))
      const originalesIds = registrosOriginales.map(r => r.id)
      const eliminados = originalesIds.filter(id => !registros.find(r => r.id === id))

      for (const nuevo of nuevos) {
        await fetch('/api/cashflow/entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...nuevo,
            id: undefined,
            itemId: itemSeleccionado.id
          })
        })
      }

      for (const registro of existentes) {
        await fetch('/api/cashflow/entries', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(registro)
        })
      }

      for (const id of eliminados) {
        await fetch(`/api/cashflow/entries?id=${id}`, { method: 'DELETE' })
      }

      await fetchRegistros(itemSeleccionado.id)
      fetchData()
    } catch (error) {
      console.error('Error guardando cambios:', error)
      alert('Error al guardar los cambios')
    } finally {
      setSaving(false)
    }
  }

  const descartarCambios = () => {
    setRegistros(registrosOriginales)
    setHasChanges(false)
  }

  const getTotalMes = (mes: number): number => {
    return registros.filter(r => r.mes === mes && r.anio === anio).reduce((sum, r) => sum + (r.monto || 0), 0)
  }

  const getTotalAnual = (): number => {
    return MESES.reduce((sum, _, i) => sum + getTotalMes(i + 1), 0)
  }

  // Obtener cuentas P&L padre para el selector
  const cuentasPadre = cuentasPL.filter(c => !c.padreId)
  const cuentasHijas = cuentasPL.filter(c => c.padreId)

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
        <div className="flex items-center gap-4">
          {vista === 'item' && itemSeleccionado && (
            <button
              onClick={() => { 
                if (hasChanges && !confirm('Hay cambios sin guardar. ¿Descartar y volver?')) return
                setVista('resumen')
                setItemSeleccionado(null)
              }}
              className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-white">
              {vista === 'resumen' ? 'Cash Flow' : itemSeleccionado?.nombre}
            </h2>
            <p className="text-gray-400">
              {vista === 'resumen' ? 'Flujo de caja anual agrupado por P&L' : `Año ${anio}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={anio}
            onChange={(e) => setCashflowAnio(Number(e.target.value))}
            className="px-3 py-2 bg-[#2d2d2d] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          >
            {[2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          
          {vista === 'resumen' && (
            <button
              onClick={() => setShowFiltros(!showFiltros)}
              className={`p-2 rounded-lg ${showFiltros ? 'bg-blue-600 text-white' : 'bg-[#2d2d2d] text-gray-400 hover:text-white'}`}
              title="Filtros"
            >
              <Filter className="w-5 h-5" />
            </button>
          )}
          
          {vista === 'item' && hasChanges && (
            <>
              <button
                onClick={descartarCambios}
                className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Descartar
              </button>
              <button
                onClick={guardarCambios}
                disabled={saving}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </>
          )}
          
          {vista === 'resumen' && (
            <button
              onClick={() => setShowNewItemModal(true)}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nuevo Item
            </button>
          )}
        </div>
      </div>

      {/* Filtros expandidos */}
      {vista === 'resumen' && showFiltros && (
        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/10 flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o cuenta P&L..."
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#2d2d2d] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Tipo:</span>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value as any)}
              className="px-3 py-2 bg-[#2d2d2d] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="todos">Todos</option>
              <option value="ingreso">Ingresos</option>
              <option value="egreso">Egresos</option>
            </select>
          </div>
          {(filtroTexto || filtroTipo !== 'todos') && (
            <button
              onClick={() => { setFiltroTexto(''); setFiltroTipo('todos'); }}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Indicador de cambios pendientes */}
      {vista === 'item' && hasChanges && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-center gap-2">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
          <span className="text-yellow-400 text-sm">Tiene cambios sin guardar</span>
        </div>
      )}

      {/* Vista RESUMEN */}
      {vista === 'resumen' && (
        <>
          {/* Cards de resumen */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-green-400 mb-2">
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm font-medium">Total Ingresos</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(getTotalIngresosAnual())}
              </div>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-red-400 mb-2">
                <TrendingDown className="w-5 h-5" />
                <span className="text-sm font-medium">Total Egresos</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(categorias.filter(c => c.tipo === 'egreso').reduce((sum, c) => 
                  sum + c.items.reduce((s, i) => s + getTotalItemAnual(i), 0), 0
                ))}
              </div>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-blue-400 mb-2">
                <DollarSign className="w-5 h-5" />
                <span className="text-sm font-medium">Saldo</span>
              </div>
              <div className={`text-2xl font-bold ${MESES.reduce((sum, _, i) => sum + getSaldoMes(i + 1), 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(MESES.reduce((sum, _, i) => sum + getSaldoMes(i + 1), 0))}
              </div>
            </div>
          </div>

          {/* Tabla RESUMEN con agrupación por P&L */}
          <div className="bg-[#1a1a1a] rounded-xl border border-white/10 overflow-x-auto">
            <table className="w-full border-collapse min-w-[1400px]">
              <thead>
                <tr className="bg-[#0d0d0d] text-sm">
                  <th className="p-3 text-center text-gray-400 font-medium border-b border-white/10 w-10"></th>
                  <th className="p-3 text-left text-gray-400 font-medium border-b border-white/10 min-w-[200px]">ITEM</th>
                  <th className="p-3 text-center text-gray-400 font-medium border-b border-white/10 w-16">% ING</th>
                  {MESES.map((mes, i) => (
                    <th key={i} className="p-3 text-center text-gray-400 font-medium border-b border-white/10 min-w-[80px]">{mes}</th>
                  ))}
                  <th className="p-3 text-center text-gray-400 font-medium border-b border-white/10 min-w-[100px]">TOTAL</th>
                  <th className="p-3 text-center text-gray-400 font-medium border-b border-white/10 w-20">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {/* INGRESOS */}
                {(filtroTipo === 'todos' || filtroTipo === 'ingreso') && getItemsAgrupados('ingreso').map(grupo => (
                  <Fragment key={grupo.id}>
                    {/* Header Grupo P&L */}
                    <tr className="bg-green-500/10 cursor-pointer" onClick={() => toggleGrupo(grupo.id)}>
                      <td className="p-2 border-b border-white/10"></td>
                      <td className="p-2 font-bold text-green-400 border-b border-white/10 flex items-center gap-2">
                        {expandedGrupos.has(grupo.id) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        <Folder className="w-4 h-4" />
                        {grupo.nombre}
                        <span className="text-xs text-gray-500 ml-2">
                          ({grupo.items.length} items)
                        </span>
                      </td>
                      <td className="p-2 text-center text-green-400 text-sm font-bold border-b border-white/10">
                        {formatPercent(grupo.items.reduce((sum, i) => sum + getPorcentajeSobreIngresos(i), 0))}
                      </td>
                      {MESES.map((_, i) => (
                        <td key={i} className="p-2 text-center text-green-400 text-sm font-medium border-b border-white/10">
                          {formatCurrency(grupo.items.reduce((s, item) => s + getTotalItemMes(item, i + 1), 0))}
                        </td>
                      ))}
                      <td className="p-2 text-center text-green-400 font-bold border-b border-white/10">
                        {formatCurrency(grupo.items.reduce((s, i) => s + getTotalItemAnual(i), 0))}
                      </td>
                      <td className="p-2 border-b border-white/10"></td>
                    </tr>
                    
                    {/* Items del grupo */}
                    {expandedGrupos.has(grupo.id) && filtrarItems(grupo.items).map((item) => (
                      <tr 
                        key={item.id} 
                        className={`border-b border-white/5 group ${
                          draggedItem?.id === item.id ? 'opacity-50 bg-blue-500/10' : ''
                        } ${
                          dragOverItem === item.id ? 'bg-blue-500/20' : ''
                        }`}
                      >
                        <td 
                          className="p-2 text-center cursor-grab active:cursor-grabbing"
                          draggable
                          onDragStart={(e) => handleDragStart(e, item)}
                          onDragEnd={handleDragEnd}
                        >
                          <div className={`flex justify-center ${draggedItem?.id === item.id ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'}`}>
                            <GripVertical className="w-4 h-4" />
                          </div>
                        </td>
                        <td 
                          className="p-2 pl-8 cursor-pointer" 
                          onClick={() => { setVista('item'); setItemSeleccionado(item); }}
                          onDragOver={(e) => handleDragOver(e, item.id)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, item)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-white text-sm">{item.nombre}</span>
                            {item.cuentaPL && (
                              <span className="text-xs text-green-400/60 flex items-center gap-1">
                                <Link className="w-3 h-3" />
                                {item.cuentaPL.nombre}
                              </span>
                            )}
                          </div>
                        </td>
                        <td 
                          className="p-2 text-center text-sm text-gray-400 cursor-pointer"
                          onClick={() => { setVista('item'); setItemSeleccionado(item); }}
                        >
                          {formatPercent(getPorcentajeSobreIngresos(item))}
                        </td>
                        {MESES.map((_, i) => (
                          <td 
                            key={i} 
                            className="p-2 text-center text-sm text-white cursor-pointer" 
                            onClick={() => { setVista('item'); setItemSeleccionado(item); }}
                            onDragOver={(e) => handleDragOver(e, item.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, item)}
                          >
                            {formatCurrency(getTotalItemMes(item, i + 1))}
                          </td>
                        ))}
                        <td 
                          className="p-2 text-center text-sm font-bold text-white cursor-pointer" 
                          onClick={() => { setVista('item'); setItemSeleccionado(item); }}
                        >
                          {formatCurrency(getTotalItemAnual(item))}
                        </td>
                        <td className="p-2">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={(e) => { 
                                e.stopPropagation()
                                setEditingItem(item)
                                setShowEditItemModal(true)
                              }}
                              className="p-1.5 hover:bg-white/10 rounded text-blue-400 hover:text-blue-300"
                              title="Editar item"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                              className="p-1.5 hover:bg-white/10 rounded text-red-400 hover:text-red-300"
                              title="Eliminar item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}

                {/* EGRESOS */}
                {(filtroTipo === 'todos' || filtroTipo === 'egreso') && getItemsAgrupados('egreso').map(grupo => (
                  <Fragment key={grupo.id}>
                    {/* Header Grupo P&L */}
                    <tr className="bg-red-500/10 cursor-pointer" onClick={() => toggleGrupo(grupo.id)}>
                      <td className="p-2 border-b border-white/10"></td>
                      <td className="p-2 font-bold text-red-400 border-b border-white/10 flex items-center gap-2">
                        {expandedGrupos.has(grupo.id) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        <Folder className="w-4 h-4" />
                        {grupo.nombre}
                        <span className="text-xs text-gray-500 ml-2">
                          ({grupo.items.length} items)
                        </span>
                      </td>
                      <td className="p-2 text-center text-red-400 text-sm font-bold border-b border-white/10">
                        {formatPercent(grupo.items.reduce((sum, i) => sum + getPorcentajeSobreIngresos(i), 0))}
                      </td>
                      {MESES.map((_, i) => (
                        <td key={i} className="p-2 text-center text-red-400 text-sm font-medium border-b border-white/10">
                          {formatCurrency(grupo.items.reduce((s, item) => s + getTotalItemMes(item, i + 1), 0))}
                        </td>
                      ))}
                      <td className="p-2 text-center text-red-400 font-bold border-b border-white/10">
                        {formatCurrency(grupo.items.reduce((s, i) => s + getTotalItemAnual(i), 0))}
                      </td>
                      <td className="p-2 border-b border-white/10"></td>
                    </tr>
                    
                    {/* Items del grupo */}
                    {expandedGrupos.has(grupo.id) && filtrarItems(grupo.items).map((item) => (
                      <tr 
                        key={item.id} 
                        className={`border-b border-white/5 group ${
                          draggedItem?.id === item.id ? 'opacity-50 bg-blue-500/10' : ''
                        } ${
                          dragOverItem === item.id ? 'bg-blue-500/20' : ''
                        }`}
                      >
                        <td 
                          className="p-2 text-center cursor-grab active:cursor-grabbing"
                          draggable
                          onDragStart={(e) => handleDragStart(e, item)}
                          onDragEnd={handleDragEnd}
                        >
                          <div className={`flex justify-center ${draggedItem?.id === item.id ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'}`}>
                            <GripVertical className="w-4 h-4" />
                          </div>
                        </td>
                        <td 
                          className="p-2 pl-8 cursor-pointer" 
                          onClick={() => { setVista('item'); setItemSeleccionado(item); }}
                          onDragOver={(e) => handleDragOver(e, item.id)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, item)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-white text-sm">{item.nombre}</span>
                            {item.cuentaPL && (
                              <span className="text-xs text-red-400/60 flex items-center gap-1">
                                <Link className="w-3 h-3" />
                                {item.cuentaPL.nombre}
                              </span>
                            )}
                            {!item.cuentaPL && (
                              <span className="text-xs text-yellow-500 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Sin asociar
                              </span>
                            )}
                          </div>
                        </td>
                        <td 
                          className="p-2 text-center text-sm text-gray-400 cursor-pointer"
                          onClick={() => { setVista('item'); setItemSeleccionado(item); }}
                        >
                          <span className={getPorcentajeSobreIngresos(item) > 10 ? 'text-red-400 font-medium' : ''}>
                            {formatPercent(getPorcentajeSobreIngresos(item))}
                          </span>
                        </td>
                        {MESES.map((_, i) => (
                          <td 
                            key={i} 
                            className="p-2 text-center text-sm text-white cursor-pointer" 
                            onClick={() => { setVista('item'); setItemSeleccionado(item); }}
                            onDragOver={(e) => handleDragOver(e, item.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, item)}
                          >
                            {formatCurrency(getTotalItemMes(item, i + 1))}
                          </td>
                        ))}
                        <td 
                          className="p-2 text-center text-sm font-bold text-white cursor-pointer" 
                          onClick={() => { setVista('item'); setItemSeleccionado(item); }}
                        >
                          {formatCurrency(getTotalItemAnual(item))}
                        </td>
                        <td className="p-2">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={(e) => { 
                                e.stopPropagation()
                                setEditingItem(item)
                                setShowEditItemModal(true)
                              }}
                              className="p-1.5 hover:bg-white/10 rounded text-blue-400 hover:text-blue-300"
                              title="Editar item"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                              className="p-1.5 hover:bg-white/10 rounded text-red-400 hover:text-red-300"
                              title="Eliminar item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}

                {/* Fila de SALDO */}
                <tr className="bg-blue-500/10 font-bold">
                  <td className="p-3 border-t-2 border-white/20"></td>
                  <td className="p-3 text-blue-400 border-t-2 border-white/20">
                    <DollarSign className="inline w-4 h-4 mr-2" />
                    SALDO
                  </td>
                  <td className="p-3 border-t-2 border-white/20"></td>
                  {MESES.map((_, i) => {
                    const saldo = getSaldoMes(i + 1)
                    return (
                      <td key={i} className={`p-3 text-center text-sm border-t-2 border-white/20 ${saldo >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(saldo)}
                      </td>
                    )
                  })}
                  <td className={`p-3 text-center text-sm border-t-2 border-white/20 ${MESES.reduce((sum, _, i) => sum + getSaldoMes(i + 1), 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(MESES.reduce((sum, _, i) => sum + getSaldoMes(i + 1), 0))}
                  </td>
                  <td className="p-3 border-t-2 border-white/20"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Vista ITEM (detalle mensual) */}
      {vista === 'item' && itemSeleccionado && (
        <div className="space-y-4">
          <div className="bg-[#1a1a1a] rounded-xl border border-white/10 overflow-x-auto">
            <table className="w-full border-collapse min-w-[1400px]">
              <thead>
                <tr className="bg-[#0d0d0d] text-sm">
                  <th className="p-2 text-center text-gray-400 font-medium border-b border-white/10 w-28">FECHA</th>
                  <th className="p-2 text-left text-gray-400 font-medium border-b border-white/10 min-w-[150px]">OBSERVACIÓN</th>
                  {MESES.map((mes, i) => (
                    <th key={i} className="p-2 text-center text-gray-400 font-medium border-b border-white/10 w-24">
                      <div className="flex flex-col items-center">
                        <span>{mes}</span>
                        <button
                          onClick={() => addRegistro(i + 1)}
                          className="mt-1 text-blue-400 hover:text-blue-300 text-xs"
                          title="Agregar fila en este mes"
                        >
                          <Plus className="w-3 h-3 inline" />
                        </button>
                      </div>
                    </th>
                  ))}
                  <th className="p-2 text-center text-gray-400 font-medium border-b border-white/10 w-10">DEL</th>
                </tr>
              </thead>
              <tbody>
                {registros.length === 0 ? (
                  <tr className="border-b border-white/5">
                    <td colSpan={15} className="p-8 text-center text-gray-500">
                      No hay registros. Haga clic en <Plus className="w-3 h-3 inline mx-1" /> en el mes para agregar.
                    </td>
                  </tr>
                ) : (
                  [...registros]
                    .sort((a, b) => {
                      if (a.mes !== b.mes) return a.mes - b.mes
                      if (!a.fecha && !b.fecha) return 0
                      if (!a.fecha) return 1
                      if (!b.fecha) return -1
                      return new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
                    })
                    .map((registro) => (
                      <tr key={registro.id} className="border-b border-white/5 hover:bg-white/5 group">
                        <td className="p-1 text-center">
                          <input
                            type="date"
                            value={registro.fecha ? new Date(registro.fecha).toISOString().split('T')[0] : ''}
                            onChange={(e) => updateRegistroLocal(registro.id, 'fecha', e.target.value || null)}
                            className="w-full px-2 py-1.5 bg-[#2d2d2d] border border-white/10 rounded text-white text-xs text-center focus:outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="p-1">
                          <input
                            type="text"
                            value={registro.observacion || ''}
                            onChange={(e) => updateRegistroLocal(registro.id, 'observacion', e.target.value)}
                            placeholder="Descripción..."
                            className="w-full px-2 py-1.5 bg-[#2d2d2d] border border-white/10 rounded text-white text-xs focus:outline-none focus:border-blue-500"
                          />
                        </td>
                        {MESES.map((_, i) => (
                          <td key={i} className={`p-1 text-center ${i + 1 === registro.mes ? 'bg-blue-500/10' : ''}`}>
                            {i + 1 === registro.mes ? (
                              <input
                                type="number"
                                value={registro.monto || ''}
                                onChange={(e) => updateRegistroLocal(registro.id, 'monto', Number(e.target.value) || 0)}
                                className="w-full px-2 py-1.5 bg-[#2d2d2d] border border-blue-500/30 rounded text-white text-xs text-right focus:outline-none focus:border-blue-500"
                                placeholder="$0"
                              />
                            ) : (
                              <span className="text-gray-700 text-xs">-</span>
                            )}
                          </td>
                        ))}
                        <td className="p-1 text-center">
                          <button
                            onClick={() => deleteRegistroLocal(registro.id)}
                            className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Eliminar fila"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                )}

                <tr className="bg-blue-500/20 font-bold border-t-2 border-blue-500/30">
                  <td className="p-2 text-blue-300 text-sm" colSpan={2}>
                    SUBTOTAL
                  </td>
                  {MESES.map((_, i) => (
                    <td key={i} className={`p-2 text-center text-sm ${getTotalMes(i + 1) > 0 ? 'text-white' : 'text-gray-500'}`}>
                      {getTotalMes(i + 1) > 0 ? `$${getTotalMes(i + 1).toLocaleString()}` : '-'}
                    </td>
                  ))}
                  <td className="p-2"></td>
                </tr>

                <tr className="bg-green-500/20 font-bold border-t border-white/10">
                  <td className="p-3 text-green-300 text-sm" colSpan={2}>
                    TOTAL ANUAL
                  </td>
                  <td className="p-3 text-center text-lg text-white" colSpan={12}>
                    $ {getTotalAnual().toLocaleString()}
                  </td>
                  <td className="p-3"></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="text-xs text-gray-500 flex items-center gap-4">
            <span>💡 Haga clic en <Plus className="w-3 h-3 inline" /> en la columna del mes para agregar una nueva fila</span>
            <span>• Los cambios se guardan con el botón <Save className="w-3 h-3 inline" /> Guardar</span>
          </div>
        </div>
      )}

      {/* Modal para crear nuevo item */}
      {showNewItemModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] rounded-xl p-6 w-full max-w-md border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">Nuevo Item de Cash Flow</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Categoría</label>
                <select
                  value={newItemData.categoriaId}
                  onChange={(e) => setNewItemData(prev => ({ ...prev, categoriaId: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#2d2d2d] border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Seleccionar categoría...</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.tipo === 'ingreso' ? '📈 ' : '📉 '}{cat.nombre}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nombre del Item</label>
                <input
                  type="text"
                  value={newItemData.nombre}
                  onChange={(e) => setNewItemData(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: ALQUILER, SUELDO, LUZ..."
                  className="w-full px-3 py-2 bg-[#2d2d2d] border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Asociar a Cuenta P&L <span className="text-red-400">*</span>
                </label>
                
                <select
                  value={newItemData.cuentaPLId}
                  onChange={(e) => setNewItemData(prev => ({ ...prev, cuentaPLId: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#2d2d2d] border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Seleccionar cuenta P&L...</option>
                  
                  {/* Agrupar por cuentas padre */}
                  {cuentasPadre.map(padre => {
                    const hijas = cuentasHijas.filter(c => c.padreId === padre.id)
                    return (
                      <optgroup key={padre.id} label={`📁 ${padre.nombre}`}>
                        {hijas.length > 0 ? hijas.map(cuenta => (
                          <option key={cuenta.id} value={cuenta.id}>
                            {cuenta.nombre}
                          </option>
                        )) : (
                          <option key={padre.id} value={padre.id}>
                            {padre.nombre}
                          </option>
                        )}
                      </optgroup>
                    )
                  })}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowNewItemModal(false); setNewItemData({ nombre: '', cuentaPLId: '', categoriaId: '' }); }}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={createItem}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Crear Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar item */}
      {showEditItemModal && editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] rounded-xl p-6 w-full max-w-md border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">Editar Item</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nombre del Item</label>
                <input
                  type="text"
                  value={editingItem.nombre}
                  onChange={(e) => setEditingItem(prev => prev ? { ...prev, nombre: e.target.value } : null)}
                  className="w-full px-3 py-2 bg-[#2d2d2d] border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Asociar a Cuenta P&L <span className="text-red-400">*</span>
                </label>
                
                <select
                  value={editingItem.cuentaPLId || ''}
                  onChange={(e) => setEditingItem(prev => prev ? { ...prev, cuentaPLId: e.target.value } : null)}
                  className="w-full px-3 py-2 bg-[#2d2d2d] border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Seleccionar cuenta P&L...</option>
                  
                  {cuentasPadre.map(padre => {
                    const hijas = cuentasHijas.filter(c => c.padreId === padre.id)
                    return (
                      <optgroup key={padre.id} label={`📁 ${padre.nombre}`}>
                        {hijas.length > 0 ? hijas.map(cuenta => (
                          <option key={cuenta.id} value={cuenta.id}>
                            {cuenta.nombre}
                          </option>
                        )) : (
                          <option key={padre.id} value={padre.id}>
                            {padre.nombre}
                          </option>
                        )}
                      </optgroup>
                    )
                  })}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowEditItemModal(false); setEditingItem(null); }}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={updateItem}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
