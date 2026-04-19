/*
 * ================================================================
 * AULA: API.TS — CENTRALIZANDO AS CHAMADAS HTTP
 * ================================================================
 *
 * Por que criar este arquivo em vez de usar fetch() diretamente?
 *
 * 1. DRY (Don't Repeat Yourself)
 *    O token de autenticação precisa ir em TODO request.
 *    Se colocássemos em cada componente, repetiríamos o código.
 *    Aqui, fazemos uma vez e todos os componentes usam.
 *
 * 2. Manutenibilidade
 *    Se o backend mudar de porta ou URL, mudamos em um único lugar.
 *
 * 3. Tratamento de erros centralizado
 *    Se o token expirar (401), podemos redirecionar para login aqui.
 *
 * AULA: TypeScript Generics
 * ==========================
 * Funções com <T> são "genéricas" — funcionam com qualquer tipo.
 *
 * function request<T>(url: string): Promise<T>
 * → "retorna uma Promise de qualquer tipo T"
 *
 * Uso: request<Patient[]>('/api/patients')
 * → TypeScript sabe que o resultado é Patient[]
 * ================================================================
 */

// URL base do backend — muda aqui se mudar de porta
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

/*
 * AULA: Lendo o token do localStorage.
 *
 * typeof window !== 'undefined': verifica se está no navegador.
 * No Next.js, o código pode rodar no servidor (sem window).
 * Esta verificação evita erro no servidor.
 */
function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('lumay_token')
}

/*
 * Lê os dados do usuário logado do localStorage.
 * Retorna null se não estiver logado.
 */
export function getCurrentUser() {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem('lumay_user')
  if (!raw) return null
  try {
    return JSON.parse(raw) as {
      id: number
      name: string
      email: string
      role: string
      clinicId: number | null
      clinicSlug: string | null
    }
  } catch {
    return null
  }
}

/*
 * AULA: Função central de requisição HTTP.
 *
 * Todos os outros métodos (get, post, patch, del) usam esta função.
 * Ela:
 *   1. Adiciona o token JWT automaticamente
 *   2. Define Content-Type como JSON
 *   3. Verifica se a resposta é ok
 *   4. Se 401 (token expirado), redireciona para login
 *   5. Retorna os dados já convertidos de JSON para objeto JS
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()

  // Monta os headers (metadados da requisição)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  // Adiciona o token se existir
  // "Bearer " + token = formato padrão JWT
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,   // spread: copia todas as opções passadas
    headers,      // substitui headers com os nossos
  })

  // Token expirado ou inválido → redireciona para login
  if (response.status === 401) {
    localStorage.removeItem('lumay_token')
    localStorage.removeItem('lumay_user')
    window.location.href = '/login'
    throw new Error('Sessão expirada. Faça login novamente.')
  }

  // Sem corpo na resposta (ex: 204 No Content)
  if (response.status === 204) {
    return undefined as T
  }

  const data = await response.json()

  // Resposta com erro (4xx, 5xx) → lança exceção com a mensagem do backend
  if (!response.ok) {
    throw new Error(data.detail || data.message || `Erro ${response.status}`)
  }

  return data as T
}

// ── Atalhos para os métodos HTTP ─────────────────────────────────

/** GET → buscar dados */
const get  = <T>(url: string) => request<T>(url, { method: 'GET' })

/** POST → criar dados */
const post = <T>(url: string, body: unknown) =>
  request<T>(url, { method: 'POST', body: JSON.stringify(body) })

/** PUT → atualizar dados completos */
const put  = <T>(url: string, body: unknown) =>
  request<T>(url, { method: 'PUT', body: JSON.stringify(body) })

/** PATCH → atualizar dados parcialmente */
const patch = <T>(url: string, body?: unknown) =>
  request<T>(url, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined })

/** DELETE → remover dados */
const del  = <T>(url: string) => request<T>(url, { method: 'DELETE' })

// ── Tipos TypeScript para as respostas da API ────────────────────

// AULA: Interface = contrato de formato de dados no TypeScript
// Garante que você não esqueceu nenhum campo ao usar o objeto.

export interface Patient {
  id: number
  name: string
  cpf: string
  email?: string
  phone?: string
  birthDate?: string
  medicalNotes?: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface Appointment {
  id: number
  patientId: number
  patientName: string
  startDateTime: string
  endDateTime: string
  procedure: string
  notes?: string
  status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  createdAt: string
}

export interface Payment {
  id: number
  appointmentId?: number
  patientId: number
  patientName: string
  description: string
  amount: number
  discount?: number
  finalAmount: number
  paymentMethod: string
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'REFUNDED' | 'CANCELLED'
  dueDate: string
  paidAt?: string
  notes?: string
  createdAt: string
}

export interface DashboardData {
  kpiCards: {
    appointmentsToday: number
    totalActivePatients: number
    newPatientsThisMonth: number
    revenueThisMonth: number
    pendingPaymentsTotal: number
    cancellationsThisMonth: number
  }
  todayAppointments: Array<{
    id: number
    patientName: string
    procedure: string
    startTime: string
    endTime: string
    status: string
  }>
  upcomingAppointments: Array<{
    id: number
    patientName: string
    procedure: string
    date: string
    startTime: string
    status: string
  }>
  pendingPayments: Array<{
    id: number
    patientName: string
    description: string
    amount: number
    dueDate: string
    overdue: boolean
  }>
  monthlyRevenue: Array<{
    monthLabel: string
    revenue: number
  }>
}

// ── API de Autenticação ──────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    post<{
      token: string
      userId: number
      userName: string
      userEmail: string
      userRole: string
      clinicId: number | null
      clinicSlug: string | null
    }>('/api/auth/login', { email, password }),

  register: (data: {
    name: string
    email: string
    password: string
    role?: string
  }) => post<void>('/api/auth/register', data),
}

// ── API de Clínicas ──────────────────────────────────────────────
export const clinicApi = {
  register: (data: {
    clinicName: string
    clinicSlug: string
    clinicEmail?: string
    clinicPhone?: string
    adminName: string
    adminEmail: string
    adminPassword: string
  }) => post<{ token: string; adminEmail: string; clinic: { id: number; name: string } }>(
    '/api/clinics/register', data
  ),

  findById: (id: number) => get<{ id: number; name: string; slug: string; plan: string }>(`/api/clinics/${id}`),

  update: (id: number, data: { name: string; email?: string; phone?: string; address?: string }) =>
    put(`/api/clinics/${id}`, data),
}

// ── API de Pacientes ──────────────────────────────────────────────
export const patientApi = {
  findAll:   ()           => get<Patient[]>('/api/patients'),
  findById:  (id: number) => get<Patient>(`/api/patients/${id}`),
  search:    (name: string) => get<Patient[]>(`/api/patients/search?name=${encodeURIComponent(name)}`),

  create: (data: {
    name: string; cpf: string; email?: string
    phone?: string; birthDate?: string; medicalNotes?: string
  }) => post<Patient>('/api/patients', data),

  update: (id: number, data: {
    name: string; email?: string; phone?: string; medicalNotes?: string
  }) => put<Patient>(`/api/patients/${id}`, data),

  deactivate: (id: number) => del<void>(`/api/patients/${id}`),
}

// ── API de Agendamentos ──────────────────────────────────────────
export const appointmentApi = {
  findById:    (id: number)          => get<Appointment>(`/api/appointments/${id}`),
  findByRange: (start: string, end: string) =>
    get<Appointment[]>(`/api/appointments/range?start=${start}&end=${end}`),
  findByPatient: (patientId: number) => get<Appointment[]>(`/api/appointments/patient/${patientId}`),

  create: (data: {
    patientId: number; startDateTime: string; endDateTime: string
    procedure: string; notes?: string
  }) => post<Appointment>('/api/appointments', data),

  confirm:  (id: number) => patch<Appointment>(`/api/appointments/${id}/confirm`),
  cancel:   (id: number) => patch<Appointment>(`/api/appointments/${id}/cancel`),
  complete: (id: number) => patch<Appointment>(`/api/appointments/${id}/complete`),
}

// ── API de Pagamentos ────────────────────────────────────────────
export const paymentApi = {
  findById:    (id: number)       => get<Payment>(`/api/payments/${id}`),
  findByStatus: (status: string)  => get<Payment[]>(`/api/payments/status/${status}`),
  findByPatient: (id: number)     => get<Payment[]>(`/api/payments/patient/${id}`),

  create: (data: {
    patientId: number; appointmentId?: number; description: string
    amount: number; discount?: number; paymentMethod: string
    dueDate: string; notes?: string
  }) => post<Payment>('/api/payments', data),

  markAsPaid: (id: number, paidAt?: string) =>
    patch<Payment>(`/api/payments/${id}/pay`, paidAt ? { paidAt } : undefined),

  cancel: (id: number) => patch<Payment>(`/api/payments/${id}/cancel`),
}

// ── API do Dashboard ─────────────────────────────────────────────
export const dashboardApi = {
  get: () => get<DashboardData>('/api/dashboard'),
}
