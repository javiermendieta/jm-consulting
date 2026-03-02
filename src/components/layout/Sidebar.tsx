'use client'

import { useStore, Module } from '@/store/useStore'
import { 
  LayoutDashboard, 
  Briefcase, 
  TrendingUp, 
  Calculator, 
  DollarSign,
  BarChart3, 
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

const menuItems: { id: Module; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'consulting', label: 'Consultoría', icon: <Briefcase className="w-5 h-5" /> },
  { id: 'forecast', label: 'Forecast', icon: <TrendingUp className="w-5 h-5" /> },
  { id: 'pl', label: 'P&L', icon: <Calculator className="w-5 h-5" /> },
  { id: 'cashflow', label: 'Cash Flow', icon: <DollarSign className="w-5 h-5" /> },
  { id: 'comparativos', label: 'Comparativos', icon: <BarChart3 className="w-5 h-5" /> },
  { id: 'config', label: 'Configuración', icon: <Settings className="w-5 h-5" /> },
]

export function Sidebar() {
  const { currentModule, setModule, sidebarOpen, toggleSidebar } = useStore()

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen bg-[#0d0d0d] border-r border-white/10 transition-all duration-300 z-40",
        sidebarOpen ? "w-64" : "w-16"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
        {sidebarOpen && (
          <h1 className="text-lg font-bold text-white tracking-wider">
            JM <span className="text-blue-500">CONSULTING</span>
          </h1>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </div>

      {/* Menu Items */}
      <nav className="p-3 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setModule(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
              currentModule === item.id
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            )}
          >
            {item.icon}
            {sidebarOpen && <span className="font-medium">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Footer */}
      {sidebarOpen && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <p className="text-xs text-gray-500 text-center">
            © 2024 JM Consulting
          </p>
        </div>
      )}
    </aside>
  )
}
