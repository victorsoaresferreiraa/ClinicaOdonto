'use client'

/*
 * ================================================================
 * AULA: PÁGINA DE CADASTRO DE CLÍNICA (FRONTEND)
 * ================================================================
 *
 * Esta é uma página Next.js com React.
 *
 * AULA: 'use client' no topo
 * ============================
 * Next.js tem dois tipos de componentes:
 *   - Server Components: renderizados no servidor (sem interatividade)
 *   - Client Components: renderizados no navegador (com useState, eventos, etc.)
 *
 * 'use client' diz ao Next.js: "este componente roda no navegador".
 * Usamos porque precisamos de useState (estado) e eventos de formulário.
 *
 * AULA: useState
 * ===============
 * useState é um "hook" do React para guardar estado (dados que mudam).
 *
 * const [valor, setValor] = useState('inicial')
 *   - valor    = o dado atual
 *   - setValor = função para mudar o dado
 *   - 'inicial' = valor inicial
 *
 * Quando setValor() é chamado, o componente RE-RENDERIZA com o novo valor.
 *
 * AULA: async/await
 * ==================
 * async = a função pode esperar por operações lentas (ex: chamadas HTTP)
 * await = "espere esta promessa terminar antes de continuar"
 *
 * fetch() faz chamadas HTTP. É assíncrono porque a rede pode demorar.
 * ================================================================
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Interface TypeScript: define o formato dos dados do formulário
// AULA: TypeScript = JavaScript com tipagem. Evita erros em tempo de desenvolvimento.
interface FormData {
  clinicName: string
  clinicSlug: string
  clinicEmail: string
  clinicPhone: string
  adminName: string
  adminEmail: string
  adminPassword: string
  confirmPassword: string
}

export default function RegisterPage() {
  // useRouter = hook do Next.js para navegar entre páginas
  const router = useRouter()

  // Estado do formulário — começa com campos vazios
  const [form, setForm] = useState<FormData>({
    clinicName: '',
    clinicSlug: '',
    clinicEmail: '',
    clinicPhone: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
  })

  // Estado de carregamento (mostra spinner durante o envio)
  const [loading, setLoading] = useState(false)

  // Estado de erro (mostra mensagem vermelha)
  const [error, setError] = useState('')

  // Estado de sucesso
  const [success, setSuccess] = useState(false)

  /*
   * AULA: Função genérica para atualizar qualquer campo do formulário.
   *
   * e.target.name  = qual campo mudou (ex: "clinicName")
   * e.target.value = novo valor digitado
   *
   * Spread operator { ...form } = copia todos os campos atuais
   * [e.target.name]: e.target.value = substitui só o campo que mudou
   *
   * Ex: se o usuário digita "Clínica X" no campo clinicName:
   *   setForm({ ...form, clinicName: 'Clínica X' })
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  /*
   * AULA: Gera o slug automaticamente a partir do nome da clínica.
   * Quando o usuário digita o nome, o slug é sugerido automaticamente.
   *
   * Ex: "Clínica Sorriso SP" → "clinica-sorriso-sp"
   *
   * normalize("NFD")               = separa letras de acentos
   * replace(/[\u0300-\u036f]/g, '') = remove os acentos
   * toLowerCase()                  = minúsculas
   * replace(/[^a-z0-9]/g, '-')     = substitui qualquer não-alfanum por hífen
   * replace(/-+/g, '-')            = remove hífens duplicados
   */
  const handleClinicNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    const slug = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')  // remove hífens do início e fim

    setForm(prev => ({ ...prev, clinicName: name, clinicSlug: slug }))
  }

  /*
   * AULA: Função que roda quando o usuário envia o formulário.
   *
   * e.preventDefault() = impede o comportamento padrão do HTML
   * (que seria recarregar a página — não queremos isso em React)
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validação simples no frontend (antes de chamar o backend)
    if (form.adminPassword !== form.confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }
    if (form.adminPassword.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.')
      return
    }

    setLoading(true)

    try {
      /*
       * AULA: fetch() faz uma chamada HTTP.
       *
       * método POST   = estamos CRIANDO um recurso
       * headers       = metadados da requisição
       * body          = corpo da requisição (dados do formulário em JSON)
       *
       * JSON.stringify() converte o objeto JavaScript em string JSON.
       * O backend recebe essa string e converte de volta para objeto Java.
       */
      const response = await fetch('http://localhost:8080/api/clinics/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',  // diz que estamos enviando JSON
        },
        body: JSON.stringify({
          clinicName:    form.clinicName,
          clinicSlug:    form.clinicSlug,
          clinicEmail:   form.clinicEmail,
          clinicPhone:   form.clinicPhone,
          adminName:     form.adminName,
          adminEmail:    form.adminEmail,
          adminPassword: form.adminPassword,
        }),
      })

      // Converte a resposta JSON para objeto JavaScript
      const data = await response.json()

      if (!response.ok) {
        // response.ok = true se status HTTP for 200-299
        // Se deu erro, mostra a mensagem do backend
        throw new Error(data.detail || data.message || 'Erro ao criar clínica.')
      }

      /*
       * Sucesso! O backend retornou o token JWT.
       * Salvamos no localStorage para usar nas próximas requests.
       *
       * AULA: localStorage = storage persistente no navegador.
       * Os dados ficam mesmo depois de fechar o navegador.
       */
      localStorage.setItem('lumay_token', data.token)
      localStorage.setItem('lumay_user', JSON.stringify({
        email:    data.adminEmail,
        clinicId: data.clinic?.id,
        role:     'ADMIN',
      }))

      setSuccess(true)

      // Redireciona para o dashboard após 2 segundos
      setTimeout(() => router.push('/dashboard'), 2000)

    } catch (err: any) {
      setError(err.message || 'Erro inesperado. Tente novamente.')
    } finally {
      // "finally" roda SEMPRE, com sucesso ou erro
      setLoading(false)
    }
  }

  // ── RENDERIZAÇÃO ────────────────────────────────────────────────
  // AULA: JSX = JavaScript + HTML. O React converte em HTML real.

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Clínica criada!</h2>
          <p className="text-gray-500">Redirecionando para o dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg">

        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🦷</div>
          <h1 className="text-2xl font-bold text-gray-800">Cadastrar Clínica</h1>
          <p className="text-gray-500 text-sm mt-1">
            Crie sua clínica e acesse imediatamente
          </p>
        </div>

        {/* Mensagem de erro */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {/*
         * AULA: onSubmit={handleSubmit}
         * Quando o formulário é submetido (botão Enviar ou Enter),
         * chama a função handleSubmit.
         */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── SEÇÃO: Dados da Clínica ── */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Dados da Clínica
            </h3>
            <div className="space-y-3">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Clínica *
                </label>
                {/*
                 * AULA: value={form.clinicName} = valor controlado pelo estado
                 * onChange={handleClinicNameChange} = atualiza o estado ao digitar
                 *
                 * Isso é um "Controlled Component" no React.
                 * O React controla o valor do campo (não o DOM).
                 */}
                <input
                  type="text"
                  name="clinicName"
                  value={form.clinicName}
                  onChange={handleClinicNameChange}
                  placeholder="Ex: Clínica Sorriso"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug (identificador único) *
                </label>
                <input
                  type="text"
                  name="clinicSlug"
                  value={form.clinicSlug}
                  onChange={handleChange}
                  placeholder="Ex: clinica-sorriso"
                  required
                  pattern="^[a-z0-9-]{3,100}$"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Apenas letras minúsculas, números e hífens. Gerado automaticamente.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="clinicEmail"
                    value={form.clinicEmail}
                    onChange={handleChange}
                    placeholder="contato@clinica.com"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input
                    type="tel"
                    name="clinicPhone"
                    value={form.clinicPhone}
                    onChange={handleChange}
                    placeholder="(11) 99999-9999"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* ── SEÇÃO: Sua Conta (Admin) ── */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Sua Conta (Administrador)
            </h3>
            <div className="space-y-3">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seu Nome *
                </label>
                <input
                  type="text"
                  name="adminName"
                  value={form.adminName}
                  onChange={handleChange}
                  placeholder="Ex: Dr. João Silva"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seu Email *
                </label>
                <input
                  type="email"
                  name="adminEmail"
                  value={form.adminEmail}
                  onChange={handleChange}
                  placeholder="joao@clinica.com"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Senha *
                  </label>
                  <input
                    type="password"
                    name="adminPassword"
                    value={form.adminPassword}
                    onChange={handleChange}
                    placeholder="Mínimo 8 caracteres"
                    required
                    minLength={8}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar *
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repita a senha"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Botão de envio */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            {/*
             * AULA: Renderização condicional com operador ternário
             * condição ? "se true" : "se false"
             */}
            {loading ? 'Criando clínica...' : 'Criar Clínica e Entrar'}
          </button>
        </form>

        {/* Link para login */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Já tem uma conta?{' '}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  )
}
