/**
 * ================================================================
 * API.TS — CENTRALIZANDO AS CHAMADAS HTTP (VERSÃO FINAL)
 * ================================================================
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

// --- FERRAMENTAS DE TOKEN E USUÁRIO ---

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('lumay_token')
}

export function getCurrentUser() {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem('lumay_user')
  if (!raw) return null
  try {
    return JSON.parse(raw) as {
      id: number; name: string; email: string; role: string;
      clinicId: number | null; clinicSlug: string | null;
    }
  } catch { return null }
}

// --- O MENSAGEIRO (REQUEST) ---
// Função central que coloca o token em todas as chamadas
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) { headers['Authorization'] = `Bearer ${token}` }

  const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers })

  // Se o token expirar, limpa a memória e manda para o login
  if (response.status === 401) {
    localStorage.removeItem('lumay_token')
    localStorage.removeItem('lumay_user')
    if (typeof window !== 'undefined') window.location.href = '/login'
    throw new Error('Sessão expirada. Faça login novamente.')
  }

  if (response.status === 204) return undefined as T
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || data.message || `Erro ${response.status}`)
  return data as T
}

// Métodos HTTP simplificados
const get   = <T>(url: string) => request<T>(url, { method: 'GET' })
const post  = <T>(url: string, body: unknown) => request<T>(url, { method: 'POST', body: JSON.stringify(body) })
const put   = <T>(url: string, body: unknown) => request<T>(url, { method: 'PUT', body: JSON.stringify(body) })
const patch = <T>(url: string, body?: unknown) => request<T>(url, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined })
const del   = <T>(url: string) => request<T>(url, { method: 'DELETE' })

// ── DEFINIÇÃO DOS TIPOS (O CONTRATO) ────────────────────────────────

export interface Patient {
  id: number; name: string; cpf: string; email?: string;
  phone?: string; birthDate?: string; medicalNotes?: string;
  active: boolean; createdAt: string; updatedAt: string;
}

export type CreatePatientReq = {
  name: string; cpf: string; email?: string;
  phone?: string; birthDate?: string; medicalNotes?: string;
}

export interface Appointment {
  id: number; patientId: number; patientName: string;
  startDateTime: string; endDateTime: string; procedure: string;
  notes?: string; status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  createdAt: string;
}

export type PayStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'REFUNDED' | 'CANCELLED';

export interface Payment {
  id: number;
  patientId: number;
  patientName: string;
  description: string;
  amount: number;
  finalAmount: number;
  paymentMethod: string; // Resolvido: O TypeScript agora enxerga este campo
  status: PayStatus;
  dueDate: string;
  createdAt: string;
}

export interface DashboardData {
  kpiCards: {
    appointmentsToday: number; totalActivePatients: number;
    newPatientsThisMonth: number; revenueThisMonth: number;
    pendingPaymentsTotal: number; cancellationsThisMonth: number;
  };
  todayAppointments: Array<{
    id: number; patientName: string; procedure: string;
    startTime: string; endTime: string; status: string;
  }>;
  pendingPayments: Array<{
    id: number; patientName: string; description: string;
    amount: number; dueDate: string; overdue: boolean;
  }>;
  monthlyRevenue: Array<{ monthLabel: string; revenue: number }>;
}

// ── APIs CENTRALIZADAS (AS FUNÇÕES QUE AS PÁGINAS USAM) ──────────────

export const authApi = {
  login: (email: string, password: string) =>
    post<{ token: string; userName: string; userRole: string }>('/api/auth/login', { email, password }),
}

export const patientApi = {
  findAll:   () => get<Patient[]>('/api/patients'),
  search:    (name: string) => get<Patient[]>(`/api/patients/search?name=${encodeURIComponent(name)}`),
  create:    (data: CreatePatientReq) => post<Patient>('/api/patients', data),
  update:    (id: number, data: Partial<CreatePatientReq>) => put<Patient>(`/api/patients/${id}`, data),
  deactivate: (id: number) => del<void>(`/api/patients/${id}`),
}

export const appointmentApi = {
  findAll:      () => get<Appointment[]>('/api/appointments'),
  findByPatient: (id: number) => get<Appointment[]>(`/api/appointments/patient/${id}`),
  create:       (data: any) => post<Appointment>('/api/appointments', data),
  confirm:      (id: number) => patch<Appointment>(`/api/appointments/${id}/confirm`),
  cancel:       (id: number) => patch<Appointment>(`/api/appointments/${id}/cancel`),
  complete:     (id: number) => patch<Appointment>(`/api/appointments/${id}/complete`),
}

export const paymentApi = {
  findAll:      () => get<Payment[]>('/api/payments'),
  findById:     (id: number) => get<Payment>(`/api/payments/${id}`),
  findByStatus: (status: string) => get<Payment[]>(`/api/payments/status/${status}`),
  findByPatient: (id: number) => get<Payment[]>(`/api/payments/patient/${id}`),
  markAsPaid:   (id: number) => patch<Payment>(`/api/payments/${id}/pay`),
  cancel:       (id: number) => patch<Payment>(`/api/payments/${id}/cancel`),
}

export const dashboardApi = {
  get: () => get<DashboardData>('/api/dashboard'),
}