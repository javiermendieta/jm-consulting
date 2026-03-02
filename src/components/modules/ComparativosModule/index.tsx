'use client'

import { useState } from 'react'
import { 
  BarChart3, 
  Calendar,
  Filter,
  TrendingUp,
  TrendingDown,
  ArrowRight
} from 'lucide-react'

export function ComparativosModule() {
  const [filtroCanal, setFiltroCanal] = useState('todos')
  const [filtroTurno, setFiltroTurno] = useState('todos')
  const [filtroTipoDia, setFiltroTipoDia] = useState('todos')
  const [agrupacion, setAgrupacion] = useState('dia')

  // Datos de ejemplo para comparativos
  const comparativos = [
    {
      dimension: 'Canal',
      item: 'Salón',
      periodoActual: 45200,
      periodoAnterior: 42300,
      variacion: 6.9,
      tendencia: 'up'
    },
    {
      dimension: 'Canal',
      item: 'Delivery',
      periodoActual: 28900,
      periodoAnterior: 31500,
      variacion: -8.3,
      tendencia: 'down'
    },
    {
      dimension: 'Canal',
      item: 'Apps',
      periodoActual: 18900,
      periodoAnterior: 15200,
      variacion: 24.3,
      tendencia: 'up'
    },
    {
      dimension: 'Turno',
      item: 'AM',
      periodoActual: 32100,
      periodoAnterior: 29800,
      variacion: 7.7,
      tendencia: 'up'
    },
    {
      dimension: 'Turno',
      item: 'PM',
      periodoActual: 60900,
      periodoAnterior: 59200,
      variacion: 2.9,
      tendencia: 'up'
    }
  ]

  const canales = ['Salón', 'Delivery', 'Takeaway', 'Apps']
  const turnos = ['AM', 'PM']
  const tiposDia = ['Normal', 'Feriado', 'Pre-Feriado', 'Post-Feriado']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Análisis Comparativos</h2>
          <p className="text-gray-400">Compara períodos y dimensionales cruzados</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-400">Filtros:</span>
          </div>
          
          <select
            value={filtroCanal}
            onChange={(e) => setFiltroCanal(e.target.value)}
            className="px-3 py-1.5 bg-[#0d0d0d] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="todos">Todos los canales</option>
            {canales.map(c => (
              <option key={c} value={c.toLowerCase()}>{c}</option>
            ))}
          </select>

          <select
            value={filtroTurno}
            onChange={(e) => setFiltroTurno(e.target.value)}
            className="px-3 py-1.5 bg-[#0d0d0d] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="todos">Todos los turnos</option>
            {turnos.map(t => (
              <option key={t} value={t.toLowerCase()}>{t}</option>
            ))}
          </select>

          <select
            value={filtroTipoDia}
            onChange={(e) => setFiltroTipoDia(e.target.value)}
            className="px-3 py-1.5 bg-[#0d0d0d] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="todos">Todos los tipos</option>
            {tiposDia.map(t => (
              <option key={t} value={t.toLowerCase()}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Agrupación */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">Agrupar por:</span>
        <div className="flex bg-[#1a1a1a] rounded-lg p-1">
          {[
            { id: 'dia', label: 'Día vs Día' },
            { id: 'semana', label: 'Semana vs Semana' },
            { id: 'mes', label: 'Mes vs Mes' }
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setAgrupacion(opt.id)}
              className={`px-4 py-1.5 rounded-md text-sm transition-colors ${
                agrupacion === opt.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla Comparativa */}
      <div className="bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden">
        <div className="grid grid-cols-6 gap-2 p-3 bg-[#0d0d0d] border-b border-white/10 text-sm font-medium text-gray-400">
          <div>Dimensión</div>
          <div>Item</div>
          <div className="text-right">Período Actual</div>
          <div className="text-right">Período Anterior</div>
          <div className="text-right">Variación</div>
          <div className="text-right">Tendencia</div>
        </div>

        {comparativos.map((item, index) => (
          <div 
            key={index}
            className="grid grid-cols-6 gap-2 p-3 hover:bg-white/5 items-center"
          >
            <div className="text-gray-400 text-sm">{item.dimension}</div>
            <div className="text-white font-medium">{item.item}</div>
            <div className="text-right text-white">
              ${item.periodoActual.toLocaleString()}
            </div>
            <div className="text-right text-gray-400">
              ${item.periodoAnterior.toLocaleString()}
            </div>
            <div className={`text-right font-medium ${item.variacion >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {item.variacion >= 0 ? '+' : ''}{item.variacion.toFixed(1)}%
            </div>
            <div className="flex items-center justify-end">
              {item.tendencia === 'up' ? (
                <TrendingUp className="w-5 h-5 text-green-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-400" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-5">
          <p className="text-sm text-gray-400 mb-1">Total Período Actual</p>
          <p className="text-2xl font-bold text-white">$93,000</p>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-5">
          <p className="text-sm text-gray-400 mb-1">Total Período Anterior</p>
          <p className="text-2xl font-bold text-white">$89,000</p>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-5">
          <p className="text-sm text-gray-400 mb-1">Variación Total</p>
          <p className="text-2xl font-bold text-green-400">+4.5%</p>
        </div>
      </div>
    </div>
  )
}
