'use client'

import { useStore } from '@/store/useStore'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { Dashboard } from '@/components/modules/Dashboard'
import { ConsultingModule } from '@/components/modules/ConsultingModule'
import { ForecastModule } from '@/components/modules/ForecastModule'
import { PLModule } from '@/components/modules/PLModule'
import { CashflowModule } from '@/components/modules/CashflowModule'
import { ComparativosModule } from '@/components/modules/ComparativosModule'
import { ConfigModule } from '@/components/modules/ConfigModule'

export default function Home() {
  const { currentModule, sidebarOpen } = useStore()

  const renderModule = () => {
    switch (currentModule) {
      case 'dashboard':
        return <Dashboard />
      case 'consulting':
        return <ConsultingModule />
      case 'forecast':
        return <ForecastModule />
      case 'pl':
        return <PLModule />
      case 'cashflow':
        return <CashflowModule />
      case 'comparativos':
        return <ComparativosModule />
      case 'config':
        return <ConfigModule />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <main 
        className={`pt-16 min-h-screen transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-16'
        }`}
      >
        <div className="p-6">
          {renderModule()}
        </div>
      </main>
    </div>
  )
}
