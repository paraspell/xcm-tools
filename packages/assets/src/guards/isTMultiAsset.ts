import type { TMultiAsset } from '../types'

export const isTMultiAsset = (value: unknown): value is TMultiAsset =>
  typeof value === 'object' && value !== null && 'id' in value && 'fun' in value
