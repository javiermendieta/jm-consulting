'use client'

import { useEffect } from 'react'
import { useStore } from '@/store/useStore'

export function useTheme() {
  const { theme, setTheme } = useStore()

  useEffect(() => {
    // Aplicar o quitar la clase 'dark' del elemento html
    const root = document.documentElement
    
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  // Detectar preferencia del sistema solo al inicio si no hay preferencia guardada
  useEffect(() => {
    const savedTheme = localStorage.getItem('jm-consulting-storage')
    if (!savedTheme) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(prefersDark ? 'dark' : 'light')
    }
  }, [setTheme])

  return { theme }
}
