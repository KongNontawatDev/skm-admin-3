import { createAuthClient } from 'better-auth/client'

const apiBase = import.meta.env.VITE_API_BASE_URL ?? 'http://i2c20wv92gd8pqui6lxq7qq2.204.168.204.48.sslip.io/api/v1'

/** origin ของ API — แยกจาก basePath ตาม [Better Auth basic usage](https://www.better-auth.com/docs/basic-usage) */
const adminAuthOrigin = (() => {
  try {
    return new URL(apiBase).origin
  } catch {
    return 'http://i2c20wv92gd8pqui6lxq7qq2.204.168.204.48.sslip.io'
  }
})()

/** ถ้าตั้ง `VITE_ADMIN_AUTH_BASE_URL` ให้เป็น origin เดียว (ไม่มี path ก็ได้ — client จะต่อ basePath) */
const resolvedOrigin = import.meta.env.VITE_ADMIN_AUTH_BASE_URL
  ? import.meta.env.VITE_ADMIN_AUTH_BASE_URL.replace(/\/api\/v1\/admin-auth\/?$/, '').replace(/\/$/, '')
  : adminAuthOrigin

/** path เดียวกับ `basePath` บนเซิร์ฟเวอร์ (`better-auth.ts`) */
export const adminAuthBasePath = '/api/v1/admin-auth'

export const adminAuthClient = createAuthClient({
  baseURL: resolvedOrigin,
  basePath: adminAuthBasePath,
})
