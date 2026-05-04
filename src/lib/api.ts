import axios, { type AxiosError, type AxiosResponse } from 'axios'
import { useAuthStore } from '@/stores/auth-store'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1'

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'X-Client-App': 'skm-admin-3',
  },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().auth.token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

type ApiSuccess<T> = { success: true; data: T; message: string; meta?: Record<string, unknown> }

export function unwrapData<T>(res: AxiosResponse<unknown>): T {
  const body = res.data
  if (
    body === null ||
    typeof body !== 'object' ||
    !('success' in body) ||
    (body as ApiSuccess<T>).success !== true ||
    !('data' in body)
  ) {
    throw new Error('คำตอบจาก API ไม่ใช่รูปแบบ success (ตรวจสอบ URL / CORS / ว่า API รันอยู่)')
  }
  return (body as ApiSuccess<T>).data
}

export function isAxiosError(e: unknown): e is AxiosError<{ error?: { message?: string } }> {
  return axios.isAxiosError(e)
}
