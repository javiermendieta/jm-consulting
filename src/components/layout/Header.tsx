'use client'

import { useStore } from '@/store/useStore'
import { Bell, User, Search, Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/hooks/useTheme'

const moduleTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  consulting: 'Gestión de Consultoría',
  forecast: 'Forecast de Ventas',
  pl: 'Estado de Resultados (P&L)',
  comparativos: 'Análisis Comparativos',
  config: 'Configuración',
}

export function Header() {
  const { currentModule, sidebarOpen, theme, toggleTheme } = useStore()
  useTheme()

  return (
    <header 
      className={cn(
        "fixed top-0 right-0 h-16 bg-background border-b flex items-center justify-between px-6 z-30 transition-all duration-300",
        sidebarOpen ? "left-64" : "left-16"
      )}
    >
      {/* Title */}
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          {moduleTitles[currentModule] || 'Dashboard'}
        </h2>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar..."
            className="w-64 pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
          />
        </div>

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User */}
        <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        </button>
      </div>
    </header>
  )
}
