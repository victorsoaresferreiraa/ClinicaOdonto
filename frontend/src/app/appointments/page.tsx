"use client";

import { useState, useEffect, useRef } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { 
  CalendarDateFill, 
  Trash, 
  PencilSquare, 
  CheckCircleFill,
  ChevronLeft,
  ChevronRight,
  Search // Ícone de busca adicionado
} from "react-bootstrap-icons";

// Tipos
type AppointmentData = {
  id: number;
  patientName: string;
  date: string;
  time: string;
  service: string;
  status: "Pendente" | "Confirmado" | "Cancelado";
};

export default function AppointmentsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  
  // ─── DADOS FALSOS (MOCK) ───
  const mockPatients = [
    { id: "1", name: "João Silva", cpf: "111.222.333-44" },
    { id: "2", name: "Maria Oliveira", cpf: "555.666.777-88" },
    { id: "3", name: "Carlos Santos", cpf: "999.888.777-66" },
    { id: "4", name: "Ana Paula", cpf: "123.456.789-00" }
  ];
  const services = ["Consulta Geral", "Limpeza", "Avaliação Ortodôntica", "Clareamento"];
  const availableTimes = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

  // ─── ESTADOS DO FORMULÁRIO ───
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [notes, setNotes] = useState("");

  // ─── ESTADOS DO AUTOCOMPLETE DE PACIENTE ───
  const [patientSearchText, setPatientSearchText] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Filtra os pacientes conforme o usuário digita (por nome ou CPF)
  const filteredPatients = mockPatients.filter(p => 
    p.name.toLowerCase().includes(patientSearchText.toLowerCase()) || 
    p.cpf.includes(patientSearchText)
  );

  // ─── LÓGICA DO CALENDÁRIO INLINE ───
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const weekDays = ["DO", "SE", "TE", "QA", "QI", "SE", "SA"];

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const monthYearLabel = currentMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }).toUpperCase();

  // ─── LÓGICA DA TABELA ───
  const [appointments, setAppointments] = useState<AppointmentData[]>([
    { id: 1, patientName: "João Silva", date: "24/04/2026", time: "14:00", service: "Avaliação Ortodôntica", status: "Confirmado" },
  ]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSaveAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !selectedPatient || !selectedService) {
      alert("Por favor, preencha todos os campos obrigatórios selecionando as opções da lista.");
      return;
    }

    const novoAgendamento: AppointmentData = {
      id: Math.random(),
      patientName: selectedPatient,
      date: selectedDate.toLocaleDateString("pt-BR"),
      time: selectedTime,
      service: selectedService,
      status: "Pendente"
    };
    
    setAppointments([...appointments, novoAgendamento]);
    setShowForm(false);
    
    // Limpar form
    setSelectedPatient("");
    setPatientSearchText("");
    setSelectedService("");
    setSelectedDate(null);
    setSelectedTime(null);
    setNotes("");
  };

  if (!isMounted) return null;

  const inputCls = "w-full bg-white/50 dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-lumay-blue dark:focus:ring-blue-500 transition-all placeholder:text-slate-400";

  return (
    <PageLayout
      title="Agendamentos"
      subtitle="Gestão de Consultas"
      action={
        <button
          onClick={() => setShowForm(!showForm)}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 flex items-center gap-2 ${
            showForm 
              ? "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-white/10 dark:text-white dark:hover:bg-white/20" 
              : "bg-lumay-blue text-white hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
          }`}
        >
          {showForm ? "✕ Fechar Cadastro" : "+ Novo Agendamento"}
        </button>
      }
    >
      {/* ─── FORMULÁRIO COM CALENDÁRIO INLINE ─── */}
      {showForm && (
        <div className="bg-white/80 dark:bg-black/50 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 p-6 mb-6 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="font-black text-slate-800 dark:text-white mb-6 uppercase tracking-tight">NOVO AGENDAMENTO</h2>
          
          <form onSubmit={handleSaveAppointment} className="flex flex-col gap-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CAMPO DE PACIENTE COM AUTOCOMPLETE */}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Paciente *</label>
                <div className="relative">
                  <input 
                    type="text"
                    required
                    value={patientSearchText}
                    placeholder="Pesquise por nome ou CPF..."
                    onChange={(e) => {
                      setPatientSearchText(e.target.value);
                      setIsDropdownOpen(true);
                      setSelectedPatient(""); // Reseta a seleção oficial se ele voltar a digitar
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    // Usamos setTimeout no onBlur para dar tempo de o clique no dropdown registrar
                    onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                    className={`${inputCls} pl-10`}
                  />
                  <Search className="absolute left-3.5 top-3 text-slate-400" />
                </div>

                {/* Dropdown de Resultados */}
                {isDropdownOpen && patientSearchText.length > 0 && (
                  <ul className="absolute z-50 w-full mt-2 max-h-48 overflow-y-auto bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl custom-scrollbar divide-y divide-slate-100 dark:divide-white/5">
                    {filteredPatients.length > 0 ? (
                      filteredPatients.map(p => (
                        <li 
                          key={p.id}
                          onClick={() => {
                            setSelectedPatient(p.name);
                            setPatientSearchText(`${p.cpf} | ${p.name}`); // Preenche o input bonitinho
                            setIsDropdownOpen(false);
                          }}
                          className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer flex flex-col transition-colors"
                        >
                          <span className="text-sm font-bold text-slate-800 dark:text-white">{p.name}</span>
                          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{p.cpf}</span>
                        </li>
                      ))
                    ) : (
                      <li className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 italic text-center">
                        Nenhum paciente encontrado.
                      </li>
                    )}
                  </ul>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Procedimento *</label>
                <select value={selectedService} onChange={(e) => setSelectedService(e.target.value)} required className={inputCls}>
                  <option value="">Selecione...</option>
                  {services.map(s => <option key={s} value={s} className="dark:bg-slate-900">{s}</option>)}
                </select>
              </div>
            </div>

            {/* O Calendário Inline */}
            <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-4 uppercase tracking-wider">Data e Horário da Consulta *</label>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Lado Esquerdo: Navegação do Mês */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <button type="button" onClick={prevMonth} className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors">
                      <ChevronLeft className="text-lg font-bold" />
                    </button>
                    <span className="font-black text-sm text-slate-800 dark:text-white tracking-widest">{monthYearLabel}</span>
                    <button type="button" onClick={nextMonth} className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors">
                      <ChevronRight className="text-lg font-bold" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {weekDays.map(day => <div key={day} className="text-center text-[10px] font-black text-lumay-blue dark:text-blue-400 mb-1">{day}</div>)}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {getDaysInMonth().map((date, index) => {
                      if (!date) return <div key={`empty-${index}`} className="h-8"></div>;
                      const isPast = date < today;
                      const isSelected = selectedDate?.getTime() === date.getTime();

                      return (
                        <button
                          key={index}
                          type="button"
                          disabled={isPast}
                          onClick={() => { setSelectedDate(date); setSelectedTime(null); }}
                          className={`h-8 w-full flex items-center justify-center rounded-lg text-xs font-bold transition-all
                            ${isPast 
                              ? "text-slate-300 dark:text-slate-700 cursor-not-allowed" 
                              : isSelected 
                                ? "bg-lumay-blue text-white dark:bg-blue-600 shadow-md transform scale-105" 
                                : "bg-white dark:bg-black/20 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/5 hover:border-lumay-blue dark:hover:border-blue-500 hover:text-lumay-blue dark:hover:text-blue-400"
                            }
                          `}
                        >
                          {date.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Lado Direito: Horários Disponíveis */}
                <div>
                   <div className="text-xs font-bold text-lumay-blue dark:text-blue-400 mb-3 uppercase tracking-wider h-4">
                     {selectedDate ? selectedDate.toLocaleDateString("pt-BR", { weekday: 'long', day: 'numeric', month: 'long' }) : "Selecione um dia"}
                   </div>
                   
                   <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 gap-2 overflow-y-auto max-h-[160px] custom-scrollbar pr-1">
                      {availableTimes.map((time) => {
                        const isSelected = selectedTime === time;
                        return (
                          <button
                            key={time}
                            type="button"
                            disabled={!selectedDate}
                            onClick={() => setSelectedTime(time)}
                            className={`py-2 rounded-xl border text-xs font-bold transition-all
                              ${!selectedDate 
                                ? "border-slate-100 dark:border-white/5 text-slate-300 dark:text-slate-700 bg-transparent cursor-not-allowed" 
                                : isSelected
                                  ? "border-lumay-blue bg-blue-50 dark:bg-blue-500/20 text-lumay-blue dark:text-blue-400"
                                  : "border-slate-200 dark:border-white/10 bg-transparent text-slate-600 dark:text-slate-300 hover:border-lumay-blue dark:hover:border-blue-500 hover:text-lumay-blue dark:hover:text-blue-400"
                              }
                            `}
                          >
                            {time}
                          </button>
                        );
                      })}
                   </div>
                </div>

              </div>
            </div>

            {/* Linha 3: Observações */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Observações</label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detalhes opcionais..." 
                rows={2} 
                className={`${inputCls} resize-none`} 
              />
            </div>

            {/* Botões do Form */}
            <div className="flex gap-3 justify-end pt-4 border-t border-slate-200 dark:border-white/10">
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                Cancelar
              </button>
              <button type="submit" className="px-6 py-2.5 text-sm font-bold bg-lumay-blue dark:bg-blue-600 text-white rounded-xl hover:bg-blue-800 dark:hover:bg-blue-500 shadow-md transition-all">
                ✓ Salvar Consulta
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── BUSCA E TABELA ─── */}
      <div className="flex gap-3 mb-6 relative z-10">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por paciente ou data..."
          className="flex-1 bg-white/80 dark:bg-black/50 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-lumay-blue shadow-sm placeholder:text-slate-400"
        />
      </div>

      <div className="bg-white/80 dark:bg-black/50 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden relative z-10">
        {appointments.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="text-5xl mb-4 text-slate-300 dark:text-slate-600"><CalendarDateFill /></div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Nenhum agendamento.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                <tr>
                  {["Data/Hora", "Paciente", "Serviço", "Status", "Ações"].map((h) => (
                    <th key={h} className="text-left py-4 px-6 font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {appointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                    <td className="py-4 px-6">
                      <p className="font-black text-slate-800 dark:text-white">{apt.date}</p>
                      <p className="text-xs font-bold text-lumay-blue dark:text-blue-400">{apt.time}</p>
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-700 dark:text-slate-300">{apt.patientName}</td>
                    <td className="py-4 px-6 text-slate-500 dark:text-slate-400">{apt.service}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest 
                        ${apt.status === 'Confirmado' ? "bg-green-100/80 text-green-700 dark:bg-green-500/20 dark:text-green-400" : 
                          apt.status === 'Cancelado' ? "bg-red-100/80 text-red-700 dark:bg-red-500/20 dark:text-red-400" :
                          "bg-orange-100/80 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400"}`}
                      >
                        {apt.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-lg transition-colors" title="Confirmar">
                          <CheckCircleFill className="text-lg" />
                        </button>
                        <button className="p-2 text-lumay-blue hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-white/10 rounded-lg transition-colors" title="Editar">
                          <PencilSquare className="text-lg" />
                        </button>
                        <button className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors" title="Cancelar">
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