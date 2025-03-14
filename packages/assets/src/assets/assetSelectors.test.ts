import type { TMultiLocation } from '@paraspell/sdk-common'
import { describe, expect, it } from 'vitest'

import type { TOverrideMultiLocationSpecifier, TSymbolSpecifier } from '../types'
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
    const sampleMultiLocation: TMultiLocation = {
      parents: 1,
      interior: {
        X1: { Parachain: 1000 }
      }
    }

    const result = Override(sampleMultiLocation)

    const expected: TOverrideMultiLocationSpecifier = {
      type: 'Override',
      value: sampleMultiLocation
    }
    expect(result).toEqual(expected)
  })
})
