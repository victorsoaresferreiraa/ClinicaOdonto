'use client'
import { useState, useEffect } from 'react'
import PageLayout from '@/components/layout/PageLayout'
import { dashboardApi, Dashboard } from '@/lib/api'

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' }).format(v)
const statusLabel: Record<string,{label:string;color:string}> = {
  SCHEDULED: { label:'Agendado',   color:'bg-blue-100 text-blue-700'  },
  CONFIRMED: { label:'Confirmado', color:'bg-green-100 text-green-700' },
  COMPLETED: { label:'Realizado',  color:'bg-gray-100 text-gray-600'  },
  CANCELLED: { label:'Cancelado',  color:'bg-red-100 text-red-600'    },
}

function KpiCard({ icon, label, value, sub }: { icon:string; label:string; value:string; sub?:string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  )
}

function BarChart({ data }: { data: { monthLabel:string; revenue:number }[] }) {
  const max = Math.max(...data.map(d=>d.revenue), 1)
  return (
    <div className="flex items-end gap-2 h-32 mt-2">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          {d.revenue > 0 && <span className="text-xs text-gray-400">{(d.revenue/1000).toFixed(1)}k</span>}
          <div className={`w-full rounded-t-md ${i===data.length-1?'bg-blue-600':'bg-blue-200'}`}
               style={{ height: `${Math.max((d.revenue/max)*100, 4)}%` }} />
          <span className="text-xs text-gray-400 text-center leading-tight">{d.monthLabel}</span>
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const [data,    setData]    = useState<Dashboard|null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    dashboardApi.get().then(setData).catch(() => setError('Erro ao carregar dashboard.')).finally(() => setLoading(false))
  }, [])

  const today = new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long' })

  if (loading) return (
    <PageLayout title="Dashboard">
      <div className="flex items-center justify-center py-20 gap-3">
        <div className="animate-spin w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full" />
        <span className="text-gray-500">Carregando...</span>
      </div>
    </PageLayout>
  )

  if (error) return (
    <PageLayout title="Dashboard">
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-5">{error}</div>
    </PageLayout>
  )

  const k = data!.kpiCards

  return (
    <PageLayout title="Dashboard" subtitle={today.charAt(0).toUpperCase() + today.slice(1)}>
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        <KpiCard icon="📅" label="Consultas hoje"     value={String(k.appointmentsToday)} />
        <KpiCard icon="👥" label="Pacientes ativos"   value={String(k.totalActivePatients)} />
        <KpiCard icon="🆕" label="Novos este mês"     value={String(k.newPatientsThisMonth)} />
        <KpiCard icon="💰" label="Receita do mês"     value={fmt(k.revenueThisMonth)} />
        <KpiCard icon="⏳" label="A receber"           value={fmt(k.pendingPaymentsTotal)} />
        <KpiCard icon="❌" label="Cancelamentos"      value={String(k.cancellationsThisMonth)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Agenda hoje */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            📅 Agenda de Hoje
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-normal">
              {data!.todayAppointments.length}
            </span>
          </h2>
          {data!.todayAppointments.length === 0
            ? <p className="text-sm text-gray-400 py-6 text-center">Nenhuma consulta hoje 🎉</p>
            : <div className="space-y-2">
                {data!.todayAppointments.map(a => (
                  <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50">
                    <div className="text-center w-14">
                      <p className="text-sm font-bold text-gray-900">{a.startTime}</p>
                      <p className="text-xs text-gray-400">{a.endTime}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{a.patientName}</p>
                      <p className="text-xs text-gray-500 truncate">{a.procedure}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusLabel[a.status]?.color ?? 'bg-gray-100 text-gray-600'}`}>
                      {statusLabel[a.status]?.label ?? a.status}
                    </span>
                  </div>
                ))}
              </div>
          }
        </div>

        {/* Cobranças pendentes */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            ⚠️ Cobranças Pendentes
            {data!.pendingPayments.filter(p=>p.overdue).length > 0 && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-normal">
                {data!.pendingPayments.filter(p=>p.overdue).length} vencidas
              </span>
            )}
          </h2>
          {data!.pendingPayments.length === 0
            ? <p className="text-sm text-gray-400 py-6 text-center">Nenhuma pendência ✅</p>
            : <div className="space-y-2">
                {data!.pendingPayments.map(p => (
                  <div key={p.id} className={`flex items-center gap-3 p-2.5 rounded-lg ${p.overdue?'bg-red-50':''}`}>
                    <span>{p.overdue?'🔴':'🟡'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.patientName}</p>
                      <p className="text-xs text-gray-500 truncate">{p.description}</p>
                      <p className={`text-xs mt-0.5 ${p.overdue?'text-red-600 font-medium':'text-gray-400'}`}>
                        {p.overdue?'Venceu em ':'Vence em '}{new Date(p.dueDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{fmt(p.amount)}</span>
                  </div>
                ))}
              </div>
          }
        </div>

        {/* Gráfico */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 lg:col-span-2">
          <h2 className="font-semibold text-gray-900 mb-1">📈 Receita — Últimos 6 Meses</h2>
          <BarChart data={data!.monthlyRevenue} />
        </div>
      </div>
    </PageLayout>
  )
}
