import { describe, expect, it } from 'vitest'
import { readPaginationMeta } from './api-pagination'

describe('readPaginationMeta', () => {
  it('reads the standard API pagination contract', () => {
    expect(
      readPaginationMeta(
        {
          success: true,
          data: [],
          meta: {
            pagination: { skip: 25, take: 25, returned: 12, hasMore: false },
          },
        },
        { skip: 0, take: 10, returned: 0 }
      )
    ).toEqual({ skip: 25, take: 25, returned: 12, hasMore: false })
  })

  it('falls back safely when pagination metadata is missing or malformed', () => {
    expect(
      readPaginationMeta(
        { success: true, data: [], meta: { pagination: { skip: -1 } } },
        { skip: 20, take: 20, returned: 20 }
      )
    ).toEqual({ skip: 20, take: 20, returned: 20, hasMore: true })
  })
})
