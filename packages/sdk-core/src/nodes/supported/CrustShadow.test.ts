import { InvalidCurrencyError, type TNativeAsset, type WithAmount } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { transferXTokens } from '../../pallets/xTokens'
import type { TReserveAsset, TXTokensTransferOptions } from '../../types'
import { getNode } from '../../utils'
import type CrustShadow from './CrustShadow'

vi.mock('../../pallets/xTokens', () => ({
  transferXTokens: vi.fn()
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
    vi.spyOn(crustShadow, 'getNativeAssetSymbol').mockReturnValue('CRU')

    crustShadow.transferXTokens(mockInput)

    expect(transferXTokens).toHaveBeenCalledWith(mockInput, 'SelfReserve' as TReserveAsset)
  })

  it('should call transferXTokens with OtherReserve when currencyID is defined and currency does not match native asset', () => {
    vi.spyOn(crustShadow, 'getNativeAssetSymbol').mockReturnValue('NOT_CRU')

    crustShadow.transferXTokens(mockInput)

    expect(transferXTokens).toHaveBeenCalledWith(mockInput, { OtherReserve: 123n } as TReserveAsset)
  })

  it('should throw InvalidCurrencyError when currencyID is undefined and currency does not match native asset', () => {
    const invalidInput = {
      ...mockInput,
      asset: {
        symbol: 'INVALID',
        amount: '100',
        isNative: true
      } as WithAmount<TNativeAsset>
    }
    vi.spyOn(crustShadow, 'getNativeAssetSymbol').mockReturnValue('NOT_CRU')

    expect(() => crustShadow.transferXTokens(invalidInput)).toThrowError(InvalidCurrencyError)
  })
})
