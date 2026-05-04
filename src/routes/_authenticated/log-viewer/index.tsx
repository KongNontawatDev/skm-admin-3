import { createFileRoute } from '@tanstack/react-router'
import { LogsPage } from '@/features/log-viewer'

export const Route = createFileRoute('/_authenticated/log-viewer/')({
  component: LogsPage,
})
