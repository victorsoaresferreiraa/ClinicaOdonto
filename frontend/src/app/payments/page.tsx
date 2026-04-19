'use client'
import { useState, useEffect, useCallback } from 'react'
import PageLayout from '@/components/layout/PageLayout'
import { paymentApi, Payment, PayStatus } from '@/lib/api'

const ST: Record<PayStatus,{label:string;color:string;icon:string}> = {
  PENDING:   { label:'Pendente',  color:'bg-yellow-100 text-yellow-800', icon:'⏳' },
  PAID:      { label:'Pago',      color:'bg-green-100 text-green-800',   icon:'✅' },
  OVERDUE:   { label:'Vencido',   color:'bg-red-100 text-red-800',       icon:'🔴' },
  REFUNDED:  { label:'Estornado', color:'bg-gray-100 text-gray-600',     icon:'↩️' },
  CANCELLED: { label:'Cancelado', color:'bg-gray-100 text-gray-400',     icon:'❌' },
}
const METHODS: Record<string,string> = { PIX:'PIX', CARTAO_CREDITO:'Crédito', CARTAO_DEBITO:'Débito', DINHEIRO:'Dinheiro', CONVENIO:'Convênio', TRANSFERENCIA:'Transferência' }
const fmt = (v: number) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v)

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [filter,   setFilter]   = useState<PayStatus>('PENDING')
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try { setPayments(await paymentApi.byStatus(filter)); setError('') }
    catch { setError('Erro ao carregar.') }
    finally { setLoading(false) }
  }, [filter])

  useEffect(() => { load() }, [load])

  async function handlePay(id: number) {
    if (!confirm('Confirmar pagamento?')) return
    try { await paymentApi.pay(id); load() } catch { alert('Erro.') }
  }
  async function handleCancel(id: number) {
    if (!confirm('Cancelar cobrança?')) return
    try { await paymentApi.cancel(id); load() } catch { alert('Erro.') }
  }

  const total = payments.reduce((s,p)=>s+(p.finalAmount??p.amount),0)

  return (
    <PageLayout title="💰 Financeiro" subtitle="Cobranças e pagamentos">
      <div className="flex gap-2 flex-wrap mb-4">
        {(['PENDING','PAID','OVERDUE','CANCELLED'] as PayStatus[]).map(s => (
          <button key={s} onClick={()=>setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${filter===s?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}>
            {ST[s].icon} {ST[s].label}
          </button>
        ))}
      </div>

      {payments.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4 text-sm text-blue-700 font-medium">
          Total: <strong>{fmt(total)}</strong> — {payments.length} cobranças
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full" /></div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">{error}</div>
      ) : payments.length === 0 ? (
        <div className="bg-white rounded-xl border py-16 text-center"><span className="text-4xl block mb-3">💸</span><p className="text-gray-400 text-sm">Nenhuma cobrança.</p></div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>{['Paciente','Descrição','Vencimento','Valor','Forma','Status','Ações'].map(h=><th key={h} className="text-left py-3 px-4 font-medium text-gray-600 text-xs">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map(p => {
                const st = ST[p.status]
                const ov = p.status==='PENDING' && new Date(p.dueDate)<new Date()
                return (
                  <tr key={p.id} className={`hover:bg-gray-50 ${ov?'bg-red-50/30':''}`}>
                    <td className="py-3 px-4 font-medium">{p.patientName}</td>
                    <td className="py-3 px-4 text-gray-600 max-w-[160px] truncate">{p.description}</td>
                    <td className="py-3 px-4"><span className={ov?'text-red-600 font-medium':'text-gray-600'}>{new Date(p.dueDate).toLocaleDateString('pt-BR')}{ov?' ⚠️':''}</span></td>
                    <td className="py-3 px-4 font-bold">{fmt(p.finalAmount??p.amount)}</td>
                    <td className="py-3 px-4 text-xs text-gray-500">{METHODS[p.paymentMethod]??p.paymentMethod}</td>
                    <td className="py-3 px-4"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>{st.icon} {st.label}</span></td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {p.status==='PENDING' && <>
                          <button onClick={()=>handlePay(p.id)} className="text-xs text-green-600 hover:text-green-800 font-medium">✅ Pagar</button>
                          <button onClick={()=>handleCancel(p.id)} className="text-xs text-red-500 hover:text-red-700">Cancelar</button>
                        </>}
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
