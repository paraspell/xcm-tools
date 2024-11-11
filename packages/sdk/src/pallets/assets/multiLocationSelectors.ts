import type { TMultiLocation, TOverrideMultiLocationSpecifier } from '../../types'

export const Override = (multiLocation: TMultiLocation): TOverrideMultiLocationSpecifier => ({
  type: 'Override',
  value: multiLocation
})
