'use client'

import { useState, useEffect } from 'react'
import PageLayout from '@/components/layout/PageLayout' // Ajuste este caminho se necessário
import { dashboardApi, DashboardData } from '@/lib/api'
import { Ban, Calendar, Cash, CashStack, ExclamationTriangleFill, GraphUp, Hourglass, PeopleFill, Plus } from 'react-bootstrap-icons'

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const statusLabel: Record<string, { label: string; color: string }> = {
  SCHEDULED: { label: 'Agendado', color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' },
  CONFIRMED: { label: 'Confirmado', color: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300' },
  COMPLETED: { label: 'Realizado', color: 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-300' },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300' },
}

function KpiCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white/80 dark:bg-black/50 backdrop-blur-md rounded-xl border border-slate-200 dark:border-white/10 p-5 shadow-sm transition-all hover:scale-[1.02]">
      <div className="text-2xl mb-2 font-semibold text-lumay-blue dark:text-blue-400">{icon}</div>
      <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
      <div className="text-xs font-semibold text-lumay-blue dark:text-blue-400 uppercase tracking-wider mt-1">{label}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  )
}

function BarChart({ data }: { data: { monthLabel: string; revenue: number }[] }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.revenue), 1)
  
  return (
    <div className="flex items-end gap-3 h-40 mt-4">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2">
          {d.revenue > 0 && (
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-300">
              {(d.revenue / 1000).toFixed(1)}k
            </span>
          )}
          <div 
            className={`w-full rounded-t-lg transition-all duration-500 ${
              i === data.length - 1 
                ? 'bg-lumay-blue dark:bg-blue-500 dark:shadow-[0_0_10px_rgba(59,130,246,0.4)]' 
                : 'bg-blue-100 dark:bg-white/20'
            }`}
            style={{ height: `${Math.max((d.revenue / max) * 100, 6)}%` }} 
          />
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase">{d.monthLabel}</span>
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [todayStr, setTodayStr] = useState('')

  useEffect(() => {
    setTodayStr(new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }))

    dashboardApi.get()
      .then(setData)
      .catch(() => setError('Erro ao carregar dashboard. Verifique o servidor.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <PageLayout title="Dashboard" subtitle="Sincronizando...">
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="animate-spin w-10 h-10 border-4 border-lumay-blue border-t-transparent dark:border-blue-500 dark:border-t-transparent rounded-full" />
        <span className="text-slate-500 dark:text-slate-300 font-medium">Carregando dados do sistema...</span>
      </div>
    </PageLayout>
  )

  if (error) return (
    <PageLayout title="Dashboard" subtitle="Erro no sistema">
      <div className="bg-red-50 dark:bg-red-900/40 backdrop-blur-md border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl p-6 flex items-center gap-3">
        <span>⚠️</span> {error}
      </div>
    </PageLayout>
  )

  const k = data?.kpiCards || {
    appointmentsToday: 0, totalActivePatients: 0, newPatientsThisMonth: 0,
    revenueThisMonth: 0, pendingPaymentsTotal: 0, cancellationsThisMonth: 0
  }
  const appointments = data?.todayAppointments || []
  const payments = data?.pendingPayments || []
  const chartData = data?.monthlyRevenue || []

  return (
    <PageLayout 
      title="Dashboard" 
      subtitle={todayStr ? todayStr.charAt(0).toUpperCase() + todayStr.slice(1) : ''}
    >
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <KpiCard icon={<Calendar/>} label="Consultas hoje" value={String(k.appointmentsToday)} />
        <KpiCard icon={<PeopleFill/>} label="Pacientes ativos" value={String(k.totalActivePatients)} />
        <KpiCard icon={<Plus/>} label="Novos este mês" value={String(k.newPatientsThisMonth)} />
        <KpiCard icon={<Cash/>} label="Receita do mês" value={fmt(k.revenueThisMonth)} />
        <KpiCard icon={<Hourglass/>} label="A receber" value={fmt(k.pendingPaymentsTotal)} />
        <KpiCard icon={<Ban/>} label="Cancelamentos" value={String(k.cancellationsThisMonth)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Agenda de Hoje */}
        <div className="bg-white/80 dark:bg-black/50 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-white/10 p-6 shadow-sm">
          <h2 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2"><Calendar/> Agenda de Hoje</span>
            <span className="text-xs bg-lumay-blue dark:bg-blue-600 text-white px-2.5 py-1 rounded-lg font-bold shadow-sm">
              {appointments.length} PACIENTES
            </span>
          </h2>
          
          {appointments.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-slate-400 dark:text-slate-500 italic">Nenhum compromisso para hoje.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map(a => (
                <div key={a.id} className="flex items-center gap-4 p-3 rounded-xl border border-transparent hover:border-slate-100 dark:hover:border-white/10 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-all">
                  <div className="text-center w-16 border-r border-slate-100 dark:border-white/10 pr-4">
                    <p className="text-sm font-black text-lumay-blue dark:text-blue-400">{a.startTime}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{a.endTime}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate uppercase tracking-tight">{a.patientName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{a.procedure}</p>
                  </div>
                  <span className={`text-[10px] px-2.5 py-1 rounded-md font-black uppercase tracking-wider ${statusLabel[a.status]?.color ?? 'bg-slate-100 dark:bg-white/10'}`}>
                    {statusLabel[a.status]?.label ?? a.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cobranças Pendentes */}
        <div className="bg-white/80 dark:bg-black/50 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-white/10 p-6 shadow-sm">
          <h2 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <ExclamationTriangleFill/> Cobranças Pendentes
          </h2>
          
          {payments.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 italic">Tudo em dia!</div>
          ) : (
            <div className="space-y-3">
              {payments.map(p => (
                <div key={p.id} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  p.overdue 
                    ? 'bg-red-50/80 border-red-100 dark:bg-red-900/30 dark:border-red-500/30' 
                    : 'bg-white/50 border-slate-100 dark:bg-white/5 dark:border-white/10'
                }`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-white uppercase truncate tracking-tight">{p.patientName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{p.description}</p>
                    <p className={`text-[10px] font-black uppercase mt-1 ${p.overdue ? 'text-red-600 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}`}>
                      {p.overdue ? `Vencido: ${new Date(p.dueDate).toLocaleDateString()}` : `Vence em: ${new Date(p.dueDate).toLocaleDateString()}`}
                    </p>
                  </div>
                  <span className="text-sm font-black text-lumay-blue dark:text-blue-400">{fmt(p.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gráfico de Receita */}
        <div className="bg-white/80 dark:bg-black/50 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-white/10 p-6 lg:col-span-2 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-slate-800 dark:text-white uppercase tracking-tight"><GraphUp/> Desempenho Financeiro</h2>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">ÚLTIMOS 6 MESES</span>
          </div>
          <BarChart data={chartData} />
        </div>

      </div>
    </PageLayout>
  )
}