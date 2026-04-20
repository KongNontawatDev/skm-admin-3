import { useState } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, KeyRound } from 'lucide-react'
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
import { PasswordInput } from '@/components/password-input'
import { AuthLayout } from '../auth-layout'

const schema = z
  .object({
    newPassword: z.string().min(8, 'รหัสผ่านอย่างน้อย 8 ตัวอักษร'),
    confirm: z.string().min(1, 'กรุณายืนยันรหัสผ่าน'),
  })
  .refine((d) => d.newPassword === d.confirm, { message: 'รหัสผ่านไม่ตรงกัน', path: ['confirm'] })

export function ResetPasswordPage() {
  const { token, error: urlError } = useSearch({ from: '/(auth)/reset-password' })
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: '', confirm: '' },
  })

  async function onSubmit(values: z.infer<typeof schema>) {
    if (!token) {
      toast.error('ไม่พบโทเคนรีเซ็ต กรุณาเปิดลิงก์จากอีเมลอีกครั้ง')
      return
    }
    setLoading(true)
    try {
      const { error } = await adminAuthClient.resetPassword({
        token,
        newPassword: values.newPassword,
      })
      if (error) {
        toast.error(typeof error.message === 'string' ? error.message : 'ตั้งรหัสผ่านไม่สำเร็จ')
        return
      }
      toast.success('ตั้งรหัสผ่านใหม่แล้ว — เข้าสู่ระบบได้เลย')
      void navigate({ to: '/sign-in', replace: true })
    } catch {
      toast.error('ตั้งรหัสผ่านไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  const invalid = urlError === 'INVALID_TOKEN' || !token

  return (
    <AuthLayout>
      <Card className='gap-4'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>ตั้งรหัสผ่านใหม่</CardTitle>
          <CardDescription>กรอกรหัสผ่านใหม่สำหรับบัญชีแอดมินของคุณ</CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4'>
          {invalid ? (
            <p className='text-sm text-destructive'>
              ลิงก์ไม่ถูกต้องหรือหมดอายุแล้ว กรุณาขอรีเซ็ตรหัสผ่านใหม่จากหน้าเข้าสู่ระบบ
            </p>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className='grid gap-3'>
                <FormField
                  control={form.control}
                  name='newPassword'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>รหัสผ่านใหม่</FormLabel>
                      <FormControl>
                        <PasswordInput autoComplete='new-password' placeholder='••••••••' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='confirm'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ยืนยันรหัสผ่าน</FormLabel>
                      <FormControl>
                        <PasswordInput autoComplete='new-password' placeholder='••••••••' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type='submit' disabled={loading}>
                  {loading ? <Loader2 className='size-4 animate-spin' /> : <KeyRound className='size-4' />}
                  บันทึกรหัสผ่านใหม่
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
