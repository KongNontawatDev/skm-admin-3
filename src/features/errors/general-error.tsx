import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type GeneralErrorProps = React.HTMLAttributes<HTMLDivElement> & {
  minimal?: boolean
  /** จาก TanStack Router errorComponent */
  error?: unknown
  reset?: () => void
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  try {
    return JSON.stringify(error)
  } catch {
    return 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'
  }
}

export function GeneralError({
  className,
  minimal = false,
  error,
  reset,
}: GeneralErrorProps) {
  const msg = error !== undefined ? errorMessage(error) : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'

  return (
    <div className={cn('h-svh w-full', className)}>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2 px-4'>
        {!minimal && <h1 className='text-[7rem] leading-tight font-bold'>500</h1>}
        <span className='font-medium'>มีบางอย่างผิดพลาด</span>
        <p className='max-w-lg text-center text-muted-foreground'>
          ขออภัยในความไม่สะดวก ลองใหม่อีกครั้งในภายหลัง
        </p>
        {import.meta.env.DEV && (
          <pre className='mt-2 max-h-40 max-w-2xl overflow-auto rounded-md border bg-muted p-3 text-left text-xs whitespace-pre-wrap'>
            {msg}
          </pre>
        )}
        {!minimal && (
          <div className='mt-6 flex flex-wrap justify-center gap-4'>
            <Button type='button' variant='outline' onClick={() => window.history.back()}>
              ย้อนกลับ
            </Button>
            <Button type='button' onClick={() => window.location.assign('/')}>
              หน้าแรก
            </Button>
            {typeof reset === 'function' && (
              <Button type='button' variant='secondary' onClick={() => reset()}>
                ลองใหม่
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
