import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { api, isAxiosError, unwrapData } from '@/lib/api'
import { resolveMediaUrl } from '@/lib/media-url'
import { PageShell } from '@/components/layout/page-shell'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'

type TicketRow = {
  id: string
  idno: string
  title: string
  description: string
  status: string
  adminReply: string | null
  imageUrl?: string | null
  createdAt: string
  updatedAt: string
}

function ticketAttachmentUrls(row: TicketRow): string[] {
  const u = row.imageUrl?.trim()
  return u ? [u] : []
}

const statusTh: Record<string, string> = {
  open: 'รอดำเนินการ',
  replied: 'มีการตอบกลับ',
  closed: 'ปิดเรื่อง',
}

function statusLabel(s: string): string {
  return statusTh[s] ?? s
}

function TicketCustomerContent({ row }: { row: TicketRow }) {
  const images = ticketAttachmentUrls(row)
  return (
    <div className='grid gap-3 text-sm'>
      <div className='flex flex-wrap gap-2 text-muted-foreground'>
        <span>รหัสตั๋ว: {row.id}</span>
        <span>·</span>
        <span>รหัสผู้ใช้แอป: {row.idno}</span>
      </div>
      <div className='flex flex-wrap gap-2 text-muted-foreground'>
        <span>สถานะ: {statusLabel(row.status)}</span>
        <span>·</span>
        <span>แจ้งเมื่อ {new Date(row.createdAt).toLocaleString('th-TH')}</span>
        <span>·</span>
        <span>อัปเดต {new Date(row.updatedAt).toLocaleString('th-TH')}</span>
      </div>
      <div>
        <p className='mb-1 font-medium text-foreground'>ข้อความที่ลูกค้าแจ้ง</p>
        <p className='whitespace-pre-wrap rounded-md border bg-muted/40 p-3 text-foreground'>{row.description}</p>
      </div>
      {images.length > 0 ? (
        <div>
          <p className='mb-2 font-medium text-foreground'>รูปประกอบจากลูกค้า ({images.length})</p>
          <div className='grid grid-cols-2 gap-2 sm:grid-cols-3'>
            {images.map((src) => (
              <a
                key={src}
                href={resolveMediaUrl(src)}
                target='_blank'
                rel='noopener noreferrer'
                className='block overflow-hidden rounded-lg border bg-muted/30'
              >
                <img
                  src={resolveMediaUrl(src)}
                  alt=''
                  className='aspect-square w-full object-cover'
                  loading='lazy'
                />
              </a>
            ))}
          </div>
        </div>
      ) : (
        <p className='text-muted-foreground'>ไม่มีรูปประกอบ</p>
      )}
    </div>
  )
}

export function SupportPage() {
  const qc = useQueryClient()
  const [detailTicket, setDetailTicket] = useState<TicketRow | null>(null)
  const [replyTicket, setReplyTicket] = useState<TicketRow | null>(null)
  const [reply, setReply] = useState('')
  const [status, setStatus] = useState<'replied' | 'closed'>('replied')

  const list = useQuery({
    queryKey: ['admin', 'support', 'tickets'],
    queryFn: async (): Promise<TicketRow[]> =>
      unwrapData(await api.get('/admin/support/tickets')) as TicketRow[],
  })

  const openReply = (row: TicketRow) => {
    setDetailTicket(null)
    setReplyTicket(row)
    setReply(row.adminReply ?? '')
    setStatus('replied')
  }

  const openDetail = (row: TicketRow) => {
    setReplyTicket(null)
    setDetailTicket(row)
  }

  const replyMut = useMutation({
    mutationFn: async () => {
      if (!replyTicket) return
      await api.post(`/admin/support/tickets/${replyTicket.id}/reply`, {
        adminReply: reply.trim(),
        status,
      })
    },
    onSuccess: async () => {
      toast.success('บันทึกคำตอบแล้ว')
      setReplyTicket(null)
      await qc.invalidateQueries({ queryKey: ['admin', 'support', 'tickets'] })
    },
    onError: (e) =>
      toast.error(isAxiosError(e) ? (e.response?.data?.error?.message ?? 'ไม่สำเร็จ') : 'ไม่สำเร็จ'),
  })

  return (
    <PageShell title='แจ้งปัญหาจากผู้ใช้'>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>หัวข้อ</TableHead>
              <TableHead>รหัสผู้ใช้แอป</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead>วันที่</TableHead>
              <TableHead className='w-[200px] text-right'>การกระทำ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.data?.map((row) => (
              <TableRow key={row.id}>
                <TableCell className='font-medium'>{row.title}</TableCell>
                <TableCell className='font-mono text-xs'>{row.idno}</TableCell>
                <TableCell>{statusLabel(row.status)}</TableCell>
                <TableCell className='text-muted-foreground text-sm'>
                  {new Date(row.createdAt).toLocaleString('th-TH')}
                </TableCell>
                <TableCell className='text-right'>
                  <div className='flex flex-wrap justify-end gap-2'>
                    <Button variant='outline' size='sm' type='button' onClick={() => openDetail(row)}>
                      ดูรายละเอียด
                    </Button>
                    <Button variant='default' size='sm' type='button' onClick={() => openReply(row)}>
                      ตอบกลับ
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!list.data?.length && (
              <TableRow>
                <TableCell colSpan={5} className='text-center text-muted-foreground'>
                  {list.isLoading ? 'กำลังโหลด…' : 'ยังไม่มีตั๋ว'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!detailTicket} onOpenChange={(o) => !o && setDetailTicket(null)}>
        <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>รายละเอียดที่ลูกค้าแจ้ง</DialogTitle>
          </DialogHeader>
          {detailTicket ? <TicketCustomerContent row={detailTicket} /> : null}
          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => setDetailTicket(null)}>
              ปิด
            </Button>
            {detailTicket ? (
              <Button type='button' onClick={() => openReply(detailTicket)}>
                ตอบกลับ
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!replyTicket} onOpenChange={(o) => !o && setReplyTicket(null)}>
        <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>ตอบตั๋ว: {replyTicket?.title}</DialogTitle>
          </DialogHeader>
          <div className='grid gap-4 py-2'>
            {replyTicket ? <TicketCustomerContent row={replyTicket} /> : null}
            <div className='grid gap-2'>
              <Label htmlFor='t-reply'>ข้อความตอบกลับ (HTML จาก CMS ได้)</Label>
              <Textarea id='t-reply' rows={5} value={reply} onChange={(e) => setReply(e.target.value)} />
            </div>
            <div className='grid gap-2'>
              <Label>สถานะหลังตอบ</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as 'replied' | 'closed')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='replied'>มีการตอบกลับ</SelectItem>
                  <SelectItem value='closed'>ปิดเรื่อง</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => setReplyTicket(null)}>
              ยกเลิก
            </Button>
            <Button
              type='button'
              disabled={replyMut.isPending || !reply.trim()}
              onClick={() => replyMut.mutate()}
            >
              {replyMut.isPending ? 'กำลังบันทึก…' : 'ส่งคำตอบ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
