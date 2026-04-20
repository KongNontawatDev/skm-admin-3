import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { api, isAxiosError, unwrapData } from '@/lib/api'
import { PageShell } from '@/components/layout/page-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type TemplateRow = {
  id: string
  label: string
  channel: string
}

type TestPushResult = {
  lineUserIdMasked: string
  template: string
  channel: string
}

export function LineOaTestPage() {
  const [legacyCustomerId, setLegacyCustomerId] = useState('')
  const [templateId, setTemplateId] = useState('')

  const templates = useQuery({
    queryKey: ['admin', 'line-oa', 'templates'],
    queryFn: async (): Promise<TemplateRow[]> =>
      unwrapData(await api.get('/admin/tools/line-oa/templates')) as TemplateRow[],
  })

  useEffect(() => {
    if (templates.data?.length && !templateId) {
      setTemplateId(templates.data[0].id)
    }
  }, [templates.data, templateId])

  const selected = templates.data?.find((t) => t.id === templateId)

  const pushMut = useMutation({
    mutationFn: async () => {
      const res = await api.post('/admin/tools/line-oa/test-push', {
        legacyCustomerId: legacyCustomerId.trim(),
        template: templateId,
      })
      return unwrapData(res) as TestPushResult
    },
    onSuccess: (data) => {
      toast.success(`ส่งแล้ว — ผู้รับ: ${data.lineUserIdMasked} · ${data.template} · ${data.channel}`)
    },
    onError: (e) =>
      toast.error(isAxiosError(e) ? (e.response?.data?.error?.message ?? 'ไม่สำเร็จ') : 'ไม่สำเร็จ'),
  })

  return (
    <PageShell title='ทดสอบ LINE OA'>
      <div className='mx-auto flex max-w-lg flex-col gap-6'>
        <div className='grid gap-2'>
          <Label htmlFor='legacyCustomerId'>รหัสลูกค้า (legacy)</Label>
          <Input
            id='legacyCustomerId'
            placeholder='เช่น SKM:1199900862730'
            value={legacyCustomerId}
            onChange={(e) => setLegacyCustomerId(e.target.value)}
            autoComplete='off'
          />
        </div>
        <div className='grid gap-2'>
          <Label>เทมเพลต</Label>
          <Select value={templateId} onValueChange={setTemplateId} disabled={!templates.data?.length}>
            <SelectTrigger>
              <SelectValue placeholder={templates.isLoading ? 'กำลังโหลด…' : 'เลือกเทมเพลต'} />
            </SelectTrigger>
            <SelectContent>
              {(templates.data ?? []).map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selected?.channel ? (
            <p className='text-muted-foreground text-xs'>{selected.channel}</p>
          ) : null}
        </div>
        <Button
          type='button'
          disabled={pushMut.isPending || !legacyCustomerId.trim() || !templateId}
          onClick={() => pushMut.mutate()}
        >
          {pushMut.isPending ? 'กำลังส่ง…' : 'ส่งทดสอบ'}
        </Button>
      </div>
    </PageShell>
  )
}
