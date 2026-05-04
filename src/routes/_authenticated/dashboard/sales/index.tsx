import { createFileRoute } from '@tanstack/react-router'
import { Dashboard } from '@/features/dashboard'

export const Route = createFileRoute('/_authenticated/dashboard/sales/')({
  component: () => <Dashboard page='sales' />,
})
