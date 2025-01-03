import type { TMultiLocationValueWithOverride, TOverrideMultiLocationSpecifier } from '../../types'

export const isOverrideMultiLocationSpecifier = (
  multiLocationSpecifier: TMultiLocationValueWithOverride
): multiLocationSpecifier is TOverrideMultiLocationSpecifier =>
  typeof multiLocationSpecifier === 'object' &&
  'type' in multiLocationSpecifier &&
  'value' in multiLocationSpecifier
