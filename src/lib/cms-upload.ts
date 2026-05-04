import { api, unwrapData } from '@/lib/api'
import { compressImageForUpload } from '@/lib/image-compression'

export async function uploadPromotionImage(promotionId: string, file: File): Promise<string | null> {
  const uploadFile = await compressImageForUpload(file)
  const fd = new FormData()
  fd.append('file', uploadFile)
  const res = await api.post(`/admin/promotions/${promotionId}/image`, fd)
  const row = unwrapData<{ image: string | null }>(res)
  return row.image ?? null
}

export async function uploadArticleCover(articleId: string, file: File): Promise<string | null> {
  const uploadFile = await compressImageForUpload(file)
  const fd = new FormData()
  fd.append('file', uploadFile)
  const res = await api.post(`/admin/articles/${articleId}/cover`, fd)
  const row = unwrapData<{ coverImage: string | null }>(res)
  return row.coverImage ?? null
}
export async function uploadCmsAsset(file: File): Promise<string | null> {
  const uploadFile = await compressImageForUpload(file)
  const fd = new FormData()
  fd.append('file', uploadFile)
  const res = await api.post('/admin/cms/upload-asset', fd)
  const row = unwrapData<{ url: string | null }>(res)
  return row.url ?? null
}
