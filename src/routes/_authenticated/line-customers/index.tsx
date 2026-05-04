import { createFileRoute } from '@tanstack/react-router'
import { LineCustomersPage } from '@/features/line-customers'

export const Route = createFileRoute('/_authenticated/line-customers/')({
  component: LineCustomersPage,
})
