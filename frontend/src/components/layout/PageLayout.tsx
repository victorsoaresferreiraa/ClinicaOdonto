'use client'
import Sidebar from './Sidebar'

interface Props {
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
}
export default function PageLayout({ title, subtitle, action, children }: Props) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-56 overflow-auto">
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{title}</h1>
              {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
            {action}
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}
