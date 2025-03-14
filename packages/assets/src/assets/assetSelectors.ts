import type { TMultiLocation } from '@paraspell/sdk-common'

import type { TOverrideMultiLocationSpecifier, TSymbolSpecifier } from '../types'

export const Native = (symbol: string): TSymbolSpecifier => ({
  type: 'Native',
  value: symbol
})

export const Foreign = (symbol: string): TSymbolSpecifier => ({
  type: 'Foreign',
  value: symbol
})

export const ForeignAbstract = (symbol: string): TSymbolSpecifier => ({
  type: 'ForeignAbstract',
  value: symbol
})

export const Override = (multiLocation: TMultiLocation): TOverrideMultiLocationSpecifier => ({
  type: 'Override',
  value: multiLocation
})
