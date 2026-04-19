'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Root() {
  const router = useRouter()
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('lumay_token') : null
    router.replace(token ? '/dashboard' : '/login')
  }, [router])
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl">🦷</span>
        </div>
        <p className="text-gray-500 text-sm">Carregando...</p>
      </div>
    </div>
  )
}
