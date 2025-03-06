import { describe, expect, it } from 'vitest'

import type { TSymbolSpecifier } from '../../types'
import { Foreign, ForeignAbstract, Native } from './assetSelectors'

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
