import { createFileRoute } from '@tanstack/react-router'
import { LineOaTestPage } from '@/features/line-oa-test'

export const Route = createFileRoute('/_authenticated/line-oa-test/')({
  component: LineOaTestPage,
})
