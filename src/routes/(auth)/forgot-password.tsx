import { createFileRoute, redirect } from '@tanstack/react-router'
import { ForgotPasswordPage } from '@/features/auth/forgot-password'
import { adminAuthClient } from '@/lib/admin-auth-client'

export const Route = createFileRoute('/(auth)/forgot-password')({
  beforeLoad: async () => {
    const { data } = await adminAuthClient.getSession()
    if (data?.session) throw redirect({ to: '/' })
  },
  component: ForgotPasswordPage,
})
