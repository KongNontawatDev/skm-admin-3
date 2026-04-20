import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { adminAuthClient } from '@/lib/admin-auth-client'
import { useAuthStore } from '@/stores/auth-store'
import { PageShell } from '@/components/layout/page-shell'
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
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/password-input'

const profileSchema = z.object({
  name: z.string().min(1, 'กรุณากรอกชื่อ'),
})

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'กรุณากรอกรหัสผ่านปัจจุบัน'),
    newPassword: z.string().min(8, 'รหัสผ่านใหม่อย่างน้อย 8 ตัวอักษร'),
    confirm: z.string().min(1, 'กรุณายืนยันรหัสผ่าน'),
  })
  .refine((d) => d.newPassword === d.confirm, { message: 'รหัสผ่านไม่ตรงกัน', path: ['confirm'] })

export function ProfilePage() {
  const setUser = useAuthStore((s) => s.auth.setUser)
  const email = useAuthStore((s) => s.auth.user?.email ?? '')

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '' },
  })

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirm: '' },
  })

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const { data, error } = await adminAuthClient.getSession()
      if (cancelled || error || !data?.user) return
      profileForm.reset({ name: data.user.name ?? '' })
    })()
    return () => {
      cancelled = true
    }
  }, [profileForm])

  async function onSaveProfile(values: z.infer<typeof profileSchema>) {
    const { error } = await adminAuthClient.updateUser({ name: values.name })
    if (error) {
      toast.error(typeof error.message === 'string' ? error.message : 'บันทึกไม่สำเร็จ')
      return
    }
    const { data } = await adminAuthClient.getSession()
    if (data?.user) {
      setUser({
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
      })
    }
    toast.success('บันทึกข้อมูลโปรไฟล์แล้ว')
  }

  async function onChangePassword(values: z.infer<typeof passwordSchema>) {
    const { error } = await adminAuthClient.changePassword({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
      revokeOtherSessions: true,
    })
    if (error) {
      toast.error(typeof error.message === 'string' ? error.message : 'เปลี่ยนรหัสผ่านไม่สำเร็จ')
      return
    }
    passwordForm.reset()
    toast.success('เปลี่ยนรหัสผ่านแล้ว (เซสชันอื่นถูกออกจากระบบ)')
  }

  return (
    <PageShell title='โปรไฟล์ของฉัน'>
      <div className='mx-auto grid max-w-xl gap-6'>
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>ข้อมูลทั่วไป</CardTitle>
            <CardDescription>แก้ไขชื่อที่แสดงในระบบ (อีเมลใช้สำหรับเข้าสู่ระบบเท่านั้น)</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className='grid gap-4'>
                <div className='grid gap-2'>
                  <Label>อีเมล</Label>
                  <Input value={email} disabled readOnly />
                </div>
                <FormField
                  control={profileForm.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ชื่อที่แสดง</FormLabel>
                      <FormControl>
                        <Input autoComplete='name' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type='submit' disabled={profileForm.formState.isSubmitting}>
                  {profileForm.formState.isSubmitting ? (
                    <Loader2 className='size-4 animate-spin' />
                  ) : (
                    <Save className='size-4' />
                  )}
                  บันทึก
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-base'>เปลี่ยนรหัสผ่าน</CardTitle>
            <CardDescription>ใช้รหัสผ่านปัจจุบันยืนยันก่อนตั้งรหัสใหม่</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className='grid gap-4'>
                <FormField
                  control={passwordForm.control}
                  name='currentPassword'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>รหัสผ่านปัจจุบัน</FormLabel>
                      <FormControl>
                        <PasswordInput autoComplete='current-password' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name='newPassword'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>รหัสผ่านใหม่</FormLabel>
                      <FormControl>
                        <PasswordInput autoComplete='new-password' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name='confirm'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ยืนยันรหัสผ่านใหม่</FormLabel>
                      <FormControl>
                        <PasswordInput autoComplete='new-password' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type='submit' disabled={passwordForm.formState.isSubmitting}>
                  {passwordForm.formState.isSubmitting ? (
                    <Loader2 className='size-4 animate-spin' />
                  ) : (
                    <Shield className='size-4' />
                  )}
                  เปลี่ยนรหัสผ่าน
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}
