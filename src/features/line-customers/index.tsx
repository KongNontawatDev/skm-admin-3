import { useQuery } from '@tanstack/react-query'
import { MessageCircle } from 'lucide-react'
import { api, unwrapData } from '@/lib/api'
import { PageShell } from '@/components/layout/page-shell'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type LineCustomer = {
  id: string
  compid: string
  idno: string
  legacyCustomerId: string
  lineUserId: string
  customerPhone: string | null
  lineDisplayName: string | null
  linePictureUrl: string | null
  customerName: string | null
  phone: string | null
  createdAt: string
}

function initial(name?: string | null) {
  const s = name?.trim()
  return s ? s.slice(0, 2).toUpperCase() : 'LN'
}

function formatDate(value: string) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })
}

export function LineCustomersPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'line-customers'],
    queryFn: async () => unwrapData<LineCustomer[]>(await api.get('/admin/line-customers', { params: { take: 500 } })),
  })

  return (
    <PageShell title='ลูกค้า LINE'>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <MessageCircle className='size-5 text-emerald-600' />
            ลูกค้าที่เชื่อมต่อบัญชี LINE แล้ว
          </CardTitle>
          <span className='text-sm text-muted-foreground'>{data?.length ?? 0} รายการ</span>
        </CardHeader>
        <CardContent className='overflow-x-auto'>
          {isError ? <p className='text-sm text-destructive'>โหลดข้อมูลลูกค้า LINE ไม่สำเร็จ</p> : null}
          {isLoading ? (
            <div className='grid gap-2'>
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className='h-12 w-full' />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>โปรไฟล์</TableHead>
                  <TableHead>ชื่อไลน์</TableHead>
                  <TableHead>ชื่อจริง</TableHead>
                  <TableHead>LINE User ID</TableHead>
                  <TableHead>เบอร์โทร</TableHead>
                  <TableHead>วันที่เชื่อมต่อ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data ?? []).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Avatar className='size-10'>
                        <AvatarImage src={row.linePictureUrl ?? undefined} />
                        <AvatarFallback>{initial(row.lineDisplayName || row.customerName)}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className='font-medium'>{row.lineDisplayName || '-'}</TableCell>
                    <TableCell>
                      <div>{row.customerName || '-'}</div>
                      <div className='text-xs text-muted-foreground'>{row.legacyCustomerId}</div>
                    </TableCell>
                    <TableCell className='font-mono text-xs'>{row.lineUserId}</TableCell>
                    <TableCell>{row.phone || row.customerPhone || '-'}</TableCell>
                    <TableCell>{formatDate(row.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageShell>
  )
}
