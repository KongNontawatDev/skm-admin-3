import { createFileRoute } from '@tanstack/react-router'
import { PaymentClaimsPage } from '@/features/payment-claims'

export const Route = createFileRoute('/_authenticated/payment-claims/')({
  component: PaymentClaimsPage,
})
