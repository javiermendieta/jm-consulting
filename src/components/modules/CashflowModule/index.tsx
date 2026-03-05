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
  ChevronRight,
  FileSpreadsheet
} from 'lucide-react'
import ExcelJS from 'exceljs'

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
  nivel?: {
    id: string
    nombre: string
    codigo: string
    orden: number
  }
}

interface NivelPL {
  id: string
  codigo: string
  nombre: string
  orden: number
}

const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']

type Vista = 'resumen' | 'item'

export function CashflowModule() {
  const { cashflowAnio, setCashflowAnio } = useStore()
  const [categorias, setCategorias] = useState<CashflowCategoria[]>([])
  const [nivelesPL, setNivelesPL] = useState<NivelPL[]>([])
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
  
  // Grupos expandidos (por nivelId)
  const [expandedNiveles, setExpandedNiveles] = useState<Set<string>>(new Set())
  
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
      const [categoriasRes, nivelesRes] = await Promise.all([
        fetch('/api/cashflow/categorias'),
        fetch('/api/pl/niveles')
      ])

      const categoriasData = await categoriasRes.json()
      const nivelesData = await nivelesRes.json()

      setCategorias(Array.isArray(categoriasData) ? categoriasData : [])
      setNivelesPL(Array.isArray(nivelesData) ? nivelesData : [])
      
      // Expandir todos los niveles por defecto
      if (Array.isArray(nivelesData)) {
        setExpandedNiveles(new Set(nivelesData.map((n: NivelPL) => n.id)))
      }
      
    } catch (error) {
      console.error('Error fetching cashflow data:', error)
      setCategorias([])
      setNivelesPL([])
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

  // === AGRUPACIÓN POR NIVEL P&L ===

  const getItemsPorNivel = (tipo: 'ingreso' | 'egreso'): Map<string, CashflowItem[]> => {
    // Obtener TODAS las categorías del tipo (no solo la primera)
    const categoriasDelTipo = categorias.filter(c => c.tipo === tipo)
    if (categoriasDelTipo.length === 0) return new Map()

    const itemsPorNivel = new Map<string, CashflowItem[]>()
    
    // Combinar items de todas las categorías del mismo tipo
    categoriasDelTipo.forEach(categoria => {
      categoria.items.forEach(item => {
        const nivelId = item.cuentaPL?.nivelId || 'sin-nivel'
        if (!itemsPorNivel.has(nivelId)) {
          itemsPorNivel.set(nivelId, [])
        }
        itemsPorNivel.get(nivelId)!.push(item)
      })
    })

    return itemsPorNivel
  }

  const getNivelInfo = (nivelId: string): NivelPL | undefined => {
    return nivelesPL.find(n => n.id === nivelId)
  }

  const toggleNivel = (nivelId: string) => {
    const newSet = new Set(expandedNiveles)
    if (newSet.has(nivelId)) {
      newSet.delete(nivelId)
    } else {
      newSet.add(nivelId)
    }
    setExpandedNiveles(newSet)
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

  // === EXPORTAR A EXCEL ===
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'JM Consulting'
    workbook.created = new Date()

    // ========== HOJA RESUMEN ==========
    const resumenSheet = workbook.addWorksheet('Resumen', { views: [{ state: 'frozen', ySplit: 3 }] })

    // Configurar columnas
    resumenSheet.columns = [
      { width: 30 },  // Item
      { width: 10 },  // % Ing
      ...MESES.map(() => ({ width: 12 })),  // 12 meses
      { width: 14 },  // Total
    ]

    // Título
    resumenSheet.mergeCells('A1:P1')
    const titleCell = resumenSheet.getCell('A1')
    titleCell.value = `Cash Flow - Año ${anio}`
    titleCell.font = { bold: true, size: 18, color: { argb: 'FFFFFFFF' } }
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a1a1a' } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    resumenSheet.getRow(1).height = 35

    // Cards de resumen
    const totalIngresos = getTotalIngresosAnual()
    const totalEgresos = categorias.filter(c => c.tipo === 'egreso').reduce((sum, c) => 
      sum + c.items.reduce((s, i) => s + getTotalItemAnual(i), 0), 0
    )
    const saldoAnual = MESES.reduce((sum, _, i) => sum + getSaldoMes(i + 1), 0)

    resumenSheet.mergeCells('A2:D2')
    resumenSheet.getCell('A2').value = `Ingresos: $${totalIngresos.toLocaleString()}`
    resumenSheet.getCell('A2').font = { bold: true, color: { argb: 'FF22C55E' } }
    resumenSheet.getCell('A2').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a1a1a' } }

    resumenSheet.mergeCells('E2:H2')
    resumenSheet.getCell('E2').value = `Egresos: $${totalEgresos.toLocaleString()}`
    resumenSheet.getCell('E2').font = { bold: true, color: { argb: 'FFEF4444' } }
    resumenSheet.getCell('E2').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a1a1a' } }

    resumenSheet.mergeCells('I2:L2')
    resumenSheet.getCell('I2').value = `Saldo: $${saldoAnual.toLocaleString()}`
    resumenSheet.getCell('I2').font = { bold: true, color: { argb: saldoAnual >= 0 ? 'FF22C55E' : 'FFEF4444' } }
    resumenSheet.getCell('I2').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a1a1a' } }

    resumenSheet.getRow(2).height = 25

    // Headers
    const headerRow = resumenSheet.addRow(['ITEM', '% ING', ...MESES, 'TOTAL'])
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0d0d0d' } }
    headerRow.alignment = { horizontal: 'center' }
    headerRow.height = 25

    // Helper para formatear moneda
    const fmtCurrency = (val: number): string => val === 0 ? '-' : `$${val.toLocaleString()}`
    const fmtPercent = (val: number): string => val === 0 ? '-' : `${val.toFixed(1)}%`

    // Función para agregar items de un tipo
    const agregarItems = (tipo: 'ingreso' | 'egreso') => {
      const itemsPorNivel = getItemsPorNivel(tipo)
      const colorTipo = tipo === 'ingreso' ? 'FF166534' : 'FF991B1B'  // Verde/Rojo
      const colorTexto = tipo === 'ingreso' ? 'FF22C55E' : 'FFEF4444'

      nivelesPL
        .filter(nivel => itemsPorNivel.has(nivel.id) && (tipo === 'ingreso' || nivel.codigo !== 'PF'))
        .forEach(nivel => {
          const items = itemsPorNivel.get(nivel.id) || []
          const totalNivel = items.reduce((s, i) => s + getTotalItemAnual(i), 0)
          const pctNivel = (totalNivel / totalIngresos) * 100

          // Fila de nivel
          const nivelRow = resumenSheet.addRow([
            `📁 ${nivel.nombre} (${items.length})`,
            fmtPercent(pctNivel),
            ...MESES.map((_, i) => fmtCurrency(items.reduce((s, item) => s + getTotalItemMes(item, i + 1), 0))),
            fmtCurrency(totalNivel)
          ])
          nivelRow.font = { bold: true, color: { argb: colorTexto } }
          nivelRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorTipo } }
          nivelRow.getCell(1).alignment = { horizontal: 'left' }
          for (let i = 2; i <= 15; i++) nivelRow.getCell(i).alignment = { horizontal: 'center' }

          // Items del nivel
          items.forEach(item => {
            const itemRow = resumenSheet.addRow([
              `   ${item.nombre}`,
              fmtPercent(getPorcentajeSobreIngresos(item)),
              ...MESES.map((_, i) => fmtCurrency(getTotalItemMes(item, i + 1))),
              fmtCurrency(getTotalItemAnual(item))
            ])
            itemRow.font = { color: { argb: 'FFFFFFFF' } }
            itemRow.getCell(1).alignment = { horizontal: 'left' }
            for (let i = 2; i <= 15; i++) itemRow.getCell(i).alignment = { horizontal: 'center' }
          })
        })
    }

    // Agregar Ingresos y Egresos
    agregarItems('ingreso')
    agregarItems('egreso')

    // Fila de SALDO
    const saldoRow = resumenSheet.addRow([
      '💰 SALDO',
      '',
      ...MESES.map((_, i) => fmtCurrency(getSaldoMes(i + 1))),
      fmtCurrency(saldoAnual)
    ])
    saldoRow.font = { bold: true, color: { argb: 'FF3B82F6' } }
    saldoRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } }
    saldoRow.getCell(1).alignment = { horizontal: 'left' }
    for (let i = 2; i <= 15; i++) saldoRow.getCell(i).alignment = { horizontal: 'center' }

    // Aplicar bordes
    resumenSheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF333333' } },
          left: { style: 'thin', color: { argb: 'FF333333' } },
          bottom: { style: 'thin', color: { argb: 'FF333333' } },
          right: { style: 'thin', color: { argb: 'FF333333' } }
        }
      })
    })

    // ========== HOJAS POR ITEM ==========
    const todosItems = categorias.flatMap(c => c.items)

    todosItems.forEach(item => {
      // Nombre de hoja válido (máx 31 caracteres, sin caracteres especiales)
      const sheetName = item.nombre.substring(0, 31).replace(/[\\/*?:[\]]/g, '')
      const itemSheet = workbook.addWorksheet(sheetName)

      // Columnas
      itemSheet.columns = [
        { width: 12 },  // Mes
        { width: 15 },  // Fecha
        { width: 35 },  // Observación
        { width: 15 },  // Monto
      ]

      // Título
      itemSheet.mergeCells('A1:D1')
      const itemTitle = itemSheet.getCell('A1')
      itemTitle.value = `${item.nombre} (${item.cuentaPL?.nombre || 'Sin cuenta'})`
      itemTitle.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }
      itemTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a1a1a' } }
      itemTitle.alignment = { horizontal: 'center' }
      itemSheet.getRow(1).height = 30

      // Headers
      const itemHeader = itemSheet.addRow(['MES', 'FECHA', 'OBSERVACIÓN', 'MONTO'])
      itemHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      itemHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0d0d0d' } }
      itemHeader.alignment = { horizontal: 'center' }

      // Registros agrupados por mes
      MESES.forEach((mesNombre, idx) => {
        const mesNum = idx + 1
        const registrosMes = item.registros?.filter(r => r.mes === mesNum && r.anio === anio) || []
        const totalMes = registrosMes.reduce((s, r) => s + (r.monto || 0), 0)

        // Fila de mes
        const mesRow = itemSheet.addRow([mesNombre, '', '', fmtCurrency(totalMes)])
        mesRow.font = { bold: true, color: { argb: 'FF3B82F6' } }
        mesRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } }

        // Registros del mes
        registrosMes.forEach(reg => {
          const fechaStr = reg.fecha ? new Date(reg.fecha).toLocaleDateString('es-AR') : '-'
          const regRow = itemSheet.addRow(['', fechaStr, reg.observacion || '', fmtCurrency(reg.monto)])
          regRow.font = { color: { argb: 'FFFFFFFF' } }
          regRow.getCell(4).alignment = { horizontal: 'right' }
        })
      })

      // Total anual
      const totalRow = itemSheet.addRow(['TOTAL', '', '', fmtCurrency(getTotalItemAnual(item))])
      totalRow.font = { bold: true, color: { argb: 'FF22C55E' } }
      totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF166534' } }

      // Bordes
      itemSheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF333333' } },
            left: { style: 'thin', color: { argb: 'FF333333' } },
            bottom: { style: 'thin', color: { argb: 'FF333333' } },
            right: { style: 'thin', color: { argb: 'FF333333' } }
          }
        })
      })
    })

    // Generar y descargar
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Cashflow_${anio}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Obtener todas las cuentas P&L para el selector
  const [cuentasPL, setCuentasPL] = useState<any[]>([])
  
  useEffect(() => {
    fetch('/api/pl/cuentas')
      .then(r => r.json())
      .then(data => setCuentasPL(Array.isArray(data) ? data : []))
      .catch(() => setCuentasPL([]))
  }, [])

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
              {vista === 'resumen' ? 'Flujo de caja agrupado por categorías P&L' : `Año ${anio}`}
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
            <>
              <button
                onClick={exportToExcel}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Exportar Excel
              </button>
              <button
                onClick={() => setShowNewItemModal(true)}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nuevo Item
              </button>
            </>
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

          {/* Tabla RESUMEN con agrupación por Nivel P&L */}
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
                {(filtroTipo === 'todos' || filtroTipo === 'ingreso') && (() => {
                  const itemsPorNivel = getItemsPorNivel('ingreso')
                  return nivelesPL
                    .filter(nivel => itemsPorNivel.has(nivel.id))
                    .map(nivel => {
                      const items = filtrarItems(itemsPorNivel.get(nivel.id) || [])
                      if (items.length === 0) return null
                      const isExpanded = expandedNiveles.has(nivel.id)
                      const totalNivel = items.reduce((s, i) => s + getTotalItemAnual(i), 0)
                      const pctNivel = (totalNivel / getTotalIngresosAnual()) * 100
                      
                      return (
                        <Fragment key={nivel.id}>
                          {/* Header del Nivel P&L */}
                          <tr 
                            className="bg-green-500/10 cursor-pointer hover:bg-green-500/20" 
                            onClick={() => toggleNivel(nivel.id)}
                          >
                            <td className="p-2 border-b border-white/10"></td>
                            <td className="p-2 font-bold text-green-400 border-b border-white/10">
                              <div className="flex items-center gap-2">
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                                <Folder className="w-4 h-4" />
                                <span>{nivel.nombre}</span>
                                <span className="text-xs text-gray-500">
                                  ({items.length} items)
                                </span>
                              </div>
                            </td>
                            <td className="p-2 text-center text-green-400 text-sm font-bold border-b border-white/10">
                              {formatPercent(pctNivel)}
                            </td>
                            {MESES.map((_, i) => (
                              <td key={i} className="p-2 text-center text-green-400 text-sm font-medium border-b border-white/10">
                                {formatCurrency(items.reduce((s, item) => s + getTotalItemMes(item, i + 1), 0))}
                              </td>
                            ))}
                            <td className="p-2 text-center text-green-400 font-bold border-b border-white/10">
                              {formatCurrency(totalNivel)}
                            </td>
                            <td className="p-2 border-b border-white/10"></td>
                          </tr>
                          
                          {/* Items del nivel */}
                          {isExpanded && items.map((item) => (
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
                      )
                    })
                })()}

                {/* EGRESOS */}
                {(filtroTipo === 'todos' || filtroTipo === 'egreso') && (() => {
                  const itemsPorNivel = getItemsPorNivel('egreso')
                  return nivelesPL
                    .filter(nivel => itemsPorNivel.has(nivel.id) && nivel.codigo !== 'PF') // Excluir PROFIT
                    .map(nivel => {
                      const items = filtrarItems(itemsPorNivel.get(nivel.id) || [])
                      if (items.length === 0) return null
                      const isExpanded = expandedNiveles.has(nivel.id)
                      const totalNivel = items.reduce((s, i) => s + getTotalItemAnual(i), 0)
                      
                      return (
                        <Fragment key={nivel.id}>
                          {/* Header del Nivel P&L */}
                          <tr 
                            className="bg-red-500/10 cursor-pointer hover:bg-red-500/20" 
                            onClick={() => toggleNivel(nivel.id)}
                          >
                            <td className="p-2 border-b border-white/10"></td>
                            <td className="p-2 font-bold text-red-400 border-b border-white/10">
                              <div className="flex items-center gap-2">
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                                <Folder className="w-4 h-4" />
                                <span>{nivel.nombre}</span>
                                <span className="text-xs text-gray-500">
                                  ({items.length} items)
                                </span>
                              </div>
                            </td>
                            <td className="p-2 text-center text-red-400 text-sm font-bold border-b border-white/10">
                              {formatPercent((totalNivel / getTotalIngresosAnual()) * 100)}
                            </td>
                            {MESES.map((_, i) => (
                              <td key={i} className="p-2 text-center text-red-400 text-sm font-medium border-b border-white/10">
                                {formatCurrency(items.reduce((s, item) => s + getTotalItemMes(item, i + 1), 0))}
                              </td>
                            ))}
                            <td className="p-2 text-center text-red-400 font-bold border-b border-white/10">
                              {formatCurrency(totalNivel)}
                            </td>
                            <td className="p-2 border-b border-white/10"></td>
                          </tr>
                          
                          {/* Items del nivel */}
                          {isExpanded && items.map((item) => (
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
                                </div>
                              </td>
                              <td 
                                className="p-2 text-center text-sm cursor-pointer"
                                onClick={() => { setVista('item'); setItemSeleccionado(item); }}
                              >
                                <span className={getPorcentajeSobreIngresos(item) > 10 ? 'text-red-400 font-medium' : 'text-gray-400'}>
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
                      )
                    })
                })()}

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
                  Categoría P&L <span className="text-red-400">*</span>
                </label>
                
                <select
                  value={newItemData.cuentaPLId}
                  onChange={(e) => setNewItemData(prev => ({ ...prev, cuentaPLId: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#2d2d2d] border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Seleccionar categoría P&L...</option>
                  
                  {/* Agrupar por nivel P&L */}
                  {nivelesPL.map(nivel => {
                    const cuentasDelNivel = cuentasPL.filter((c: any) => c.nivelId === nivel.id)
                    if (cuentasDelNivel.length === 0) return null
                    return (
                      <optgroup key={nivel.id} label={`${nivel.nombre}`}>
                        {cuentasDelNivel.map((cuenta: any) => (
                          <option key={cuenta.id} value={cuenta.id}>
                            {cuenta.nombre}
                          </option>
                        ))}
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
                  Categoría P&L <span className="text-red-400">*</span>
                </label>
                
                <select
                  value={editingItem.cuentaPLId || ''}
                  onChange={(e) => setEditingItem(prev => prev ? { ...prev, cuentaPLId: e.target.value } : null)}
                  className="w-full px-3 py-2 bg-[#2d2d2d] border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Seleccionar categoría P&L...</option>
                  
                  {nivelesPL.map(nivel => {
                    const cuentasDelNivel = cuentasPL.filter((c: any) => c.nivelId === nivel.id)
                    if (cuentasDelNivel.length === 0) return null
                    return (
                      <optgroup key={nivel.id} label={`${nivel.nombre}`}>
                        {cuentasDelNivel.map((cuenta: any) => (
                          <option key={cuenta.id} value={cuenta.id}>
                            {cuenta.nombre}
                          </option>
                        ))}
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
