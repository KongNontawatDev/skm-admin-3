import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  Banknote,
  Bike,
  ChartNoAxesCombined,
  FileText,
  MessageCircle,
  PackageCheck,
  ReceiptText,
  ShieldAlert,
  Users,
  Wrench,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api, unwrapData } from '@/lib/api'
import { PageShell } from '@/components/layout/page-shell'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type DashboardPageId = 'overview' | 'finance' | 'sales' | 'refinance' | 'used-stock'

type MetricCard = {
  key: string
  label: string
  value: number
  unit?: string
  tone?: 'good' | 'bad' | 'neutral'
}

type DashboardData = {
  page: DashboardPageId
  title: string
  filters: {
    startDate: string
    endDate: string
    salesperson: string[]
    vehicleTypes: string[]
    salesChannels: string[]
  }
  cards: MetricCard[]
  charts: Record<string, Array<Record<string, string | number | null>>>
  tables: Record<string, Array<Record<string, string | number | null>>>
  insights: { label: string; value: string; tone: 'good' | 'bad' | 'neutral' }[]
  alerts: { label: string; detail: string; tone: 'bad' | 'neutral' }[]
  dataSourceNotes: string[]
}

const pageTitles: Record<DashboardPageId, string> = {
  overview: 'ภาพรวมธุรกิจ',
  finance: 'สินเชื่อ & ลูกหนี้',
  sales: 'ยอดขาย & เซลล์',
  refinance: 'รีไฟแนนซ์ / เทิร์น / รถยึด',
  'used-stock': 'รถมือสอง & สต๊อก',
}

const palette = ['#16a34a', '#2563eb', '#f59e0b', '#dc2626', '#7c3aed', '#0f766e']

const iconMap = [MessageCircle, AlertTriangle, Banknote, Bike, FileText, ReceiptText, ShieldAlert, PackageCheck, Users, Wrench]

function defaultDates() {
  const end = new Date()
  return {
    startDate: end.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  }
}

function formatNumber(value: number, unit?: string) {
  const maximumFractionDigits = unit === 'บาท' ? 0 : 2
  const formatted = value.toLocaleString('th-TH', { maximumFractionDigits })
  return unit === 'บาท' ? `฿${formatted}` : `${formatted}${unit ? ` ${unit}` : ''}`
}

function shortNumber(value: unknown) {
  const n = Number(value ?? 0)
  if (!Number.isFinite(n)) return '-'
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toLocaleString('th-TH', { maximumFractionDigits: 1 })}M`
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toLocaleString('th-TH', { maximumFractionDigits: 1 })}K`
  return n.toLocaleString('th-TH', { maximumFractionDigits: 0 })
}

function toneClass(tone?: string) {
  if (tone === 'good') return 'text-emerald-600'
  if (tone === 'bad') return 'text-red-600'
  return 'text-foreground'
}

function presetRange(days: number) {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - days + 1)
  return { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) }
}

export function Dashboard({ page = 'overview' }: { page?: DashboardPageId }) {
  const initial = useMemo(() => defaultDates(), [])
  const [startDate, setStartDate] = useState(initial.startDate)
  const [endDate, setEndDate] = useState(initial.endDate)
  const [vehicleType, setVehicleType] = useState('all')
  const [salesChannel, setSalesChannel] = useState('all')
  const [salesperson, setSalesperson] = useState('all')

  const query = useQuery({
    queryKey: ['admin', 'dashboard', page, startDate, endDate, vehicleType, salesChannel, salesperson],
    queryFn: async () =>
      unwrapData<DashboardData>(
        await api.get(`/admin/dashboard/${page}`, {
          params: {
            startDate,
            endDate,
            vehicleType: vehicleType === 'all' ? undefined : vehicleType,
            salesChannel: salesChannel === 'all' ? undefined : salesChannel,
            salesperson: salesperson === 'all' ? undefined : salesperson,
          },
        }),
      ),
  })

  const data = query.data

  return (
    <PageShell title={pageTitles[page]}>
      <div className='grid gap-4'>
        <FilterPanel
          data={data}
          startDate={startDate}
          endDate={endDate}
          vehicleType={vehicleType}
          salesChannel={salesChannel}
          salesperson={salesperson}
          onDatePreset={(days) => {
            const next = presetRange(days)
            setStartDate(next.startDate)
            setEndDate(next.endDate)
          }}
          onStartDate={setStartDate}
          onEndDate={setEndDate}
          onVehicleType={setVehicleType}
          onSalesChannel={setSalesChannel}
          onSalesperson={setSalesperson}
        />

        {query.isError ? (
          <Card className='border-red-200'>
            <CardContent className='py-4 text-sm text-red-600'>โหลดข้อมูล dashboard ไม่สำเร็จ</CardContent>
          </Card>
        ) : null}

        <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
          {query.isLoading
            ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className='h-32 rounded-lg' />)
            : data?.cards.map((card, i) => <MetricCardView key={card.key} card={card} index={i} />)}
        </div>

        {data ? <Insights data={data} /> : null}
        {data ? <DashboardCharts data={data} /> : <ChartSkeleton />}
        {data ? <DashboardTables data={data} /> : null}

        {data?.dataSourceNotes.length ? (
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm'>หมายเหตุข้อมูล</CardTitle>
            </CardHeader>
            <CardContent className='grid gap-1 text-xs text-muted-foreground'>
              {data.dataSourceNotes.slice(0, 5).map((note) => (
                <p key={note}>{note}</p>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </PageShell>
  )
}

function FilterPanel(props: {
  data?: DashboardData
  startDate: string
  endDate: string
  vehicleType: string
  salesChannel: string
  salesperson: string
  onDatePreset: (days: number) => void
  onStartDate: (v: string) => void
  onEndDate: (v: string) => void
  onVehicleType: (v: string) => void
  onSalesChannel: (v: string) => void
  onSalesperson: (v: string) => void
}) {
  return (
    <Card>
      <CardContent className='grid gap-3 py-4'>
        <div className='flex flex-wrap gap-2'>
          <Button size='sm' variant='outline' onClick={() => props.onDatePreset(1)}>วันนี้</Button>
          <Button size='sm' variant='outline' onClick={() => props.onDatePreset(2)}>เมื่อวาน/วันนี้</Button>
          <Button size='sm' variant='outline' onClick={() => props.onDatePreset(7)}>7 วัน</Button>
          <Button size='sm' variant='outline' onClick={() => props.onDatePreset(30)}>30 วัน</Button>
          <Button size='sm' variant='outline' onClick={() => props.onDatePreset(90)}>3 เดือน</Button>
          <Button size='sm' variant='outline' onClick={() => props.onDatePreset(365)}>1 ปี</Button>
        </div>
        <div className='grid gap-3 md:grid-cols-5'>
          <Input type='date' value={props.startDate} onChange={(e) => props.onStartDate(e.target.value)} />
          <Input type='date' value={props.endDate} onChange={(e) => props.onEndDate(e.target.value)} />
          <FilterSelect value={props.salesperson} onChange={props.onSalesperson} placeholder='เซลล์' items={props.data?.filters.salesperson ?? []} />
          <FilterSelect value={props.vehicleType} onChange={props.onVehicleType} placeholder='ประเภทรถ/รุ่น' items={props.data?.filters.vehicleTypes ?? []} />
          <FilterSelect value={props.salesChannel} onChange={props.onSalesChannel} placeholder='ช่องทาง' items={props.data?.filters.salesChannels ?? []} />
        </div>
      </CardContent>
    </Card>
  )
}

function FilterSelect(props: { value: string; onChange: (v: string) => void; placeholder: string; items: string[] }) {
  return (
    <Select value={props.value} onValueChange={props.onChange}>
      <SelectTrigger><SelectValue placeholder={props.placeholder} /></SelectTrigger>
      <SelectContent>
        <SelectItem value='all'>ทั้งหมด</SelectItem>
        {props.items.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

function MetricCardView({ card, index }: { card: MetricCard; index: number }) {
  const Icon = iconMap[index % iconMap.length]
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>{card.label}</CardTitle>
        <Icon className='size-4 text-muted-foreground' />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-semibold ${toneClass(card.tone)}`}>{formatNumber(card.value, card.unit)}</div>
      </CardContent>
    </Card>
  )
}

function Insights({ data }: { data: DashboardData }) {
  if (!data.insights.length && !data.alerts.length) return null
  return (
    <div className='grid gap-3 lg:grid-cols-2'>
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='flex items-center gap-2 text-sm'><ChartNoAxesCombined className='size-4' /> Insight</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-2'>
          {data.insights.map((item) => (
            <div key={item.label} className='flex items-center justify-between gap-3 rounded-md border px-3 py-2'>
              <span className='text-sm text-muted-foreground'>{item.label}</span>
              <span className={`font-semibold ${toneClass(item.tone)}`}>{item.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='flex items-center gap-2 text-sm'><ShieldAlert className='size-4 text-red-600' /> ระบบแจ้งเตือน</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-2'>
          {data.alerts.length ? data.alerts.map((item) => (
            <div key={item.label} className='rounded-md border border-red-200 px-3 py-2'>
              <p className='text-sm font-medium text-red-600'>{item.label}</p>
              <p className='text-xs text-muted-foreground'>{item.detail}</p>
            </div>
          )) : <p className='text-sm text-muted-foreground'>ไม่มี alert จากข้อมูลช่วงนี้</p>}
        </CardContent>
      </Card>
    </div>
  )
}

function DashboardCharts({ data }: { data: DashboardData }) {
  const timeline = data.charts.salesTimeline ?? data.charts.receivedVsLoan ?? data.charts.repossessionByTime ?? []
  const donut = data.charts.revenueMix ?? data.charts.debtorStatus ?? data.charts.sources ?? data.charts.refinanceSuccess ?? []
  const bar = data.charts.topModels ?? data.charts.aging ?? data.charts.daysToSell ?? []

  return (
    <div className='grid gap-4 xl:grid-cols-3'>
      <ChartCard title='แนวโน้มตามเวลา' className='xl:col-span-2'>
        <ResponsiveContainer width='100%' height={280}>
          <LineChart data={timeline}>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='date' tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={shortNumber} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => shortNumber(v)} />
            <Line type='monotone' dataKey='amount' stroke='#16a34a' strokeWidth={2} dot={false} />
            <Line type='monotone' dataKey='received' stroke='#2563eb' strokeWidth={2} dot={false} />
            <Line type='monotone' dataKey='loan' stroke='#f59e0b' strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title='สัดส่วน'>
        <ResponsiveContainer width='100%' height={280}>
          <PieChart>
            <Pie data={donut} dataKey='value' nameKey='name' innerRadius={58} outerRadius={92} paddingAngle={2}>
              {donut.map((_, i) => <Cell key={i} fill={palette[i % palette.length]} />)}
            </Pie>
            <Tooltip formatter={(v) => shortNumber(v)} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title='อันดับ / Aging' className='xl:col-span-3'>
        <ResponsiveContainer width='100%' height={300}>
          <BarChart data={bar}>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='name' tick={{ fontSize: 12 }} interval={0} />
            <YAxis tickFormatter={shortNumber} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => shortNumber(v)} />
            <Bar dataKey='count' fill='#2563eb' radius={[4, 4, 0, 0]} />
            <Bar dataKey='amount' fill='#16a34a' radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}

function ChartCard({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader className='pb-2'>
        <CardTitle className='text-sm'>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function ChartSkeleton() {
  return <Skeleton className='h-80 rounded-lg' />
}

function DashboardTables({ data }: { data: DashboardData }) {
  const entries = Object.entries(data.tables).filter(([, rows]) => rows.length)
  if (!entries.length) return null
  return (
    <div className='grid gap-4'>
      {entries.map(([key, rows]) => {
        const columns = Object.keys(rows[0] ?? {})
        return (
          <Card key={key}>
            <CardHeader>
              <CardTitle className='text-sm'>{tableTitle(key)}</CardTitle>
              <CardDescription>ข้อมูลจริงจากฐานข้อมูล COMPID M03</CardDescription>
            </CardHeader>
            <CardContent className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((col) => <TableHead key={col}>{col}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, i) => (
                    <TableRow key={i}>
                      {columns.map((col) => <TableCell key={col}>{formatCell(row[col])}</TableCell>)}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function tableTitle(key: string) {
  if (key === 'overdueCustomers') return 'ลูกค้าค้างชำระ'
  if (key === 'ranking') return 'Ranking'
  if (key === 'repossessions') return 'รายการรถยึด'
  if (key === 'usedVehicles') return 'รายการรถมือสอง'
  return key
}

function formatCell(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'number') return value.toLocaleString('th-TH', { maximumFractionDigits: 2 })
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10)
  return value
}
