"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "react-bootstrap-icons";

interface AppointmentModalProps {
  onClose: () => void;
  onConfirm: (date: Date, time: string, service: string) => void;
}

export default function AppointmentModal({ onClose, onConfirm }: AppointmentModalProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string>("Consulta Geral");

  const services = ["Consulta Geral", "Limpeza", "Clareamento", "Avaliação Ortodôntica"];
  const availableTimes = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];
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

  const formatFullDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).toLowerCase();
  };

  const monthYearLabel = currentMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm p-4">
      
      {/* Container Principal */}
      <div className="w-full max-w-4xl bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-colors">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
          <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Novo Agendamento</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10">
            <X className="text-3xl" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* LADO ESQUERDO: Calendário e Serviço */}
          <div>
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Serviço Desejado</label>
              <select 
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full bg-slate-50 dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-lumay-blue dark:focus:ring-blue-500 transition-all appearance-none cursor-pointer"
              >
                {services.map(s => <option key={s} value={s} className="dark:bg-slate-900">{s}</option>)}
              </select>
            </div>
            
            <div className="bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 md:p-6">
              {/* Controles do Mês */}
              <div className="flex justify-between items-center mb-6">
                <button onClick={prevMonth} className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors">
                  <ChevronLeft className="text-xl font-bold" />
                </button>
                <span className="font-black text-slate-800 dark:text-white tracking-widest">{monthYearLabel}</span>
                <button onClick={nextMonth} className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors">
                  <ChevronRight className="text-xl font-bold" />
                </button>
              </div>

              {/* Dias da Semana */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map((day) => (
                  <div key={day} className="text-center text-xs font-black text-lumay-blue dark:text-blue-400 mb-2">{day}</div>
                ))}
              </div>

              {/* Grid de Datas */}
              <div className="grid grid-cols-7 gap-1 md:gap-2">
                {getDaysInMonth().map((date, index) => {
                  if (!date) return <div key={`empty-${index}`} className="h-10"></div>;

                  const isPast = date < today;
                  const isSelected = selectedDate?.getTime() === date.getTime();

                  return (
                    <button
                      key={index}
                      disabled={isPast}
                      onClick={() => { setSelectedDate(date); setSelectedTime(null); }}
                      className={`h-10 w-full flex items-center justify-center rounded-lg text-sm font-semibold transition-all
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
          </div>

          {/* LADO DIREITO: Horários */}
          <div className="flex flex-col h-full">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Horários Disponíveis</h3>
            <p className="text-sm text-lumay-blue dark:text-blue-400 font-medium mb-4 h-5">
              {selectedDate ? formatFullDate(selectedDate) : "Selecione uma data no calendário"}
            </p>

            <div className="flex-1 space-y-2 overflow-y-auto pr-2 max-h-[350px] custom-scrollbar">
              {availableTimes.map((time) => {
                const isSelected = selectedTime === time;
                return (
                  <button
                    key={time}
                    disabled={!selectedDate}
                    onClick={() => setSelectedTime(time)}
                    className={`w-full py-3 rounded-xl border text-sm font-bold transition-all
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

        {/* Rodapé (Botões de Ação) */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-black/20 border border-slate-300 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            Cancelar
          </button>
          <button 
            disabled={!selectedDate || !selectedTime}
            onClick={() => onConfirm(selectedDate!, selectedTime!, selectedService)}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-lumay-blue hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✓ Confirmar Agendamento
          </button>
        </div>

      </div>
    </div>
  );
}