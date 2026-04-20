import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Lumay Odontologia',
  description: 'Sistema de gestão clínica — Lumay Odontologia',
  icons: { icon: '/icon.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: 'system-ui, -apple-system, sans-serif', margin: 0 }}>
        {children}
      </body>
    </html>
  )
}
