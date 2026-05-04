import { Link } from '@tanstack/react-router'
import {
  Banknote,
  Bike,
  FileText,
  LayoutDashboard,
  MessageCircle,
  MessageSquareWarning,
  PackageSearch,
  Repeat2,
} from 'lucide-react'
import { PageShell } from '@/components/layout/page-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const shortcuts = [
  { title: 'ภาพรวมธุรกิจ', to: '/dashboard/overview', icon: LayoutDashboard, detail: 'ยอดขาย เงินรับ และความเสี่ยง' },
  { title: 'สินเชื่อ & ลูกหนี้', to: '/dashboard/finance', icon: Banknote, detail: 'ค้างชำระ Aging และตารางติดตาม' },
  { title: 'ยอดขาย & เซลล์', to: '/dashboard/sales', icon: Bike, detail: 'ยอดขายตามเวลาและรุ่นขายดี' },
  { title: 'รีไฟแนนซ์ / เทิร์น / รถยึด', to: '/dashboard/refinance', icon: Repeat2, detail: 'เปิดดูเมื่อมี schema รองรับ' },
  { title: 'รถมือสอง & สต๊อก', to: '/dashboard/used-stock', icon: PackageSearch, detail: 'เปิดดูเมื่อมี schema รองรับ' },
  { title: 'ลูกค้า LINE', to: '/line-customers', icon: MessageCircle, detail: 'ลูกค้าที่ผูกบัญชี LINE แล้ว' },
  { title: 'แจ้งปัญหา', to: '/support', icon: MessageSquareWarning, detail: 'ตั๋วจากผู้ใช้งานแอป' },
  { title: 'บทความ', to: '/articles', icon: FileText, detail: 'จัดการข่าวสารในแอป' },
]

export function HomePage() {
  return (
    <PageShell title='หน้าแรก'>
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {shortcuts.map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.to} to={item.to as never}>
              <Card className='h-full transition-colors hover:bg-muted/50'>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm'>{item.title}</CardTitle>
                  <Icon className='size-4 text-muted-foreground' />
                </CardHeader>
                <CardContent className='text-sm text-muted-foreground'>{item.detail}</CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </PageShell>
  )
}
