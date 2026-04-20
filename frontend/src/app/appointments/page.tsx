'use client'
import { useState, useEffect, useCallback } from 'react'
import PageLayout from '@/components/layout/PageLayout'
import { appointmentApi, patientApi, Appointment, Patient } from '@/lib/api'
import { Calendar } from 'react-bootstrap-icons'

// Status com cores adaptativas e transparência
const STATUS: Record<string,{label:string;color:string}> = {
  SCHEDULED: { label:'Agendado',   color:'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'    },
  CONFIRMED: { label:'Confirmado', color:'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300'  },
  COMPLETED: { label:'Realizado',  color:'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-300'    },
  CANCELLED: { label:'Cancelado',  color:'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300'      },
  NO_SHOW:   { label:'Não veio',   color:'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300'},
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
  const [isMounted, setIsMounted] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const pats = await patientApi.findAll()
      setPatients(pats)
      const all: Appointment[] = []
      for (const p of pats.filter(p=>p.active).slice(0,15)) {
        try { all.push(...await appointmentApi.findByPatient(p.id)) } catch {}
      }
      setAppts(all.sort((a,b) => new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime()))
    } catch { setError('Erro ao carregar agendamentos.') }
    finally   { setLoading(false) }
  }, [])

  useEffect(() => { 
    setIsMounted(true)
    load() 
  }, [load])

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

  if (!isMounted) return null

  const inputCls = "w-full bg-white/50 dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-lumay-blue dark:focus:ring-blue-500 transition-all"

  return (
    <PageLayout
      title="Agendamentos"
      subtitle="Gestão de Consultas"
      action={
        <button onClick={()=>setShowForm(!showForm)}
          className="bg-lumay-blue text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 transition-all shadow-md active:scale-95">
          {showForm ? '✕ Fechar Cadastro' : '+ Novo Agendamento'}
        </button>
      }
    >
      {/* Formulário com Efeito Vidro */}
      {showForm && (
        <div className="bg-white/80 dark:bg-black/50 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 p-6 mb-6 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="font-black text-slate-800 dark:text-white mb-6 uppercase tracking-tight">Novo Agendamento</h2>
          {formErr && <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl p-4 text-sm mb-6 font-medium">⚠️ {formErr}</div>}
          
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Paciente *</label>
              <select required value={form.patientId} onChange={e=>setForm(f=>({...f,patientId:e.target.value}))} className={inputCls}>
                <option value="" className="dark:bg-slate-800">Selecione...</option>
                {patients.filter(p=>p.active).map(p=><option key={p.id} value={p.id} className="dark:bg-slate-800">{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Procedimento *</label>
              <select required value={form.procedure} onChange={e=>setForm(f=>({...f,procedure:e.target.value}))} className={inputCls}>
                <option value="" className="dark:bg-slate-800">Selecione...</option>
                {PROCEDURES.map(p=><option key={p} value={p} className="dark:bg-slate-800">{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Início *</label>
              <input required type="datetime-local" value={form.startDateTime} onChange={e=>setForm(f=>({...f,startDateTime:e.target.value}))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Fim *</label>
              <input required type="datetime-local" value={form.endDateTime} onChange={e=>setForm(f=>({...f,endDateTime:e.target.value}))} className={inputCls} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Observações</label>
              <input value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Detalhes opcionais..." className={inputCls} />
            </div>
            <div className="md:col-span-2 flex gap-3 justify-end mt-2 pt-4 border-t border-slate-200 dark:border-white/10">
              <button type="button" onClick={()=>setShowForm(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">Cancelar</button>
              <button type="submit" disabled={saving} className="px-6 py-2.5 text-sm font-bold bg-lumay-blue dark:bg-blue-600 text-white rounded-xl hover:bg-blue-800 dark:hover:bg-blue-500 shadow-md disabled:opacity-50 transition-all">{saving?'Agendando...':'✓ Salvar Consulta'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Lista Glassmorphism */}
      <div className="bg-white/80 dark:bg-black/50 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden relative z-10">
        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-lumay-blue dark:border-blue-500 border-t-transparent rounded-full" /></div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 bg-red-500/5 font-bold">{error}</div>
        ) : appts.length === 0 ? (
          <div className="py-20 text-center"><span className="text-5xl block mb-4"><Calendar/></span><p className="text-slate-500 dark:text-slate-400 font-medium">Nenhum agendamento.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                <tr>{['Paciente','Procedimento','Data/Hora','Status','Ações'].map(h=><th key={h} className="text-left py-4 px-6 font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px]">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {appts.map(a => {
                  const st   = STATUS[a.status]
                  const dt   = new Date(a.startDateTime)
                  const past = dt < new Date()
                  const canAct = !['COMPLETED','CANCELLED','NO_SHOW'].includes(a.status)
                  return (
                    <tr key={a.id} className={`hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group ${past && canAct ? 'bg-yellow-50/50 dark:bg-yellow-500/5' : ''}`}>
                      <td className="py-4 px-6 font-black text-slate-800 dark:text-white uppercase">{a.patientName ?? '—'}</td>
                      <td className="py-4 px-6 text-slate-600 dark:text-slate-300 font-medium">{a.procedure}</td>
                      <td className="py-4 px-6">
                        <span className="font-bold text-slate-800 dark:text-white">{dt.toLocaleDateString('pt-BR')}</span>
                        <span className="text-slate-500 dark:text-slate-400 ml-2 font-mono text-xs bg-slate-100 dark:bg-white/10 px-2 py-1 rounded-md">{dt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</span>
                      </td>
                      <td className="py-4 px-6"><span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${st?.color}`}>{st?.label}</span></td>
                      <td className="py-4 px-6">
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {a.status==='SCHEDULED' && <button onClick={()=>act(a.id,'confirm')} className="px-3 py-1.5 rounded-lg text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 hover:bg-green-100 dark:hover:bg-green-500/20">Confirmar</button>}
                          {canAct && ['SCHEDULED','CONFIRMED'].includes(a.status) && <button onClick={()=>act(a.id,'complete')} className="px-3 py-1.5 rounded-lg text-xs font-bold text-lumay-blue dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20">Concluir</button>}
                          {canAct && <button onClick={()=>act(a.id,'cancel')} className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20">Cancelar</button>}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageLayout>
  )
}