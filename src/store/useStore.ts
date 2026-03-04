import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Module = 'dashboard' | 'consulting' | 'forecast' | 'pl' | 'cashflow' | 'comparativos' | 'config'
export type ConfigTab = 'plan-cuentas' | 'restaurantes' | 'canales' | 'turnos' | 'tipos'
export type Theme = 'light' | 'dark'

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
  // Tema
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  
  // Navegación
  currentModule: Module
  setModule: (module: Module) => void
  
  // Config tabs
  currentConfigTab: ConfigTab
  setConfigTab: (tab: ConfigTab) => void
  
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

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Tema
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      
      // Navegación
      currentModule: 'dashboard',
      setModule: (module) => set({ currentModule: module }),
      
      // Config tabs
      currentConfigTab: 'plan-cuentas',
      setConfigTab: (tab) => set({ currentConfigTab: tab }),
      
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
    }),
    {
      name: 'jm-consulting-storage',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
)
