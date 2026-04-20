import { useCallback, useEffect, useId, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { ImageIcon, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { resolveMediaUrl } from '@/lib/media-url'

type ImageDropzoneProps = {
  id?: string
  label: string
  /** URL จากเซิร์ฟเวอร์ (path หรือเต็ม) */
  serverUrl: string | null
  /** ไฟล์ที่ผู้ใช้เลือกแล้ว ยังไม่อัปโหลด */
  pendingFile: File | null
  onPendingFileChange: (file: File | null) => void
  /** true = ผู้ใช้กดลบ — จะส่งล้างรูปตอนบันทึก */
  removed: boolean
  onRemovedChange: (removed: boolean) => void
  disabled?: boolean
  hint?: string
}

export function ImageDropzone({
  id,
  label,
  serverUrl,
  pendingFile,
  onPendingFileChange,
  removed,
  onRemovedChange,
  disabled,
  hint = 'ลากไฟล์มาวาง หรือคลิกเลือก — JPEG, PNG, WebP, GIF',
}: ImageDropzoneProps) {
  const autoId = useId()
  const inputId = id ?? `img-drop-${autoId}`
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const blobUrl = useMemo(() => (pendingFile ? URL.createObjectURL(pendingFile) : null), [pendingFile])
  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [blobUrl])

  const previewSrc = removed ? '' : pendingFile && blobUrl ? blobUrl : serverUrl ? resolveMediaUrl(serverUrl) : ''

  const pickFile = useCallback(
    (file: File | undefined) => {
      if (!file || disabled) return
      if (!file.type.startsWith('image/')) return
      onRemovedChange(false)
      onPendingFileChange(file)
    },
    [disabled, onPendingFileChange, onRemovedChange],
  )

  const onInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      pickFile(e.target.files?.[0])
      e.target.value = ''
    },
    [pickFile],
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      pickFile(e.dataTransfer.files?.[0])
    },
    [pickFile],
  )

  const onRemove = useCallback(() => {
    onPendingFileChange(null)
    onRemovedChange(true)
  }, [onPendingFileChange, onRemovedChange])

  const onReplaceClick = useCallback(() => {
    inputRef.current?.click()
  }, [])

  return (
    <div className='grid gap-2'>
      <Label htmlFor={inputId}>{label}</Label>
      <input
        ref={inputRef}
        id={inputId}
        type='file'
        accept='image/jpeg,image/png,image/webp,image/gif'
        className='sr-only'
        disabled={disabled}
        onChange={onInputChange}
      />
      <div
        role='button'
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            if (!disabled) inputRef.current?.click()
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault()
          if (!disabled) setDragOver(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false)
        }}
        onDragOver={(e) => {
          e.preventDefault()
        }}
        onDrop={onDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          'border-border bg-muted/20 relative flex min-h-[168px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors',
          dragOver && 'border-primary bg-primary/5',
          disabled && 'pointer-events-none opacity-60',
        )}
      >
        {previewSrc ? (
          <>
            <img
              key={previewSrc}
              src={previewSrc}
              alt=''
              className='max-h-44 max-w-full rounded-md object-contain'
              decoding='async'
            />
            <div className='mt-3 flex flex-wrap justify-center gap-2'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={(e) => {
                  e.stopPropagation()
                  onReplaceClick()
                }}
                disabled={disabled}
              >
                <Upload className='me-1 size-4' />
                เปลี่ยนรูป
              </Button>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='text-destructive'
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove()
                }}
                disabled={disabled}
              >
                <Trash2 className='me-1 size-4' />
                ลบรูป
              </Button>
            </div>
            {serverUrl && !removed && !pendingFile ? (
              <p className='text-muted-foreground mt-2 max-w-full px-1 text-center text-xs break-all'>
                รูปที่บันทึกบนเซิร์ฟเวอร์: {serverUrl}
              </p>
            ) : null}
          </>
        ) : (
          <div className='text-muted-foreground flex flex-col items-center gap-2 text-center text-sm'>
            <ImageIcon className='size-10 opacity-50' />
            <span>{hint}</span>
            <Button type='button' variant='secondary' size='sm' className='pointer-events-none mt-1'>
              <Upload className='me-1 size-4' />
              เลือกจากเครื่อง
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
