import axios from 'axios'
import { useAuthStore } from '../store/authStore'

// API URL must be set via VITE_API_URL environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL

if (!API_BASE_URL) {
  console.error('VITE_API_URL environment variable is not set')
  throw new Error('VITE_API_URL environment variable is required')
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect on login/register 401 errors - let the component handle them
    const isAuthEndpoint = error.config?.url?.includes('/auth/login') || 
                          error.config?.url?.includes('/auth/register')
    
    if (error.response?.status === 401 && !isAuthEndpoint) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Diagnosis API
export const diagnosisApi = {
  analyze: (formData: FormData) =>
    api.post('/diagnosis/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  get: (id: string) => api.get(`/diagnosis/${id}`),
  list: () => api.get('/diagnosis/'),
}

// Prescription API
export const prescriptionApi = {
  generate: (data: { diagnosis_id: string; additional_notes?: string }) =>
    api.post('/prescription/generate', data),
  get: (id: string) => api.get(`/prescription/${id}`),
  list: () => api.get('/prescription/'),
  translate: (data: { prescription_id: string; target_language: string }) =>
    api.post('/prescription/translate', data),
}

// Doctor API
export const doctorApi = {
  getPendingPrescriptions: () => api.get('/doctor/prescriptions/pending'),
  getAllPrescriptions: () => api.get('/doctor/prescriptions'),
  approvePrescription: (id: string, doctor_notes?: string) =>
    api.post(`/doctor/prescriptions/${id}/approve`, { doctor_notes }),
  rejectPrescription: (id: string, doctor_notes: string) =>
    api.post(`/doctor/prescriptions/${id}/reject`, { doctor_notes }),
}

// Reminders API
export const remindersApi = {
  create: (data: any) => api.post('/reminders/create', data),
  list: () => api.get('/reminders/'),
  get: (id: string) => api.get(`/reminders/${id}`),
  acknowledge: (id: string) => api.post(`/reminders/${id}/acknowledge`),
  delete: (id: string) => api.delete(`/reminders/${id}`),
  autoSchedule: (prescriptionId: string) =>
    api.post(`/reminders/auto-schedule/${prescriptionId}`),
}

// Auth API
export const authApi = {
  register: (data: {
    email: string
    password: string
    full_name: string
    phone?: string
    date_of_birth?: string
    gender?: string
  }) => api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateMe: (data: {
    full_name?: string
    phone?: string
    date_of_birth?: string
    gender?: string
    skin_type?: string
    preferences?: Record<string, any>
  }) => api.put('/auth/me', data),
}
