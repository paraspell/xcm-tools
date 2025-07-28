import type { TLocation } from '@paraspell/sdk-common'
import { describe, expect, it } from 'vitest'

import type { TOverrideLocationSpecifier, TSymbolSpecifier } from '../types'
import { Foreign, ForeignAbstract, Native, Override } from './assetSelectors'

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

describe('Override Function', () => {
  it('should return an object with type "Override" and the correct value', () => {
    const sampleLocation: TLocation = {
      parents: 1,
      interior: {
        X1: { Parachain: 1000 }
      }
    }

    const result = Override(sampleLocation)

    const expected: TOverrideLocationSpecifier = {
      type: 'Override',
      value: sampleLocation
    }
    expect(result).toEqual(expected)
  })
})
