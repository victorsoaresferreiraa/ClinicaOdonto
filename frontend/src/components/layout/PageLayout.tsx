'use client'

import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import { SunFill, MoonFill, List } from 'react-bootstrap-icons' // Adicionei o ícone List

interface Props {
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
}

export default function PageLayout({ title, subtitle, action, children }: Props) {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  
  // Novo estado para controlar o menu no celular
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const toggleTheme = () => setIsDarkMode(!isDarkMode)

  if (!isMounted) return null

  return (
    <div className={`${isDarkMode ? "dark" : ""} flex h-screen w-full overflow-hidden`}>
      
      {/* Background Fixo */}
      <div 
        className="fixed inset-0 z-[-1] bg-cover bg-center bg-no-repeat transition-colors duration-500"
        style={{ 
          backgroundImage: isDarkMode ? "url('/background.png')" : "none",
          backgroundColor: isDarkMode ? "#000" : "#f8fafc"
        }}
      >
        <div className="absolute inset-0 dark:bg-black/60"></div>
      </div>

      {/* Sidebar recebe os controles do menu mobile */}
      <Sidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />

      {/* Fundo escuro quando o menu está aberto no celular (clicar fora fecha) */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ÁREA PRINCIPAL: lg:ml-64 no PC, ml-0 no celular */}
      <main className="flex-1 lg:ml-64 w-full h-screen overflow-x-hidden overflow-y-auto relative transition-all duration-300">
        
        {/* Cabeçalho */}
        <header className="sticky top-0 z-20 bg-white/80 dark:bg-black/50 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 px-4 lg:px-6 py-4 flex items-center justify-between shadow-sm">
          
          <div className="flex items-center gap-3">
            {/* Botão Menu Hambúrguer (Aparece só no celular) */}
            <button 
              className="lg:hidden p-2 -ml-2 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <List className="text-3xl" />
            </button>

            <div>
              <h1 className="text-lg lg:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-[10px] font-bold text-lumay-blue dark:text-blue-400 uppercase tracking-widest mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-4">
            {action}
            <button 
              onClick={toggleTheme}
              className="p-2 lg:p-2.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-300 hover:scale-110 transition-all"
            >
              {isDarkMode ? <SunFill /> : <MoonFill />}
            </button>
          </div>
        </header>

        {/* Conteúdo da Página */}
        <div className="max-w-6xl mx-auto p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}