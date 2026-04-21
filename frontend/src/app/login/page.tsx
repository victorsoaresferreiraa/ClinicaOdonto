"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Email ou senha incorretos.");
      localStorage.setItem("lumay_token", data.token);
      localStorage.setItem("lumay_user", JSON.stringify(data));
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
<div className={isDarkMode ? "dark" : ""}>
  <div 
    className="min-h-screen flex items-center justify-center px-4 relative transition-all duration-500
               bg-cover bg-center bg-no-repeat" // Classes para a imagem cobrir tudo
    style={{ 
      backgroundImage: "url('/background.png')",
      // Opcional: Adiciona um overlay (camada) para o fundo não brigar com o texto
      backgroundColor: isDarkMode ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.8)",
      backgroundBlendMode: "overlay" 
    }}
  >
    {/* O restante do seu código (botão de toggle e card) continua aqui */}
    
    <button onClick={toggleTheme} className="absolute top-6 right-6 ...">
       {isDarkMode ? "☀️" : "🌙"}
    </button>

        <div className="bg-white dark:bg-[#000000] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-md transition-all duration-500">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-lumay-blue dark:bg-white transition-colors duration-500"
                style={{ maskImage: "url(/logolumay.svg)", WebkitMaskImage: "url(/logolumay.svg)", maskRepeat: "no-repeat", maskPosition: "center", maskSize: "contain", WebkitMaskSize: "contain" }}
              />
            </div>
            <h1 className="text-2xl text-lumay-blue dark:text-white font-bold tracking-tight">LUMAY ODONTOLOGIA</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Acesse para gerenciar sua clínica</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
              <input placeholder="Digite seu email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-transparent border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-600 outline-none transition-all" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Senha</label>
              <div className="relative">
                <input placeholder="Digite sua senha" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-transparent border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-600 outline-none pr-12" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors">
                  {showPassword ? "👁️‍🗨️" : "👁️"}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-900/30 mt-4 active:scale-95">
              {loading ? "⏳ Entrando..." : "Entrar"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-8">
            Deseja abrir sua clínica? <Link href="/register" className="text-blue-600 dark:text-blue-400 hover:underline font-bold">Crie sua conta</Link>
          </p>
        </div>
      </div>
    </div>
  );
}