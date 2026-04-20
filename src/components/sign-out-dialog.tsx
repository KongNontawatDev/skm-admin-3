import { useNavigate, useLocation } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { adminAuthClient } from '@/lib/admin-auth-client'
import { ConfirmDialog } from '@/components/confirm-dialog'

interface SignOutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { auth } = useAuthStore()

  const handleSignOut = () => {
    void (async () => {
      await adminAuthClient.signOut()
      auth.reset()
      const redirect = `${location.pathname}${location.searchStr}`
      navigate({
        to: '/sign-in',
        search: { redirect },
        replace: true,
      })
    })()
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='ออกจากระบบ'
      desc='คุณต้องการออกจากระบบหลังบ้านหรือไม่ ต้องล็อกอินใหม่เพื่อใช้งานต่อ'
      confirmText='ออกจากระบบ'
      destructive
      handleConfirm={handleSignOut}
      className='sm:max-w-sm'
    />
  )
}
