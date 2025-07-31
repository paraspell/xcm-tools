import type { TAsset } from '../types'

export const isTAsset = <T = bigint>(value: unknown): value is TAsset<T> =>
  typeof value === 'object' && value !== null && 'id' in value && 'fun' in value
