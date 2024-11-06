import { describe, it, expect } from 'vitest'
import { Native, Foreign, ForeignAbstract } from './assetSelectors'
import type { TSymbolSpecifier } from '../../types'

describe('Symbol Specifiers', () => {
  const symbol = 'TEST'

  it('should create a Native symbol specifier', () => {
    const result: TSymbolSpecifier = Native(symbol)
    expect(result).toEqual({
      type: 'Native',
      value: symbol
    })
  })

  it('should create a Foreign symbol specifier', () => {
    const result: TSymbolSpecifier = Foreign(symbol)
    expect(result).toEqual({
      type: 'Foreign',
      value: symbol
    })
  })

  it('should create a ForeignAbstract symbol specifier', () => {
    const result: TSymbolSpecifier = ForeignAbstract(symbol)
    expect(result).toEqual({
      type: 'ForeignAbstract',
      value: symbol
    })
  })
})
