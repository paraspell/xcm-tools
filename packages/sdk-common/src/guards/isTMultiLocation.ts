import type { TMultiLocation } from '../types'

export const isTMultiLocation = (value: unknown): value is TMultiLocation =>
  typeof value === 'object' && value !== null && 'parents' in value && 'interior' in value
