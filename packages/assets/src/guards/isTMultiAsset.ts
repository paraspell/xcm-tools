import type { TMultiAsset } from '../types'

export const isTMultiAsset = <T = bigint>(value: unknown): value is TMultiAsset<T> =>
  typeof value === 'object' && value !== null && 'id' in value && 'fun' in value
