import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Eye, Trash2 } from 'lucide-react'
import { api, isAxiosError, unwrapData } from '@/lib/api'
import { uploadPromotionImage } from '@/lib/cms-upload'
import { PageShell } from '@/components/layout/page-shell'
import { ImageDropzone } from '@/components/image-dropzone'
import { PromotionPreviewPanel } from '@/components/cms-rich-preview'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { isRichTextEmpty, RichTextEditor } from '@/components/rich-text-editor/rich-text-editor'

type PromotionRow = {
  id: string
  title: string
  description: string
  image: string | null
  startDate: string | null
  endDate: string | null
  isActive: boolean
}

function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function PromotionsPage() {
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [edit, setEdit] = useState<PromotionRow | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [serverImageUrl, setServerImageUrl] = useState<string | null>(null)
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null)
  const [imageRemoved, setImageRemoved] = useState(false)
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [isActive, setIsActive] = useState(true)

  const [preview, setPreview] = useState<null | { mode: 'row'; row: PromotionRow } | { mode: 'draft' }>(null)
  const [deleteTarget, setDeleteTarget] = useState<PromotionRow | null>(null)

  const pendingBlobUrl = useMemo(
    () => (pendingImageFile ? URL.createObjectURL(pendingImageFile) : null),
    [pendingImageFile],
  )
  useEffect(() => {
    return () => {
      if (pendingBlobUrl) URL.revokeObjectURL(pendingBlobUrl)
    }
  }, [pendingBlobUrl])

  const list = useQuery({
    queryKey: ['admin', 'promotions'],
    queryFn: async (): Promise<PromotionRow[]> =>
      unwrapData(await api.get('/admin/promotions')) as PromotionRow[],
  })

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setServerImageUrl(null)
    setPendingImageFile(null)
    setImageRemoved(false)
    setStart('')
    setEnd('')
    setIsActive(true)
  }

  const openCreate = () => {
    resetForm()
    setEdit(null)
    setCreateOpen(true)
  }

  const openEdit = (row: PromotionRow) => {
    setEdit(row)
    setTitle(row.title)
    setDescription(row.description)
    setServerImageUrl(row.image ?? null)
    setPendingImageFile(null)
    setImageRemoved(false)
    setStart(toLocalInput(row.startDate))
    setEnd(toLocalInput(row.endDate))
    setIsActive(row.isActive)
    setCreateOpen(true)
  }

  const createMut = useMutation({
    mutationFn: async (): Promise<{ nextImage?: string | null }> => {
      const res = await api.post('/admin/promotions', {
        title,
        description,
        startDate: start ? new Date(start).toISOString() : undefined,
        endDate: end ? new Date(end).toISOString() : undefined,
        isActive,
      })
      const row = unwrapData<PromotionRow>(res)
      if (pendingImageFile) {
        const img = await uploadPromotionImage(row.id, pendingImageFile)
        return { nextImage: img }
      }
      return {}
    },
    onSuccess: async (data) => {
      toast.success('บันทึกโปรโมชันแล้ว')
      if (data.nextImage !== undefined) {
        setServerImageUrl(data.nextImage)
        setPendingImageFile(null)
        setImageRemoved(false)
      }
      setCreateOpen(false)
      await qc.invalidateQueries({ queryKey: ['admin', 'promotions'] })
    },
    onError: (e) => {
      toast.error(isAxiosError(e) ? (e.response?.data?.error?.message ?? 'บันทึกไม่สำเร็จ') : 'บันทึกไม่สำเร็จ')
    },
  })

  const patchMut = useMutation({
    mutationFn: async (): Promise<{ nextImage?: string | null }> => {
      if (!edit) return {}
      const body: Record<string, unknown> = {
        title,
        description,
        startDate: start ? new Date(start).toISOString() : null,
        endDate: end ? new Date(end).toISOString() : null,
        isActive,
      }
      if (imageRemoved) body.image = null
      await api.patch(`/admin/promotions/${edit.id}`, body)
      if (pendingImageFile) {
        const img = await uploadPromotionImage(edit.id, pendingImageFile)
        return { nextImage: img }
      }
      if (imageRemoved) return { nextImage: null }
      return {}
    },
    onSuccess: async (data) => {
      toast.success('อัปเดตโปรโมชันแล้ว')
      if (data.nextImage !== undefined) {
        setServerImageUrl(data.nextImage)
        setPendingImageFile(null)
        setImageRemoved(false)
      }
      setCreateOpen(false)
      setEdit(null)
      await qc.invalidateQueries({ queryKey: ['admin', 'promotions'] })
    },
    onError: (e) => {
      toast.error(isAxiosError(e) ? (e.response?.data?.error?.message ?? 'อัปเดตไม่สำเร็จ') : 'อัปเดตไม่สำเร็จ')
    },
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/promotions/${id}`)
    },
    onSuccess: async () => {
      toast.success('ลบโปรโมชันแล้ว')
      setDeleteTarget(null)
      await qc.invalidateQueries({ queryKey: ['admin', 'promotions'] })
    },
    onError: (e) =>
      toast.error(isAxiosError(e) ? (e.response?.data?.error?.message ?? 'ลบไม่สำเร็จ') : 'ลบไม่สำเร็จ'),
  })

  const saving = createMut.isPending || patchMut.isPending

  return (
    <PageShell title='จัดการโปรโมชัน'>
      <div className='mb-4 flex justify-end'>
        <Button type='button' onClick={openCreate}>
          เพิ่มโปรโมชัน
        </Button>
      </div>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>หัวข้อ</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead className='w-[220px] text-end'>การทำงาน</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.data?.map((row) => (
              <TableRow key={row.id}>
                <TableCell className='font-medium'>{row.title}</TableCell>
                <TableCell>{row.isActive ? 'ใช้งาน' : 'ปิด'}</TableCell>
                <TableCell className='text-end'>
                  <div className='flex flex-wrap justify-end gap-1'>
                    <Button variant='outline' size='sm' type='button' onClick={() => setPreview({ mode: 'row', row })}>
                      <Eye className='size-4' />
                      ดูตัวอย่าง
                    </Button>
                    <Button variant='outline' size='sm' type='button' onClick={() => openEdit(row)}>
                      แก้ไข
                    </Button>
                    <Button variant='outline' size='sm' type='button' className='text-destructive' onClick={() => setDeleteTarget(row)}>
                      <Trash2 className='size-4' />
                      ลบ
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!list.data?.length && (
              <TableRow>
                <TableCell colSpan={3} className='text-center text-muted-foreground'>
                  {list.isLoading ? 'กำลังโหลด…' : 'ยังไม่มีข้อมูล'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-3xl'>
          <DialogHeader>
            <DialogTitle>{edit ? 'แก้ไขโปรโมชัน' : 'เพิ่มโปรโมชัน'}</DialogTitle>
          </DialogHeader>
          <div className='grid gap-3 py-2'>
            <div className='grid gap-2'>
              <Label htmlFor='p-title'>หัวข้อ</Label>
              <Input id='p-title' value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='p-desc'>รายละเอียด</Label>
              <RichTextEditor
                id='p-desc'
                value={description}
                onChange={setDescription}
                placeholder='รายละเอียดโปรโมชัน…'
              />
            </div>
            <ImageDropzone
              id='p-img'
              label='รูปโปรโมชัน (ถ้ามี)'
              serverUrl={serverImageUrl}
              pendingFile={pendingImageFile}
              onPendingFileChange={setPendingImageFile}
              removed={imageRemoved}
              onRemovedChange={setImageRemoved}
              disabled={saving}
            />
            <div className='grid gap-2 sm:grid-cols-2'>
              <div>
                <Label htmlFor='p-start'>เริ่ม</Label>
                <Input id='p-start' type='datetime-local' value={start} onChange={(e) => setStart(e.target.value)} />
              </div>
              <div>
                <Label htmlFor='p-end'>สิ้นสุด</Label>
                <Input id='p-end' type='datetime-local' value={end} onChange={(e) => setEnd(e.target.value)} />
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <Switch id='p-active' checked={isActive} onCheckedChange={setIsActive} />
              <Label htmlFor='p-active'>เปิดใช้งาน</Label>
            </div>
            <div className='flex justify-end border-t pt-3'>
              <Button type='button' variant='secondary' size='sm' onClick={() => setPreview({ mode: 'draft' })} disabled={!title.trim()}>
                <Eye className='me-1 size-4' />
                ดูตัวอย่างจากฟอร์ม
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => setCreateOpen(false)}>
              ยกเลิก
            </Button>
            <Button
              type='button'
              disabled={saving || !title.trim() || isRichTextEmpty(description)}
              onClick={() => (edit ? patchMut.mutate() : createMut.mutate())}
            >
              {saving ? 'กำลังบันทึก…' : 'บันทึก'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-3xl'>
          <DialogHeader>
            <DialogTitle>ตัวอย่างโปรโมชัน</DialogTitle>
          </DialogHeader>
          {preview?.mode === 'row' ? (
            <PromotionPreviewPanel
              title={preview.row.title}
              descriptionHtml={preview.row.description}
              imageUrl={preview.row.image}
              startDate={preview.row.startDate}
              endDate={preview.row.endDate}
              isActive={preview.row.isActive}
            />
          ) : preview?.mode === 'draft' ? (
            <PromotionPreviewPanel
              title={title}
              descriptionHtml={description}
              imageUrl={imageRemoved ? null : serverImageUrl}
              objectImageUrl={pendingBlobUrl}
              startDate={start ? new Date(start).toISOString() : null}
              endDate={end ? new Date(end).toISOString() : null}
              isActive={isActive}
            />
          ) : null}
          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => setPreview(null)}>
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>ลบโปรโมชัน</DialogTitle>
          </DialogHeader>
          <p className='text-muted-foreground text-sm'>
            ต้องการลบ <span className='text-foreground font-medium'>«{deleteTarget?.title}»</span> ใช่หรือไม่ การลบไม่สามารถย้อนกลับได้
          </p>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => setDeleteTarget(null)}>
              ยกเลิก
            </Button>
            <Button
              type='button'
              variant='destructive'
              disabled={deleteMut.isPending}
              onClick={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
            >
              {deleteMut.isPending ? 'กำลังลบ…' : 'ลบ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
