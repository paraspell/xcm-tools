import type { TSymbolSpecifier } from '../../types'

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
