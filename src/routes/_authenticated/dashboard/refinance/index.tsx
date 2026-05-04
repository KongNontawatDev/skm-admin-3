import { createFileRoute } from '@tanstack/react-router'
import { Dashboard } from '@/features/dashboard'

export const Route = createFileRoute('/_authenticated/dashboard/refinance/')({
  component: () => <Dashboard page='refinance' />,
})
