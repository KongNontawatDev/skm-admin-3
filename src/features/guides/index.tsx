import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { Eye, Trash2 } from 'lucide-react'
import { api, isAxiosError, unwrapData } from '@/lib/api'
import { PageShell } from '@/components/layout/page-shell'
import { GuidePreviewPanel } from '@/components/cms-rich-preview'
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
import { isRichTextEmpty, RichTextEditor } from '@/components/rich-text-editor/rich-text-editor'

type GuideRow = {
  id: string
  title: string
  content: string
  sortOrder: number
}

export function GuidesPage() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState<GuideRow | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [sortOrder, setSortOrder] = useState('0')

  const [preview, setPreview] = useState<null | { mode: 'row'; row: GuideRow } | { mode: 'draft' }>(null)
  const [deleteTarget, setDeleteTarget] = useState<GuideRow | null>(null)

  const list = useQuery({
    queryKey: ['admin', 'guides'],
    queryFn: async (): Promise<GuideRow[]> =>
      unwrapData(await api.get('/admin/guides')) as GuideRow[],
  })

  const reset = () => {
    setTitle('')
    setContent('')
    setSortOrder('0')
    setEdit(null)
  }

  const openCreate = () => {
    reset()
    setOpen(true)
  }

  const openEdit = (row: GuideRow) => {
    setEdit(row)
    setTitle(row.title)
    setContent(row.content)
    setSortOrder(String(row.sortOrder))
    setOpen(true)
  }

  const createMut = useMutation({
    mutationFn: async () => {
      await api.post('/admin/guides', {
        title,
        content,
        sortOrder: Number.parseInt(sortOrder, 10) || 0,
      })
    },
    onSuccess: async () => {
      toast.success('สร้างคู่มือแล้ว')
      setOpen(false)
      await qc.invalidateQueries({ queryKey: ['admin', 'guides'] })
    },
    onError: (e) =>
      toast.error(isAxiosError(e) ? (e.response?.data?.error?.message ?? 'ไม่สำเร็จ') : 'ไม่สำเร็จ'),
  })

  const patchMut = useMutation({
    mutationFn: async () => {
      if (!edit) return
      await api.patch(`/admin/guides/${edit.id}`, {
        title,
        content,
        sortOrder: Number.parseInt(sortOrder, 10) || 0,
      })
    },
    onSuccess: async () => {
      toast.success('อัปเดตคู่มือแล้ว')
      setOpen(false)
      await qc.invalidateQueries({ queryKey: ['admin', 'guides'] })
    },
    onError: (e) =>
      toast.error(isAxiosError(e) ? (e.response?.data?.error?.message ?? 'ไม่สำเร็จ') : 'ไม่สำเร็จ'),
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/guides/${id}`)
    },
    onSuccess: async () => {
      toast.success('ลบคู่มือแล้ว')
      setDeleteTarget(null)
      await qc.invalidateQueries({ queryKey: ['admin', 'guides'] })
    },
    onError: (e) =>
      toast.error(isAxiosError(e) ? (e.response?.data?.error?.message ?? 'ลบไม่สำเร็จ') : 'ลบไม่สำเร็จ'),
  })

  const saving = createMut.isPending || patchMut.isPending

  return (
    <PageShell title='วิธีใช้งานแอป'>
      <div className='mb-4 flex justify-end'>
        <Button type='button' onClick={openCreate}>
          เพิ่มหัวข้อคู่มือ
        </Button>
      </div>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-20'>ลำดับ</TableHead>
              <TableHead>หัวข้อ</TableHead>
              <TableHead className='w-[220px] text-end'>การทำงาน</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.data?.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.sortOrder}</TableCell>
                <TableCell className='font-medium'>{row.title}</TableCell>
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
            <DialogTitle>{edit ? 'แก้ไขคู่มือ' : 'เพิ่มคู่มือ'}</DialogTitle>
          </DialogHeader>
          <div className='grid gap-3 py-2'>
            <div className='grid gap-2'>
              <Label htmlFor='g-order'>ลำดับการแสดง</Label>
              <Input
                id='g-order'
                type='number'
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='g-title'>หัวข้อ</Label>
              <Input id='g-title' value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='g-body'>เนื้อหา</Label>
              <RichTextEditor id='g-body' value={content} onChange={setContent} placeholder='เนื้อหาคู่มือ…' />
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
            <DialogTitle>ตัวอย่างคู่มือ</DialogTitle>
          </DialogHeader>
          {preview?.mode === 'row' ? (
            <GuidePreviewPanel
              title={preview.row.title}
              contentHtml={preview.row.content}
              sortOrder={preview.row.sortOrder}
            />
          ) : preview?.mode === 'draft' ? (
            <GuidePreviewPanel
              title={title}
              contentHtml={content}
              sortOrder={Number.parseInt(sortOrder, 10) || 0}
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
            <DialogTitle>ลบคู่มือ</DialogTitle>
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
