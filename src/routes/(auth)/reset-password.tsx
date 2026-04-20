import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { ResetPasswordPage } from '@/features/auth/reset-password'

const searchSchema = z.object({
  token: z.string().optional(),
  error: z.string().optional(),
})

export const Route = createFileRoute('/(auth)/reset-password')({
  validateSearch: searchSchema,
  component: ResetPasswordPage,
})
