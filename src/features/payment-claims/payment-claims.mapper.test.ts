import { describe, expect, it } from 'vitest'
import { type LineCustomerLink } from '@/features/line-customers/types'
import {
  findLineLinkForClaim,
  mapPaymentClaim,
  mapPaymentClaimsPayload,
} from './payment-claims.mapper'

describe('mapPaymentClaimsPayload', () => {
  it('maps the canonical API contract and numeric string amounts', () => {
    const claims = mapPaymentClaimsPayload([
      {
        id: 'claim-1',
        compid: 'M03',
        idno: '1001',
        legacyCustomerId: 'M03:1001',
        contractRef: 'HP-001',
        installmentRef: '5',
        amountBaht: '1,250.50',
        lineUserId: 'U-line-1',
        clientRequestId: 'client-1',
        status: 'pending',
        submittedAt: '2026-08-04T03:00:00.000Z',
        expiresAt: '2026-08-05T03:00:00.000Z',
        resolvedAt: null,
        updatedAt: '2026-08-04T03:00:00.000Z',
      },
    ])

    expect(claims).toEqual([
      expect.objectContaining({
        id: 'claim-1',
        legacyCustomerId: 'M03:1001',
        contractRef: 'HP-001',
        installmentRef: '5',
        amountBaht: 1250.5,
        lineUserId: 'U-line-1',
        status: 'pending',
      }),
    ])
  })

  it('accepts wrapped rows and common snake-case aliases', () => {
    const claims = mapPaymentClaimsPayload({
      rows: [
        {
          claim_id: 'claim-2',
          legacy_customer_id: 'M03:1002',
          contract_no: 'ignored',
          contract_ref: 'HP-002',
          installment_period: 7,
          amount_baht: 890,
          line_user_id: 'U-line-2',
          claim_status: 'POSTED',
          submitted_at: '2026-08-03T03:00:00.000Z',
        },
      ],
    })

    expect(claims[0]).toMatchObject({
      id: 'claim-2',
      legacyCustomerId: 'M03:1002',
      contractRef: 'HP-002',
      installmentRef: '7',
      amountBaht: 890,
      lineUserId: 'U-line-2',
      status: 'posted',
    })
  })

  it('drops malformed rows that cannot be acted on', () => {
    expect(
      mapPaymentClaimsPayload([null, 'bad', { status: 'pending' }])
    ).toEqual([])
    expect(
      mapPaymentClaim({ id: 'claim-3', status: 'unexpected' })?.status
    ).toBe('unknown')
  })
})

describe('findLineLinkForClaim', () => {
  const links: LineCustomerLink[] = [
    {
      id: 'link-a',
      compid: 'M03',
      idno: '1001',
      legacyCustomerId: 'M03:1001',
      lineUserId: 'U-line-a',
      customerPhone: '0800000000',
      lineDisplayName: 'LINE A',
      linePictureUrl: 'https://example.com/a.jpg',
      customerName: 'เจ้าของรถคนเดียวกัน',
      phone: '0800000000',
      createdAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'link-b',
      compid: 'M03',
      idno: '1001',
      legacyCustomerId: 'M03:1001',
      lineUserId: 'U-line-b',
      customerPhone: '0811111111',
      lineDisplayName: 'LINE B',
      linePictureUrl: 'https://example.com/b.jpg',
      customerName: 'เจ้าของรถคนเดียวกัน',
      phone: '0811111111',
      createdAt: '2026-08-02T00:00:00.000Z',
    },
  ]

  it('matches the exact LINE identity when one owner has multiple links', () => {
    const claim = mapPaymentClaim({
      id: 'claim-4',
      legacyCustomerId: 'M03:1001',
      lineUserId: 'U-line-b',
      status: 'pending',
    })

    expect(claim).not.toBeNull()
    expect(findLineLinkForClaim(claim!, links)?.id).toBe('link-b')
    expect(findLineLinkForClaim(claim!, links)?.lineDisplayName).toBe('LINE B')
  })

  it('does not guess a LINE profile from owner identity when multiple links exist', () => {
    const claim = mapPaymentClaim({
      id: 'claim-5',
      legacyCustomerId: 'M03:1001',
      status: 'pending',
    })

    expect(claim).not.toBeNull()
    expect(findLineLinkForClaim(claim!, links)).toBeNull()
  })

  it('rejects the same LINE user when the owner identity does not match', () => {
    const claim = mapPaymentClaim({
      id: 'claim-6',
      legacyCustomerId: 'M03:different-owner',
      lineUserId: 'U-line-b',
      status: 'pending',
    })

    expect(claim).not.toBeNull()
    expect(findLineLinkForClaim(claim!, links)).toBeNull()
  })

  it('does not fall back to the only owner link when LINE identity is missing', () => {
    const claim = mapPaymentClaim({
      id: 'claim-7',
      legacyCustomerId: 'M03:1001',
      status: 'pending',
    })

    expect(claim).not.toBeNull()
    expect(findLineLinkForClaim(claim!, links.slice(0, 1))).toBeNull()
  })

  it('requires owner identity even when LINE user identity matches', () => {
    const claim = mapPaymentClaim({
      id: 'claim-8',
      lineUserId: 'U-line-a',
      status: 'pending',
    })

    expect(claim).not.toBeNull()
    expect(findLineLinkForClaim(claim!, links)).toBeNull()
  })
})
