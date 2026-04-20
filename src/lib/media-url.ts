/**
 * แปลง path รูปจาก API ให้เป็น URL ที่ `<img src>` โหลดได้ (สอดคล้องกับแอปลูกค้า)
 */
function apiOriginForAssets(): string {
  const publicOrigin = import.meta.env.VITE_API_PUBLIC_ORIGIN as string | undefined
  if (publicOrigin?.trim() && /^https?:\/\//i.test(publicOrigin.trim())) {
    return publicOrigin.trim().replace(/\/$/, '')
  }
  const base = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1'
  if (/^https?:\/\//i.test(base)) {
    try {
      return new URL(base).origin
    } catch {
      /* fall through */
    }
  }
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return 'http://127.0.0.1:3000'
}

export function resolveMediaUrl(stored: string | null | undefined): string {
  if (!stored) return ''
  if (stored.startsWith('http://') || stored.startsWith('https://')) return stored
  const path = stored.startsWith('/') ? stored : `/${stored}`
  return `${apiOriginForAssets()}${path}`
}
