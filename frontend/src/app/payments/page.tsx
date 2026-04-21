'use client' // Componente interativo (possui filtros e botões de ação)

import { useState, useEffect, useCallback } from 'react'
import PageLayout from '@/components/layout/PageLayout'
// Importamos o mensageiro do financeiro e os tipos de dados
import { paymentApi, Payment, PayStatus } from '@/lib/api'

// 1. DICIONÁRIO DE STATUS: Mapeia o código que vem do Java para textos e cores amigáveis
const ST: Record<PayStatus,{label:string;color:string;icon:string}> = {
  PENDING:   { label:'Pendente',  color:'bg-yellow-100 text-yellow-800', icon:'⏳' },
  PAID:      { label:'Pago',      color:'bg-green-100 text-green-800',   icon:'✅' },
  OVERDUE:   { label:'Vencido',   color:'bg-red-100 text-red-800',       icon:'🔴' },
  REFUNDED:  { label:'Estornado', color:'bg-gray-100 text-gray-600',     icon:'↩️' },
  CANCELLED: { label:'Cancelado', color:'bg-gray-100 text-gray-400',     icon:'❌' },
}

// 2. DICIONÁRIO DE MÉTODOS: Traduz o nome técnico do banco para o nome que o usuário entende
const METHODS: Record<string,string> = { 
  PIX:'PIX', 
  CARTAO_CREDITO:'Crédito', 
  CARTAO_DEBITO:'Débito', 
  DINHEIRO:'Dinheiro', 
  CONVENIO:'Convênio', 
  TRANSFERENCIA:'Transferência' 
}

// Utilitário para formatar valores em Reais (R$)
const fmt = (v: number) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v)

export default function PaymentsPage() {
  // --- ESTADOS (MEMÓRIA) ---
  const [payments, setPayments] = useState<Payment[]>([]) // Lista de cobranças
  const [filter,   setFilter]   = useState<PayStatus>('PENDING') // Filtro atual (começa em Pendentes)
  const [loading,  setLoading]  = useState(true) // Controle da rodinha de carregar
  const [error,    setError]    = useState('') // Mensagem de erro

  // FUNÇÃO 1: Buscar cobranças no banco de acordo com o filtro
  const load = useCallback(async () => {
    setLoading(true)
    try { 
      // AQUI FOI O CONSERTO: Mudamos de byStatus para findByStatus
      const data = await paymentApi.findByStatus(filter)
      setPayments(data)
      setError('') 
    }
    catch { setError('Erro ao carregar os dados financeiros.') }
    finally { setLoading(false) }
  }, [filter]) // Toda vez que o botão de filtro mudar, ele roda essa função de novo

  // Carrega os dados assim que a tela abre
  useEffect(() => { load() }, [load])

  // FUNÇÃO 2: Confirmar Recebimento
  async function handlePay(id: number) {
    if (!confirm('Deseja marcar esta cobrança como PAGA?')) return
    try { 
      // CONSERTO: Mudamos de pay para markAsPaid (nome que está no seu api.ts)
      await paymentApi.markAsPaid(id) 
      load() // Atualiza a lista
    } catch { alert('Erro ao processar pagamento.') }
  }

  // FUNÇÃO 3: Cancelar Cobrança
  async function handleCancel(id: number) {
    if (!confirm('Tem certeza que deseja CANCELAR esta cobrança?')) return
    try { 
      await paymentApi.cancel(id) 
      load() 
    } catch { alert('Erro ao cancelar.') }
  }

  // CÁLCULO: Soma o valor de todos os itens aparecendo na tela agora
  const total = payments.reduce((s,p)=>s+(p.finalAmount??p.amount),0)

  return (
    <PageLayout title="💰 Financeiro" subtitle="Gestão de cobranças e fluxo de caixa">
      
      {/* BOTÕES DE FILTRO (Pendente, Pago, Vencido, etc) */}
      <div className="flex gap-2 flex-wrap mb-4">
        {(['PENDING','PAID','OVERDUE','CANCELLED'] as PayStatus[]).map(s => (
          <button key={s} onClick={()=>setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${filter===s?'bg-blue-600 text-white border-blue-600 shadow-md':'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}>
            {ST[s].icon} {ST[s].label}
          </button>
        ))}
      </div>

      {/* RESUMO DE VALORES */}
      {payments.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4 text-sm text-blue-700 flex justify-between items-center">
          <span>Mostrando {payments.length} cobrança(s)</span>
          <span className="text-lg">Total: <strong>{fmt(total)}</strong></span>
        </div>
      )}

      {/* ÁREA DA TABELA */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full" /></div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-center font-medium">⚠️ {error}</div>
      ) : payments.length === 0 ? (
        <div className="bg-white rounded-xl border py-16 text-center">
          <span className="text-4xl block mb-3">💸</span>
          <p className="text-gray-400 text-sm font-medium">Nenhum registro encontrado para este filtro.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Paciente','Descrição','Vencimento','Valor','Forma','Status','Ações'].map(h=>(
                  <th key={h} className="py-3 px-4 font-bold text-gray-600 text-[10px] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map(p => {
                const st = ST[p.status]
                // Lógica para saber se está atrasado (Pendente + Data passou de hoje)
                const isOverdue = p.status==='PENDING' && new Date(p.dueDate) < new Date()
                
                return (
                  <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${isOverdue ? 'bg-red-50/50' : ''}`}>
                    <td className="py-3 px-4 font-bold text-gray-900">{p.patientName}</td>
                    <td className="py-3 px-4 text-gray-500 max-w-[160px] truncate">{p.description}</td>
                    <td className="py-3 px-4">
                      <span className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
                        {new Date(p.dueDate).toLocaleDateString('pt-BR')}
                        {isOverdue && ' ⚠️'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-black text-gray-900">{fmt(p.finalAmount ?? p.amount)}</td>
                    <td className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase">
                      {METHODS[p.paymentMethod] ?? p.paymentMethod}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${st.color}`}>
                        {st.icon} {st.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-3">
                        {/* Só mostra botões de ação se a conta estiver Pendente */}
                        {p.status === 'PENDING' && (
                          <>
                            <button onClick={()=>handlePay(p.id)} className="text-[10px] font-black text-green-600 hover:text-green-800 uppercase tracking-tighter">
                              ✓ Confirmar
                            </button>
                            <button onClick={()=>handleCancel(p.id)} className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-tighter">
                              Cancelar
                            </button>
                          </>
                        )}
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