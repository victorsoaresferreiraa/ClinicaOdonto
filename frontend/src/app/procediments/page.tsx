"use client";

import { PeopleFill, PencilSquare, Trash } from "react-bootstrap-icons";
import { useState, useEffect, useCallback } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { patientApi, Patient } from "@/lib/api";

type PatientFormData = {
  name: string;
  cpf: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  medicalNotes?: string;
};

// ─── FUNÇÕES DE MÁSCARA E VALIDAÇÃO ───
const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");
};

const maskPhone = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{4})\d+?$/, "$1");
};

const isValidCPF = (cpf: string) => {
  cpf = cpf.replace(/[^\d]+/g, "");
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
  let calc = (n: number) => {
    let sum = 0;
    for (let i = 1; i <= n; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (n + 2 - i);
    let rest = (sum * 10) % 11;
    return rest === 10 || rest === 11 ? 0 : rest;
  };
  return calc(9) === parseInt(cpf.substring(9, 10)) && calc(10) === parseInt(cpf.substring(10, 11));
};

const INITIAL_FORM: PatientFormData = { name: "", cpf: "", email: "", phone: "", birthDate: "", medicalNotes: "" };

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Controle de Formulário e Edição
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<PatientFormData>(INITIAL_FORM);
  const [formErr, setFormErr] = useState("");
  const [saving, setSaving] = useState(false);
  
  const [isMounted, setIsMounted] = useState(false);

  const load = useCallback(async (q?: string) => {
    setLoading(true);
    setError("");
    try {
      setPatients(q ? await patientApi.search(q) : await patientApi.findAll());
    } catch {
      setError("Erro ao carregar. Verifique se o backend está rodando.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    load();
  }, [load]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    load(search.trim() || undefined);
  }

  // ─── FUNÇÕES DO CRUD ───

  // Salvar (Cria novo OU Atualiza existente)
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormErr("");
    
    if (!isValidCPF(form.cpf)) {
      setFormErr("O CPF informado é inválido.");
      return;
    }
    if (form.phone && form.phone.replace(/\D/g, "").length < 10) {
      setFormErr("O telefone informado está incompleto.");
      return;
    }

    setSaving(true);
    try {
      const cleanCpf = form.cpf.replace(/\D/g, "");
      const cleanPhone = form.phone ? form.phone.replace(/\D/g, "") : undefined;

      const payload = {
        ...form,
        cpf: cleanCpf,
        email: form.email || undefined,
        phone: cleanPhone,
        birthDate: form.birthDate || undefined,
        medicalNotes: form.medicalNotes || undefined,
      };

      if (editingId) {
        await patientApi.update(editingId, payload);
      } else {
        await patientApi.create(payload);
      }

      fecharFormulario();
      load();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.detail || err?.response?.data?.message;
      setFormErr(errorMsg ?? "Erro ao salvar. Verifique se os dados já estão em uso.");
    } finally {
      setSaving(false);
    }
  }

  // Prepara o formulário para Edição
  function handleEdit(patient: Patient) {
    setForm({
      name: patient.name,
      cpf: maskCPF(patient.cpf),
      email: patient.email || "",
      phone: patient.phone ? maskPhone(patient.phone) : "",
      birthDate: patient.birthDate || "",
      medicalNotes: patient.medicalNotes || "",
    });
    setEditingId(patient.id);
    setFormErr("");
    setShowForm(true);
    
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Deleta o paciente permanentemente
  async function handleDelete(id: number, name: string) {
    if (!confirm(`⚠️ ATENÇÃO: Tem certeza que deseja DELETAR o paciente "${name}" permanentemente?\nEsta ação não pode ser desfeita.`)) return;
    try {
      await patientApi.delete(id);
      load();
    } catch {
      alert("Erro ao deletar paciente. Ele pode ter agendamentos ou pagamentos vinculados.");
    }
  }

  // Helper para resetar tudo ao fechar o form
  function fecharFormulario() {
    setShowForm(false);
    setEditingId(null);
    setForm(INITIAL_FORM);
    setFormErr("");
  }

  if (!isMounted) return null;

  const inputCls = "w-full bg-white/50 dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-lumay-blue dark:focus:ring-blue-500 transition-all placeholder:text-slate-400";

  return (
    <PageLayout
      title="Pacientes"
      subtitle={`${patients.length} paciente(s) listado(s)`}
      action={
        <button
          onClick={() => showForm ? fecharFormulario() : setShowForm(true)}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 ${
            showForm 
              ? "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-white/10 dark:text-white dark:hover:bg-white/20" 
              : "bg-lumay-blue text-white hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
          }`}
        >
          {showForm ? "✕ Fechar Formulário" : "+ Novo Paciente"}
        </button>
      }
    >
      {/* ─── FORMULÁRIO (CRIAR / EDITAR) ─── */}
      {showForm && (
        <div className="bg-white/80 dark:bg-black/50 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 p-6 mb-6 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="font-black text-slate-800 dark:text-white mb-6 uppercase tracking-tight flex items-center gap-2">
            {editingId ? <PencilSquare className="text-lumay-blue dark:text-blue-400" /> : <PeopleFill className="text-lumay-blue dark:text-blue-400" />}
            {editingId ? "Editar Paciente" : "Cadastrar Novo Paciente"}
          </h2>
          
          {formErr && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl p-4 text-sm mb-6 font-medium flex items-center gap-2">
              ⚠️ {formErr}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Nome *</label>
              <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="Nome completo" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">CPF *</label>
              <input required value={form.cpf} onChange={(e) => setForm((f) => ({ ...f, cpf: maskCPF(e.target.value) }))} placeholder="000.000.000-00" maxLength={14} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Telefone</label>
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: maskPhone(e.target.value) }))} placeholder="(00) 00000-0000" maxLength={15} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="paciente@email.com" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Nascimento</label>
              <input type="date" value={form.birthDate} onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Observações</label>
              <input value={form.medicalNotes} onChange={(e) => setForm((f) => ({ ...f, medicalNotes: e.target.value }))} placeholder="Alergias, medicamentos..." className={inputCls} />
            </div>

            <div className="md:col-span-2 flex gap-3 justify-end mt-2 pt-4 border-t border-slate-200 dark:border-white/10">
              <button type="button" onClick={fecharFormulario} className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="px-6 py-2.5 text-sm font-bold bg-lumay-blue dark:bg-blue-600 text-white rounded-xl hover:bg-blue-800 dark:hover:bg-blue-500 shadow-md disabled:opacity-50 transition-all">
                {saving ? "Salvando..." : editingId ? "✓ Salvar Alterações" : "✓ Finalizar Cadastro"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── BUSCA ─── */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-6 relative z-10">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar paciente por nome..." className="flex-1 bg-white/80 dark:bg-black/50 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-lumay-blue shadow-sm placeholder:text-slate-400" />
        <button type="submit" className="px-6 py-3 bg-white/80 dark:bg-black/50 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
          🔍 Buscar
        </button>
        {search && (
          <button type="button" onClick={() => { setSearch(""); load(); }} className="px-4 py-3 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-100 dark:hover:bg-red-500/20 font-bold transition-colors">
            ✕ Limpar
          </button>
        )}
      </form>

      {/* ─── TABELA DE PACIENTES ─── */}
      <div className="bg-white/80 dark:bg-black/50 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden relative z-10">
        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-lumay-blue dark:border-blue-500 border-t-transparent rounded-full" /></div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 bg-red-500/5 font-bold">{error}</div>
        ) : patients.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="text-5xl mb-4 text-slate-300 dark:text-slate-600"><PeopleFill /></div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">{search ? `Nenhum resultado para "${search}"` : "Nenhum paciente cadastrado."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                <tr>{["ID", "Paciente", "CPF", "Contato", "Status", "Ações"].map((h) => (
                  <th key={h} className="text-left py-4 px-6 font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px]">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {patients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                    <td className="py-4 px-6 text-slate-400 dark:text-slate-500 font-mono text-xs">#{p.id}</td>
                    <td className="py-4 px-6">
                      <p className="font-black text-slate-800 dark:text-white uppercase">{p.name}</p>
                      {p.email && <p className="text-xs text-slate-500 dark:text-slate-400">{p.email}</p>}
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-600 dark:text-slate-300 text-xs">{maskCPF(p.cpf)}</td>
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-300 font-medium">{p.phone ? maskPhone(p.phone) : "—"}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${p.active ? "bg-green-100/80 text-green-700 dark:bg-green-500/20 dark:text-green-400" : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400"}`}>
                        {p.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Botão Editar */}
                        <button onClick={() => handleEdit(p)} className="p-2 text-lumay-blue hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-white/10 rounded-lg transition-colors" title="Editar Paciente">
                          <PencilSquare className="text-lg" />
                        </button>

                        {/* Botão Deletar (Lixeira) */}
                        <button onClick={() => handleDelete(p.id, p.name)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors" title="Excluir Permanentemente">
                          <Trash className="text-lg" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageLayout>
  );
}