'use client'

import { PeopleFill, PencilSquare, Trash } from "react-bootstrap-icons";
import { useState, useEffect, useCallback } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { patientApi, Patient, CreatePatientReq } from "@/lib/api";

// --- FUNÇÕES DE MÁSCARA (Para o CPF e Telefone ficarem bonitos enquanto digita) ---
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

export default function PatientsPage() {
  // --- ESTADOS (A Memória da Página) ---
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CreatePatientReq>({ 
    name: "", cpf: "", email: "", phone: "", birthDate: "", medicalNotes: "" 
  });
  const [formErr, setFormErr] = useState("");
  const [saving, setSaving] = useState(false);

  // FUNÇÃO: Buscar pacientes no banco
  const load = useCallback(async (q?: string) => {
    setLoading(true);
    setError("");
    try {
      const data = q ? await patientApi.search(q) : await patientApi.findAll();
      setPatients(data);
    } catch {
      setError("Erro ao carregar. Verifique se o backend está rodando.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Barra de Pesquisa
  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    load(search.trim() || undefined);
  }

  // FUNÇÃO: Salvar ou Atualizar
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormErr("");
    setSaving(true);
    try {
      const payload = {
        ...form,
        cpf: form.cpf.replace(/\D/g, ""), // Limpa pontos e traços antes de mandar pro Java
        phone: form.phone ? form.phone.replace(/\D/g, "") : undefined,
        email: form.email || undefined,
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
      setFormErr(err?.response?.data?.detail ?? "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  // Prepara para editar
  function handleEdit(p: Patient) {
    setForm({
      name: p.name,
      cpf: maskCPF(p.cpf),
      email: p.email || "",
      phone: p.phone ? maskPhone(p.phone) : "",
      birthDate: p.birthDate || "",
      medicalNotes: p.medicalNotes || "",
    });
    setEditingId(p.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Desativar (Soft Delete)
  async function handleDeactivate(id: number, name: string) {
    if (!confirm(`Deseja desativar o paciente "${name}"?`)) return;
    try {
      await patientApi.deactivate(id);
      load();
    } catch {
      alert("Erro ao desativar.");
    }
  }

  function fecharFormulario() {
    setShowForm(false);
    setEditingId(null);
    setForm({ name: "", cpf: "", email: "", phone: "", birthDate: "", medicalNotes: "" });
    setFormErr("");
  }

  const inputCls = "w-full bg-white/50 dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all";

  return (
    <PageLayout
      title="Pacientes"
      subtitle={`${patients.length} paciente(s) listado(s)`}
      action={
        <button onClick={() => showForm ? fecharFormulario() : setShowForm(true)}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md ${showForm ? "bg-slate-200 text-slate-700" : "bg-blue-600 text-white"}`}>
          {showForm ? "✕ Fechar" : "+ Novo Paciente"}
        </button>
      }
    >
      {/* FORMULÁRIO */}
      {showForm && (
        <div className="bg-white/80 dark:bg-black/50 backdrop-blur-xl rounded-2xl border border-slate-200 p-6 mb-6 shadow-xl">
          <h2 className="font-black text-slate-800 dark:text-white mb-6 uppercase tracking-tight">
            {editingId ? "Editar Paciente" : "Novo Paciente"}
          </h2>
          {formErr && <div className="bg-red-500/10 text-red-600 p-4 rounded-xl text-sm mb-6">⚠️ {formErr}</div>}
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold mb-1.5 uppercase">Nome *</label>
            <input required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className={inputCls} /></div>
            
            <div><label className="block text-xs font-bold mb-1.5 uppercase">CPF *</label>
            <input required value={form.cpf} onChange={e=>setForm(f=>({...f,cpf:maskCPF(e.target.value)}))} maxLength={14} className={inputCls} /></div>
            
            <div><label className="block text-xs font-bold mb-1.5 uppercase">Telefone</label>
            <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:maskPhone(e.target.value)}))} maxLength={15} className={inputCls} /></div>
            
            <div><label className="block text-xs font-bold mb-1.5 uppercase">Email</label>
            <input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} className={inputCls} /></div>

            <div className="md:col-span-2 flex gap-3 justify-end pt-4 border-t">
              <button type="button" onClick={fecharFormulario} className="text-sm font-bold text-slate-600 px-5">Cancelar</button>
              <button type="submit" disabled={saving} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-md">
                {saving ? "Salvando..." : "✓ Salvar"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* BUSCA */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar nome..." className={inputCls} />
        <button type="submit" className="px-6 py-3 bg-white dark:bg-black/50 border rounded-2xl font-bold">🔍 Buscar</button>
      </form>

      {/* TABELA */}
      <div className="bg-white/80 dark:bg-black/50 backdrop-blur-xl rounded-3xl border shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-20 text-center animate-spin">⌛</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-white/5 border-b">
              <tr>{["ID", "Paciente", "CPF", "Status", "Ações"].map(h=><th key={h} className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-widest">{h}</th>)}</tr>
            </thead>
            <tbody>
              {patients.map(p => (
                <tr key={p.id} className="border-b hover:bg-slate-50 transition-colors group">
                  <td className="py-4 px-6 text-xs">#{p.id}</td>
                  <td className="py-4 px-6 font-bold uppercase">{p.name}</td>
                  <td className="py-4 px-6 font-mono text-xs">{maskCPF(p.cpf)}</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black ${p.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                      {p.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="py-4 px-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => handleEdit(p)} className="text-blue-500"><PencilSquare size={18} /></button>
                    {p.active && <button onClick={() => handleDeactivate(p.id, p.name)} className="text-red-500"><Trash size={18} /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PageLayout>
  );
}