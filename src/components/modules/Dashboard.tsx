'use client'

import { useStore } from '@/store/useStore'
import { 
  Briefcase, 
  TrendingUp, 
  Calculator, 
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react'

export function Dashboard() {
  const { setModule } = useStore()

  const quickStats = [
    { label: 'Proyectos Activos', value: '3', icon: Briefcase, color: 'text-blue-400' },
    { label: 'Forecast Mensual', value: '$125,450', icon: TrendingUp, color: 'text-green-400' },
    { label: 'P&L Variación', value: '+4.2%', icon: Calculator, color: 'text-yellow-400' },
    { label: 'Comparativos', value: '12', icon: BarChart3, color: 'text-purple-400' },
  ]

  const modules = [
    { 
      id: 'consulting' as const, 
      title: 'Consultoría', 
      description: 'Gestión de proyectos con timeline, fases, semanas, tareas y entregables',
      icon: Briefcase,
      color: 'bg-blue-600'
    },
    { 
      id: 'forecast' as const, 
      title: 'Forecast', 
      description: 'Proyección de ventas con estructura jerárquica por fecha, restaurante y canal',
      icon: TrendingUp,
      color: 'bg-green-600'
    },
    { 
      id: 'pl' as const, 
      title: 'P&L', 
      description: 'Estado de resultados con plan de cuentas editable y cálculos automáticos',
      icon: Calculator,
      color: 'bg-yellow-600'
    },
    { 
      id: 'comparativos' as const, 
      title: 'Comparativos', 
      description: 'Análisis cruzado con filtros por canal, turno, tipo de día y más',
      icon: BarChart3,
      color: 'bg-purple-600'
    },
  ]

  const recentProjects = [
    { name: 'Optimización Restaurant ABC', client: 'ABC Corp', status: 'activo', progress: 65 },
    { name: 'Plan de Expansión', client: 'XYZ Group', status: 'activo', progress: 40 },
    { name: 'Análisis de Costos', client: 'Restaurante 123', status: 'completado', progress: 100 },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'activo': return <Clock className="w-4 h-4 text-blue-400" />
      case 'completado': return <CheckCircle2 className="w-4 h-4 text-green-400" />
      default: return <AlertCircle className="w-4 h-4 text-yellow-400" />
    }
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-white mb-2">Bienvenido a JM Consulting</h1>
        <p className="text-blue-100">Sistema de gestión de consultoría para restaurantes</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <div key={index} className="bg-[#1a1a1a] rounded-xl p-5 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
              </div>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Modules Grid */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Módulos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modules.map((module) => (
            <button
              key={module.id}
              onClick={() => setModule(module.id)}
              className="bg-[#1a1a1a] rounded-xl p-5 border border-white/10 hover:border-blue-500/50 transition-all group text-left"
            >
              <div className="flex items-start gap-4">
                <div className={`${module.color} p-3 rounded-lg`}>
                  <module.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                    {module.title}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">{module.description}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-blue-400 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Projects */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Proyectos Recientes</h2>
        <div className="bg-[#1a1a1a] rounded-xl border border-white/10 divide-y divide-white/10">
          {recentProjects.map((project, index) => (
            <div key={index} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(project.status)}
                <div>
                  <p className="text-white font-medium">{project.name}</p>
                  <p className="text-sm text-gray-400">{project.client}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-32">
                  <div className="h-2 bg-[#2d2d2d] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm text-gray-400 w-10 text-right">{project.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
