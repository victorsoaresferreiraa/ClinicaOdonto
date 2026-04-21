'use client'

import { useState, useEffect, useCallback } from 'react'
import PageLayout from '@/components/layout/PageLayout'
import { appointmentApi, patientApi, Appointment, Patient } from '@/lib/api'

// Dicionário de status para cores e nomes amigáveis
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
      const pats = await patientApi.findAll()
      setPatients(pats)
      const all: Appointment[] = []
      for (const p of pats.filter(p=>p.active).slice(0,15)) {
        try { all.push(...await appointmentApi.findByPatient(p.id)) } catch {}
      }
      setAppts(all.sort((a,b) => new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime()))
    } catch { 
      setError('Erro ao carregar agendamentos.') 
    } finally { 
      setLoading(false) 
    }
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
    } catch (err: any) { 
      setFormErr(err?.response?.data?.detail ?? 'Erro ao criar agendamento.') 
    } finally { 
      setSaving(false) 
    }
  }

  async function act(id: number, action: 'confirm'|'cancel'|'complete') {
    const labels = { confirm:'confirmar', cancel:'cancelar', complete:'concluir' }
    if (!confirm(`Deseja ${labels[action]} este agendamento?`)) return
    try {
      await appointmentApi[action](id); 
      load();
    } catch (err: any) { 
      alert(err?.response?.data?.detail ?? 'Erro.') 
    }
  }

  const cls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

  return (
    <PageLayout
      title="📅 Agendamentos"
      subtitle="Gestão de consultas"
      action={
        <button onClick={()=>setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          {showForm ? '✕ Fechar' : '+ Novo Agendamento'}
        </button>
      }
    >
      {showForm && (
        <div className="bg-white rounded-xl border border-blue-200 p-5 mb-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">+ Novo Agendamento</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Paciente *</label>
              <select required value={form.patientId} onChange={e=>setForm(f=>({...f,patientId:e.target.value}))} className={cls}>
                <option value="">Selecione...</option>
                {patients.filter(p=>p.active).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-2 flex gap-3 justify-end">
              <button type="submit" disabled={saving} className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                {saving ? 'Salvando...' : '✓ Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>{['Paciente','Procedimento','Data/Hora','Status','Ações'].map(h=><th key={h} className="text-left py-3 px-4 text-gray-600 text-xs">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {appts.map(a => {
                const st = STATUS[a.status]
                const dt = new Date(a.startDateTime)
                const canAct = !['COMPLETED','CANCELLED','NO_SHOW'].includes(a.status)
                return (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{a.patientName}</td>
                    <td className="py-3 px-4 text-gray-600">{a.procedure}</td>
                    <td className="py-3 px-4">
                      <span className="font-medium">{dt.toLocaleDateString('pt-BR')}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${st?.color}`}>
                        {st?.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {a.status==='SCHEDULED' && <button onClick={()=>act(a.id,'confirm')} className="text-xs text-green-600">Confirmar</button>}
                        {canAct && <button onClick={()=>act(a.id,'complete')} className="text-xs text-blue-600">Concluir</button>}
                        {canAct && <button onClick={()=>act(a.id,'cancel')} className="text-xs text-red-500">Cancelar</button>}
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