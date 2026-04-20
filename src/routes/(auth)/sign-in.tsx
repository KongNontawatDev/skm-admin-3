import { z } from 'zod'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { SignIn } from '@/features/auth/sign-in'
import { adminAuthClient } from '@/lib/admin-auth-client'

const searchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/(auth)/sign-in')({
  beforeLoad: async () => {
    const { data } = await adminAuthClient.getSession()
    if (data?.session) throw redirect({ to: '/' })
  },
  component: SignIn,
  validateSearch: searchSchema,
})
