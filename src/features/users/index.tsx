import { useQuery } from '@tanstack/react-query'
import { api, unwrapData } from '@/lib/api'
import { PageShell } from '@/components/layout/page-shell'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type AdminUserRow = {
  id: string
  email: string
  name: string | null
  isActive: boolean
  roles: string[]
  createdAt: string
}

export function UsersPage() {
  const list = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async (): Promise<AdminUserRow[]> =>
      unwrapData(await api.get('/admin/users')) as AdminUserRow[],
  })

  const rows = list.data ?? []

  return (
    <PageShell title='ผู้ดูแลระบบ'>
      <p className='mb-4 text-sm text-muted-foreground'>
        รายชื่อบัญชีในระบบหลังบ้าน (อ่านอย่างเดียว — สร้าง/แก้สิทธิ์ผ่าน API / seed / DBA)
      </p>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>อีเมล</TableHead>
              <TableHead>ชื่อ</TableHead>
              <TableHead>บทบาท</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead>สร้างเมื่อ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className='font-medium'>{row.email}</TableCell>
                <TableCell>{row.name ?? '—'}</TableCell>
                <TableCell>
                  <div className='flex flex-wrap gap-1'>
                    {row.roles.map((r) => (
                      <Badge key={r} variant='secondary'>
                        {r}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{row.isActive ? 'ใช้งาน' : 'ปิด'}</TableCell>
                <TableCell className='text-muted-foreground text-sm'>
                  {new Date(row.createdAt).toLocaleString('th-TH')}
                </TableCell>
              </TableRow>
            ))}
            {!rows.length && (
              <TableRow>
                <TableCell colSpan={5} className='text-center text-muted-foreground'>
                  {list.isLoading ? 'กำลังโหลด…' : 'ไม่มีข้อมูล'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </PageShell>
  )
}
