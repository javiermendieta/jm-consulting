'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { 
  Plus, 
  Calendar, 
  Users, 
  DollarSign,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Trash2,
  Edit3,
  Briefcase
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
  estado: string
  prioridad: string
}

interface Entregable {
  id: string
  nombre: string
  tipo: string
  estado: string
}

export function ConsultingModule() {
  const { proyectoSeleccionado, setProyectoSeleccionado } = useStore()
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewProject, setShowNewProject] = useState(false)
  const [expandedFase, setExpandedFase] = useState<string | null>(null)
  const [expandedSemana, setExpandedSemana] = useState<string | null>(null)

  // Form state
  const [newProject, setNewProject] = useState({
    nombre: '',
    cliente: '',
    fechaInicio: '',
    fechaFin: '',
    valorContrato: 0
  })

  useEffect(() => {
    fetchProyectos()
  }, [])

  const fetchProyectos = async () => {
    try {
      const res = await fetch('/api/consulting/proyectos')
      const data = await res.json()
      setProyectos(data)
    } catch (error) {
      console.error('Error fetching proyectos:', error)
    } finally {
      setLoading(false)
    }
  }

  const createProyecto = async () => {
    try {
      const res = await fetch('/api/consulting/proyectos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject)
      })
      const proyecto = await res.json()
      setProyectos([proyecto, ...proyectos])
      setShowNewProject(false)
      setNewProject({ nombre: '', cliente: '', fechaInicio: '', fechaFin: '', valorContrato: 0 })
    } catch (error) {
      console.error('Error creating proyecto:', error)
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
                  <span className={`px-2 py-0.5 rounded text-xs ${getEstadoColor(fase.estado)}`}>
                    {fase.estado}
                  </span>
                </button>
                
                {expandedFase === fase.id && (
                  <div className="border-t border-white/10 p-4 bg-[#0d0d0d]">
                    <h4 className="text-sm font-medium text-gray-400 mb-3">Semanas</h4>
                    <div className="space-y-2">
                      {fase.semanas.map((semana) => (
                        <div key={semana.id} className="border border-white/10 rounded-lg overflow-hidden">
                          <button
                            onClick={() => setExpandedSemana(expandedSemana === semana.id ? null : semana.id)}
                            className="w-full flex items-center justify-between p-3 hover:bg-white/5"
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
                          </button>
                          
                          {expandedSemana === semana.id && (
                            <div className="border-t border-white/10 p-3 bg-[#1a1a1a]">
                              {semana.tareas.length === 0 ? (
                                <p className="text-gray-500 text-sm text-center py-2">No hay tareas</p>
                              ) : (
                                <div className="space-y-2">
                                  {semana.tareas.map((tarea) => (
                                    <div key={tarea.id} className="flex items-center justify-between p-2 bg-[#0d0d0d] rounded">
                                      <div className="flex items-center gap-2">
                                        {getStatusIcon(tarea.estado)}
                                        <span className="text-white text-sm">{tarea.titulo}</span>
                                      </div>
                                      <span className={`px-2 py-0.5 rounded text-xs ${
                                        tarea.prioridad === 'alta' ? 'bg-red-500/20 text-red-400' :
                                        tarea.prioridad === 'media' ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-green-500/20 text-green-400'
                                      }`}>
                                        {tarea.prioridad}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
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
            <h3 className="text-lg font-semibold text-white">Entregables</h3>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition-colors">
              <Plus className="w-4 h-4" />
              Nuevo
            </button>
          </div>
          <div className="space-y-2">
            {proyecto.entregables.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay entregables</p>
            ) : (
              proyecto.entregables.map((entregable) => (
                <div key={entregable.id} className="flex items-center justify-between p-3 bg-[#0d0d0d] rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-400" />
                    <span className="text-white">{entregable.nombre}</span>
                    <span className="text-xs text-gray-400 uppercase">{entregable.tipo}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs ${getEstadoColor(entregable.estado)}`}>
                    {entregable.estado}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )
  }

  // Vista de lista de proyectos
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Proyectos de Consultoría</h2>
          <p className="text-gray-400">Gestiona tus proyectos con timeline, fases y entregables</p>
        </div>
        <button
          onClick={() => setShowNewProject(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Proyecto
        </button>
      </div>

      {/* Modal Nuevo Proyecto */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-white mb-4">Nuevo Proyecto</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nombre del proyecto</label>
                <input
                  type="text"
                  value={newProject.nombre}
                  onChange={(e) => setNewProject({...newProject, nombre: e.target.value})}
                  className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Cliente</label>
                <input
                  type="text"
                  value={newProject.cliente}
                  onChange={(e) => setNewProject({...newProject, cliente: e.target.value})}
                  className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Fecha inicio</label>
                  <input
                    type="date"
                    value={newProject.fechaInicio}
                    onChange={(e) => setNewProject({...newProject, fechaInicio: e.target.value})}
                    className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Fecha fin</label>
                  <input
                    type="date"
                    value={newProject.fechaFin}
                    onChange={(e) => setNewProject({...newProject, fechaFin: e.target.value})}
                    className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Valor contrato ($)</label>
                <input
                  type="number"
                  value={newProject.valorContrato}
                  onChange={(e) => setNewProject({...newProject, valorContrato: Number(e.target.value)})}
                  className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowNewProject(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={createProyecto}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
              >
                Crear Proyecto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Proyectos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {proyectos.map((proyecto) => (
          <button
            key={proyecto.id}
            onClick={() => setProyectoSeleccionado({ id: proyecto.id, nombre: proyecto.nombre, cliente: proyecto.cliente })}
            className="bg-[#1a1a1a] rounded-xl border border-white/10 p-5 hover:border-blue-500/50 transition-all text-left"
          >
            <div className="flex items-start justify-between mb-3">
              <span className={`px-2 py-0.5 rounded text-xs ${getEstadoColor(proyecto.estado)}`}>
                {proyecto.estado}
              </span>
              <span className="text-gray-400 text-sm">
                {proyecto.fases.length} fases
              </span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">{proyecto.nombre}</h3>
            <p className="text-gray-400 text-sm mb-4">{proyecto.cliente}</p>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-gray-400">
                <Calendar className="w-4 h-4" />
                {new Date(proyecto.fechaInicio).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1 text-green-400">
                <DollarSign className="w-4 h-4" />
                {proyecto.valorContrato.toLocaleString()}
              </div>
            </div>
          </button>
        ))}
      </div>

      {proyectos.length === 0 && (
        <div className="text-center py-12">
          <Briefcase className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No hay proyectos creados</p>
          <button
            onClick={() => setShowNewProject(true)}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
          >
            Crear primer proyecto
          </button>
        </div>
      )}
    </div>
  )
}
