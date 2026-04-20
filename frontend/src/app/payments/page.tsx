"use client";
import {
  ArrowCounterclockwise,
  CalendarX,
  CashCoin,
  Check,
  Hourglass,
  X,
} from "react-bootstrap-icons";
import { useState, useEffect, useCallback } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { paymentApi, Payment } from "@/lib/api";

type PayStatus = "PENDING" | "PAID" | "OVERDUE" | "REFUNDED" | "CANCELLED";

const ST: Record<PayStatus, { label: string; color: string; icon: any }> = {
  PENDING: {
    label: "Pendente",
    icon: <Hourglass />,
    color:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300",
  },
  PAID: {
    label: "Pago",
    icon: <Check />,
    color:
      "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300",
  },
  OVERDUE: {
    label: "Vencido",
    icon: <CalendarX />,
    color: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
  },
  REFUNDED: {
    label: "Estornado",
    icon: <ArrowCounterclockwise />,
    color: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
  },
  CANCELLED: {
    label: "Cancelado",
    icon: <X />,
    color: "bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500",
  },
};
const METHODS: Record<string, string> = {
  PIX: "PIX",
  CARTAO_CREDITO: "Crédito",
  CARTAO_DEBITO: "Débito",
  DINHEIRO: "Dinheiro",
  CONVENIO: "Convênio",
  TRANSFERENCIA: "Transferência",
};
const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    v,
  );

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filter, setFilter] = useState<PayStatus>("PENDING");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPayments(await paymentApi.findByStatus(filter));
      setError("");
    } catch {
      setError("Erro ao carregar faturas.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    setIsMounted(true);
    load();
  }, [load]);

  async function handlePay(id: number) {
    if (!confirm("Confirmar recebimento?")) return;
    try {
      await paymentApi.markAsPaid(id);
      load();
    } catch {
      alert("Erro ao processar.");
    }
  }
  async function handleCancel(id: number) {
    if (!confirm("Cancelar esta cobrança?")) return;
    try {
      await paymentApi.cancel(id);
      load();
    } catch {
      alert("Erro ao cancelar.");
    }
  }

  if (!isMounted) return null;

  const total = payments.reduce((s, p) => s + (p.finalAmount ?? p.amount), 0);

  return (
    <PageLayout title="Financeiro" subtitle="Gestão de Cobranças">
      {/* Filtros em Pílulas */}
      <div className="flex gap-3 flex-wrap mb-6 relative z-10">
        {(["PENDING", "PAID", "OVERDUE", "CANCELLED"] as PayStatus[]).map(
          (s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-5 py-2.5 rounded-2xl text-sm font-bold border transition-all flex items-center gap-2 ${
                filter === s
                  ? "bg-lumay-blue text-white border-lumay-blue dark:bg-blue-600 dark:border-blue-600 shadow-md"
                  : "bg-white/80 dark:bg-black/50 backdrop-blur-md text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-lumay-blue dark:hover:border-blue-400"
              }`}
            >
              <span>{ST[s].icon}</span>{" "}
              <span className="uppercase tracking-wider text-xs">
                {ST[s].label}
              </span>
            </button>
          ),
        )}
      </div>

      {/* Resumo Financeiro */}
      {payments.length > 0 && (
        <div className="bg-white/80 dark:bg-blue-900/20 backdrop-blur-md border border-slate-200 dark:border-blue-500/20 rounded-2xl px-6 py-4 mb-6 text-sm text-slate-800 dark:text-blue-300 font-medium shadow-sm flex items-center justify-between relative z-10">
          <span className="uppercase tracking-widest text-[10px] font-black">
            Total em {ST[filter].label}
          </span>
          <div className="text-right">
            <strong className="text-xl font-black">{fmt(total)}</strong>
            <p className="text-[10px] opacity-70 uppercase tracking-widest">
              {payments.length} Registros
            </p>
          </div>
        </div>
      )}

      {/* Tabela Glassmorphism */}
      <div className="bg-white/80 dark:bg-black/50 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden relative z-10">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-lumay-blue dark:border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 bg-red-500/5 font-bold">
            {error}
          </div>
        ) : payments.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="text-5xl mb-4 text-slate-300 dark:text-slate-600">
              <CashCoin /> {/* Ou o ícone que você estiver usando aqui */}
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Nenhuma cobrança encontrada.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                <tr>
                  {[
                    "Paciente",
                    "Descrição",
                    "Vencimento",
                    "Valor",
                    "Forma",
                    "Status",
                    "Ações",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left py-4 px-6 font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {payments.map((p) => {
                  const st = ST[p.status];
                  const ov =
                    p.status === "PENDING" && new Date(p.dueDate) < new Date();
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group ${ov ? "bg-red-50/50 dark:bg-red-500/5" : ""}`}
                    >
                      <td className="py-4 px-6 font-black text-slate-800 dark:text-white uppercase">
                        {p.patientName}
                      </td>
                      <td className="py-4 px-6 text-slate-600 dark:text-slate-300 font-medium max-w-[200px] truncate">
                        {p.description}
                      </td>
                      <td className="py-4 px-6 font-bold">
                        <span
                          className={
                            ov
                              ? "text-red-600 dark:text-red-400"
                              : "text-slate-600 dark:text-slate-300"
                          }
                        >
                          {new Date(p.dueDate).toLocaleDateString("pt-BR")}
                        </span>
                        {ov && (
                          <span className="ml-2 text-[10px] bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 px-2 py-0.5 rounded-full uppercase">
                            Atrasado
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 font-black text-lumay-blue dark:text-blue-400 text-base">
                        {fmt(p.finalAmount ?? p.amount)}
                      </td>
                      <td className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {METHODS[p.paymentMethod] ?? p.paymentMethod}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${st.color}`}
                        >
                          <span>{st.icon}</span> {st.label}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {p.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => handlePay(p.id)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 hover:bg-green-100 dark:hover:bg-green-500/20"
                              >
                                Baixar
                              </button>
                              <button
                                onClick={() => handleCancel(p.id)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20"
                              >
                                Cancelar
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
