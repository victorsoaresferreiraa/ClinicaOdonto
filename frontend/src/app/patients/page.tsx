'use client' // Avisa que este arquivo tem interação (clique, digitação, etc)

import { useState, useEffect, useCallback } from 'react'
import PageLayout from '@/components/layout/PageLayout'
// Trazemos as ferramentas de comunicação com o Banco e as definições de como é um "Paciente"
import { patientApi, Patient, CreatePatientReq } from '@/lib/api'

export default function PatientsPage() {
  // --- A "MEMÓRIA" DA PÁGINA (ESTADOS) ---
  
  // Guarda a lista de pacientes que vem do banco
  const [patients, setPatients] = useState<Patient[]>([])
  // Guarda o que você digita na barra de pesquisa
  const [search, setSearch] = useState('')
  // Controla se a rodinha de "Carregando..." deve aparecer
  const [loading, setLoading] = useState(true)
  // Guarda mensagens de erro caso o servidor caia, por exemplo
  const [error, setError] = useState('')
  // Controla se o formulário de cadastro está aberto (true) ou fechado (false)
  const [showForm, setShowForm] = useState(false)
  // Guarda os dados que você está preenchendo no novo cadastro
  const [form, setForm] = useState<CreatePatientReq>({ 
    name:'', cpf:'', email:'', phone:'', birthDate:'', medicalNotes:'' 
  })
  // Guarda erros específicos que acontecem na hora de salvar (ex: CPF duplicado)
  const [formErr, setFormErr] = useState('')
  // Avisa se o botão de "Salvar" deve ficar travado enquanto o banco processa
  const [saving, setSaving] = useState(false)

  // --- AS AÇÕES (FUNÇÕES) ---

  // FUNÇÃO 1: Ir até o servidor e buscar os pacientes
  const load = useCallback(async (q?: string) => {
    setLoading(true) // Começa a carregar
    setError('')     // Limpa erros antigos
    try {
      // Se tiver algo escrito na busca (q), ele procura. Se não, lista todos.
      const data = q ? await patientApi.search(q) : await patientApi.findAll()
      setPatients(data) // Coloca os dados recebidos na nossa "memória" (state)
    } catch {
      setError('Erro ao carregar. Verifique se o backend está rodando.')
    } finally {
      setLoading(false) // Para de carregar (esconde a rodinha)
    }
  }, [])

  // FUNÇÃO 2: Rodar o "load" assim que a página abre
  useEffect(() => { 
    load() 
  }, [load])

  // FUNÇÃO 3: Quando você clica na Lupa (Pesquisar)
  async function handleSearch(e: React.FormEvent) {
    e.preventDefault() // Impede a página de recarregar (comportamento padrão do HTML)
    load(search.trim() || undefined) // Chama o load passando o que você digitou
  }

  // FUNÇÃO 4: Quando você clica em "Finalizar Cadastro"
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setFormErr('')
    setSaving(true) // Trava o botão para evitar cliques duplos
    try {
      // Tenta enviar os dados para o Java
      await patientApi.create({ 
        ...form, // Pega tudo o que está no formulário
        email: form.email || undefined, // Se estiver vazio, manda "nulo" para o banco
        phone: form.phone || undefined,
        birthDate: form.birthDate || undefined,
        medicalNotes: form.medicalNotes || undefined 
      })
      setShowForm(false) // Fecha o formulário
      setForm({ name:'', cpf:'', email:'', phone:'', birthDate:'', medicalNotes:'' }) // Limpa os campos
      load() // Atualiza a lista para o novo paciente aparecer
    } catch (err: any) {
      // Se o Java der erro (ex: CPF já existe), mostra a mensagem
      setFormErr(err?.response?.data?.detail ?? 'Erro ao cadastrar.')
    } finally {
      setSaving(false) // Destrava o botão
    }
  }

  // FUNÇÃO 5: Quando você clica em "Desativar"
  async function handleDeactivate(id: number, name: string) {
    // Abre aquela janelinha de "Tem certeza?" do navegador
    if (!confirm(`Desativar "${name}"?`)) return
    try {
      await patientApi.deactivate(id) // Avisa o banco para desativar
      load() // Recarrega a lista
    } catch {
      alert('Erro ao desativar.')
    }
  }

  // Estilo visual padrão para as caixinhas de texto
  const cls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

  // --- O DESENHO DA PÁGINA (HTML/JSX) ---
  return (
    <PageLayout
      title="👥 Pacientes"
      subtitle={`${patients.length} paciente(s) ativo(s)`}
      action={
        // Botão que abre/fecha o formulário mudando o showForm entre true e false
        <button onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          {showForm ? '✕ Fechar' : '+ Novo Paciente'}
        </button>
      }
    >
      {/* SE o showForm for verdadeiro, mostra este bloco (Formulário) */}
      {showForm && (
        <div className="bg-white rounded-xl border border-blue-200 p-5 mb-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">+ Cadastrar Paciente</h2>
          {formErr && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">⚠️ {formErr}</div>}
          
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Cada input abaixo atualiza uma parte do "estado" form */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
              <input required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className={cls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">CPF *</label>
              <input required value={form.cpf} onChange={e=>setForm(f=>({...f,cpf:e.target.value}))} placeholder="000.000.000-00" className={cls} />
            </div>
            {/* ... outros campos ... */}
            <div className="md:col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={()=>setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button type="submit" disabled={saving} className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
                {saving ? 'Salvando...' : '✓ Cadastrar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* BARRA DE BUSCA */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nome..."
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button type="submit" className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm hover:bg-gray-200">🔍</button>
      </form>

      {/* ÁREA DA TABELA */}
      {loading ? (
        // Se estiver carregando, mostra a rodinha
        <div className="flex justify-center py-16"><div className="animate-spin w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full" /></div>
      ) : patients.length === 0 ? (
        // Se a lista estiver vazia, mostra o dente
        <div className="bg-white rounded-xl border py-16 text-center"><span className="text-4xl block mb-3">🦷</span><p className="text-gray-400 text-sm">Nenhum paciente encontrado.</p></div>
      ) : (
        // Se tiver paciente, desenha a tabela
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {/* Cabeçalho da tabela */}
                {['#','Nome','CPF','Status','Ações'].map(h=><th key={h} className="text-left py-3 px-4 font-medium text-gray-600 text-xs">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {/* Para CADA paciente (p) na lista, cria uma linha (tr) */}
              {patients.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-gray-400 text-xs">#{p.id}</td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.email}</p>
                  </td>
                  <td className="py-3 px-4 font-mono text-gray-600 text-xs">{p.cpf}</td>
                  <td className="py-3 px-4">
                    {/* Muda a cor do fundo se o paciente estiver Ativo ou Inativo */}
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${p.active?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>
                      {p.active ? '● Ativo' : '○ Inativo'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {/* Só mostra o botão desativar se o paciente estiver ativo */}
                    {p.active && (
                      <button onClick={()=>handleDeactivate(p.id,p.name)} className="text-xs text-red-500 hover:text-red-700">Desativar</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageLayout>
  )
}