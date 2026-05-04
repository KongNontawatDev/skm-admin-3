import { Fragment, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronRight, RefreshCw, Search } from 'lucide-react'
import { api, unwrapData } from '@/lib/api'
import { PageShell } from '@/components/layout/page-shell'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type LogCategory =
  | 'admin-request'
  | 'app-request'
  | 'api-request'
  | 'system'
  | 'audit'
  | 'performance'
  | 'auth'
  | 'sql'

type LogEntry = {
  id: string
  timestamp: string
  level: string
  category: LogCategory
  source: string
  message: string
  method?: string
  url?: string
  statusCode?: number
  duration?: number
  requestId?: string
  actorType?: string
  actorId?: string
  userId?: string
  adminId?: string
  customerId?: string
  customerIdNo?: string
  ip?: string
  userAgent?: string
  file: string
  details: Record<string, unknown>
  raw: string
}

type LogEntryPage = {
  entries: LogEntry[]
  page: number
  limit: number
  total: number
  totalPages: number
  categories: Array<{ category: LogCategory; count: number }>
}

const categoryLabels: Record<LogCategory | 'all', string> = {
  all: 'All logs',
  'app-request': 'App requests',
  'admin-request': 'Admin requests',
  'api-request': 'API requests',
  system: 'System',
  audit: 'Audit',
  performance: 'Performance',
  auth: 'Auth',
  sql: 'SQL',
}

function formatDate(value: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function levelVariant(level: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (level.toUpperCase()) {
    case 'ERROR':
      return 'destructive'
    case 'WARN':
    case 'WARNING':
      return 'secondary'
    case 'DEBUG':
      return 'outline'
    default:
      return 'default'
  }
}

export function LogsPage() {
  const [category, setCategory] = useState<LogCategory | 'all'>('all')
  const [level, setLevel] = useState('all')
  const [search, setSearch] = useState('')
  const [actorType, setActorType] = useState('all')
  const [actorId, setActorId] = useState('')
  const [requestId, setRequestId] = useState('')
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['admin', 'logs', category, level, search, actorType, actorId, requestId, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
      })
      if (category !== 'all') params.set('category', category)
      if (level !== 'all') params.set('level', level)
      if (actorType !== 'all') params.set('actorType', actorType)
      if (actorId.trim()) params.set('actorId', actorId.trim())
      if (requestId.trim()) params.set('requestId', requestId.trim())
      if (search.trim()) params.set('search', search.trim())
      return unwrapData(await api.get(`/admin/logs?${params.toString()}`)) as LogEntryPage
    },
    placeholderData: (previous) => previous,
  })

  const categoryOptions = useMemo(() => {
    const seen = new Set<LogCategory>(query.data?.categories.map((item) => item.category) ?? [])
    return ['all', ...seen] as Array<LogCategory | 'all'>
  }, [query.data?.categories])

  const resetPage = (fn: () => void) => {
    fn()
    setPage(1)
    setExpandedId(null)
  }

  return (
    <PageShell title='จัดการ Logs'>
      <div className='space-y-4'>
        <div className='flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between'>
          <div>
            <h2 className='text-xl font-semibold tracking-tight'>Structured logs</h2>
            <p className='text-muted-foreground text-sm'>
              Log files are parsed to JSON, grouped by category, and shown newest first.
            </p>
          </div>
          <Button variant='outline' type='button' onClick={() => void query.refetch()} disabled={query.isFetching}>
            <RefreshCw className={`me-2 size-4 ${query.isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Filters</CardTitle>
            <CardDescription>Viewing log data does not create request log noise.</CardDescription>
          </CardHeader>
          <CardContent className='grid gap-3 lg:grid-cols-[1.3fr_180px_180px_150px] xl:grid-cols-[1.3fr_180px_180px_150px_1fr_1fr]'>
            <div className='relative'>
              <Search className='text-muted-foreground absolute start-3 top-1/2 size-4 -translate-y-1/2' />
              <Input
                value={search}
                onChange={(event) => resetPage(() => setSearch(event.target.value))}
                className='ps-9'
                placeholder='Search message, URL, request id...'
              />
            </div>
            <Select value={category} onValueChange={(value) => resetPage(() => setCategory(value as LogCategory | 'all'))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((item) => (
                  <SelectItem key={item} value={item}>
                    {categoryLabels[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={level} onValueChange={(value) => resetPage(() => setLevel(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All levels</SelectItem>
                <SelectItem value='INFO'>INFO</SelectItem>
                <SelectItem value='WARN'>WARN</SelectItem>
                <SelectItem value='ERROR'>ERROR</SelectItem>
                <SelectItem value='DEBUG'>DEBUG</SelectItem>
              </SelectContent>
            </Select>
            <Select value={actorType} onValueChange={(value) => resetPage(() => setActorType(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All actors</SelectItem>
                <SelectItem value='customer'>Customer</SelectItem>
                <SelectItem value='admin'>Admin</SelectItem>
                <SelectItem value='staff'>Staff</SelectItem>
                <SelectItem value='anonymous'>Anonymous</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={actorId}
              onChange={(event) => resetPage(() => setActorId(event.target.value))}
              placeholder='Actor / IDNO'
            />
            <Input
              value={requestId}
              onChange={(event) => resetPage(() => setRequestId(event.target.value))}
              placeholder='Request id'
            />
          </CardContent>
        </Card>

        {query.isError ? (
          <Alert variant='destructive'>
            <AlertDescription>Unable to load logs.</AlertDescription>
          </Alert>
        ) : null}

        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-10' />
                <TableHead className='min-w-[170px]'>Time</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Request</TableHead>
                <TableHead>Message</TableHead>
                <TableHead className='text-end'>Status / ms</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isLoading ? (
                Array.from({ length: 8 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={8}>
                      <Skeleton className='h-7 w-full' />
                    </TableCell>
                  </TableRow>
                ))
              ) : query.data?.entries.length ? (
                query.data.entries.map((entry) => {
                  const expanded = expandedId === entry.id
                  return (
                    <Fragment key={entry.id}>
                      <TableRow className='align-top'>
                        <TableCell>
                          <Button
                            type='button'
                            variant='ghost'
                            size='icon'
                            className='size-7'
                            onClick={() => setExpandedId(expanded ? null : entry.id)}
                          >
                            {expanded ? <ChevronDown className='size-4' /> : <ChevronRight className='size-4' />}
                          </Button>
                        </TableCell>
                        <TableCell className='text-muted-foreground text-xs'>{formatDate(entry.timestamp)}</TableCell>
                        <TableCell>
                          <Badge variant='outline'>{categoryLabels[entry.category]}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={levelVariant(entry.level)}>{entry.level}</Badge>
                        </TableCell>
                        <TableCell className='max-w-[180px]'>
                          <div className='truncate text-sm font-medium'>{entry.actorType ?? 'anonymous'}</div>
                          <div className='text-muted-foreground truncate text-xs'>
                            {entry.customerIdNo ?? entry.adminId ?? entry.actorId ?? entry.userId ?? '-'}
                          </div>
                        </TableCell>
                        <TableCell className='max-w-[240px]'>
                          <div className='truncate text-sm font-medium'>{entry.method ?? '—'} {entry.url ?? ''}</div>
                          {entry.requestId ? <div className='text-muted-foreground truncate text-xs'>{entry.requestId}</div> : null}
                        </TableCell>
                        <TableCell className='max-w-[360px]'>
                          <div className='truncate'>{entry.message}</div>
                          <div className='text-muted-foreground truncate text-xs'>{entry.source}</div>
                        </TableCell>
                        <TableCell className='text-end text-sm'>
                          {entry.statusCode ?? '—'}
                          {entry.duration !== undefined ? <span className='text-muted-foreground'> / {entry.duration}</span> : null}
                        </TableCell>
                      </TableRow>
                      {expanded ? (
                        <TableRow key={`${entry.id}-details`}>
                          <TableCell />
                          <TableCell colSpan={7}>
                            <pre className='bg-muted max-h-[420px] overflow-auto rounded-md p-4 text-xs leading-relaxed'>
                              {JSON.stringify(
                                {
                                  ...entry.details,
                                  parsed: {
                                    category: entry.category,
                                    source: entry.source,
                                    file: entry.file,
                                    raw: entry.raw,
                                  },
                                },
                                null,
                                2,
                              )}
                            </pre>
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </Fragment>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className='text-muted-foreground h-24 text-center'>
                    No logs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className='flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between'>
          <div className='text-muted-foreground'>
            Total {query.data?.total ?? 0} entries, page {query.data?.page ?? page} of {query.data?.totalPages ?? 1}
          </div>
          <div className='flex gap-2'>
            <Button variant='outline' type='button' disabled={page <= 1 || query.isFetching} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Previous
            </Button>
            <Button
              variant='outline'
              type='button'
              disabled={page >= (query.data?.totalPages ?? 1) || query.isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
