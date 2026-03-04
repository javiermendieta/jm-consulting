'use client'

import { useStore } from '@/store/useStore'
import { 
  Briefcase, 
  TrendingUp, 
  Calculator, 
  BarChart3,
  ArrowRight
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
          <div key={index} className="bg-card rounded-xl p-5 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
              </div>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Modules Grid */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Módulos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modules.map((module) => (
            <button
              key={module.id}
              onClick={() => setModule(module.id)}
              className="bg-card rounded-xl p-5 border border-border hover:border-blue-500/50 transition-all group text-left"
            >
              <div className="flex items-start gap-4">
                <div className={`${module.color} p-3 rounded-lg`}>
                  <module.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-blue-400 transition-colors">
                    {module.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-blue-400 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
