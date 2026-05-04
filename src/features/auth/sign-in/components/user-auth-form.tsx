import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { Loader2, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { adminAuthClient } from '@/lib/admin-auth-client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'

const formSchema = z.object({
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง'),
  password: z.string().min(1, 'กรุณากรอกรหัสผ่าน').min(8, 'รหัสผ่านอย่างน้อย 8 ตัวอักษร'),
})

function safeRedirectPath(redirectTo?: string): string {
  if (!redirectTo) return '/'
  try {
    if (redirectTo.startsWith('http')) {
      const u = new URL(redirectTo)
      const p = u.pathname + u.search
      return p || '/'
    }
  } catch {
    /* ignore */
  }
  return redirectTo.startsWith('/') ? redirectTo : '/'
}

interface UserAuthFormProps extends React.HTMLAttributes<HTMLFormElement> {
  redirectTo?: string
}

export function UserAuthForm({ className, redirectTo, ...props }: UserAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { auth } = useAuthStore()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      const { data: res, error } = await adminAuthClient.signIn.email({
        email: data.email,
        password: data.password,
      })
      if (error) {
        toast.error(typeof error.message === 'string' ? error.message : 'เข้าสู่ระบบไม่สำเร็จ')
        return
      }
      if (res?.user) {
        auth.setUser(
          {
            id: res.user.id,
            email: res.user.email,
            name: res.user.name,
          },
          (res as { token?: string }).token // Save the token if it exists in the response
        )
      }
      const target = safeRedirectPath(redirectTo)
      await navigate({ to: target, replace: true } as never)
      toast.success('เข้าสู่ระบบสำเร็จ')
    } catch {
      toast.error('เข้าสู่ระบบไม่สำเร็จ')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={cn('grid gap-3', className)} {...props}>
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>อีเมล</FormLabel>
              <FormControl>
                <Input autoComplete='email' placeholder='admin@example.com' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem>
              <FormLabel>รหัสผ่าน</FormLabel>
              <FormControl>
                <PasswordInput autoComplete='current-password' placeholder='••••••••' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit' className='mt-2' disabled={isLoading}>
          {isLoading ? <Loader2 className='size-4 animate-spin' /> : <LogIn className='size-4' />}
          เข้าสู่ระบบ
        </Button>
        <div className='text-center text-sm'>
          <Link to='/forgot-password' className='text-muted-foreground underline-offset-4 hover:text-foreground hover:underline'>
            ลืมรหัสผ่าน
          </Link>
        </div>
      </form>
    </Form>
  )
}
