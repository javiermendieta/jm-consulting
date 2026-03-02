import { create } from 'zustand'

export type Module = 'dashboard' | 'consulting' | 'forecast' | 'pl' | 'cashflow' | 'comparativos' | 'config'

interface ProyectoSeleccionado {
  id: string
  nombre: string
  cliente: string
}

interface ForecastFiltros {
  fechaInicio: Date | null
  fechaFin: Date | null
  restauranteId: string | null
  canalId: string | null
  turnoId: string | null
  tipoDiaId: string | null
}

interface PLFiltros {
  periodo: string // formato: "2024-01"
  tipoVista: 'mensual' | 'trimestral' | 'anual'
}

interface AppState {
  // Navegación
  currentModule: Module
  setModule: (module: Module) => void
  
  // Consultoría
  proyectoSeleccionado: ProyectoSeleccionado | null
  setProyectoSeleccionado: (proyecto: ProyectoSeleccionado | null) => void
  
  // Forecast
  forecastFiltros: ForecastFiltros
  setForecastFiltros: (filtros: Partial<ForecastFiltros>) => void
  
  // P&L
  plFiltros: PLFiltros
  setPLFiltros: (filtros: Partial<PLFiltros>) => void
  
  // Cashflow
  cashflowAnio: number
  setCashflowAnio: (anio: number) => void
  
  // UI
  sidebarOpen: boolean
  toggleSidebar: () => void
}

const currentDate = new Date()
const currentPeriod = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`

export const useStore = create<AppState>((set) => ({
  // Navegación
  currentModule: 'dashboard',
  setModule: (module) => set({ currentModule: module }),
  
  // Consultoría
  proyectoSeleccionado: null,
  setProyectoSeleccionado: (proyecto) => set({ proyectoSeleccionado: proyecto }),
  
  // Forecast
  forecastFiltros: {
    fechaInicio: null,
    fechaFin: null,
    restauranteId: null,
    canalId: null,
    turnoId: null,
    tipoDiaId: null,
  },
  setForecastFiltros: (filtros) => set((state) => ({
    forecastFiltros: { ...state.forecastFiltros, ...filtros }
  })),
  
  // P&L
  plFiltros: {
    periodo: currentPeriod,
    tipoVista: 'mensual',
  },
  setPLFiltros: (filtros) => set((state) => ({
    plFiltros: { ...state.plFiltros, ...filtros }
  })),
  
  // Cashflow
  cashflowAnio: currentDate.getFullYear(),
  setCashflowAnio: (anio) => set({ cashflowAnio: anio }),
  
  // UI
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}))
