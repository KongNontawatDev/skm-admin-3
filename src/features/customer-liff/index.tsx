import { useQuery } from '@tanstack/react-query'
import { api, unwrapData } from '@/lib/api'
import { PageShell } from '@/components/layout/page-shell'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

type LiffLinkRow = {
  id: string
  legacyCustomerId: string
  lineUserId: string
  customerPhone: string
  lineDisplayName: string | null
  linePictureUrl: string | null
  createdAt: string
}

export function CustomerLiffPage() {
  const [legacyFilter, setLegacyFilter] = useState('')

  const { data = [], isLoading } = useQuery({
    queryKey: ['admin-customer-liff', legacyFilter],
    queryFn: async () => {
      const q = legacyFilter.trim() ? `?legacyCustomerId=${encodeURIComponent(legacyFilter.trim())}` : ''
      return unwrapData(await api.get(`/admin/customer-liff-links${q}`)) as LiffLinkRow[]
    },
  })

  return (
    <PageShell title="การผูก LINE ลูกค้า (LIFF)">
      <div className="mb-4 flex max-w-md gap-2">
        <Input
          placeholder="กรองตาม legacy_customer_id"
          value={legacyFilter}
          onChange={(e) => setLegacyFilter(e.target.value)}
        />
        <Button type="button" variant="secondary" onClick={() => setLegacyFilter('')}>
          ล้าง
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ลูกค้า (legacy)</TableHead>
              <TableHead>LINE user id</TableHead>
              <TableHead>เบอร์ในโทเคน</TableHead>
              <TableHead>ชื่อ LINE</TableHead>
              <TableHead>สร้างเมื่อ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5}>กำลังโหลด…</TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>ไม่มีข้อมูล</TableCell>
              </TableRow>
            ) : (
              data.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.legacyCustomerId}</TableCell>
                  <TableCell className="max-w-[200px] truncate font-mono text-xs">{r.lineUserId}</TableCell>
                  <TableCell>{r.customerPhone}</TableCell>
                  <TableCell>{r.lineDisplayName ?? '—'}</TableCell>
                  <TableCell className="text-xs">{new Date(r.createdAt).toLocaleString('th-TH')}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </PageShell>
  )
}
