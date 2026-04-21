'use client' // Avisa que a página é interativa (tem botões e cliques)

import { useState, useEffect, useCallback } from 'react'
import PageLayout from '@/components/layout/PageLayout'
// Importamos os "mensageiros" (api) e as definições de como são os dados
import { appointmentApi, patientApi, Appointment, Patient } from '@/lib/api'

// 1. DICIONÁRIO DE STATUS: Para não escrever "SCHEDULED" na tela, 
// a gente usa esse mapa para mostrar "Agendado" com cores bonitas.
const STATUS: Record<string,{label:string;color:string}> = {
  SCHEDULED: { label:'Agendado',   color:'bg-blue-100 text-blue-700'    },
  CONFIRMED: { label:'Confirmado', color:'bg-green-100 text-green-700'  },
  COMPLETED: { label:'Realizado',  color:'bg-gray-100 text-gray-600'    },
  CANCELLED: { label:'Cancelado',  color:'bg-red-100 text-red-600'      },
  NO_SHOW:   { label:'Não veio',   color:'bg-orange-100 text-orange-700'},
}

// Lista fixa de procedimentos para aparecer no campo de "Seleção"
const PROCEDURES = ['Limpeza dental','Clareamento dental','Consulta de avaliação','Restauração','Extração','Canal','Ortodontia','Outro']

export default function AppointmentsPage() {
  // --- MEMÓRIA (ESTADOS) ---
  const [appts,    setAppts]    = useState<Appointment[]>([]) // Lista de consultas
  const [patients, setPatients] = useState<Patient[]>([])     // Lista de pacientes (para escolher no cadastro)
  const [loading,  setLoading]  = useState(true)               // Rodinha de carregamento
  const [error,    setError]    = useState('')                 // Mensagem de erro
  const [showForm, setShowForm] = useState(false)              // Mostrar ou esconder formulário
  const [form,     setForm]     = useState({ patientId:'', startDateTime:'', endDateTime:'', procedure:'', notes:'' })
  const [formErr,  setFormErr]  = useState('')
  const [saving,   setSaving]   = useState(false)

  // --- FUNÇÃO 1: CARREGAR DADOS (O MOTOR) ---
  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      // BUSCA OS PACIENTES PRIMEIRO (Para saber quem pode agendar)
      const pats = await patientApi.findAll() // AQUI FOI O CONSERTO!
      setPatients(pats)

      // BUSCA AS CONSULTAS (Lógica simples para pegar os primeiros pacientes)
      const all: Appointment[] = []
      // Percorre os pacientes ativos e traz os agendamentos deles
      for (const p of pats.filter(p=>p.active).slice(0,15)) {
        try { all.push(...await appointmentApi.byPatient(p.id)) } catch {}
      }
      
      // Organiza por data (o mais recente primeiro)
      setAppts(all.sort((a,b) => new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime()))
    } catch { 
      setError('Erro ao carregar agendamentos.') 
    } finally { 
      setLoading(false) 
    }
  }, [])

  // Faz a página carregar tudo assim que abre
  useEffect(() => { load() }, [load])

  // --- FUNÇÃO 2: CRIAR NOVO AGENDAMENTO ---
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setFormErr(''); setSaving(true)
    try {
      await appointmentApi.create({
        patientId: Number(form.patientId),
        // Adicionamos ':00' no final porque o banco de dados espera segundos
        startDateTime: form.startDateTime + ':00', 
        endDateTime:   form.endDateTime   + ':00',
        procedure: form.procedure,
        notes: form.notes || undefined,
      })
      setShowForm(false); // Fecha o formulário
      setForm({ patientId:'', startDateTime:'', endDateTime:'', procedure:'', notes:'' }); // Limpa
      load(); // Atualiza a lista
    } catch (err: any) { 
      setFormErr(err?.response?.data?.detail ?? 'Erro ao criar agendamento.') 
    } finally { 
      setSaving(false) 
    }
  }

  // --- FUNÇÃO 3: BOTÕES DE AÇÃO (Confirmar, Cancelar, Concluir) ---
  async function act(id: number, action: 'confirm'|'cancel'|'complete') {
    const labels = { confirm:'confirmar', cancel:'cancelar', complete:'concluir' }
    if (!confirm(`Deseja ${labels[action]} este agendamento?`)) return
    try {
      // O JavaScript permite chamar funções pelo nome: appointmentApi['confirm'](id)
      await appointmentApi[action](id); 
      load(); // Recarrega a lista para mudar o status na tela
    } catch (err: any) { 
      alert(err?.response?.data?.detail ?? 'Erro.') 
    }
  }

  // Estilo das caixas de texto
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
      {/* FORMULÁRIO DE NOVO AGENDAMENTO */}
      {showForm && (
        <div className="bg-white rounded-xl border border-blue-200 p-5 mb-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">+ Novo Agendamento</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* SELEÇÃO DO PACIENTE */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Paciente *</label>
              <select required value={form.patientId} onChange={e=>setForm(f=>({...f,patientId:e.target.value}))} className={cls}>
                <option value="">Selecione...</option>
                {/* Só mostra na lista quem está ATIVO */}
                {patients.filter(p=>p.active).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            {/* ... CAMPOS DE DATA E HORA ... */}
            <div className="md:col-span-2 flex gap-3 justify-end">
              <button type="submit" disabled={saving} className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                {saving ? 'Salvando...' : '✓ Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TABELA DE CONSULTAS */}
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
                // canAct: Verifica se o agendamento NÃO está finalizado ou cancelado
                const canAct = !['COMPLETED','CANCELLED','NO_SHOW'].includes(a.status)
                
                return (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{a.patientName}</td>
                    <td className="py-3 px-4 text-gray-600">{a.procedure}</td>
                    <td className="py-3 px-4">
                      <span className="font-medium">{dt.toLocaleDateString('pt-BR')}</span>
                    </td>
                    <td className="py-3 px-4">
                      {/* Mostra o crachá colorido do Status */}
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${st?.color}`}>
                        {st?.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {/* BOTÕES DE AÇÃO DINÂMICOS */}
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