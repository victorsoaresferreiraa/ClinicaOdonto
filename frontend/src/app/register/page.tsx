"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();

  // Estados de UI
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Estado do Formulário
  const [form, setForm] = useState({
    clinicName: "",
    clinicSlug: "",
    clinicEmail: "",
    clinicPhone: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
    confirmPassword: "",
  });

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Função para Máscara de Telefone (11) 99999-9999
  const maskPhone = (value: string) => {
    if (!value) return "";
    value = value.replace(/\D/g, "");
    value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
    value = value.replace(/(\d{5})(\d)/, "$1-$2");
    return value.substring(0, 15);
  };

  // Gerador de Slug Automático
  const handleClinicNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    setForm((prev) => ({ ...prev, clinicName: name, clinicSlug: slug }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const formattedValue = name === "clinicPhone" ? maskPhone(value) : value;
    setForm((prev) => ({ ...prev, [name]: formattedValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.adminPassword !== form.confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clinics/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicName: form.clinicName,
          clinicSlug: form.clinicSlug,
          clinicEmail: form.clinicEmail,
          clinicPhone: form.clinicPhone,
          adminName: form.adminName,
          adminEmail: form.adminEmail,
          adminPassword: form.adminPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Erro ao cadastrar clínica.");
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err: any) {
      setError(err.message || "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = 
    "w-full bg-transparent border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-slate-400";

  return (
    <div className={isDarkMode ? "dark" : ""}>
      <div 
        className="min-h-screen flex items-center justify-center py-12 px-4 transition-all duration-500 bg-cover bg-center bg-no-repeat relative"
        style={{ 
          backgroundImage: "url('/background.png')",
          backgroundColor: isDarkMode ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.7)",
          backgroundBlendMode: isDarkMode ? "multiply" : "overlay"
        }}
      >
        {/* Botão de Tema */}
        <button
          onClick={toggleTheme}
          className="absolute top-6 right-6 p-2.5 rounded-xl bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-md border dark:border-slate-800 shadow-lg text-xl hover:scale-110 transition-all z-10"
        >
          {isDarkMode ? "☀️" : "🌙"}
        </button>

        <div className="bg-white/95 dark:bg-[#000000]/90 backdrop-blur-md border dark:border-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-lg transition-all duration-500">
          
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div
                className="w-20 h-20 bg-lumay-blue dark:bg-white transition-colors duration-500"
                style={{
                  maskImage: "url(/logolumay.svg)",
                  WebkitMaskImage: "url(/logolumay.svg)",
                  maskRepeat: "no-repeat",
                  maskPosition: "center",
                  maskSize: "contain",
                  WebkitMaskSize: "contain",
                }}
              />
            </div>
            <h1 className="text-2xl font-bold text-lumay-blue dark:text-white tracking-tight">CADASTRAR CLÍNICA</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Comece a gerenciar sua clínica agora mesmo.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
              ⚠️ {error}
            </div>
          )}

          {success ? (
            <div className="text-center py-10">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-xl font-bold dark:text-white">Clínica criada com sucesso!</h2>
              <p className="text-slate-500 dark:text-slate-400">Você será redirecionado para o login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Unidade</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input name="clinicName" placeholder="Nome da Clínica" onChange={handleClinicNameChange} required className={inputClasses} />
                  <input name="clinicSlug" value={form.clinicSlug} placeholder="Slug da Clínica" readOnly className={`${inputClasses} bg-slate-100 dark:bg-slate-900 font-mono`} />
                  <input name="clinicEmail" type="email" placeholder="Email Comercial" onChange={handleChange} className={inputClasses} />
                  <input name="clinicPhone" type="tel" value={form.clinicPhone} placeholder="Telefone" onChange={handleChange} className={inputClasses} />
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800" />

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Administrador</h3>
                <div className="space-y-3">
                  <input name="adminName" placeholder="Seu Nome Completo" onChange={handleChange} required className={inputClasses} />
                  <input name="adminEmail" type="email" placeholder="Seu Email de Acesso" onChange={handleChange} required className={inputClasses} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        name="adminPassword" 
                        placeholder="Senha"
                        onChange={handleChange} 
                        required 
                        className={inputClasses} 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      >
                        {showPassword ? "👁️‍🗨️" : "👁️"}
                      </button>
                    </div>
                    <input name="confirmPassword" type="password" placeholder="Repetir Senha" onChange={handleChange} required className={inputClasses} />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? 'PROCESSANDO...' : 'FINALIZAR CADASTRO'}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-8">
            Já tem uma conta?{' '}
            <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-bold">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}