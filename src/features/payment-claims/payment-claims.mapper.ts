import { type LineCustomerLink } from '@/features/line-customers/types'

export type PaymentClaimStatus =
  | 'pending'
  | 'posted'
  | 'rejected'
  | 'expired'
  | 'unknown'

export type PaymentClaim = {
  id: string
  compid: string | null
  idno: string | null
  legacyCustomerId: string | null
  contractRef: string | null
  installmentRef: string | null
  amountBaht: number | null
  lineUserId: string | null
  clientRequestId: string | null
  status: PaymentClaimStatus
  submittedAt: string | null
  expiresAt: string | null
  resolvedAt: string | null
  updatedAt: string | null
}

type UnknownRecord = Record<string, unknown>

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null
}

function firstValue(record: UnknownRecord, keys: string[]): unknown {
  for (const key of keys) {
    const value = record[key]
    if (value !== undefined && value !== null && value !== '') return value
  }
  return null
}

function stringValue(record: UnknownRecord, keys: string[]): string | null {
  const value = firstValue(record, keys)
  if (value === null) return null
  const normalized = String(value).trim()
  return normalized || null
}

function numberValue(record: UnknownRecord, keys: string[]): number | null {
  const value = firstValue(record, keys)
  if (value === null) return null
  const normalized =
    typeof value === 'string' ? value.replace(/,/g, '').trim() : value
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function statusValue(record: UnknownRecord): PaymentClaimStatus {
  const status = stringValue(record, [
    'status',
    'claimStatus',
    'claim_status',
  ])?.toLowerCase()
  if (
    status === 'pending' ||
    status === 'posted' ||
    status === 'rejected' ||
    status === 'expired'
  ) {
    return status
  }
  return 'unknown'
}

function rowsFromPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload
  const record = asRecord(payload)
  if (!record) return []

  for (const key of ['items', 'rows', 'claims', 'data']) {
    if (Array.isArray(record[key])) return record[key]
  }
  return []
}

export function mapPaymentClaim(value: unknown): PaymentClaim | null {
  const record = asRecord(value)
  if (!record) return null

  const id = stringValue(record, [
    'id',
    'claimId',
    'claim_id',
    'paymentClaimId',
  ])
  if (!id) return null

  return {
    id,
    compid: stringValue(record, ['compid', 'compId', 'companyId']),
    idno: stringValue(record, ['idno', 'idNo', 'customerIdNo']),
    legacyCustomerId: stringValue(record, [
      'legacyCustomerId',
      'legacy_customer_id',
      'customerId',
      'customer_id',
    ]),
    contractRef: stringValue(record, [
      'contractRef',
      'contract_ref',
      'contractNo',
      'contract_no',
      'contractNumber',
      'contno',
    ]),
    installmentRef: stringValue(record, [
      'installmentRef',
      'installment_ref',
      'installmentNo',
      'installmentPeriod',
      'installment_period',
      'period',
    ]),
    amountBaht: numberValue(record, [
      'amountBaht',
      'amount_baht',
      'amount',
      'paidAmount',
      'paid_amount',
      'paymentAmount',
      'payment_amount',
    ]),
    lineUserId: stringValue(record, ['lineUserId', 'line_user_id']),
    clientRequestId: stringValue(record, [
      'clientRequestId',
      'client_request_id',
      'requestId',
    ]),
    status: statusValue(record),
    submittedAt: stringValue(record, [
      'submittedAt',
      'submitted_at',
      'createdAt',
      'receivedAt',
    ]),
    expiresAt: stringValue(record, ['expiresAt', 'expires_at', 'expiryAt']),
    resolvedAt: stringValue(record, ['resolvedAt', 'resolved_at']),
    updatedAt: stringValue(record, ['updatedAt', 'updated_at']),
  }
}

export function mapPaymentClaimsPayload(payload: unknown): PaymentClaim[] {
  return rowsFromPayload(payload)
    .map(mapPaymentClaim)
    .filter((claim): claim is PaymentClaim => claim !== null)
}

export function findLineLinkForClaim(
  claim: PaymentClaim,
  links: LineCustomerLink[]
): LineCustomerLink | null {
  if (!claim.lineUserId || !claim.legacyCustomerId) return null

  return (
    links.find(
      (link) =>
        link.lineUserId === claim.lineUserId &&
        link.legacyCustomerId === claim.legacyCustomerId
    ) ?? null
  )
}
