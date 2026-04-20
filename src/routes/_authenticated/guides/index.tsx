import { createFileRoute } from '@tanstack/react-router'
import { GuidesPage } from '@/features/guides'

export const Route = createFileRoute('/_authenticated/guides/')({
  component: GuidesPage,
})
