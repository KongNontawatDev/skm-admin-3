import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link2, Loader2, MessageCircle, Phone, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { api, isAxiosError, unwrapData } from '@/lib/api'
import { readPaginationMeta } from '@/lib/api-pagination'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/components/layout/page-shell'
import { PaginationControls } from '@/components/pagination-controls'
import { type LineCustomerLink } from '@/features/line-customers/types'

const LINE_PAGE_SIZE = 20

type TemplateRow = {
  id: string
  label: string
  channel: string
}

type TestPushResult = {
  linkId: string
  legacyCustomerId: string
  lineUserIdMasked: string
  template: string
  channel: string
}

function initial(name?: string | null) {
  const value = name?.trim()
  return value ? value.slice(0, 2).toUpperCase() : 'LN'
}

export function LineOaTestPage() {
  const [lineSearch, setLineSearch] = useState('')
  const [linePage, setLinePage] = useState(1)
  const [selectedLink, setSelectedLink] = useState<LineCustomerLink | null>(
    null
  )
  const [templateId, setTemplateId] = useState('')
  const normalizedLineSearch = lineSearch.trim()
  const debouncedLineSearch = useDebouncedValue(normalizedLineSearch)
  const lineSearchPending = normalizedLineSearch !== debouncedLineSearch
  const lineSkip = (linePage - 1) * LINE_PAGE_SIZE

  const links = useQuery({
    queryKey: [
      'admin',
      'line-customers',
      {
        search: debouncedLineSearch,
        skip: lineSkip,
        take: LINE_PAGE_SIZE,
        surface: 'line-oa-test',
      },
    ],
    queryFn: async () => {
      const response = await api.get('/admin/line-customers', {
        params: {
          search: debouncedLineSearch || undefined,
          skip: lineSkip,
          take: LINE_PAGE_SIZE,
        },
      })
      const rows = unwrapData<LineCustomerLink[]>(response)
      return {
        rows,
        pagination: readPaginationMeta(response.data, {
          skip: lineSkip,
          take: LINE_PAGE_SIZE,
          returned: rows.length,
        }),
      }
    },
    enabled: !lineSearchPending,
    placeholderData: (previous) => previous,
  })

  const templates = useQuery({
    queryKey: ['admin', 'line-oa', 'templates'],
    queryFn: async (): Promise<TemplateRow[]> =>
      unwrapData(
        await api.get('/admin/tools/line-oa/templates')
      ) as TemplateRow[],
  })

  const effectiveTemplateId = templateId || templates.data?.[0]?.id || ''
  const selected = templates.data?.find((t) => t.id === effectiveTemplateId)
  const lineRows = links.data?.rows ?? []

  const pushMut = useMutation({
    mutationFn: async () => {
      if (!selectedLink) throw new Error('กรุณาเลือกบัญชี LINE ผู้รับ')
      const res = await api.post('/admin/tools/line-oa/test-push', {
        linkId: selectedLink.id,
        template: effectiveTemplateId,
      })
      return unwrapData(res) as TestPushResult
    },
    onSuccess: (data) => {
      toast.success(
        `ส่งแล้ว — ${data.legacyCustomerId} · ${data.lineUserIdMasked} · ${data.template} · ${data.channel}`
      )
    },
    onError: (e) =>
      toast.error(
        isAxiosError(e)
          ? (e.response?.data?.error?.message ?? 'ไม่สำเร็จ')
          : 'ไม่สำเร็จ'
      ),
  })

  return (
    <PageShell title='ทดสอบ LINE OA'>
      <div className='mx-auto grid max-w-2xl gap-4'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-base'>
              <MessageCircle className='size-5 text-emerald-600' />
              เลือกบัญชี LINE ผู้รับ
            </CardTitle>
            <CardDescription>
              เลือกจากรายการเชื่อมต่อจริง ระบบจะส่งด้วย Link ID
              ของบัญชีนี้โดยตรง ไม่เลือกจากเจ้าของรถเพียงอย่างเดียว
            </CardDescription>
          </CardHeader>
          <CardContent className='grid gap-4'>
            <div className='grid gap-3'>
              <div className='grid gap-2'>
                <Label htmlFor='line-search'>ค้นหาบัญชี LINE</Label>
                <Input
                  id='line-search'
                  value={lineSearch}
                  placeholder='ชื่อ LINE, LINE User ID, เจ้าของรถ, เบอร์โทร หรือรหัสลูกค้า'
                  onChange={(event) => {
                    setLineSearch(event.target.value)
                    setLinePage(1)
                  }}
                />
              </div>
              <Label>ผลการค้นหา</Label>
              {links.isLoading ? (
                <Skeleton className='h-9 w-full' />
              ) : (
                <Select
                  value={selectedLink?.id ?? ''}
                  onValueChange={(id) => {
                    const link = lineRows.find((row) => row.id === id)
                    if (link) setSelectedLink(link)
                  }}
                  disabled={!lineRows.length || lineSearchPending}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue
                      placeholder={
                        lineRows.length
                          ? 'เลือกบัญชี LINE'
                          : 'ไม่พบบัญชี LINE ที่เชื่อมต่อ'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {lineRows.map((link) => (
                      <SelectItem key={link.id} value={link.id}>
                        <span className='flex min-w-0 items-center gap-2'>
                          <span className='truncate font-medium'>
                            {link.lineDisplayName || link.lineUserId}
                          </span>
                          <span className='truncate text-muted-foreground'>
                            · {link.customerName || link.legacyCustomerId} · …
                            {link.lineUserId.slice(-6)}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {links.isError ? (
                <div className='flex items-center justify-between gap-3'>
                  <p role='alert' className='text-sm text-destructive'>
                    โหลดรายการบัญชี LINE ไม่สำเร็จ กรุณาลองใหม่
                  </p>
                  <Button
                    type='button'
                    size='sm'
                    variant='outline'
                    onClick={() => void links.refetch()}
                  >
                    ลองใหม่
                  </Button>
                </div>
              ) : null}
              <PaginationControls
                page={linePage}
                returned={links.data?.pagination.returned ?? lineRows.length}
                hasMore={links.data?.pagination.hasMore ?? false}
                disabled={links.isFetching || lineSearchPending}
                onPrevious={() =>
                  setLinePage((current) => Math.max(1, current - 1))
                }
                onNext={() => setLinePage((current) => current + 1)}
              />
            </div>

            {selectedLink ? (
              <div className='flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-center'>
                <Avatar className='size-12 shrink-0'>
                  <AvatarImage
                    src={selectedLink.linePictureUrl ?? undefined}
                    alt={selectedLink.lineDisplayName || 'LINE profile'}
                  />
                  <AvatarFallback>
                    {initial(
                      selectedLink.lineDisplayName || selectedLink.customerName
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className='min-w-0 flex-1 space-y-1'>
                  <p className='truncate font-medium'>
                    {selectedLink.lineDisplayName || 'ไม่พบชื่อ LINE'}
                  </p>
                  <p className='flex items-center gap-2 text-sm text-muted-foreground'>
                    <UserRound className='size-4 shrink-0' />
                    <span className='truncate'>
                      {selectedLink.customerName ||
                        selectedLink.legacyCustomerId}
                    </span>
                  </p>
                  <p className='flex items-center gap-2 text-sm text-muted-foreground'>
                    <Phone className='size-4 shrink-0' />
                    {selectedLink.phone || selectedLink.customerPhone || '-'}
                  </p>
                  <p className='flex items-start gap-2 font-mono text-xs break-all text-muted-foreground'>
                    <Link2 className='mt-0.5 size-4 shrink-0' />
                    {selectedLink.lineUserId}
                  </p>
                </div>
              </div>
            ) : null}

            <div className='grid gap-2'>
              <Label>เทมเพลต</Label>
              <Select
                value={effectiveTemplateId}
                onValueChange={setTemplateId}
                disabled={!templates.data?.length}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue
                    placeholder={
                      templates.isLoading ? 'กำลังโหลด…' : 'เลือกเทมเพลต'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {(templates.data ?? []).map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {templates.isError ? (
                <div className='flex items-center justify-between gap-3'>
                  <p role='alert' className='text-sm text-destructive'>
                    โหลดรายการเทมเพลตไม่สำเร็จ
                  </p>
                  <Button
                    type='button'
                    size='sm'
                    variant='outline'
                    onClick={() => void templates.refetch()}
                  >
                    ลองใหม่
                  </Button>
                </div>
              ) : null}
              {selected?.channel ? (
                <p className='text-xs text-muted-foreground'>
                  {selected.channel} · เทมเพลตนี้ใช้ข้อมูลจริงจากฐานข้อมูล
                  production แบบอ่านอย่างเดียว
                </p>
              ) : null}
            </div>

            <Button
              type='button'
              disabled={
                pushMut.isPending || !selectedLink || !effectiveTemplateId
              }
              onClick={() => pushMut.mutate()}
            >
              {pushMut.isPending ? (
                <Loader2 className='size-4 animate-spin' />
              ) : (
                <MessageCircle className='size-4' />
              )}
              {pushMut.isPending ? 'กำลังส่ง…' : 'ส่งทดสอบไปยังบัญชีนี้'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}
