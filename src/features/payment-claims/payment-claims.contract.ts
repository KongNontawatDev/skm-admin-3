type UnknownRecord = Record<string, unknown>

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null
}

export function isPaymentClaimConflict(error: unknown): boolean {
  const response = asRecord(asRecord(error)?.response)
  return response?.status === 409
}
