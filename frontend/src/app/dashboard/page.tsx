'use client' // Define que este componente roda no navegador (cliques, estados, etc)

import { useState, useEffect } from 'react'
import PageLayout from '@/components/layout/PageLayout'
// Importamos o dashboardApi para falar com o Java e o tipo DashboardData para o TypeScript não reclamar
import { dashboardApi, DashboardData } from '@/lib/api'

// --- UTILITÁRIOS (PEQUENAS FERRAMENTAS) ---

// Formata números para o padrão de Real Brasileiro: R$ 1.500,00
const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' }).format(v)

// Mapeia os Status das consultas para etiquetas coloridas
const statusLabel: Record<string,{label:string;color:string}> = {
  SCHEDULED: { label:'Agendado',   color:'bg-blue-100 text-blue-700'  },
  CONFIRMED: { label:'Confirmado', color:'bg-green-100 text-green-700' },
  COMPLETED: { label:'Realizado',  color:'bg-gray-100 text-gray-600'  },
  CANCELLED: { label:'Cancelado',  color:'bg-red-100 text-red-600'    },
}

// --- SUB-COMPONENTES (PEÇAS MENORES DA PÁGINA) ---

// Componente para os cartões de cima (KPIs - Key Performance Indicators)
function KpiCard({ icon, label, value, sub }: { icon:string; label:string; value:string; sub?:string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5 font-medium uppercase tracking-wider">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  )
}

// Componente para o gráfico de barras simplificado
function BarChart({ data }: { data: { monthLabel:string; revenue:number }[] }) {
  const max = Math.max(...data.map(d=>d.revenue), 1) // Acha a barra mais alta para calcular as outras
  return (
    <div className="flex items-end gap-2 h-32 mt-4">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
          {/* Mostra o valor simplificado (ex: 1.5k) ao passar o mouse */}
          {d.revenue > 0 && <span className="text-[10px] text-gray-400">{(d.revenue/1000).toFixed(1)}k</span>}
          <div className={`w-full rounded-t-md transition-all ${i===data.length-1?'bg-blue-600':'bg-blue-200 group-hover:bg-blue-300'}`}
               style={{ height: `${Math.max((d.revenue/max)*100, 4)}%` }} />
          <span className="text-[10px] text-gray-400 text-center leading-tight font-bold">{d.monthLabel}</span>
        </div>
      ))}
    </div>
  )
}

// --- PÁGINA PRINCIPAL ---

export default function DashboardPage() {
  // A memória que guarda todos os dados que o Java enviar
  const [data, setData] = useState<DashboardData|null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Ao abrir a página, pede os dados para o servidor
  useEffect(() => {
    dashboardApi.get()
      .then(setData)
      .catch(() => setError('Erro ao carregar dashboard.'))
      .finally(() => setLoading(false))
  }, [])

  // Gera a data de hoje formatada (ex: Terça-feira, 21 de Abril)
  const today = new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long' })

  // 1. TELA DE CARREGAMENTO
  if (loading) return (
    <PageLayout title="Dashboard">
      <div className="flex items-center justify-center py-20 gap-3">
        <div className="animate-spin w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full" />
        <span className="text-gray-500 font-medium">Sincronizando dados...</span>
      </div>
    </PageLayout>
  )

  // 2. TELA DE ERRO
  if (error) return (
    <PageLayout title="Dashboard">
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-5 shadow-sm">⚠️ {error}</div>
    </PageLayout>
  )

  // Atalho para não precisar digitar "data.kpiCards" toda hora
  const k = data!.kpiCards

  // 3. TELA PRINCIPAL (CONSTRUIDA COM OS DADOS DO JAVA)
  return (
    <PageLayout title="Dashboard" subtitle={today.charAt(0).toUpperCase() + today.slice(1)}>
      
      {/* SEÇÃO 1: BLOCOS DE RESUMO (KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        <KpiCard icon="📅" label="Consultas hoje"    value={String(k.appointmentsToday)} />
        <KpiCard icon="👥" label="Pacientes ativos"  value={String(k.totalActivePatients)} />
        <KpiCard icon="🆕" label="Novos este mês"    value={String(k.newPatientsThisMonth)} />
        <KpiCard icon="💰" label="Receita do mês"    value={fmt(k.revenueThisMonth)} />
        <KpiCard icon="⏳" label="A receber"          value={fmt(k.pendingPaymentsTotal)} />
        <KpiCard icon="❌" label="Cancelamentos"      value={String(k.cancellationsThisMonth)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* SEÇÃO 2: AGENDA DO DIA */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2 uppercase text-xs tracking-widest">
            📅 Agenda de Hoje
            <span className="bg-blue-600 text-white px-2 py-0.5 rounded-md text-[10px]">
              {data!.todayAppointments.length}
            </span>
          </h2>
          
          {data!.todayAppointments.length === 0
            ? <p className="text-sm text-gray-400 py-10 text-center italic">Nenhuma consulta agendada 🎉</p>
            : <div className="space-y-3">
                {data!.todayAppointments.map(a => (
                  <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/50 border border-transparent hover:border-blue-100 transition-all">
                    <div className="text-center w-14 border-r border-gray-200 pr-3">
                      <p className="text-sm font-black text-gray-900">{a.startTime}</p>
                      <p className="text-[10px] text-gray-400 font-bold">{a.endTime}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate uppercase">{a.patientName}</p>
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

        {/* SEÇÃO 3: COBRANÇAS PENDENTES */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2 uppercase text-xs tracking-widest">
            ⚠️ Cobranças Pendentes
          </h2>
          {data!.pendingPayments.length === 0
            ? <p className="text-sm text-gray-400 py-10 text-center italic">Tudo em dia! ✅</p>
            : <div className="space-y-3">
                {data!.pendingPayments.map(p => (
                  <div key={p.id} className={`flex items-center gap-3 p-3 rounded-xl border ${p.overdue ? 'bg-red-50/50 border-red-100' : 'bg-gray-50/50 border-transparent'}`}>
                    <span className="text-lg">{p.overdue ? '🔴' : '🟡'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate uppercase">{p.patientName}</p>
                      <p className="text-[10px] text-gray-500 truncate">{p.description}</p>
                    </div>
                    <span className="text-sm font-black text-gray-900">{fmt(p.amount)}</span>
                  </div>
                ))}
              </div>
          }
        </div>

        {/* SEÇÃO 4: GRÁFICO DE FATURAMENTO */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 lg:col-span-2 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-1 uppercase text-xs tracking-widest">📈 Faturamento — Últimos 6 Meses</h2>
          <BarChart data={data!.monthlyRevenue} />
        </div>
      </div>
    </PageLayout>
  )
}