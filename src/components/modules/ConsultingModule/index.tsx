'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { 
  Plus, 
  Calendar, 
  DollarSign,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Trash2,
  Edit3,
  Briefcase,
  X
} from 'lucide-react'

interface Proyecto {
  id: string
  nombre: string
  cliente: string
  fechaInicio: string
  fechaFin: string
  estado: string
  valorContrato: number
  fases: Fase[]
  entregables: Entregable[]
  pendientes: PendienteCliente[]
}

interface Fase {
  id: string
  nombre: string
  orden: number
  estado: string
  semanas: Semana[]
}

interface Semana {
  id: string
  numero: number
  estado: string
  tareas: Tarea[]
}

interface Tarea {
  id: string
  titulo: string
  descripcion?: string
  estado: string
  prioridad: string
  responsable?: string
}

interface Entregable {
  id: string
  nombre: string
  tipo: string
  estado: string
  fechaEntrega?: string
  semanaId?: string
  semana?: {
    id: string
    numero: number
    fase?: {
      id: string
      nombre: string
    }
  }
}

interface PendienteCliente {
  id: string
  descripcion: string
  estado: string
  prioridad: string
  fechaLimite?: string
  responsable?: string
  notas?: string
}



const ESTADOS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_progreso', label: 'En Progreso' },
  { value: 'completado', label: 'Completado' }
]

const ESTADOS_PROYECTO = [
  { value: 'activo', label: 'Activo' },
  { value: 'pausado', label: 'Pausado' },
  { value: 'completado', label: 'Completado' },
  { value: 'cancelado', label: 'Cancelado' }
]

const TIPOS_ENTREGABLE = [
  { value: 'documento', label: 'Documento' },
  { value: 'presentacion', label: 'Presentación' },
  { value: 'reporte', label: 'Reporte' },
  { value: 'plantilla', label: 'Plantilla' },
  { value: 'otro', label: 'Otro' }
]

const PRIORIDADES = [
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' }
]

export function ConsultingModule() {
  const { proyectoSeleccionado, setProyectoSeleccionado } = useStore()
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewProject, setShowNewProject] = useState(false)
  const [showEditProject, setShowEditProject] = useState(false)
  const [editingProject, setEditingProject] = useState<Proyecto | null>(null)
  const [expandedFase, setExpandedFase] = useState<string | null>(null)
  const [expandedSemana, setExpandedSemana] = useState<string | null>(null)

  // Modales para tareas y entregables
  const [showNuevaTarea, setShowNuevaTarea] = useState<string | null>(null)
  const [showEditarTarea, setShowEditarTarea] = useState<Tarea | null>(null)
  const [showNuevoEntregable, setShowNuevoEntregable] = useState(false)
  const [showEditarEntregable, setShowEditarEntregable] = useState<Entregable | null>(null)

  // Modales para pendientes del cliente
  const [showNuevoPendiente, setShowNuevoPendiente] = useState(false)
  const [showEditarPendiente, setShowEditarPendiente] = useState<PendienteCliente | null>(null)

  // Filtro de entregables por semana
  const [filtroSemana, setFiltroSemana] = useState<string>('todas')


  // Form state
  const [newProject, setNewProject] = useState({
    nombre: '',
    cliente: '',
    fechaInicio: '',
    fechaFin: '',
    valorContrato: 0
  })

  const [editProject, setEditProject] = useState({
    id: '',
    nombre: '',
    cliente: '',
    fechaInicio: '',
    fechaFin: '',
    estado: 'activo',
    valorContrato: 0
  })

  const [tareaForm, setTareaForm] = useState({
    titulo: '',
    descripcion: '',
    estado: 'pendiente',
    prioridad: 'media',
    responsable: ''
  })

  const [entregableForm, setEntregableForm] = useState({
    nombre: '',
    tipo: 'documento',
    estado: 'pendiente',
    fechaEntrega: '',
    semanaId: ''
  })

  const [pendienteForm, setPendienteForm] = useState({
    descripcion: '',
    estado: 'pendiente',
    prioridad: 'media',
    fechaLimite: '',
    responsable: '',
    notas: ''
  })


  useEffect(() => {
    fetchProyectos()
  }, [])

  const fetchProyectos = async () => {
    try {
      const res = await fetch('/api/consulting/proyectos')
      const data = await res.json()
      setProyectos(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching proyectos:', error)
    } finally {
      setLoading(false)
    }
  }

  const createProyecto = async () => {
    if (!newProject.nombre.trim() || !newProject.cliente.trim()) {
      alert('Por favor complete el nombre y cliente')
      return
    }
    if (!newProject.fechaInicio || !newProject.fechaFin) {
      alert('Por favor complete las fechas de inicio y fin')
      return
    }
    
    try {
      const res = await fetch('/api/consulting/proyectos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject)
      })
      
      if (!res.ok) {
        const error = await res.json()
        alert(error.error || 'Error al crear proyecto')
        return
      }
      
      const proyecto = await res.json()
      setProyectos([proyecto, ...proyectos])
      setShowNewProject(false)
      setNewProject({ nombre: '', cliente: '', fechaInicio: '', fechaFin: '', valorContrato: 0 })
    } catch (error) {
      console.error('Error creating proyecto:', error)
      alert('Error de conexión al crear proyecto')
    }
  }

  const updateProyecto = async () => {
    if (!editProject.nombre.trim() || !editProject.cliente.trim()) {
      alert('Por favor complete el nombre y cliente')
      return
    }
    
    try {
      const res = await fetch('/api/consulting/proyectos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editProject)
      })
      
      if (!res.ok) {
        const error = await res.json()
        alert(error.error || 'Error al actualizar proyecto')
        return
      }
      
      const proyectoActualizado = await res.json()
      setProyectos(proyectos.map(p => p.id === proyectoActualizado.id ? proyectoActualizado : p))
      setShowEditProject(false)
      setEditingProject(null)
    } catch (error) {
      console.error('Error updating proyecto:', error)
      alert('Error de conexión al actualizar proyecto')
    }
  }

  const deleteProyecto = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este proyecto? Se eliminarán todas las fases, semanas y tareas asociadas.')) {
      return
    }
    
    try {
      const res = await fetch(`/api/consulting/proyectos?id=${id}`, {
        method: 'DELETE'
      })
      
      if (!res.ok) {
        const error = await res.json()
        alert(error.error || 'Error al eliminar proyecto')
        return
      }
      
      setProyectos(proyectos.filter(p => p.id !== id))
    } catch (error) {
      console.error('Error deleting proyecto:', error)
      alert('Error de conexión al eliminar proyecto')
    }
  }

  const openEditModal = (proyecto: Proyecto) => {
    setEditingProject(proyecto)
    setEditProject({
      id: proyecto.id,
      nombre: proyecto.nombre,
      cliente: proyecto.cliente,
      fechaInicio: proyecto.fechaInicio ? proyecto.fechaInicio.split('T')[0] : '',
      fechaFin: proyecto.fechaFin ? proyecto.fechaFin.split('T')[0] : '',
      estado: proyecto.estado,
      valorContrato: proyecto.valorContrato
    })
    setShowEditProject(true)
  }

  // === SEMANAS ===
  const addSemana = async (faseId: string) => {
    try {
      const res = await fetch('/api/consulting/semanas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faseId })
      })
      
      if (!res.ok) {
        alert('Error al crear semana')
        return
      }
      
      fetchProyectos()
    } catch (error) {
      console.error('Error adding semana:', error)
    }
  }

  const updateFaseEstado = async (faseId: string, estado: string) => {
    try {
      await fetch('/api/consulting/fases', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: faseId, estado })
      })
      fetchProyectos()
    } catch (error) {
      console.error('Error updating fase:', error)
    }
  }

  const deleteSemana = async (semanaId: string) => {
    if (!confirm('¿Eliminar esta semana y todas sus tareas?')) return
    
    try {
      await fetch(`/api/consulting/semanas?id=${semanaId}`, { method: 'DELETE' })
      fetchProyectos()
    } catch (error) {
      console.error('Error deleting semana:', error)
    }
  }

  // === TAREAS ===
  const createTarea = async (semanaId: string) => {
    if (!tareaForm.titulo.trim()) {
      alert('El título es requerido')
      return
    }
    
    try {
      const res = await fetch('/api/consulting/tareas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...tareaForm, semanaId })
      })
      
      if (!res.ok) {
        alert('Error al crear tarea')
        return
      }
      
      setShowNuevaTarea(null)
      setTareaForm({ titulo: '', descripcion: '', estado: 'pendiente', prioridad: 'media', responsable: '' })
      fetchProyectos()
    } catch (error) {
      console.error('Error creating tarea:', error)
    }
  }

  const updateTarea = async () => {
    if (!showEditarTarea || !tareaForm.titulo.trim()) {
      alert('El título es requerido')
      return
    }
    
    try {
      const res = await fetch('/api/consulting/tareas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: showEditarTarea.id, ...tareaForm })
      })
      
      if (!res.ok) {
        alert('Error al actualizar tarea')
        return
      }
      
      setShowEditarTarea(null)
      setTareaForm({ titulo: '', descripcion: '', estado: 'pendiente', prioridad: 'media', responsable: '' })
      fetchProyectos()
    } catch (error) {
      console.error('Error updating tarea:', error)
    }
  }

  const deleteTarea = async (tareaId: string) => {
    if (!confirm('¿Eliminar esta tarea?')) return
    
    try {
      await fetch(`/api/consulting/tareas?id=${tareaId}`, { method: 'DELETE' })
      fetchProyectos()
    } catch (error) {
      console.error('Error deleting tarea:', error)
    }
  }

  const openEditTarea = (tarea: Tarea) => {
    setShowEditarTarea(tarea)
    setTareaForm({
      titulo: tarea.titulo,
      descripcion: tarea.descripcion || '',
      estado: tarea.estado,
      prioridad: tarea.prioridad,
      responsable: tarea.responsable || ''
    })
  }

  const updateTareaEstado = async (tareaId: string, estado: string) => {
    try {
      await fetch('/api/consulting/tareas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tareaId, estado })
      })
      fetchProyectos()
    } catch (error) {
      console.error('Error updating tarea estado:', error)
    }
  }

  // === ENTREGABLES ===
  const createEntregable = async (proyectoId: string) => {
    if (!entregableForm.nombre.trim()) {
      alert('El nombre es requerido')
      return
    }
    
    try {
      const res = await fetch('/api/consulting/entregables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...entregableForm, proyectoId })
      })
      
      if (!res.ok) {
        alert('Error al crear entregable')
        return
      }
      
      setShowNuevoEntregable(false)
      setEntregableForm({ nombre: '', tipo: 'documento', estado: 'pendiente', fechaEntrega: '', semanaId: '' })
      fetchProyectos()
    } catch (error) {
      console.error('Error creating entregable:', error)
    }
  }

  const updateEntregable = async () => {
    if (!showEditarEntregable || !entregableForm.nombre.trim()) {
      alert('El nombre es requerido')
      return
    }
    
    try {
      const res = await fetch('/api/consulting/entregables', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: showEditarEntregable.id, ...entregableForm })
      })
      
      if (!res.ok) {
        alert('Error al actualizar entregable')
        return
      }
      
      setShowEditarEntregable(null)
      setEntregableForm({ nombre: '', tipo: 'documento', estado: 'pendiente', fechaEntrega: '', semanaId: '' })
      fetchProyectos()
    } catch (error) {
      console.error('Error updating entregable:', error)
    }
  }

  const deleteEntregable = async (entregableId: string) => {
    if (!confirm('¿Eliminar este entregable?')) return
    
    try {
      await fetch(`/api/consulting/entregables?id=${entregableId}`, { method: 'DELETE' })
      fetchProyectos()
    } catch (error) {
      console.error('Error deleting entregable:', error)
    }
  }

  const openEditEntregable = (entregable: Entregable) => {
    setShowEditarEntregable(entregable)
    setEntregableForm({
      nombre: entregable.nombre,
      tipo: entregable.tipo,
      estado: entregable.estado,
      fechaEntrega: entregable.fechaEntrega ? entregable.fechaEntrega.split('T')[0] : '',
      semanaId: entregable.semanaId || ''
    })
  }

  // Helper para obtener todas las semanas del proyecto
  const getSemanasProyecto = (proyecto: Proyecto) => {
    const semanas: { id: string; numero: number; faseNombre: string }[] = []
    proyecto.fases.forEach(fase => {
      fase.semanas.forEach(semana => {
        semanas.push({
          id: semana.id,
          numero: semana.numero,
          faseNombre: fase.nombre
        })
      })
    })
    return semanas
  }

  // === PENDIENTES DEL CLIENTE ===
  const createPendiente = async (proyectoId: string) => {
    if (!pendienteForm.descripcion.trim()) {
      alert('La descripción es requerida')
      return
    }
    
    try {
      const res = await fetch('/api/consulting/pendientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...pendienteForm, proyectoId })
      })
      
      if (!res.ok) {
        alert('Error al crear pendiente')
        return
      }
      
      setShowNuevoPendiente(false)
      setPendienteForm({ descripcion: '', estado: 'pendiente', prioridad: 'media', fechaLimite: '', responsable: '', notas: '' })
      fetchProyectos()
    } catch (error) {
      console.error('Error creating pendiente:', error)
    }
  }

  const updatePendiente = async () => {
    if (!showEditarPendiente || !pendienteForm.descripcion.trim()) {
      alert('La descripción es requerida')
      return
    }
    
    try {
      const res = await fetch('/api/consulting/pendientes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: showEditarPendiente.id, ...pendienteForm })
      })
      
      if (!res.ok) {
        alert('Error al actualizar pendiente')
        return
      }
      
      setShowEditarPendiente(null)
      setPendienteForm({ descripcion: '', estado: 'pendiente', prioridad: 'media', fechaLimite: '', responsable: '', notas: '' })
      fetchProyectos()
    } catch (error) {
      console.error('Error updating pendiente:', error)
    }
  }

  const deletePendiente = async (pendienteId: string) => {
    if (!confirm('¿Eliminar este pendiente?')) return
    
    try {
      await fetch(`/api/consulting/pendientes?id=${pendienteId}`, { method: 'DELETE' })
      fetchProyectos()
    } catch (error) {
      console.error('Error deleting pendiente:', error)
    }
  }

  const openEditPendiente = (pendiente: PendienteCliente) => {
    setShowEditarPendiente(pendiente)
    setPendienteForm({
      descripcion: pendiente.descripcion,
      estado: pendiente.estado,
      prioridad: pendiente.prioridad,
      fechaLimite: pendiente.fechaLimite ? pendiente.fechaLimite.split('T')[0] : '',
      responsable: pendiente.responsable || '',
      notas: pendiente.notas || ''
    })
  }

  const updatePendienteEstado = async (pendienteId: string, estado: string) => {
    try {
      await fetch('/api/consulting/pendientes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pendienteId, estado })
      })
      fetchProyectos()
    } catch (error) {
      console.error('Error updating pendiente estado:', error)
    }
  }

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'completado': return <CheckCircle2 className="w-4 h-4 text-green-400" />
      case 'en_progreso': return <Clock className="w-4 h-4 text-blue-400" />
      default: return <AlertCircle className="w-4 h-4 text-yellow-400" />
    }
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activo':
      case 'completado': return 'bg-green-500/20 text-green-400'
      case 'pausado': return 'bg-yellow-500/20 text-yellow-400'
      case 'cancelado': return 'bg-red-500/20 text-red-400'
      case 'en_progreso': return 'bg-blue-500/20 text-blue-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // Vista de detalle de proyecto
  if (proyectoSeleccionado) {
    const proyecto = proyectos.find(p => p.id === proyectoSeleccionado.id)
    if (!proyecto) return null

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button 
              onClick={() => setProyectoSeleccionado(null)}
              className="text-blue-400 hover:text-blue-300 text-sm mb-2 flex items-center gap-1"
            >
              ← Volver a proyectos
            </button>
            <h2 className="text-2xl font-bold text-white">{proyecto.nombre}</h2>
            <p className="text-gray-400">{proyecto.cliente}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm ${getEstadoColor(proyecto.estado)}`}>
              {proyecto.estado}
            </span>
            <button
              onClick={() => openEditModal(proyecto)}
              className="p-2 bg-[#2d2d2d] hover:bg-[#3d3d3d] rounded-lg text-gray-400 hover:text-white"
              title="Editar proyecto"
            >
              <Edit3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => deleteProyecto(proyecto.id)}
              className="p-2 bg-[#2d2d2d] hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400"
              title="Eliminar proyecto"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <div className="text-right">
              <p className="text-sm text-gray-400">Valor contrato</p>
              <p className="text-xl font-bold text-white">${proyecto.valorContrato.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Timeline de Fases */}
        <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Timeline de Fases</h3>
          <div className="space-y-4">
            {proyecto.fases.map((fase) => (
              <div key={fase.id} className="border border-white/10 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedFase(expandedFase === fase.id ? null : fase.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    {expandedFase === fase.id ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                    {getStatusIcon(fase.estado)}
                    <span className="text-white font-medium">{fase.nombre}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={fase.estado}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => updateFaseEstado(fase.id, e.target.value)}
                      className={`px-2 py-1 rounded text-xs ${getEstadoColor(fase.estado)}`}
                    >
                      {ESTADOS.map(e => (
                        <option key={e.value} value={e.value}>{e.label}</option>
                      ))}
                    </select>
                  </div>
                </button>
                
                {expandedFase === fase.id && (
                  <div className="border-t border-white/10 p-4 bg-[#0d0d0d]">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-400">Semanas</h4>
                      <button
                        onClick={() => addSemana(fase.id)}
                        className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs"
                      >
                        <Plus className="w-3 h-3" />
                        Agregar Semana
                      </button>
                    </div>
                    <div className="space-y-2">
                      {fase.semanas.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-2">No hay semanas creadas</p>
                      ) : (
                        fase.semanas.map((semana) => (
                          <div key={semana.id} className="border border-white/10 rounded-lg overflow-hidden">
                            <div 
                              className="w-full flex items-center justify-between p-3 hover:bg-white/5 cursor-pointer"
                              onClick={() => setExpandedSemana(expandedSemana === semana.id ? null : semana.id)}
                            >
                              <div className="flex items-center gap-2">
                                {expandedSemana === semana.id ? (
                                  <ChevronDown className="w-4 h-4 text-gray-400" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-400" />
                                )}
                                {getStatusIcon(semana.estado)}
                                <span className="text-white">Semana {semana.numero}</span>
                                <span className="text-gray-400 text-sm">({semana.tareas.length} tareas)</span>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteSemana(semana.id) }}
                                className="p-1 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                            
                            {expandedSemana === semana.id && (
                              <div className="border-t border-white/10 p-3 bg-[#1a1a1a]" onClick={(e) => e.stopPropagation()}>
                                <div className="space-y-2 mb-3">
                                  {semana.tareas.length === 0 ? (
                                    <p className="text-gray-500 text-sm text-center py-2">No hay tareas</p>
                                  ) : (
                                    semana.tareas.map((tarea) => (
                                      <div key={tarea.id} className="flex items-center justify-between p-2 bg-[#0d0d0d] rounded">
                                        <div className="flex items-center gap-2 flex-1">
                                          <select
                                            value={tarea.estado}
                                            onChange={(e) => updateTareaEstado(tarea.id, e.target.value)}
                                            className={`px-1 py-0.5 rounded text-xs ${getEstadoColor(tarea.estado)}`}
                                          >
                                            {ESTADOS.map(e => (
                                              <option key={e.value} value={e.value}>{e.label}</option>
                                            ))}
                                          </select>
                                          <span className="text-white text-sm">{tarea.titulo}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className={`px-2 py-0.5 rounded text-xs ${
                                            tarea.prioridad === 'alta' ? 'bg-red-500/20 text-red-400' :
                                            tarea.prioridad === 'media' ? 'bg-yellow-500/20 text-yellow-400' :
                                            'bg-green-500/20 text-green-400'
                                          }`}>
                                            {tarea.prioridad}
                                          </span>
                                          <button
                                            onClick={() => openEditTarea(tarea)}
                                            className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-blue-400"
                                          >
                                            <Edit3 className="w-3 h-3" />
                                          </button>
                                          <button
                                            onClick={() => deleteTarea(tarea.id)}
                                            className="p-1 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                                <button
                                  onClick={() => {
                                    setShowNuevaTarea(semana.id)
                                    setTareaForm({ titulo: '', descripcion: '', estado: 'pendiente', prioridad: 'media', responsable: '' })
                                  }}
                                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-blue-400 text-sm"
                                >
                                  <Plus className="w-4 h-4" />
                                  Nueva Tarea
                                </button>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Entregables */}
        <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold text-white">Entregables</h3>
              <select
                value={filtroSemana}
                onChange={(e) => setFiltroSemana(e.target.value)}
                className="px-3 py-1 bg-[#0d0d0d] border border-white/10 rounded-lg text-white text-sm"
              >
                <option value="todas">Todas las semanas</option>
                {getSemanasProyecto(proyecto).map(s => (
                  <option key={s.id} value={s.id}>{s.faseNombre} - Semana {s.numero}</option>
                ))}
              </select>
            </div>
            <button 
              onClick={() => {
                setShowNuevoEntregable(true)
                setEntregableForm({ nombre: '', tipo: 'documento', estado: 'pendiente', fechaEntrega: '', semanaId: '' })
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm"
            >
              <Plus className="w-4 h-4" />
              Nuevo
            </button>
          </div>
          <div className="space-y-2">
            {proyecto.entregables.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay entregables</p>
            ) : (
              proyecto.entregables
                .filter(e => filtroSemana === 'todas' || e.semanaId === filtroSemana)
                .map((entregable) => (
                <div key={entregable.id} className="flex items-center justify-between p-3 bg-[#0d0d0d] rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-400" />
                    <span className="text-white">{entregable.nombre}</span>
                    <span className="text-xs text-gray-400 uppercase">{entregable.tipo}</span>
                    {entregable.semana && (
                      <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                        {entregable.semana.fase?.nombre} - Semana {entregable.semana.numero}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${getEstadoColor(entregable.estado)}`}>
                      {entregable.estado}
                    </span>
                    <button
                      onClick={() => openEditEntregable(entregable)}
                      className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-blue-400"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteEntregable(entregable.id)}
                      className="p-1 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pendientes del Cliente */}
        <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Pendientes del Cliente</h3>
            <button 
              onClick={() => {
                setShowNuevoPendiente(true)
                setPendienteForm({ descripcion: '', estado: 'pendiente', prioridad: 'media', fechaLimite: '', responsable: '', notas: '' })
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm"
            >
              <Plus className="w-4 h-4" />
              Nuevo
            </button>
          </div>
          <div className="space-y-2">
            {proyecto.pendientes.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay pendientes del cliente</p>
            ) : (
              proyecto.pendientes.map((pendiente) => (
                <div key={pendiente.id} className="flex items-center justify-between p-3 bg-[#0d0d0d] rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <select
                      value={pendiente.estado}
                      onChange={(e) => updatePendienteEstado(pendiente.id, e.target.value)}
                      className={`px-2 py-1 rounded text-xs ${getEstadoColor(pendiente.estado)}`}
                    >
                      {ESTADOS.map(e => (
                        <option key={e.value} value={e.value}>{e.label}</option>
                      ))}
                    </select>
                    <span className="text-white">{pendiente.descripcion}</span>
                    {pendiente.fechaLimite && (
                      <span className="text-xs text-gray-400">
                        {new Date(pendiente.fechaLimite).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      pendiente.prioridad === 'alta' ? 'bg-red-500/20 text-red-400' :
                      pendiente.prioridad === 'media' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {pendiente.prioridad}
                    </span>
                    <button
                      onClick={() => openEditPendiente(pendiente)}
                      className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-blue-400"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deletePendiente(pendiente.id)}
                      className="p-1 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal Nueva Tarea */}
        {showNuevaTarea && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Nueva Tarea</h3>
                <button onClick={() => setShowNuevaTarea(null)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Título *</label>
                  <input
                    type="text"
                    value={tareaForm.titulo}
                    onChange={(e) => setTareaForm({...tareaForm, titulo: e.target.value})}
                    className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="Descripción de la tarea"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Descripción</label>
                  <textarea
                    value={tareaForm.descripcion}
                    onChange={(e) => setTareaForm({...tareaForm, descripcion: e.target.value})}
                    className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Prioridad</label>
                    <select
                      value={tareaForm.prioridad}
                      onChange={(e) => setTareaForm({...tareaForm, prioridad: e.target.value})}
                      className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white"
                    >
                      {PRIORIDADES.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Responsable</label>
                    <input
                      type="text"
                      value={tareaForm.responsable}
                      onChange={(e) => setTareaForm({...tareaForm, responsable: e.target.value})}
                      className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowNuevaTarea(null)} className="px-4 py-2 text-gray-400 hover:text-white">Cancelar</button>
                <button onClick={() => createTarea(showNuevaTarea)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white">Crear</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Editar Tarea */}
        {showEditarTarea && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Editar Tarea</h3>
                <button onClick={() => setShowEditarTarea(null)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Título *</label>
                  <input type="text" value={tareaForm.titulo} onChange={(e) => setTareaForm({...tareaForm, titulo: e.target.value})} className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Descripción</label>
                  <textarea value={tareaForm.descripcion} onChange={(e) => setTareaForm({...tareaForm, descripcion: e.target.value})} className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white" rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Estado</label>
                    <select value={tareaForm.estado} onChange={(e) => setTareaForm({...tareaForm, estado: e.target.value})} className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white">
                      {ESTADOS.map(e => (<option key={e.value} value={e.value}>{e.label}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Prioridad</label>
                    <select value={tareaForm.prioridad} onChange={(e) => setTareaForm({...tareaForm, prioridad: e.target.value})} className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white">
                      {PRIORIDADES.map(p => (<option key={p.value} value={p.value}>{p.label}</option>))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Responsable</label>
                  <input type="text" value={tareaForm.responsable} onChange={(e) => setTareaForm({...tareaForm, responsable: e.target.value})} className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowEditarTarea(null)} className="px-4 py-2 text-gray-400 hover:text-white">Cancelar</button>
                <button onClick={updateTarea} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white">Guardar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Nuevo Entregable */}
        {showNuevoEntregable && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Nuevo Entregable</h3>
                <button onClick={() => setShowNuevoEntregable(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Nombre *</label>
                  <input type="text" value={entregableForm.nombre} onChange={(e) => setEntregableForm({...entregableForm, nombre: e.target.value})} className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Tipo</label>
                  <select value={entregableForm.tipo} onChange={(e) => setEntregableForm({...entregableForm, tipo: e.target.value})} className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white">
                    {TIPOS_ENTREGABLE.map(t => (<option key={t.value} value={t.value}>{t.label}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Asignar a Semana (opcional)</label>
                  <select value={entregableForm.semanaId} onChange={(e) => setEntregableForm({...entregableForm, semanaId: e.target.value})} className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white">
                    <option value="">Sin asignar</option>
                    {getSemanasProyecto(proyecto).map(s => (
                      <option key={s.id} value={s.id}>{s.faseNombre} - Semana {s.numero}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Estado</label>
                    <select value={entregableForm.estado} onChange={(e) => setEntregableForm({...entregableForm, estado: e.target.value})} className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white">
                      {ESTADOS.map(e => (<option key={e.value} value={e.value}>{e.label}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Fecha Entrega</label>
                    <input type="date" value={entregableForm.fechaEntrega} onChange={(e) => setEntregableForm({...entregableForm, fechaEntrega: e.target.value})} className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowNuevoEntregable(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancelar</button>
                <button onClick={() => createEntregable(proyecto.id)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white">Crear</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Editar Entregable */}
        {showEditarEntregable && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Editar Entregable</h3>
                <button onClick={() => setShowEditarEntregable(null)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Nombre *</label>
                  <input type="text" value={entregableForm.nombre} onChange={(e) => setEntregableForm({...entregableForm, nombre: e.target.value})} className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Tipo</label>
                  <select value={entregableForm.tipo} onChange={(e) => setEntregableForm({...entregableForm, tipo: e.target.value})} className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white">
                    {TIPOS_ENTREGABLE.map(t => (<option key={t.value} value={t.value}>{t.label}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Asignar a Semana (opcional)</label>
                  <select value={entregableForm.semanaId} onChange={(e) => setEntregableForm({...entregableForm, semanaId: e.target.value})} className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white">
                    <option value="">Sin asignar</option>
                    {getSemanasProyecto(proyecto).map(s => (
                      <option key={s.id} value={s.id}>{s.faseNombre} - Semana {s.numero}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Estado</label>
                    <select value={entregableForm.estado} onChange={(e) => setEntregableForm({...entregableForm, estado: e.target.value})} className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white">
                      {ESTADOS.map(e => (<option key={e.value} value={e.value}>{e.label}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Fecha Entrega</label>
                    <input type="date" value={entregableForm.fechaEntrega} onChange={(e) => setEntregableForm({...entregableForm, fechaEntrega: e.target.value})} className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowEditarEntregable(null)} className="px-4 py-2 text-gray-400 hover:text-white">Cancelar</button>
                <button onClick={updateEntregable} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white">Guardar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Nuevo Pendiente */}
        {showNuevoPendiente && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Nuevo Pendiente del Cliente</h3>
                <button onClick={() => setShowNuevoPendiente(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Descripción *</label>
                  <textarea value={pendienteForm.descripcion} onChange={(e) => setPendienteForm({...pendienteForm, descripcion: e.target.value})} className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white" rows={2} placeholder="¿Qué pendiente tiene el cliente?" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Prioridad</label>
                    <select value={pendienteForm.prioridad} onChange={(e) => setPendienteForm({...pendienteForm, prioridad: e.target.value})} className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white">
                      {PRIORIDADES.map(p => (<option key={p.value} value={p.value}>{p.label}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Fecha Límite</label>
                    <input type="date" value={pendienteForm.fechaLimite} onChange={(e) => setPendienteForm({...pendienteForm, fechaLimite: e.target.value})} className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Responsable</label>
                  <input type="text" value={pendienteForm.responsable} onChange={(e) => setPendienteForm({...pendienteForm, responsable: e.target.value})} className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white" placeholder="¿Quién debe resolverlo?" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Notas</label>
                  <textarea value={pendienteForm.notas} onChange={(e) => setPendienteForm({...pendienteForm, notas: e.target.value})} className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white" rows={2} placeholder="Notas adicionales..." />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowNuevoPendiente(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancelar</button>
                <button onClick={() => createPendiente(proyecto.id)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white">Crear</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Editar Pendiente */}
        {showEditarPendiente && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Editar Pendiente</h3>
                <button onClick={() => setShowEditarPendiente(null)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Descripción *</label>
                  <textarea value={pendienteForm.descripcion} onChange={(e) => setPendienteForm({...pendienteForm, descripcion: e.target.value})} className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white" rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Estado</label>
                    <select value={pendienteForm.estado} onChange={(e) => setPendienteForm({...pendienteForm, estado: e.target.value})} className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white">
                      {ESTADOS.map(e => (<option key={e.value} value={e.value}>{e.label}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Prioridad</label>
                    <select value={pendienteForm.prioridad} onChange={(e) => setPendienteForm({...pendienteForm, prioridad: e.target.value})} className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white">
                      {PRIORIDADES.map(p => (<option key={p.value} value={p.value}>{p.label}</option>))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Fecha Límite</label>
                    <input type="date" value={pendienteForm.fechaLimite} onChange={(e) => setPendienteForm({...pendienteForm, fechaLimite: e.target.value})} className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Responsable</label>
                    <input type="text" value={pendienteForm.responsable} onChange={(e) => setPendienteForm({...pendienteForm, responsable: e.target.value})} className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Notas</label>
                  <textarea value={pendienteForm.notas} onChange={(e) => setPendienteForm({...pendienteForm, notas: e.target.value})} className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white" rows={2} />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowEditarPendiente(null)} className="px-4 py-2 text-gray-400 hover:text-white">Cancelar</button>
                <button onClick={updatePendiente} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white">Guardar</button>
              </div>
            </div>
          </div>
        )}

      </div>
    )
  }

  // Vista de lista de proyectos
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Proyectos de Consultoría</h2>
          <p className="text-gray-400">Gestiona tus proyectos con timeline, fases y entregables</p>
        </div>
        <button onClick={() => setShowNewProject(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white">
          <Plus className="w-5 h-5" />
          Nuevo Proyecto
        </button>
      </div>

      {/* Modal Nuevo Proyecto */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Nuevo Proyecto</h3>
              <button onClick={() => setShowNewProject(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nombre del proyecto</label>
                <input type="text" value={newProject.nombre} onChange={(e) => setNewProject({...newProject, nombre: e.target.value})} className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Cliente</label>
                <input type="text" value={newProject.cliente} onChange={(e) => setNewProject({...newProject, cliente: e.target.value})} className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Fecha inicio</label>
                  <input type="date" value={newProject.fechaInicio} onChange={(e) => setNewProject({...newProject, fechaInicio: e.target.value})} className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Fecha fin</label>
                  <input type="date" value={newProject.fechaFin} onChange={(e) => setNewProject({...newProject, fechaFin: e.target.value})} className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Valor contrato ($)</label>
                <input type="number" value={newProject.valorContrato} onChange={(e) => setNewProject({...newProject, valorContrato: Number(e.target.value)})} className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowNewProject(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancelar</button>
              <button onClick={createProyecto} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white">Crear Proyecto</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Proyecto */}
      {showEditProject && editingProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Editar Proyecto</h3>
              <button onClick={() => { setShowEditProject(false); setEditingProject(null) }} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nombre del proyecto</label>
                <input type="text" value={editProject.nombre} onChange={(e) => setEditProject({...editProject, nombre: e.target.value})} className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Cliente</label>
                <input type="text" value={editProject.cliente} onChange={(e) => setEditProject({...editProject, cliente: e.target.value})} className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Estado</label>
                <select value={editProject.estado} onChange={(e) => setEditProject({...editProject, estado: e.target.value})} className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white">
                  {ESTADOS_PROYECTO.map(estado => (<option key={estado.value} value={estado.value}>{estado.label}</option>))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Fecha inicio</label>
                  <input type="date" value={editProject.fechaInicio} onChange={(e) => setEditProject({...editProject, fechaInicio: e.target.value})} className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Fecha fin</label>
                  <input type="date" value={editProject.fechaFin} onChange={(e) => setEditProject({...editProject, fechaFin: e.target.value})} className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Valor contrato ($)</label>
                <input type="number" value={editProject.valorContrato} onChange={(e) => setEditProject({...editProject, valorContrato: Number(e.target.value)})} className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowEditProject(false); setEditingProject(null) }} className="px-4 py-2 text-gray-400 hover:text-white">Cancelar</button>
              <button onClick={updateProyecto} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white">Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Proyectos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {proyectos.map((proyecto) => (
          <div key={proyecto.id} className="bg-[#1a1a1a] rounded-xl border border-white/10 p-5 hover:border-blue-500/50 transition-all">
            <div className="flex items-start justify-between mb-3">
              <span className={`px-2 py-0.5 rounded text-xs ${getEstadoColor(proyecto.estado)}`}>{proyecto.estado}</span>
              <div className="flex items-center gap-1">
                <button onClick={(e) => { e.stopPropagation(); openEditModal(proyecto) }} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-blue-400"><Edit3 className="w-4 h-4" /></button>
                <button onClick={(e) => { e.stopPropagation(); deleteProyecto(proyecto.id) }} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <button onClick={() => setProyectoSeleccionado({ id: proyecto.id, nombre: proyecto.nombre, cliente: proyecto.cliente })} className="w-full text-left">
              <h3 className="text-lg font-semibold text-white mb-1">{proyecto.nombre}</h3>
              <p className="text-gray-400 text-sm mb-4">{proyecto.cliente}</p>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-gray-400"><Calendar className="w-4 h-4" />{new Date(proyecto.fechaInicio).toLocaleDateString()}</div>
                <div className="flex items-center gap-1 text-green-400"><DollarSign className="w-4 h-4" />{proyecto.valorContrato.toLocaleString()}</div>
              </div>
              <div className="mt-2 text-xs text-gray-500">{proyecto.fases.length} fases · {proyecto.entregables.length} entregables · {proyecto.pendientes?.length || 0} pendientes</div>
            </button>
          </div>
        ))}
      </div>

      {proyectos.length === 0 && (
        <div className="text-center py-12">
          <Briefcase className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No hay proyectos creados</p>
          <button onClick={() => setShowNewProject(true)} className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white">Crear primer proyecto</button>
        </div>
      )}
    </div>
  )
}
