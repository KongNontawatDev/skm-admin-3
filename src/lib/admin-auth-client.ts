import { createAuthClient } from 'better-auth/client'

import { useAuthStore } from '@/stores/auth-store'

const apiBase = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1'

type HeaderTuple = [string, string]

/** origin ของ API — แยกจาก basePath ตาม [Better Auth basic usage](https://www.better-auth.com/docs/basic-usage) */
const adminAuthOrigin = (() => {
  try {
    return new URL(apiBase).origin
  } catch {
    return 'http://localhost:3000'
  }
})()

/** ถ้าตั้ง `VITE_ADMIN_AUTH_BASE_URL` ให้เป็น origin เดียว (ไม่มี path ก็ได้ — client จะต่อ basePath) */
const resolvedOrigin = import.meta.env.VITE_ADMIN_AUTH_BASE_URL
  ? import.meta.env.VITE_ADMIN_AUTH_BASE_URL.replace(/\/api\/v1\/admin-auth\/?$/, '').replace(/\/$/, '')
  : adminAuthOrigin

/** path เดียวกับ `basePath` บนเซิร์ฟเวอร์ (`better-auth.ts`) */
const adminAuthBasePath = '/api/v1/admin-auth'

export const adminAuthClient = createAuthClient({
  baseURL: resolvedOrigin,
  basePath: adminAuthBasePath,
  fetchOptions: {
    onRequest: (context: unknown) => {
      let token = useAuthStore.getState().auth.token
      
      // Fallback: Check localStorage directly if Zustand state is not yet ready/hydrated
      if (!token && typeof window !== 'undefined') {
        try {
          const storage = window.localStorage.getItem('auth-storage')
          if (storage) {
            const parsed = JSON.parse(storage)
            token = parsed.state?.auth?.token
          }
        } catch {
          // ignore
        }
      }

      if (!token || token === 'null' || token === 'undefined') return

      const ctx = context as { options?: { headers?: Record<string, string> | Headers | HeaderTuple[] } }
      if (!ctx.options) return

      // Handle different header formats (Object, Headers instance, or Array)
      if (!ctx.options.headers) {
        ctx.options.headers = {}
      }

      if (ctx.options.headers instanceof Headers) {
        ctx.options.headers.set('Authorization', `Bearer ${token}`)
      } else if (Array.isArray(ctx.options.headers)) {
        ctx.options.headers.push(['Authorization', `Bearer ${token}`])
      } else {
        ctx.options.headers = {
          ...ctx.options.headers,
          Authorization: `Bearer ${token}`,
        }
      }
    },
  },

})

const SESSION_CHECK_TTL_MS = 5 * 60 * 1000
const SESSION_CHECK_STORAGE_KEY = 'admin-session-last-check'

let pendingSessionCheck: ReturnType<typeof adminAuthClient.getSession> | null = null

function getLastSessionCheck(): number {
  if (typeof window === 'undefined') return 0
  const raw = window.sessionStorage.getItem(SESSION_CHECK_STORAGE_KEY)
  const ts = raw ? Number(raw) : 0
  return Number.isFinite(ts) ? ts : 0
}

function markSessionChecked() {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(SESSION_CHECK_STORAGE_KEY, String(Date.now()))
}

export async function getCachedAdminSession(options?: { force?: boolean }) {
  const store = useAuthStore.getState().auth
  const hasLocalAuth = Boolean(store.token && store.user)
  const freshEnough = Date.now() - getLastSessionCheck() < SESSION_CHECK_TTL_MS

  if (!options?.force && hasLocalAuth && freshEnough) {
    return { data: { user: store.user, session: null }, error: null }
  }

  if (!pendingSessionCheck) {
    pendingSessionCheck = adminAuthClient.getSession().finally(() => {
      pendingSessionCheck = null
    })
  }

  const result = await pendingSessionCheck
  if (!result.error && (result.data?.session || result.data?.user || hasLocalAuth)) {
    markSessionChecked()
  }
  return result
}
