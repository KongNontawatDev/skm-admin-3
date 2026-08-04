export type ApiPagination = {
  skip: number
  take: number
  returned: number
  hasMore: boolean
}

type PaginationFallback = {
  skip: number
  take: number
  returned: number
}

type UnknownRecord = Record<string, unknown>

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null
}

function nonNegativeInteger(value: unknown, fallback: number): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback
}

export function readPaginationMeta(
  responseBody: unknown,
  fallback: PaginationFallback
): ApiPagination {
  const body = asRecord(responseBody)
  const meta = asRecord(body?.meta)
  const pagination = asRecord(meta?.pagination)
  const skip = nonNegativeInteger(pagination?.skip, fallback.skip)
  const take = nonNegativeInteger(pagination?.take, fallback.take)
  const returned = nonNegativeInteger(pagination?.returned, fallback.returned)
  const hasMore =
    typeof pagination?.hasMore === 'boolean'
      ? pagination.hasMore
      : fallback.returned >= fallback.take

  return { skip, take, returned, hasMore }
}
