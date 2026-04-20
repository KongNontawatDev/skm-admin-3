import { useMemo } from 'react'
import { Calendar, ImageIcon } from 'lucide-react'
import { resolveMediaUrl } from '@/lib/media-url'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function rewriteHtmlAssetUrls(html: string): string {
  if (!html) return ''
  return html
    .replace(/src="(\/api\/v1\/[^"]+)"/gi, (_, p: string) => `src="${resolveMediaUrl(p)}"`)
    .replace(/src='(\/api\/v1\/[^']+)'/gi, (_, p: string) => `src='${resolveMediaUrl(p)}'`)
}

export function RichHtmlPreview({ html, className }: { html: string; className?: string }) {
  const inner = useMemo(() => rewriteHtmlAssetUrls(html), [html])
  return (
    <div
      className={cn(
        'rich-html-preview border-border bg-muted/20 overflow-hidden rounded-xl border shadow-inner',
        className,
      )}
    >
      <div
        className='tiptap-editor-content text-foreground max-w-none px-5 py-5 text-[0.9375rem] leading-relaxed'
        dangerouslySetInnerHTML={{ __html: inner || '<p class="text-muted-foreground">ไม่มีเนื้อหา</p>' }}
      />
    </div>
  )
}

function formatThDate(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })
}

export function PromotionPreviewPanel({
  title,
  descriptionHtml,
  imageUrl,
  objectImageUrl,
  startDate,
  endDate,
  isActive,
}: {
  title: string
  descriptionHtml: string
  imageUrl: string | null
  objectImageUrl?: string | null
  startDate: string | null
  endDate: string | null
  isActive: boolean
}) {
  const hero = objectImageUrl || (imageUrl ? resolveMediaUrl(imageUrl) : '')
  const start = formatThDate(startDate)
  const end = formatThDate(endDate)

  return (
    <div className='bg-background space-y-5'>
      {hero ? (
        <div className='border-border overflow-hidden rounded-xl border shadow-sm'>
          <img src={hero} alt='' className='max-h-72 w-full object-cover' />
        </div>
      ) : (
        <div className='border-border bg-muted/30 text-muted-foreground flex min-h-[140px] items-center justify-center gap-2 rounded-xl border border-dashed'>
          <ImageIcon className='size-8 opacity-40' />
          <span>ยังไม่มีรูปโปรโมชัน</span>
        </div>
      )}
      <div className='space-y-2'>
        <div className='flex flex-wrap items-center gap-2'>
          <Badge variant={isActive ? 'default' : 'secondary'}>{isActive ? 'เปิดใช้งาน' : 'ปิด'}</Badge>
          {(start || end) && (
            <span className='text-muted-foreground flex items-center gap-1 text-xs'>
              <Calendar className='size-3.5' />
              {start && <span>เริ่ม {start}</span>}
              {start && end && <span>·</span>}
              {end && <span>สิ้นสุด {end}</span>}
            </span>
          )}
        </div>
        <h2 className='text-2xl leading-tight font-semibold tracking-tight'>{title || '—'}</h2>
      </div>
      <RichHtmlPreview html={descriptionHtml} />
    </div>
  )
}

export function ArticlePreviewPanel({
  title,
  contentHtml,
  coverUrl,
  objectCoverUrl,
  publishedAt,
}: {
  title: string
  contentHtml: string
  coverUrl: string | null
  objectCoverUrl?: string | null
  publishedAt: string | null
}) {
  const hero = objectCoverUrl || (coverUrl ? resolveMediaUrl(coverUrl) : '')
  const pub = formatThDate(publishedAt)

  return (
    <div className='bg-background space-y-5'>
      {hero ? (
        <div className='border-border overflow-hidden rounded-xl border shadow-sm'>
          <img src={hero} alt='' className='max-h-80 w-full object-cover' />
        </div>
      ) : null}
      <div className='space-y-1'>
        <h2 className='text-2xl leading-tight font-semibold tracking-tight'>{title || '—'}</h2>
        {pub ? <p className='text-muted-foreground text-sm'>เผยแพร่ {pub}</p> : <p className='text-muted-foreground text-sm'>ยังไม่กำหนดเวลาเผยแพร่</p>}
      </div>
      <RichHtmlPreview html={contentHtml} />
    </div>
  )
}

export function GuidePreviewPanel({
  title,
  contentHtml,
  sortOrder,
}: {
  title: string
  contentHtml: string
  sortOrder: number
}) {
  return (
    <div className='bg-background space-y-4'>
      <div className='flex flex-wrap items-center gap-2'>
        <Badge variant='outline'>ลำดับ {sortOrder}</Badge>
        <h2 className='text-2xl leading-tight font-semibold tracking-tight'>{title || '—'}</h2>
      </div>
      <RichHtmlPreview html={contentHtml} />
    </div>
  )
}
