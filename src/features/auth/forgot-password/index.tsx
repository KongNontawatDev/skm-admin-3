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
      const redirectTo = `${window.location.origin}/reset-password`
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
            กรอกอีเมลบัญชีแอดมิน ระบบจะส่งลิงก์ตั้งรหัสผ่านใหม่ให้ทางอีเมล
          </CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4'>
          {done ? (
            <p className='text-sm text-muted-foreground'>
              ตรวจสอบกล่องจดหมาย (และโฟลเดอร์สแปม) แล้วกดลิงก์ในจดหมายเพื่อตั้งรหัสผ่านใหม่
            </p>
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
