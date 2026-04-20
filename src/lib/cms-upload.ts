import { api, unwrapData } from '@/lib/api'

export async function uploadPromotionImage(promotionId: string, file: File): Promise<string | null> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await api.post(`/admin/promotions/${promotionId}/image`, fd)
  const row = unwrapData<{ image: string | null }>(res)
  return row.image ?? null
}

export async function uploadArticleCover(articleId: string, file: File): Promise<string | null> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await api.post(`/admin/articles/${articleId}/cover`, fd)
  const row = unwrapData<{ coverImage: string | null }>(res)
  return row.coverImage ?? null
}
