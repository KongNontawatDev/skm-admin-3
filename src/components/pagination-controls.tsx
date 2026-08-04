import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

type PaginationControlsProps = {
  page: number
  returned: number
  hasMore: boolean
  disabled?: boolean
  onPrevious: () => void
  onNext: () => void
}

export function PaginationControls({
  page,
  returned,
  hasMore,
  disabled = false,
  onPrevious,
  onNext,
}: PaginationControlsProps) {
  return (
    <div className='flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between'>
      <p className='text-sm text-muted-foreground'>
        หน้า {page} · แสดง {returned} รายการ
      </p>
      <div className='flex gap-2'>
        <Button
          type='button'
          size='sm'
          variant='outline'
          disabled={disabled || page <= 1}
          onClick={onPrevious}
        >
          <ChevronLeft className='size-4' />
          ก่อนหน้า
        </Button>
        <Button
          type='button'
          size='sm'
          variant='outline'
          disabled={disabled || !hasMore}
          onClick={onNext}
        >
          ถัดไป
          <ChevronRight className='size-4' />
        </Button>
      </div>
    </div>
  )
}
