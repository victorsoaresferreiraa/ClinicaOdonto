'use client'

/*
 * ================================================================
 * AULA: PÁGINA DE LOGIN — ATUALIZADA
 * ================================================================
 *
 * O que mudou:
 *   1. Agora salva clinicId e clinicSlug no localStorage
 *   2. Adicionado link para a página de cadastro de clínica
 *   3. Comentários didáticos em todo o fluxo
 *
 * AULA: FLUXO COMPLETO DO LOGIN
 * ===============================
 *
 * 1. Usuário digita email + senha
 * 2. Clica em "Entrar"
 * 3. handleSubmit() é chamado
 * 4. fetch() faz POST para /api/auth/login
 * 5. Backend valida email + senha (BCrypt)
 * 6. Backend retorna { token, userName, clinicId, clinicSlug, ... }
 * 7. Salvamos tudo no localStorage
 * 8. router.push('/dashboard') → vai para o painel
 *
 * 9. No dashboard, todas as requests usam o token salvo:
 *    Authorization: Bearer {token}
 * ================================================================
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()  // Previne recarregamento da página
    setError('')
    setLoading(true)

    try {
      /*
       * AULA: Chamada HTTP POST para o backend.
       *
       * O backend está em localhost:8080.
       * O frontend está em localhost:3000.
       * São portas diferentes → precisamos do CORS configurado.
       */
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        /*
         * AULA: O backend retorna erros no formato ProblemDetail:
         * {
         *   "status": 401,
         *   "detail": "Email ou senha incorretos.",
         *   "title": "Erro de negócio"
         * }
         */
        throw new Error(data.detail || 'Email ou senha incorretos.')
      }

      /*
       * AULA: Salvando dados no localStorage.
       *
       * Salvamos separado para facilitar acesso:
       *   - lumay_token: o JWT para requests autenticados
       *   - lumay_user: dados do usuário logado
       *
       * JSON.stringify() converte objeto → string (localStorage só aceita string)
       * JSON.parse() converte string → objeto (quando lemos de volta)
       */
      localStorage.setItem('lumay_token', data.token)
      localStorage.setItem('lumay_user', JSON.stringify({
        id:         data.userId,
        name:       data.userName,
        email:      data.userEmail,
        role:       data.userRole,
        clinicId:   data.clinicId,    // ← novo: id da clínica
        clinicSlug: data.clinicSlug,  // ← novo: slug da clínica
      }))

      // Navega para o dashboard após login bem-sucedido
      router.push('/dashboard')

    } catch (err: any) {
      setError(err.message || 'Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">

        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🦷</div>
          <h1 className="text-2xl font-bold text-gray-800">Bem-vindo de volta</h1>
          <p className="text-gray-500 text-sm mt-1">Faça login para acessar sua clínica</p>
        </div>

        {/* Mensagem de erro */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}  // atualiza estado ao digitar
              placeholder="seu@email.com"
              required
              autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Sua senha"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-lg transition-colors mt-2"
          >
            {loading ? '⏳ Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* Dica de credenciais (remova em produção!) */}
        <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
          <p className="font-semibold mb-1">🔑 Credenciais de teste:</p>
          <p>admin@lumayodontologia.com.br / admin123</p>
          <p className="text-yellow-500 mt-1">(Remova este bloco em produção!)</p>
        </div>

        {/* Link para cadastro */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Não tem clínica cadastrada?{' '}
          <Link href="/register" className="text-blue-600 hover:underline font-medium">
            Cadastrar agora
          </Link>
        </p>
      </div>
    </div>
  )
}
