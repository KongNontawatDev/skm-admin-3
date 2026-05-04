import { useCallback, useEffect, useRef, type ChangeEvent, type ReactNode } from 'react'
import { NodeSelection } from '@tiptap/pm/state'
import { BubbleMenu } from '@tiptap/react/menus'
import { EditorContent, useEditor } from '@tiptap/react'
import Placeholder from '@tiptap/extension-placeholder'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import type { Editor } from '@tiptap/core'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Strikethrough,
  TerminalSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdminImage } from './admin-image'

type RichTextEditorProps = {
  id?: string
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
}

import { toast } from 'sonner'
import { uploadCmsAsset } from '@/lib/cms-upload'

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  title: string
  children: ReactNode
}) {
  return (
    <Button
      type='button'
      size='icon'
      variant={active ? 'secondary' : 'ghost'}
      className='h-8 w-8 shrink-0'
      title={title}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}

function ToolbarDivider() {
  return <div className='bg-border mx-0.5 hidden h-6 w-px shrink-0 sm:block' aria-hidden />
}

function EditorToolbar({ editor }: { editor: Editor }) {
  const fileRef = useRef<HTMLInputElement>(null)

  const addImageFromFile = useCallback(() => {
    fileRef.current?.click()
  }, [])

  const onFile = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file || !file.type.startsWith('image/')) return

      toast.promise(uploadCmsAsset(file), {
        loading: 'กำลังอัปโหลดรูปภาพ...',
        success: (url) => {
          if (url) {
            editor.chain().focus().setImage({ src: url }).run()
            return 'อัปโหลดรูปภาพสำเร็จ'
          }
          return 'อัปโหลดไม่สำเร็จ'
        },
        error: 'อัปโหลดรูปภาพล้มเหลว',
      })
    },
    [editor],
  )

  return (
    <div className='border-border bg-muted/30 flex flex-wrap items-center gap-0.5 rounded-t-md border border-b-0 px-1 py-1'>
      <input ref={fileRef} type='file' accept='image/*' className='sr-only' onChange={onFile} />
      <ToolbarButton
        title='ย่อหน้า'
        active={editor.isActive('paragraph')}
        onClick={() => editor.chain().focus().setParagraph().run()}
      >
        <Pilcrow className='size-4' />
      </ToolbarButton>
      <ToolbarButton
        title='หัวข้อ 1'
        active={editor.isActive('heading', { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 className='size-4' />
      </ToolbarButton>
      <ToolbarButton
        title='หัวข้อ 2'
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className='size-4' />
      </ToolbarButton>
      <ToolbarButton
        title='หัวข้อ 3'
        active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className='size-4' />
      </ToolbarButton>
      <ToolbarDivider />
      <ToolbarButton
        title='ตัวหนา'
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className='size-4' />
      </ToolbarButton>
      <ToolbarButton
        title='ตัวเอียง'
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className='size-4' />
      </ToolbarButton>
      <ToolbarButton
        title='ขีดฆ่า'
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className='size-4' />
      </ToolbarButton>
      <ToolbarButton
        title='โค้ดอินไลน์'
        active={editor.isActive('code')}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <Code className='size-4' />
      </ToolbarButton>
      <ToolbarDivider />
      <ToolbarButton
        title='จัดซ้าย'
        active={editor.isActive({ textAlign: 'left' })}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
      >
        <AlignLeft className='size-4' />
      </ToolbarButton>
      <ToolbarButton
        title='จัดกลาง'
        active={editor.isActive({ textAlign: 'center' })}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
      >
        <AlignCenter className='size-4' />
      </ToolbarButton>
      <ToolbarButton
        title='จัดขวา'
        active={editor.isActive({ textAlign: 'right' })}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
      >
        <AlignRight className='size-4' />
      </ToolbarButton>
      <ToolbarDivider />
      <ToolbarButton
        title='รายการหัวข้อย่อย'
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className='size-4' />
      </ToolbarButton>
      <ToolbarButton
        title='รายการลำดับเลข'
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className='size-4' />
      </ToolbarButton>
      <ToolbarButton
        title='อ้างอิง'
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className='size-4' />
      </ToolbarButton>
      <ToolbarButton
        title='บล็อกโค้ด'
        active={editor.isActive('codeBlock')}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <TerminalSquare className='size-4' />
      </ToolbarButton>
      <ToolbarDivider />
      <ToolbarButton title='แทรกรูป (อัปโหลด)' onClick={addImageFromFile}>
        <ImagePlus className='size-4' />
      </ToolbarButton>
    </div>
  )
}

function ImageBubbleMenu({ editor }: { editor: Editor }) {
  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ state }) => {
        const { selection } = state
        if (!(selection instanceof NodeSelection)) return false
        return selection.node.type.name === 'image'
      }}
      options={{ placement: 'top', offset: 8, flip: true }}
    >
      <div className='border-border bg-background flex items-center gap-0.5 rounded-md border p-0.5 shadow-md'>
        <span className='text-muted-foreground px-1.5 text-xs'>จัดรูป</span>
        <Button
          type='button'
          size='sm'
          variant='ghost'
          className='h-7 px-2'
          onClick={() => editor.chain().focus().updateAttributes('image', { align: null }).run()}
        >
          ซ้าย
        </Button>
        <Button
          type='button'
          size='sm'
          variant='ghost'
          className='h-7 px-2'
          onClick={() => editor.chain().focus().updateAttributes('image', { align: 'center' }).run()}
        >
          กลาง
        </Button>
        <Button
          type='button'
          size='sm'
          variant='ghost'
          className='h-7 px-2'
          onClick={() => editor.chain().focus().updateAttributes('image', { align: 'right' }).run()}
        >
          ขวา
        </Button>
      </div>
    </BubbleMenu>
  )
}

export function RichTextEditor({ id, value, onChange, placeholder, className }: RichTextEditorProps) {
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      AdminImage,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      Placeholder.configure({
        placeholder: placeholder ?? 'พิมพ์เนื้อหา…',
      }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        class: 'tiptap-editor-content max-w-none px-3 py-2 focus:outline-none',
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChangeRef.current(ed.getHTML())
    },
  })

  useEffect(() => {
    if (!editor) return
    const incoming = value ?? ''
    const current = editor.getHTML()
    if (incoming !== current) {
      editor.commands.setContent(incoming, { emitUpdate: false })
    }
  }, [value, editor])

  if (!editor) {
    return (
      <div
        className={`border-border bg-muted/20 text-muted-foreground rounded-md border px-3 py-8 text-center text-sm ${className ?? ''}`}
      >
        กำลังโหลดตัวแก้ไข…
      </div>
    )
  }

  return (
    <div className={`tiptap-editor overflow-hidden rounded-md ${className ?? ''}`}>
      <EditorToolbar editor={editor} />
      <div className='border-border bg-background rounded-b-md border'>
        <ImageBubbleMenu editor={editor} />
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
