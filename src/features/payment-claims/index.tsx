import { useState } from 'react'
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCcw,
  Search,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { api, isAxiosError, unwrapData } from '@/lib/api'
import { readPaginationMeta } from '@/lib/api-pagination'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { ConfirmDialog } from '@/components/confirm-dialog'
import { PageShell } from '@/components/layout/page-shell'
import { PaginationControls } from '@/components/pagination-controls'
import { type LineCustomerLink } from '@/features/line-customers/types'
import { isPaymentClaimConflict } from '@/features/payment-claims/payment-claims.contract'
import {
  findLineLinkForClaim,
  mapPaymentClaimsPayload,
  type PaymentClaim,
  type PaymentClaimStatus,
} from '@/features/payment-claims/payment-claims.mapper'

type ClaimResolution = 'posted' | 'rejected'

type ActionTarget = {
  claim: PaymentClaim
  status: ClaimResolution
}

const CLAIMS_PAGE_SIZE = 25

function apiErrorMessage(error: unknown, fallback: string) {
  if (!isAxiosError(error)) return fallback
  return error.response?.data?.error?.message ?? fallback
}

function formatDate(value: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function formatMoney(value: number | null) {
  if (value === null) return '-'
  return value.toLocaleString('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

function initial(name?: string | null) {
  const value = name?.trim()
  return value ? value.slice(0, 2).toUpperCase() : 'LN'
}

function statusLabel(status: PaymentClaimStatus) {
  if (status === 'pending') return 'รอตรวจสอบ'
  if (status === 'posted') return 'ตัดงวดแล้ว'
  if (status === 'rejected') return 'ปฏิเสธ'
  if (status === 'expired') return 'หมดอายุ'
  return 'ไม่ทราบสถานะ'
}

function StatusBadge({ status }: { status: PaymentClaimStatus }) {
  const variant =
    status === 'rejected' || status === 'expired'
      ? 'destructive'
      : status === 'posted'
        ? 'default'
        : 'secondary'
  return <Badge variant={variant}>{statusLabel(status)}</Badge>
}

function OwnerIdentity({
  claim,
  link,
}: {
  claim: PaymentClaim
  link: LineCustomerLink | null
}) {
  return (
    <div className='min-w-40'>
      <p className='font-medium'>
        {link?.customerName || claim.legacyCustomerId || '-'}
      </p>
      {link?.customerName && claim.legacyCustomerId ? (
        <p className='font-mono text-xs text-muted-foreground'>
          {claim.legacyCustomerId}
        </p>
      ) : null}
      <p className='text-xs text-muted-foreground'>
        {link?.phone || link?.customerPhone || '-'}
      </p>
    </div>
  )
}

function LineIdentity({
  claim,
  link,
}: {
  claim: PaymentClaim
  link: LineCustomerLink | null
}) {
  return (
    <div className='flex min-w-48 items-center gap-3'>
      <Avatar className='size-9 shrink-0'>
        <AvatarImage
          src={link?.linePictureUrl ?? undefined}
          alt={link?.lineDisplayName || 'LINE profile'}
        />
        <AvatarFallback>
          {initial(link?.lineDisplayName || link?.customerName)}
        </AvatarFallback>
      </Avatar>
      <div className='min-w-0'>
        <p className='truncate text-sm font-medium'>
          {link?.lineDisplayName || 'ไม่พบชื่อ LINE'}
        </p>
        <p className='truncate font-mono text-xs text-muted-foreground'>
          {claim.lineUserId || '-'}
        </p>
      </div>
    </div>
  )
}

function ClaimActions({
  claim,
  disabled,
  activeStatus,
  onAction,
}: {
  claim: PaymentClaim
  disabled: boolean
  activeStatus?: ClaimResolution
  onAction: (claim: PaymentClaim, status: ClaimResolution) => void
}) {
  return (
    <div className='flex flex-col gap-2 sm:flex-row md:justify-end'>
      <Button
        size='sm'
        disabled={disabled}
        onClick={() => onAction(claim, 'posted')}
      >
        {activeStatus === 'posted' ? (
          <Loader2 className='size-4 animate-spin' />
        ) : (
          <CheckCircle2 className='size-4' />
        )}
        ตัดงวดแล้ว
      </Button>
      <Button
        size='sm'
        variant='outline'
        className='text-destructive hover:text-destructive'
        disabled={disabled}
        onClick={() => onAction(claim, 'rejected')}
      >
        {activeStatus === 'rejected' ? (
          <Loader2 className='size-4 animate-spin' />
        ) : (
          <XCircle className='size-4' />
        )}
        ปฏิเสธ
      </Button>
    </div>
  )
}

function MobileClaimCard({
  claim,
  link,
  disabled,
  activeStatus,
  onAction,
}: {
  claim: PaymentClaim
  link: LineCustomerLink | null
  disabled: boolean
  activeStatus?: ClaimResolution
  onAction: (claim: PaymentClaim, status: ClaimResolution) => void
}) {
  return (
    <Card>
      <CardContent className='grid gap-4 pt-5'>
        <div className='flex items-start justify-between gap-3'>
          <OwnerIdentity claim={claim} link={link} />
          <StatusBadge status={claim.status} />
        </div>
        <LineIdentity claim={claim} link={link} />
        <dl className='grid grid-cols-2 gap-3 text-sm'>
          <div>
            <dt className='text-xs text-muted-foreground'>สัญญา</dt>
            <dd className='font-medium break-all'>
              {claim.contractRef || '-'}
            </dd>
          </div>
          <div>
            <dt className='text-xs text-muted-foreground'>งวด</dt>
            <dd className='font-medium'>{claim.installmentRef || '-'}</dd>
          </div>
          <div>
            <dt className='text-xs text-muted-foreground'>ยอดแจ้งชำระ</dt>
            <dd className='font-semibold text-emerald-700 dark:text-emerald-400'>
              {formatMoney(claim.amountBaht)}
            </dd>
          </div>
          <div>
            <dt className='text-xs text-muted-foreground'>กำหนดตรวจสอบ (SLA)</dt>
            <dd>{formatDate(claim.expiresAt)}</dd>
          </div>
          <div className='col-span-2'>
            <dt className='text-xs text-muted-foreground'>แจ้งเมื่อ</dt>
            <dd>{formatDate(claim.submittedAt)}</dd>
          </div>
        </dl>
        <ClaimActions
          claim={claim}
          disabled={disabled}
          activeStatus={activeStatus}
          onAction={onAction}
        />
      </CardContent>
    </Card>
  )
}

export function PaymentClaimsPage() {
  const queryClient = useQueryClient()
  const [actionTarget, setActionTarget] = useState<ActionTarget | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const normalizedSearch = search.trim()
  const debouncedSearch = useDebouncedValue(normalizedSearch)
  const searchPending = normalizedSearch !== debouncedSearch
  const skip = (page - 1) * CLAIMS_PAGE_SIZE

  const claimsQuery = useQuery({
    queryKey: [
      'admin',
      'payment-claims',
      {
        status: 'pending',
        search: debouncedSearch,
        skip,
        take: CLAIMS_PAGE_SIZE,
      },
    ],
    queryFn: async () => {
      const response = await api.get('/admin/payment-claims', {
        params: {
          status: 'pending',
          search: debouncedSearch || undefined,
          skip,
          take: CLAIMS_PAGE_SIZE,
        },
      })
      const rows = mapPaymentClaimsPayload(unwrapData<unknown>(response))
      return {
        rows,
        pagination: readPaginationMeta(response.data, {
          skip,
          take: CLAIMS_PAGE_SIZE,
          returned: rows.length,
        }),
      }
    },
    enabled: !searchPending,
    placeholderData: (previous) => previous,
  })

  const claims = claimsQuery.data?.rows ?? []
  const lineIdentities = [
    ...new Map(
      claims
        .filter(
          (
            claim
          ): claim is PaymentClaim & {
            lineUserId: string
            legacyCustomerId: string
          } => Boolean(claim.lineUserId && claim.legacyCustomerId)
        )
        .map((claim) => [
          `${claim.legacyCustomerId}\u0000${claim.lineUserId}`,
          {
            lineUserId: claim.lineUserId,
            legacyCustomerId: claim.legacyCustomerId,
          },
        ])
    ).values(),
  ]
  const lineLinkQueries = useQueries({
    queries: lineIdentities.map(({ lineUserId, legacyCustomerId }) => ({
      queryKey: [
        'admin',
        'line-customers',
        'claim-match',
        legacyCustomerId,
        lineUserId,
      ],
      queryFn: async (): Promise<LineCustomerLink | null> => {
        const response = await api.get('/admin/line-customers', {
          params: { search: lineUserId, skip: 0, take: CLAIMS_PAGE_SIZE },
        })
        const rows = unwrapData<LineCustomerLink[]>(response)
        return (
          rows.find(
            (row) =>
              row.lineUserId === lineUserId &&
              row.legacyCustomerId === legacyCustomerId
          ) ?? null
        )
      },
      staleTime: 5 * 60 * 1000,
    })),
  })
  const links = lineLinkQueries
    .map((query) => query.data)
    .filter((link): link is LineCustomerLink => Boolean(link))
  const lineLinksFetching = lineLinkQueries.some((query) => query.isFetching)
  const lineLinksError = lineLinkQueries.some((query) => query.isError)

  const updateClaim = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string
      status: ClaimResolution
    }) => {
      const response = await api.patch(`/admin/payment-claims/${id}`, {
        status,
      })
      return unwrapData<unknown>(response)
    },
    onSuccess: async (_data, variables) => {
      toast.success(
        variables.status === 'posted'
          ? 'ยืนยันการตัดงวดแล้ว'
          : 'ปฏิเสธรายการแจ้งชำระแล้ว'
      )
      setActionTarget(null)
      if (claims.length === 1 && page > 1) {
        setPage((current) => Math.max(1, current - 1))
      }
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['admin', 'payment-claims'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['admin', 'dashboard', 'finance'],
        }),
      ])
    },
    onError: (error) => {
      if (isPaymentClaimConflict(error)) {
        toast.warning(
          'รายการนี้ถูกดำเนินการหรือเปลี่ยนสถานะแล้ว โหลดข้อมูลล่าสุดให้แล้ว'
        )
        setActionTarget(null)
        void claimsQuery.refetch()
        return
      }
      toast.error(apiErrorMessage(error, 'อัปเดตสถานะรายการแจ้งชำระไม่สำเร็จ'))
    },
  })

  const mutationVariables = updateClaim.variables

  function openAction(claim: PaymentClaim, status: ClaimResolution) {
    updateClaim.reset()
    setActionTarget({ claim, status })
  }

  function confirmAction() {
    if (!actionTarget || updateClaim.isPending) return
    updateClaim.mutate({
      id: actionTarget.claim.id,
      status: actionTarget.status,
    })
  }

  return (
    <PageShell title='รายการแจ้งชำระ'>
      <div className='grid gap-4'>
        <Card>
          <CardHeader className='gap-4'>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
              <div>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <Banknote className='size-5 text-emerald-600' />
                  รอตรวจสอบและตัดงวด
                </CardTitle>
                <CardDescription className='mt-1'>
                  รายการที่ลูกค้าแจ้งชำระแล้ว
                  ระบบจะไม่แจ้งเตือนค้างชำระจนกว่าเจ้าหน้าที่จะตัดงวดหรือปฏิเสธรายการ
                  โดยวันที่ SLA เป็นกำหนดติดตามงาน ไม่ใช่วันหมดอายุอัตโนมัติ
                </CardDescription>
              </div>
              <Badge variant='secondary' className='w-fit'>
                {claims.length} รายการในหน้านี้
              </Badge>
            </div>
            <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
              <div className='relative w-full flex-1'>
                <Search className='absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  value={search}
                  className='ps-9'
                  placeholder='ค้นหารหัสลูกค้า สัญญา งวด LINE User ID หรือรหัสอ้างอิง'
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
                disabled={
                  claimsQuery.isFetching || lineLinksFetching || searchPending
                }
                onClick={() =>
                  void Promise.all([
                    claimsQuery.refetch(),
                    queryClient.invalidateQueries({
                      queryKey: ['admin', 'line-customers', 'claim-match'],
                    }),
                  ])
                }
              >
                <RefreshCcw
                  className={`size-4 ${claimsQuery.isFetching || lineLinksFetching ? 'animate-spin' : ''}`}
                />
                รีเฟรช
              </Button>
            </div>
          </CardHeader>
        </Card>

        {claimsQuery.isError ? (
          <Card className='border-destructive/50'>
            <CardContent className='flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between'>
              <div
                role='alert'
                className='flex items-start gap-3 text-sm text-destructive'
              >
                <AlertTriangle className='mt-0.5 size-5 shrink-0' />
                <span>
                  {apiErrorMessage(
                    claimsQuery.error,
                    'โหลดรายการแจ้งชำระไม่สำเร็จ'
                  )}
                </span>
              </div>
              <Button
                type='button'
                size='sm'
                variant='outline'
                onClick={() => void claimsQuery.refetch()}
              >
                ลองใหม่
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {lineLinksError && !claimsQuery.isError ? (
          <div
            role='alert'
            className='rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200'
          >
            โหลดชื่อและรูปโปรไฟล์ LINE ไม่สำเร็จ ระบบยังแสดง LINE User ID
            และจัดการรายการได้ตามปกติ
          </div>
        ) : null}

        {claimsQuery.isLoading ? (
          <div className='grid gap-3'>
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className='h-28 w-full rounded-lg' />
            ))}
          </div>
        ) : null}

        {!claimsQuery.isLoading && !claimsQuery.isError && !claims.length ? (
          <Card>
            <CardContent className='flex flex-col items-center gap-2 py-12 text-center'>
              <CheckCircle2 className='size-10 text-emerald-600' />
              <p className='font-medium'>ไม่มีรายการรอตรวจสอบ</p>
              <p className='text-sm text-muted-foreground'>
                รายการใหม่จะปรากฏที่หน้านี้เมื่อลูกค้าแจ้งชำระ
              </p>
            </CardContent>
          </Card>
        ) : null}

        {claims.length ? (
          <>
            <div className='grid gap-3 md:hidden'>
              {claims.map((claim) => (
                <MobileClaimCard
                  key={claim.id}
                  claim={claim}
                  link={findLineLinkForClaim(claim, links)}
                  disabled={
                    updateClaim.isPending ||
                    searchPending ||
                    claim.status !== 'pending'
                  }
                  activeStatus={
                    updateClaim.isPending && mutationVariables?.id === claim.id
                      ? mutationVariables.status
                      : undefined
                  }
                  onAction={openAction}
                />
              ))}
            </div>

            <Card className='hidden md:block'>
              <CardContent className='overflow-x-auto p-0'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>เจ้าของรถ</TableHead>
                      <TableHead>สัญญา / งวด</TableHead>
                      <TableHead className='text-end'>ยอดแจ้งชำระ</TableHead>
                      <TableHead>บัญชี LINE</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead>แจ้งเมื่อ / กำหนดตรวจสอบ</TableHead>
                      <TableHead className='text-end'>ดำเนินการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {claims.map((claim) => {
                      const link = findLineLinkForClaim(claim, links)
                      const activeStatus =
                        updateClaim.isPending &&
                        mutationVariables?.id === claim.id
                          ? mutationVariables.status
                          : undefined
                      return (
                        <TableRow key={claim.id}>
                          <TableCell>
                            <OwnerIdentity claim={claim} link={link} />
                          </TableCell>
                          <TableCell>
                            <p className='font-medium'>
                              {claim.contractRef || '-'}
                            </p>
                            <p className='text-xs text-muted-foreground'>
                              งวด {claim.installmentRef || '-'}
                            </p>
                          </TableCell>
                          <TableCell className='text-end font-semibold'>
                            {formatMoney(claim.amountBaht)}
                          </TableCell>
                          <TableCell>
                            <LineIdentity claim={claim} link={link} />
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={claim.status} />
                          </TableCell>
                          <TableCell className='min-w-44'>
                            <p>{formatDate(claim.submittedAt)}</p>
                            <p className='flex items-center gap-1 text-xs text-muted-foreground'>
                              <Clock3 className='size-3' /> SLA ตรวจสอบ{' '}
                              {formatDate(claim.expiresAt)}
                            </p>
                          </TableCell>
                          <TableCell>
                            <ClaimActions
                              claim={claim}
                              disabled={
                                updateClaim.isPending ||
                                searchPending ||
                                claim.status !== 'pending'
                              }
                              activeStatus={activeStatus}
                              onAction={openAction}
                            />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        ) : null}

        {!claimsQuery.isLoading &&
        !claimsQuery.isError &&
        (claims.length > 0 || page > 1) ? (
          <PaginationControls
            page={page}
            returned={claimsQuery.data?.pagination.returned ?? claims.length}
            hasMore={claimsQuery.data?.pagination.hasMore ?? false}
            disabled={
              claimsQuery.isFetching || updateClaim.isPending || searchPending
            }
            onPrevious={() => setPage((current) => Math.max(1, current - 1))}
            onNext={() => setPage((current) => current + 1)}
          />
        ) : null}
      </div>

      <ConfirmDialog
        open={Boolean(actionTarget)}
        onOpenChange={(open) => {
          if (!open && !updateClaim.isPending) setActionTarget(null)
        }}
        title={
          actionTarget?.status === 'posted'
            ? 'ยืนยันว่าตัดงวดแล้ว?'
            : 'ปฏิเสธรายการแจ้งชำระ?'
        }
        desc={
          <div className='grid gap-3'>
            <p>
              {actionTarget?.status === 'posted'
                ? 'ใช้เมื่อฝ่ายรับงวดตรวจสอบยอดและตัดงวดเรียบร้อยแล้ว'
                : 'รายการจะถูกนำออกจากคิวรอตรวจสอบ กรุณายืนยันว่าหลักฐานหรือข้อมูลไม่ถูกต้อง'}
            </p>
            {actionTarget ? (
              <div className='rounded-md bg-muted p-3 text-sm'>
                <p className='font-medium'>
                  {actionTarget.claim.legacyCustomerId || '-'}
                </p>
                <p>
                  สัญญา {actionTarget.claim.contractRef || '-'} · งวด{' '}
                  {actionTarget.claim.installmentRef || '-'}
                </p>
                <p>{formatMoney(actionTarget.claim.amountBaht)}</p>
              </div>
            ) : null}
            {updateClaim.isError ? (
              <p role='alert' className='text-sm text-destructive'>
                {apiErrorMessage(
                  updateClaim.error,
                  'อัปเดตสถานะไม่สำเร็จ กรุณาลองใหม่'
                )}
              </p>
            ) : null}
          </div>
        }
        cancelBtnText='ยกเลิก'
        confirmText={
          <span className='flex items-center gap-2'>
            {updateClaim.isPending ? (
              <Loader2 className='size-4 animate-spin' />
            ) : null}
            {actionTarget?.status === 'posted'
              ? 'ยืนยันตัดงวด'
              : 'ยืนยันปฏิเสธ'}
          </span>
        }
        destructive={actionTarget?.status === 'rejected'}
        isLoading={updateClaim.isPending}
        handleConfirm={confirmAction}
      />
    </PageShell>
  )
}
