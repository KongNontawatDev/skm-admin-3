import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { adminAuthClient } from '@/lib/admin-auth-client'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { AuthLayout } from '../auth-layout'

const schema = z.object({
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง'),
})

function adminAppOrigin(): string {
  const configured = import.meta.env.VITE_ADMIN_APP_URL?.trim()
  if (configured) return configured.replace(/\/$/, '')

  if (typeof window === 'undefined') return 'http://localhost:5174'
  const { hostname, origin } = window.location
  if (hostname === 'localhost' || hostname === '127.0.0.1') return 'http://localhost:5174'
  if (hostname === 'skm-easy-admin.ta-pps.com') return 'https://skm-easy-admin.ta-pps.com'
  return origin.replace(/\/$/, '')
}

export function ForgotPasswordPage() {
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  async function onSubmit(values: z.infer<typeof schema>) {
    setLoading(true)
    try {
      const redirectTo = `${adminAppOrigin()}/reset-password`
      const { error } = await adminAuthClient.requestPasswordReset({
        email: values.email,
        redirectTo,
      })
      if (error) {
        toast.error(typeof error.message === 'string' ? error.message : 'ส่งอีเมลไม่สำเร็จ')
        return
      }
      setDone(true)
      toast.success('ถ้ามีบัญชีนี้ในระบบ จะส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมล')
    } catch {
      toast.error('ส่งอีเมลไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <Card className='gap-4'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>ลืมรหัสผ่าน</CardTitle>
          <CardDescription>
            กรอกอีเมลบัญชีแอดมิน ระบบจะส่งลิงก์ตั้งรหัสผ่านใหม่ให้ทางอีเมล ถ้าไม่ได้รับอีเมลให้ตรวจสอบว่าใช้อีเมลเดียวกับบัญชีแอดมิน
          </CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4'>
          {done ? (
            <div className='grid gap-2 text-sm text-muted-foreground'>
              <p>ถ้าอีเมลนี้เป็นบัญชีแอดมิน ระบบจะส่งลิงก์รีเซ็ตรหัสผ่านให้ภายในไม่กี่นาที</p>
              <p>ถ้าไม่พบอีเมลในกล่องจดหมายหรือสแปม ให้ตรวจสอบว่าใช้อีเมลเดียวกับบัญชีแอดมินในระบบหลังบ้าน</p>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className='grid gap-3'>
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
                <Button type='submit' disabled={loading}>
                  {loading ? <Loader2 className='size-4 animate-spin' /> : <Mail className='size-4' />}
                  ส่งลิงก์รีเซ็ต
                </Button>
              </form>
            </Form>
          )}
          <Button variant='ghost' className='justify-self-start px-0' asChild>
            <Link to='/sign-in'>กลับไปเข้าสู่ระบบ</Link>
          </Button>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
