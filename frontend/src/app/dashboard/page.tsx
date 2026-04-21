'use client'

import { useState, useEffect } from 'react'
import PageLayout from '@/components/layout/PageLayout'
import { dashboardApi, DashboardData } from '@/lib/api'
import { Calendar, PeopleFill, Plus, Cash, Hourglass, Ban, GraphUp, ExclamationTriangleFill } from 'react-bootstrap-icons'

// --- UTILITÁRIOS ---
const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' }).format(v)

const statusLabel: Record<string,{label:string;color:string}> = {
  SCHEDULED: { label:'Agendado',   color:'bg-blue-100 text-blue-700 dark:bg-blue-500/20' },
  CONFIRMED: { label:'Confirmado', color:'bg-green-100 text-green-700 dark:bg-green-500/20' },
  COMPLETED: { label:'Realizado',  color:'bg-gray-100 text-gray-600 dark:bg-gray-500/20' },
  CANCELLED: { label:'Cancelado',  color:'bg-red-100 text-red-600 dark:bg-red-500/20' },
}

// --- SUB-COMPONENTES ---
function KpiCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white dark:bg-black/50 rounded-xl border border-gray-200 dark:border-white/10 p-4 shadow-sm hover:scale-[1.02] transition-all">
      <div className="text-2xl mb-2 text-blue-600">{icon}</div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5 font-medium uppercase tracking-wider">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  )
}

function BarChart({ data }: { data: { monthLabel:string; revenue:number }[] }) {
  const max = Math.max(...data.map(d=>d.revenue), 1)
  return (
    <div className="flex items-end gap-2 h-32 mt-4">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
          {d.revenue > 0 && <span className="text-[10px] text-gray-400">{(d.revenue/1000).toFixed(1)}k</span>}
          <div className={`w-full rounded-t-md transition-all ${i===data.length-1?'bg-blue-600':'bg-blue-200 group-hover:bg-blue-300'}`}
               style={{ height: `${Math.max((d.revenue/max)*100, 4)}%` }} />
          <span className="text-[10px] text-gray-400 text-center font-bold uppercase">{d.monthLabel}</span>
        </div>
      ))}
    </div>
  )
}

// --- PÁGINA PRINCIPAL ---
export default function DashboardPage() {
  const [data, setData] = useState<DashboardData|null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    dashboardApi.get()
      .then(setData)
      .catch(() => setError('Erro ao carregar dashboard. Verifique o servidor.'))
      .finally(() => setLoading(false))
  }, [])

  const todayStr = new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long' })

  if (loading) return (
    <PageLayout title="Dashboard">
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="animate-spin w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full" />
        <span className="text-gray-500 font-medium">Sincronizando dados...</span>
      </div>
    </PageLayout>
  )

  if (error) return (
    <PageLayout title="Dashboard">
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-5 shadow-sm">⚠️ {error}</div>
    </PageLayout>
  )

  const k = data!.kpiCards
  const appointments = data?.todayAppointments || []
  const payments = data?.pendingPayments || []

  return (
    <PageLayout title="Dashboard" subtitle={todayStr.charAt(0).toUpperCase() + todayStr.slice(1)}>
      
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        <KpiCard icon={<Calendar/>} label="Consultas hoje"    value={String(k.appointmentsToday)} />
        <KpiCard icon={<PeopleFill/>} label="Pacientes ativos"  value={String(k.totalActivePatients)} />
        <KpiCard icon={<Plus/>} label="Novos este mês"    value={String(k.newPatientsThisMonth)} />
        <KpiCard icon={<Cash/>} label="Receita do mês"    value={fmt(k.revenueThisMonth)} />
        <KpiCard icon={<Hourglass/>} label="A receber"          value={fmt(k.pendingPaymentsTotal)} />
        <KpiCard icon={<Ban/>} label="Cancelamentos"      value={String(k.cancellationsThisMonth)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-black/50 rounded-xl border border-gray-200 dark:border-white/10 p-5 shadow-sm">
          <h2 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center justify-between uppercase text-xs tracking-widest">
            <span className="flex items-center gap-2"><Calendar/> Agenda de Hoje</span>
            <span className="bg-blue-600 text-white px-2 py-0.5 rounded-md text-[10px]">
              {appointments.length} PACIENTES
            </span>
          </h2>
          
          {appointments.length === 0
            ? <p className="text-sm text-gray-400 py-10 text-center italic">Nenhuma consulta hoje 🎉</p>
            : <div className="space-y-3">
                {appointments.map(a => (
                  <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/50 dark:bg-white/5 border border-transparent hover:border-blue-100 transition-all">
                    <div className="text-center w-14 border-r border-gray-200 pr-3">
                      <p className="text-sm font-black text-blue-600">{a.startTime}</p>
                      <p className="text-[10px] text-gray-400 font-bold">{a.endTime}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate uppercase tracking-tight">{a.patientName}</p>
                      <p className="text-[10px] text-gray-500 truncate font-medium">{a.procedure}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded-lg font-black uppercase tracking-tighter ${statusLabel[a.status]?.color ?? 'bg-gray-100'}`}>
                      {statusLabel[a.status]?.label ?? a.status}
                    </span>
                  </div>
                ))}
              </div>
          }
        </div>

        <div className="bg-white dark:bg-black/50 rounded-xl border border-gray-200 dark:border-white/10 p-5 shadow-sm">
          <h2 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2 uppercase text-xs tracking-widest">
            <ExclamationTriangleFill/> Cobranças Pendentes
          </h2>
          {payments.length === 0
            ? <p className="text-sm text-gray-400 py-10 text-center italic">Tudo em dia! ✅</p>
            : <div className="space-y-3">
                {payments.map(p => (
                  <div key={p.id} className={`flex items-center gap-3 p-3 rounded-xl border ${p.overdue ? 'bg-red-50 border-red-100' : 'bg-gray-50/50 border-transparent'}`}>
                    <span className="text-lg">{p.overdue ? '🔴' : '🟡'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate uppercase tracking-tight">{p.patientName}</p>
                      <p className="text-[10px] text-gray-500 truncate">{p.description}</p>
                    </div>
                    <span className="text-sm font-black text-blue-600">{fmt(p.amount)}</span>
                  </div>
                ))}
              </div>
          }
        </div>

        <div className="bg-white dark:bg-black/50 rounded-xl border border-gray-200 dark:border-white/10 p-5 lg:col-span-2 shadow-sm">
          <h2 className="font-bold text-gray-800 dark:text-white mb-1 uppercase text-xs tracking-widest flex items-center gap-2"><GraphUp/> Desempenho Financeiro</h2>
          <BarChart data={data!.monthlyRevenue} />
        </div>
      </div>
    </PageLayout>
  )
}