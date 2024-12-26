import { describe, it, expect, vi, beforeEach } from 'vitest'
import { InvalidCurrencyError } from '../../errors/InvalidCurrencyError'
import type { TXTokensTransferOptions, TReserveAsset } from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../xTokens'
import type CrustShadow from './CrustShadow'
import { getNode } from '../../utils'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('CrustShadow', () => {
  let crustShadow: CrustShadow<unknown, unknown>
  const mockInput = {
    asset: {
      symbol: 'CRU',
      assetId: '123',
      amount: '100'
    }
  } as TXTokensTransferOptions<unknown, unknown>

  beforeEach(() => {
    crustShadow = getNode<unknown, unknown, 'CrustShadow'>('CrustShadow')
  })

  it('should initialize with correct values', () => {
    expect(crustShadow.node).toBe('CrustShadow')
    expect(crustShadow.info).toBe('shadow')
    expect(crustShadow.type).toBe('kusama')
    expect(crustShadow.version).toBe(Version.V3)
  })

  it('should call transferXTokens with SelfReserve when currency matches native asset', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')
    vi.spyOn(crustShadow, 'getNativeAssetSymbol').mockReturnValue('CRU')

    crustShadow.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 'SelfReserve' as TReserveAsset)
  })

  it('should call transferXTokens with OtherReserve when currencyID is defined and currency does not match native asset', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')
    vi.spyOn(crustShadow, 'getNativeAssetSymbol').mockReturnValue('NOT_CRU')

    crustShadow.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, { OtherReserve: BigInt(123) } as TReserveAsset)
  })

  it('should throw InvalidCurrencyError when currencyID is undefined and currency does not match native asset', () => {
    const invalidInput = {
      ...mockInput,
      asset: {
        symbol: 'INVALID',
        amount: '100'
      }
    }
    vi.spyOn(crustShadow, 'getNativeAssetSymbol').mockReturnValue('NOT_CRU')

    expect(() => crustShadow.transferXTokens(invalidInput)).toThrowError(InvalidCurrencyError)
  })
})