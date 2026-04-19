'use client'
import { useState, useEffect, useCallback } from 'react'
import PageLayout from '@/components/layout/PageLayout'
import { appointmentApi, patientApi, Appointment, Patient } from '@/lib/api'

const STATUS: Record<string,{label:string;color:string}> = {
  SCHEDULED: { label:'Agendado',   color:'bg-blue-100 text-blue-700'    },
  CONFIRMED: { label:'Confirmado', color:'bg-green-100 text-green-700'  },
  COMPLETED: { label:'Realizado',  color:'bg-gray-100 text-gray-600'    },
  CANCELLED: { label:'Cancelado',  color:'bg-red-100 text-red-600'      },
  NO_SHOW:   { label:'Não veio',   color:'bg-orange-100 text-orange-700'},
}
const PROCEDURES = ['Limpeza dental','Clareamento dental','Consulta de avaliação','Restauração','Extração','Canal','Ortodontia','Outro']

export default function AppointmentsPage() {
  const [appts,    setAppts]    = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form,     setForm]     = useState({ patientId:'', startDateTime:'', endDateTime:'', procedure:'', notes:'' })
  const [formErr,  setFormErr]  = useState('')
  const [saving,   setSaving]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const pats = await patientApi.list()
      setPatients(pats)
      // Busca próximos 30 dias
      const s = new Date().toISOString().slice(0,19)
      const e = new Date(Date.now()+30*86400000).toISOString().slice(0,19)
      const all: Appointment[] = []
      for (const p of pats.filter(p=>p.active).slice(0,15)) {
        try { all.push(...await appointmentApi.byPatient(p.id)) } catch {}
      }
      setAppts(all.sort((a,b) => new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime()))
    } catch { setError('Erro ao carregar agendamentos.') }
    finally   { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setFormErr(''); setSaving(true)
    try {
      await appointmentApi.create({
        patientId: Number(form.patientId),
        startDateTime: form.startDateTime + ':00',
        endDateTime:   form.endDateTime   + ':00',
        procedure: form.procedure,
        notes: form.notes || undefined,
      })
      setShowForm(false); setForm({ patientId:'', startDateTime:'', endDateTime:'', procedure:'', notes:'' }); load()
    } catch (err: any) { setFormErr(err?.response?.data?.detail ?? 'Erro ao criar agendamento.') }
    finally { setSaving(false) }
  }

  async function act(id: number, action: 'confirm'|'cancel'|'complete') {
    const labels = { confirm:'confirmar', cancel:'cancelar', complete:'concluir' }
    if (!confirm(`Deseja ${labels[action]} este agendamento?`)) return
    try { await appointmentApi[action](id); load() } catch (err: any) { alert(err?.response?.data?.detail ?? 'Erro.') }
  }

  const cls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

  return (
    <PageLayout
      title="📅 Agendamentos"
      subtitle="Gestão de consultas"
      action={
        <button onClick={()=>setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          {showForm ? '✕ Fechar' : '+ Novo Agendamento'}
        </button>
      }
    >
      {/* Formulário */}
      {showForm && (
        <div className="bg-white rounded-xl border border-blue-200 p-5 mb-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">+ Novo Agendamento</h2>
          {formErr && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">⚠️ {formErr}</div>}
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Paciente *</label>
              <select required value={form.patientId} onChange={e=>setForm(f=>({...f,patientId:e.target.value}))} className={cls}>
                <option value="">Selecione...</option>
                {patients.filter(p=>p.active).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Procedimento *</label>
              <select required value={form.procedure} onChange={e=>setForm(f=>({...f,procedure:e.target.value}))} className={cls}>
                <option value="">Selecione...</option>
                {PROCEDURES.map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Início *</label>
              <input required type="datetime-local" value={form.startDateTime} onChange={e=>setForm(f=>({...f,startDateTime:e.target.value}))} min={new Date().toISOString().slice(0,16)} className={cls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fim *</label>
              <input required type="datetime-local" value={form.endDateTime} onChange={e=>setForm(f=>({...f,endDateTime:e.target.value}))} min={form.startDateTime} className={cls} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Observações</label>
              <input value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} className={cls} />
            </div>
            <div className="md:col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={()=>setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button type="submit" disabled={saving} className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">{saving?'Salvando...':'✓ Salvar'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full" /></div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">{error}</div>
      ) : appts.length === 0 ? (
        <div className="bg-white rounded-xl border py-16 text-center"><span className="text-4xl block mb-3">📅</span><p className="text-gray-400 text-sm">Nenhum agendamento.</p></div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>{['Paciente','Procedimento','Data/Hora','Status','Ações'].map(h=><th key={h} className="text-left py-3 px-4 font-medium text-gray-600 text-xs">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {appts.map(a => {
                const st   = STATUS[a.status]
                const dt   = new Date(a.startDateTime)
                const past = dt < new Date()
                const canAct = !['COMPLETED','CANCELLED','NO_SHOW'].includes(a.status)
                return (
                  <tr key={a.id} className={`hover:bg-gray-50 ${past && canAct ? 'bg-yellow-50/30' : ''}`}>
                    <td className="py-3 px-4 font-medium">{a.patientName ?? '—'}</td>
                    <td className="py-3 px-4 text-gray-600">{a.procedure}</td>
                    <td className="py-3 px-4">
                      <span className="font-medium">{dt.toLocaleDateString('pt-BR')}</span>
                      <span className="text-gray-500 ml-1">{dt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</span>
                    </td>
                    <td className="py-3 px-4"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${st?.color}`}>{st?.label}</span></td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {a.status==='SCHEDULED' && <button onClick={()=>act(a.id,'confirm')} className="text-xs text-green-600 hover:text-green-800 font-medium">Confirmar</button>}
                        {canAct && ['SCHEDULED','CONFIRMED'].includes(a.status) && <button onClick={()=>act(a.id,'complete')} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Concluir</button>}
                        {canAct && <button onClick={()=>act(a.id,'cancel')} className="text-xs text-red-500 hover:text-red-700">Cancelar</button>}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </PageLayout>
  )
}
