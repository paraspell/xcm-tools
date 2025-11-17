import { InvalidCurrencyError, type TNativeAssetInfo, type WithAmount } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { transferXTokens } from '../../pallets/xTokens'
import type { TReserveAsset, TXTokensTransferOptions } from '../../types'
import { getChain } from '../../utils'
import type CrustShadow from './CrustShadow'

vi.mock('../../pallets/xTokens')

describe('CrustShadow', () => {
  let crustShadow: CrustShadow<unknown, unknown>
  const mockInput = {
    asset: {
      symbol: 'CRU',
      assetId: '123',
      amount: 100n
    }
  } as TXTokensTransferOptions<unknown, unknown>

  beforeEach(() => {
    crustShadow = getChain<unknown, unknown, 'CrustShadow'>('CrustShadow')
  })

  it('should initialize with correct values', () => {
    expect(crustShadow.chain).toBe('CrustShadow')
    expect(crustShadow.info).toBe('shadow')
    expect(crustShadow.ecosystem).toBe('Kusama')
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
        amount: 100n,
        isNative: true
      } as WithAmount<TNativeAssetInfo>
    }
    vi.spyOn(crustShadow, 'getNativeAssetSymbol').mockReturnValue('NOT_CRU')

    expect(() => crustShadow.transferXTokens(invalidInput)).toThrowError(InvalidCurrencyError)
  })
})
