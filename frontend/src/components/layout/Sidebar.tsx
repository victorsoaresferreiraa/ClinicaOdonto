'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const nav = [
  { href: '/dashboard',    icon: '📊', label: 'Dashboard'    },
  { href: '/patients',     icon: '👥', label: 'Pacientes'    },
  { href: '/appointments', icon: '📅', label: 'Agendamentos' },
  { href: '/payments',     icon: '💰', label: 'Financeiro'   },
]

export default function Sidebar() {
  const path   = usePathname()
  const router = useRouter()
  const user   = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('lumay_user') ?? '{}') : {}

  function logout() {
    localStorage.clear()
    router.push('/login')
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-56 bg-white border-r border-gray-200 flex flex-col z-10">
      {/* Logo */}
      <div className="p-5 border-b border-gray-100 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-lg">🦷</div>
        <div>
          <p className="text-sm font-bold text-gray-900 leading-none">Lumay</p>
          <p className="text-xs text-gray-400">Odontologia</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {nav.map(item => (
          <Link key={item.href} href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              path.startsWith(item.href)
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}>
            <span>{item.icon}</span>{item.label}
          </Link>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-2 px-2 mb-2">
          <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-700">
            {user.name?.charAt(0) ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-800 truncate">{user.name ?? 'Usuário'}</p>
            <p className="text-xs text-gray-400">{user.role ?? ''}</p>
          </div>
        </div>
        <button onClick={logout}
          className="w-full text-left text-xs text-gray-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors">
          🚪 Sair
        </button>
      </div>
    </aside>
  )
}
