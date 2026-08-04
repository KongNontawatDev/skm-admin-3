import { describe, expect, it } from 'vitest'
import { isPaymentClaimConflict } from './payment-claims.contract'

describe('isPaymentClaimConflict', () => {
  it('recognizes a stale payment claim response', () => {
    expect(isPaymentClaimConflict({ response: { status: 409 } })).toBe(true)
  })

  it('does not treat other API failures as stale state', () => {
    expect(isPaymentClaimConflict({ response: { status: 400 } })).toBe(false)
    expect(isPaymentClaimConflict(new Error('network error'))).toBe(false)
  })
})
