import type { TAssetInfo } from '@paraspell/assets'
import { InvalidCurrencyError, type WithAmount } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { transferXTokens } from '../../pallets/xTokens'
import type { TReserveAsset, TXTokensTransferOptions } from '../../types'
import { getChain } from '../../utils'
import type CrustShadow from './CrustShadow'

vi.mock('../../pallets/xTokens')

describe('CrustShadow', () => {
  let chain: CrustShadow<unknown, unknown>

  const mockInput = {
    asset: {
      symbol: 'CRU',
      assetId: '123',
      amount: 100n
    }
  } as TXTokensTransferOptions<unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, 'CrustShadow'>('CrustShadow')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('CrustShadow')
    expect(chain.info).toBe('shadow')
    expect(chain.ecosystem).toBe('Kusama')
    expect(chain.version).toBe(Version.V3)
  })

  it('should call transferXTokens with SelfReserve when currency matches native asset', () => {
    vi.spyOn(chain, 'getNativeAssetSymbol').mockReturnValue('CRU')

    chain.transferXTokens(mockInput)

    expect(transferXTokens).toHaveBeenCalledWith(mockInput, 'SelfReserve' as TReserveAsset)
  })

  it('should call transferXTokens with OtherReserve when currencyID is defined and currency does not match native asset', () => {
    vi.spyOn(chain, 'getNativeAssetSymbol').mockReturnValue('NOT_CRU')

    chain.transferXTokens(mockInput)

    expect(transferXTokens).toHaveBeenCalledWith(mockInput, { OtherReserve: 123n } as TReserveAsset)
  })

  it('should throw InvalidCurrencyError when currencyID is undefined and currency does not match native asset', () => {
    const invalidInput = {
      ...mockInput,
      asset: {
        symbol: 'INVALID',
        amount: 100n,
        isNative: true
      } as WithAmount<TAssetInfo>
    }
    vi.spyOn(chain, 'getNativeAssetSymbol').mockReturnValue('NOT_CRU')

    expect(() => chain.transferXTokens(invalidInput)).toThrow(InvalidCurrencyError)
  })
})
