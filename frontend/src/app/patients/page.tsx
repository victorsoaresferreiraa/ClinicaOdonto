'use client'
import { useState, useEffect, useCallback } from 'react'
import PageLayout from '@/components/layout/PageLayout'
import { patientApi, Patient, CreatePatientReq } from '@/lib/api'

export default function PatientsPage() {
  const [patients,  setPatients]  = useState<Patient[]>([])
  const [search,    setSearch]    = useState('')
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [showForm,  setShowForm]  = useState(false)
  const [form,      setForm]      = useState<CreatePatientReq>({ name:'', cpf:'', email:'', phone:'', birthDate:'', medicalNotes:'' })
  const [formErr,   setFormErr]   = useState('')
  const [saving,    setSaving]    = useState(false)

  const load = useCallback(async (q?: string) => {
    setLoading(true); setError('')
    try {
      setPatients(q ? await patientApi.search(q) : await patientApi.list())
    } catch { setError('Erro ao carregar. Verifique se o backend está rodando.') }
    finally   { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault(); load(search.trim() || undefined)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setFormErr(''); setSaving(true)
    try {
      await patientApi.create({ ...form, email:form.email||undefined, phone:form.phone||undefined, birthDate:form.birthDate||undefined, medicalNotes:form.medicalNotes||undefined })
      setShowForm(false)
      setForm({ name:'', cpf:'', email:'', phone:'', birthDate:'', medicalNotes:'' })
      load()
    } catch (err: any) { setFormErr(err?.response?.data?.detail ?? 'Erro ao cadastrar.') }
    finally { setSaving(false) }
  }

  async function handleDeactivate(id: number, name: string) {
    if (!confirm(`Desativar "${name}"?`)) return
    try { await patientApi.deactivate(id); load() } catch { alert('Erro ao desativar.') }
  }

  const cls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

  return (
    <PageLayout
      title="👥 Pacientes"
      subtitle={`${patients.length} paciente(s) ativo(s)`}
      action={
        <button onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          {showForm ? '✕ Fechar' : '+ Novo Paciente'}
        </button>
      }
    >
      {/* Formulário */}
      {showForm && (
        <div className="bg-white rounded-xl border border-blue-200 p-5 mb-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">+ Cadastrar Paciente</h2>
          {formErr && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">⚠️ {formErr}</div>}
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label><input required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className={cls} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">CPF *</label><input required value={form.cpf} onChange={e=>setForm(f=>({...f,cpf:e.target.value}))} placeholder="000.000.000-00" className={cls} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Telefone</label><input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="11999999999" className={cls} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Email</label><input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} className={cls} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Nascimento</label><input type="date" value={form.birthDate} onChange={e=>setForm(f=>({...f,birthDate:e.target.value}))} className={cls} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Observações</label><input value={form.medicalNotes} onChange={e=>setForm(f=>({...f,medicalNotes:e.target.value}))} placeholder="Alergias, medicamentos..." className={cls} /></div>
            <div className="md:col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={()=>setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button type="submit" disabled={saving} className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">{saving?'Salvando...':'✓ Cadastrar'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Busca */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nome..."
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button type="submit" className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm hover:bg-gray-200">🔍</button>
        {search && <button type="button" onClick={()=>{setSearch('');load()}} className="px-3 py-2 text-gray-500 hover:text-gray-800 text-sm">✕</button>}
      </form>

      {/* Tabela */}
      {loading ? (
        <div className="flex justify-center py-16 gap-3">
          <div className="animate-spin w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full" />
          <span className="text-gray-500 text-sm">Carregando...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-5 text-sm">
          <p className="font-medium mb-1">⚠️ Erro de conexão</p><p>{error}</p>
          <button onClick={()=>load()} className="mt-3 text-blue-600 underline text-xs">Tentar novamente</button>
        </div>
      ) : patients.length === 0 ? (
        <div className="bg-white rounded-xl border py-16 text-center">
          <span className="text-4xl block mb-3">🦷</span>
          <p className="text-gray-400 text-sm">{search ? `Nenhum resultado para "${search}"` : 'Nenhum paciente cadastrado.'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>{['#','Nome','CPF','Telefone','Status','Ações'].map(h=><th key={h} className="text-left py-3 px-4 font-medium text-gray-600 text-xs">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {patients.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-gray-400 text-xs">#{p.id}</td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-900">{p.name}</p>
                    {p.email && <p className="text-xs text-gray-400">{p.email}</p>}
                  </td>
                  <td className="py-3 px-4 font-mono text-gray-600 text-xs">{p.cpf}</td>
                  <td className="py-3 px-4 text-gray-600">{p.phone ?? '—'}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${p.active?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>
                      {p.active ? '● Ativo' : '○ Inativo'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
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
