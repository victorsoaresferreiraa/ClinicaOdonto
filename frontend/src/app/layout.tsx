import type { Metadata } from 'next'
import './globals.css'
import { Google_Sans_Code } from 'next/font/google'

const globalFont = Google_Sans_Code({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins', // Cria uma variável CSS
})

export const metadata: Metadata = {
  title: 'Lumay Odontologia',
  description: 'Sistema de gestão clínica — Lumay Odontologia',
  icons: { icon: '/icon.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${globalFont.className} antialiased`}>
        {children}
      </body>
    </html>
  )
}
