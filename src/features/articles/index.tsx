import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Eye, Trash2 } from 'lucide-react'
import { api, isAxiosError, unwrapData } from '@/lib/api'
import { uploadArticleCover } from '@/lib/cms-upload'
import { PageShell } from '@/components/layout/page-shell'
import { ImageDropzone } from '@/components/image-dropzone'
import { ArticlePreviewPanel } from '@/components/cms-rich-preview'
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RichTextEditor } from '@/components/rich-text-editor/rich-text-editor'
import { isRichTextEmpty } from '@/lib/rich-text'

type ArticleRow = {
  id: string
  title: string
  content: string
  coverImage: string | null
  publishedAt: string | null
}

function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function ArticlesPage() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState<ArticleRow | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [serverCoverUrl, setServerCoverUrl] = useState<string | null>(null)
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null)
  const [coverRemoved, setCoverRemoved] = useState(false)
  const [published, setPublished] = useState('')

  const [preview, setPreview] = useState<null | { mode: 'row'; row: ArticleRow } | { mode: 'draft' }>(null)
  const [deleteTarget, setDeleteTarget] = useState<ArticleRow | null>(null)

  const pendingCoverBlobUrl = useMemo(
    () => (pendingCoverFile ? URL.createObjectURL(pendingCoverFile) : null),
    [pendingCoverFile],
  )
  useEffect(() => {
    return () => {
      if (pendingCoverBlobUrl) URL.revokeObjectURL(pendingCoverBlobUrl)
    }
  }, [pendingCoverBlobUrl])

  const list = useQuery({
    queryKey: ['admin', 'articles'],
    queryFn: async (): Promise<ArticleRow[]> =>
      unwrapData(await api.get('/admin/articles')) as ArticleRow[],
  })

  const reset = () => {
    setTitle('')
    setContent('')
    setServerCoverUrl(null)
    setPendingCoverFile(null)
    setCoverRemoved(false)
    setPublished('')
    setEdit(null)
  }

  const openCreate = () => {
    reset()
    setOpen(true)
  }

  const openEdit = (row: ArticleRow) => {
    setEdit(row)
    setTitle(row.title)
    setContent(row.content)
    setServerCoverUrl(row.coverImage ?? null)
    setPendingCoverFile(null)
    setCoverRemoved(false)
    setPublished(toLocalInput(row.publishedAt))
    setOpen(true)
  }

  const createMut = useMutation({
    mutationFn: async (): Promise<{ nextCover?: string | null }> => {
      const res = await api.post('/admin/articles', {
        title,
        content,
        publishedAt: published ? new Date(published).toISOString() : null,
      })
      const row = unwrapData<ArticleRow>(res)
      if (pendingCoverFile) {
        const url = await uploadArticleCover(row.id, pendingCoverFile)
        return { nextCover: url }
      }
      return {}
    },
    onSuccess: async (data) => {
      toast.success('สร้างบทความแล้ว')
      if (data.nextCover !== undefined) {
        setServerCoverUrl(data.nextCover)
        setPendingCoverFile(null)
        setCoverRemoved(false)
      }
      setOpen(false)
      await qc.invalidateQueries({ queryKey: ['admin', 'articles'] })
    },
    onError: (e) =>
      toast.error(isAxiosError(e) ? (e.response?.data?.error?.message ?? 'ไม่สำเร็จ') : 'ไม่สำเร็จ'),
  })

  const patchMut = useMutation({
    mutationFn: async (): Promise<{ nextCover?: string | null }> => {
      if (!edit) return {}
      const body: Record<string, unknown> = {
        title,
        content,
        publishedAt: published ? new Date(published).toISOString() : null,
      }
      if (coverRemoved) body.coverImage = null
      await api.patch(`/admin/articles/${edit.id}`, body)
      if (pendingCoverFile) {
        const url = await uploadArticleCover(edit.id, pendingCoverFile)
        return { nextCover: url }
      }
      if (coverRemoved) return { nextCover: null }
      return {}
    },
    onSuccess: async (data) => {
      toast.success('อัปเดตบทความแล้ว')
      if (data.nextCover !== undefined) {
        setServerCoverUrl(data.nextCover)
        setPendingCoverFile(null)
        setCoverRemoved(false)
      }
      setOpen(false)
      await qc.invalidateQueries({ queryKey: ['admin', 'articles'] })
    },
    onError: (e) =>
      toast.error(isAxiosError(e) ? (e.response?.data?.error?.message ?? 'ไม่สำเร็จ') : 'ไม่สำเร็จ'),
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/articles/${id}`)
    },
    onSuccess: async () => {
      toast.success('ลบบทความแล้ว')
      setDeleteTarget(null)
      await qc.invalidateQueries({ queryKey: ['admin', 'articles'] })
    },
    onError: (e) =>
      toast.error(isAxiosError(e) ? (e.response?.data?.error?.message ?? 'ลบไม่สำเร็จ') : 'ลบไม่สำเร็จ'),
  })

  const saving = createMut.isPending || patchMut.isPending

  return (
    <PageShell title='ข่าวสาร / บทความ'>
      <div className='mb-4 flex justify-end'>
        <Button type='button' onClick={openCreate}>
          เพิ่มบทความ
        </Button>
      </div>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>หัวข้อ</TableHead>
              <TableHead>เผยแพร่</TableHead>
              <TableHead className='w-[220px] text-end'>การทำงาน</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.data?.map((row) => (
              <TableRow key={row.id}>
                <TableCell className='font-medium'>{row.title}</TableCell>
                <TableCell className='text-muted-foreground text-sm'>
                  {row.publishedAt ? new Date(row.publishedAt).toLocaleString('th-TH') : '—'}
                </TableCell>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-3xl'>
          <DialogHeader>
            <DialogTitle>{edit ? 'แก้ไขบทความ' : 'เพิ่มบทความ'}</DialogTitle>
          </DialogHeader>
          <div className='grid gap-3 py-2'>
            <div className='grid gap-2'>
              <Label htmlFor='a-title'>หัวข้อ</Label>
              <Input id='a-title' value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='a-body'>เนื้อหา</Label>
              <RichTextEditor id='a-body' value={content} onChange={setContent} placeholder='เนื้อหาบทความ…' />
            </div>
            <ImageDropzone
              id='a-cover'
              label='รูปปก (ถ้ามี)'
              serverUrl={serverCoverUrl}
              pendingFile={pendingCoverFile}
              onPendingFileChange={setPendingCoverFile}
              removed={coverRemoved}
              onRemovedChange={setCoverRemoved}
              disabled={saving}
            />
            <div className='grid gap-2'>
              <Label htmlFor='a-pub'>เวลาเผยแพร่ (ว่างได้)</Label>
              <Input id='a-pub' type='datetime-local' value={published} onChange={(e) => setPublished(e.target.value)} />
            </div>
            <div className='flex justify-end border-t pt-3'>
              <Button type='button' variant='secondary' size='sm' onClick={() => setPreview({ mode: 'draft' })} disabled={!title.trim()}>
                <Eye className='me-1 size-4' />
                ดูตัวอย่างจากฟอร์ม
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => setOpen(false)}>
              ยกเลิก
            </Button>
            <Button
              type='button'
              disabled={saving || !title.trim() || isRichTextEmpty(content)}
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
            <DialogTitle>ตัวอย่างบทความ</DialogTitle>
          </DialogHeader>
          {preview?.mode === 'row' ? (
            <ArticlePreviewPanel
              title={preview.row.title}
              contentHtml={preview.row.content}
              coverUrl={preview.row.coverImage}
              publishedAt={preview.row.publishedAt}
            />
          ) : preview?.mode === 'draft' ? (
            <ArticlePreviewPanel
              title={title}
              contentHtml={content}
              coverUrl={coverRemoved ? null : serverCoverUrl}
              objectCoverUrl={pendingCoverBlobUrl}
              publishedAt={published ? new Date(published).toISOString() : null}
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
            <DialogTitle>ลบบทความ</DialogTitle>
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
