import { describe, it, expect, vi } from 'vitest'
import { isTCurrencySpecifier } from './utils'
import { transformSendOptions } from './transformSendOptions'
import { TSendOptionsCommon } from '../../types'

vi.mock('./utils', () => ({
  isTCurrencySpecifier: vi.fn()
}))

describe('transformSendOptions', () => {
  it('should convert currency to symbol if currency is a valid specifier with a symbol', () => {
    const options = {
      currency: {
        symbol: 'USDT'
      }
    } as TSendOptionsCommon

    vi.mocked(isTCurrencySpecifier).mockReturnValue(true)

    const result = transformSendOptions(options)

    expect(result).toEqual({
      ...options,
      currency: 'USDT',
      isSymbol: true
    })
  })

  it('should convert currency to id if currency is a valid specifier with an id', () => {
    const options = {
      currency: {
        id: '123'
      }
    } as TSendOptionsCommon

    vi.mocked(isTCurrencySpecifier).mockReturnValue(true)

    const result = transformSendOptions(options)

    expect(result).toEqual({
      ...options,
      currency: '123',
      isSymbol: false
    })
  })

  it('should return original options if currency is not a valid specifier', () => {
    const options = {
      currency: 'DOT'
    } as TSendOptionsCommon

    vi.mocked(isTCurrencySpecifier).mockReturnValue(false)

    const result = transformSendOptions(options)

    expect(result).toEqual({
      ...options,
      currency: 'DOT',
      isSymbol: undefined
    })
  })
})
