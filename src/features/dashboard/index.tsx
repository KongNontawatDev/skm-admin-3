import { useQuery } from '@tanstack/react-query'
import { MessageSquareWarning, Users } from 'lucide-react'
import { api, unwrapData } from '@/lib/api'
import { PageShell } from '@/components/layout/page-shell'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

type DashboardSummary = {
  openTickets: number
  adminUserCount: number
}

export function Dashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'dashboard', 'summary'],
    queryFn: async () => unwrapData(await api.get('/admin/dashboard/summary')) as DashboardSummary,
  })

  return (
    <PageShell title='ภาพรวมระบบ'>
      <p className='mb-6 text-muted-foreground'>
        สรุปตั๋วแจ้งปัญหาและจำนวนบัญชีผู้ดูแลที่เปิดใช้งาน — การตัดงวดทำที่ระบบหลักขององค์กร
      </p>
      {isError && (
        <p className='text-sm text-destructive'>โหลดข้อมูลไม่สำเร็จ — ตรวจสอบการล็อกอินหรือ URL API</p>
      )}
      <div className='grid gap-4 sm:grid-cols-2'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>ตั๋วแจ้งปัญหาเปิดอยู่</CardTitle>
            <MessageSquareWarning className='size-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className='h-8 w-16' />
            ) : (
              <div className='text-2xl font-bold'>{data?.openTickets ?? '—'}</div>
            )}
            <CardDescription className='mt-1'>สถานะ open / replied</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>บัญชีผู้ใช้ระบบ (เปิดใช้งาน)</CardTitle>
            <Users className='size-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className='h-8 w-16' />
            ) : (
              <div className='text-2xl font-bold'>{data?.adminUserCount ?? '—'}</div>
            )}
            <CardDescription className='mt-1'>ผู้ดูแลและพนักงาน (ไม่รวม soft delete)</CardDescription>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}
