import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MessageCircle, RefreshCcw, Search } from 'lucide-react'
import { api, unwrapData } from '@/lib/api'
import { readPaginationMeta } from '@/lib/api-pagination'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageShell } from '@/components/layout/page-shell'
import { PaginationControls } from '@/components/pagination-controls'
import { type LineCustomerLink } from '@/features/line-customers/types'

const PAGE_SIZE = 50

function initial(name?: string | null) {
  const value = name?.trim()
  return value ? value.slice(0, 2).toUpperCase() : 'LN'
}

function formatDate(value: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function LineCustomersPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const normalizedSearch = search.trim()
  const debouncedSearch = useDebouncedValue(normalizedSearch)
  const searchPending = normalizedSearch !== debouncedSearch
  const skip = (page - 1) * PAGE_SIZE

  const query = useQuery({
    queryKey: [
      'admin',
      'line-customers',
      { search: debouncedSearch, skip, take: PAGE_SIZE },
    ],
    queryFn: async () => {
      const response = await api.get('/admin/line-customers', {
        params: {
          search: debouncedSearch || undefined,
          skip,
          take: PAGE_SIZE,
        },
      })
      const rows = unwrapData<LineCustomerLink[]>(response)
      return {
        rows,
        pagination: readPaginationMeta(response.data, {
          skip,
          take: PAGE_SIZE,
          returned: rows.length,
        }),
      }
    },
    enabled: !searchPending,
    placeholderData: (previous) => previous,
  })

  const rows = query.data?.rows ?? []
  const pagination = query.data?.pagination

  return (
    <PageShell title='ลูกค้า LINE'>
      <Card>
        <CardHeader className='gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <MessageCircle className='size-5 text-emerald-600' />
            ลูกค้าที่เชื่อมต่อบัญชี LINE แล้ว
          </CardTitle>
          <span className='text-sm text-muted-foreground'>
            หน้า {page} · {rows.length} รายการ
          </span>
        </CardHeader>
        <CardContent className='grid gap-4'>
          <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
            <div className='relative w-full max-w-xl'>
              <Search className='absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                value={search}
                className='ps-9'
                placeholder='ค้นหาชื่อ LINE, LINE User ID, เจ้าของรถ, เบอร์โทร หรือรหัสลูกค้า'
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(1)
                }}
              />
            </div>
            <Button
              type='button'
              size='sm'
              variant='outline'
              disabled={query.isFetching || searchPending}
              onClick={() => void query.refetch()}
            >
              <RefreshCcw
                className={`size-4 ${query.isFetching ? 'animate-spin' : ''}`}
              />
              รีเฟรช
            </Button>
          </div>

          {query.isError ? (
            <div className='flex flex-col gap-2 rounded-md border border-destructive/50 p-3 sm:flex-row sm:items-center sm:justify-between'>
              <p role='alert' className='text-sm text-destructive'>
                โหลดข้อมูลลูกค้า LINE ไม่สำเร็จ
              </p>
              <Button
                type='button'
                size='sm'
                variant='outline'
                onClick={() => void query.refetch()}
              >
                ลองใหม่
              </Button>
            </div>
          ) : null}

          {query.isLoading ? (
            <div className='grid gap-2'>
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className='h-12 w-full' />
              ))}
            </div>
          ) : null}

          {!query.isLoading && !query.isError && !rows.length ? (
            <div className='rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground'>
              {debouncedSearch
                ? 'ไม่พบบัญชี LINE ที่ตรงกับคำค้นหา'
                : 'ยังไม่มีบัญชี LINE ที่เชื่อมต่อ'}
            </div>
          ) : null}

          {rows.length ? (
            <div
              className={`overflow-x-auto transition-opacity ${query.isFetching || searchPending ? 'opacity-60' : ''}`}
            >
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
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Avatar className='size-10'>
                          <AvatarImage
                            src={row.linePictureUrl ?? undefined}
                            alt={row.lineDisplayName || 'LINE profile'}
                          />
                          <AvatarFallback>
                            {initial(row.lineDisplayName || row.customerName)}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className='font-medium'>
                        {row.lineDisplayName || '-'}
                      </TableCell>
                      <TableCell>
                        <div>{row.customerName || '-'}</div>
                        <div className='text-xs text-muted-foreground'>
                          {row.legacyCustomerId}
                        </div>
                      </TableCell>
                      <TableCell className='font-mono text-xs'>
                        {row.lineUserId}
                      </TableCell>
                      <TableCell>
                        {row.phone || row.customerPhone || '-'}
                      </TableCell>
                      <TableCell>{formatDate(row.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}

          <PaginationControls
            page={page}
            returned={pagination?.returned ?? rows.length}
            hasMore={pagination?.hasMore ?? false}
            disabled={query.isFetching || searchPending}
            onPrevious={() => setPage((current) => Math.max(1, current - 1))}
            onNext={() => setPage((current) => current + 1)}
          />
        </CardContent>
      </Card>
    </PageShell>
  )
}
