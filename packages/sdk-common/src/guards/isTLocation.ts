import type { TLocation } from '../types'

export const isTLocation = (value: unknown): value is TLocation =>
  typeof value === 'object' && value !== null && 'parents' in value && 'interior' in value
