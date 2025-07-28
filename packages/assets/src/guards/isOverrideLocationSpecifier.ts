import type { TLocationValueWithOverride, TOverrideLocationSpecifier } from '../types'

export const isOverrideLocationSpecifier = (
  locationSpecifier: TLocationValueWithOverride
): locationSpecifier is TOverrideLocationSpecifier =>
  typeof locationSpecifier === 'object' &&
  'type' in locationSpecifier &&
  'value' in locationSpecifier
