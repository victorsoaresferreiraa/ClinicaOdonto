'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { 
  HouseDoorFill, 
  PeopleFill, 
  CalendarDateFill, 
  WalletFill, 
  BoxArrowRight,
  X, // Ícone de Fechar
  Cash,
  GraphUp,
  CurrencyDollar
} from 'react-bootstrap-icons'

const nav = [
  { href: '/dashboard',    icon: <GraphUp />,          label: 'Dashboard'    },
  { href: '/patients',     icon: <PeopleFill />,       label: 'Pacientes'    },
  { href: '/appointments', icon: <CalendarDateFill />, label: 'Agendamentos' },
  { href: '/payments',     icon: <Cash />,             label: 'Financeiro'   },
  { href: '/procediments',     icon: <CurrencyDollar />,             label: 'Procedimentos'   },
]

// Adicionamos as props para controlar a abertura no mobile
export default function Sidebar({ isOpen, setIsOpen }: { isOpen?: boolean, setIsOpen?: (v: boolean) => void }) {
  const path = usePathname()
  const router = useRouter()
  
  // Aceita tanto "name" quanto "userName" para evitar telas em branco
  const [user, setUser] = useState<{name?: string, role?: string, userName?: string, userRole?: string}>({})
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const storedUser = localStorage.getItem('lumay_user')
    if (storedUser) {
      try { 
        setUser(JSON.parse(storedUser)) 
      } catch (e) {
        console.error("Erro ao ler usuário")
      }
    }
  }, [])

  // Fecha o menu automaticamente quando clicar em um link no celular
  useEffect(() => {
    if (setIsOpen) setIsOpen(false)
  }, [path, setIsOpen])

  function logout() {
    localStorage.removeItem('lumay_token')
    localStorage.removeItem('lumay_user')
    router.push('/login')
  }

  if (!isMounted) return <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 bg-white dark:bg-black z-40"></aside>

  // 🛡️ Variáveis de Segurança (Garante que nunca ficará em branco)
  const displayUserName = user?.name || user?.userName || 'Usuário'
  const displayUserRole = user?.role || user?.userRole || 'ADMIN'
  const initial = displayUserName.charAt(0).toUpperCase()

  return (
    <aside className={`fixed inset-y-0 left-0 w-64 bg-white/90 dark:bg-black/80 backdrop-blur-xl border-r border-slate-200 dark:border-white/10 flex flex-col z-40 shadow-2xl lg:shadow-none transition-transform duration-300 ease-in-out lg:translate-x-0
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      
      {/* Cabeçalho do Sidebar */}
      <div className="h-[73px] flex items-center justify-between lg:justify-center border-b border-slate-200 dark:border-white/10 px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 bg-lumay-blue dark:bg-white transition-colors"
            style={{ maskImage: "url(/logolumay.svg)", WebkitMaskImage: "url(/logolumay.svg)", maskRepeat: "no-repeat", maskPosition: "center", maskSize: "contain", WebkitMaskSize: "contain" }}
          />
          <div className="flex flex-col">
            <span className="font-black text-xl tracking-tight text-lumay-blue dark:text-white uppercase leading-none">Lumay</span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Odontologia</span>
          </div>
        </div>

        {/* Botão Fechar (Só no Mobile) */}
        {setIsOpen && (
          <button 
            className="lg:hidden text-slate-500 dark:text-slate-400 hover:text-red-500"
            onClick={() => setIsOpen(false)}
          >
            <X className="text-3xl" />
          </button>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {nav.map(item => {
          const isActive = path.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                isActive ? 'bg-lumay-blue text-white shadow-md dark:bg-blue-600' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-lumay-blue dark:hover:text-white'
              }`}>
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Perfil e Logout */}
      <div className="p-4 border-t border-slate-200 dark:border-white/10 shrink-0">
        <div className="flex items-center gap-3 px-2 mb-4">
          <div className="w-10 h-10 bg-gradient-to-tr from-lumay-blue to-blue-400 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md shrink-0">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-slate-800 dark:text-white truncate">{displayUserName}</p>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{displayUserRole}</p>
          </div>
        </div>
        
        <button onClick={logout} className="w-full flex items-center gap-3 text-left text-sm font-bold text-red-500 hover:text-red-600 px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
          <BoxArrowRight className="text-lg" /> Sair
        </button>
      </div>
    </aside>
  )
}