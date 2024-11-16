import { describe, it, expect, vi, beforeEach } from 'vitest'
import { InvalidCurrencyError } from '../../errors/InvalidCurrencyError'
import type { XTokensTransferInput, TReserveAsset } from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../xTokens'
import type Crust from './Crust'
import { getNode } from '../../utils'
import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic } from '../../pjs/types'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Crust', () => {
  let crust: Crust<ApiPromise, Extrinsic>
  const mockInput = {
    asset: {
      symbol: 'CRU',
      assetId: '123'
    },
    amount: '100'
  } as XTokensTransferInput<ApiPromise, Extrinsic>

  beforeEach(() => {
    crust = getNode<ApiPromise, Extrinsic, 'Crust'>('Crust')
  })

  it('should initialize with correct values', () => {
    expect(crust.node).toBe('Crust')
    expect(crust.info).toBe('crustParachain')
    expect(crust.type).toBe('polkadot')
    expect(crust.version).toBe(Version.V3)
  })

  it('should call transferXTokens with SelfReserve when currency matches native asset', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')
    vi.spyOn(crust, 'getNativeAssetSymbol').mockReturnValue('CRU')

    crust.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 'SelfReserve' as TReserveAsset)
  })

  it('should call transferXTokens with OtherReserve when currencyID is defined and currency does not match native asset', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')
    vi.spyOn(crust, 'getNativeAssetSymbol').mockReturnValue('NOT_CRU')

    crust.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, { OtherReserve: BigInt(123) } as TReserveAsset)
  })

  it('should throw InvalidCurrencyError when currencyID is undefined and currency does not match native asset', () => {
    const invalidInput = {
      ...mockInput,
      asset: {
        symbol: 'XYZ'
      }
    }
    vi.spyOn(crust, 'getNativeAssetSymbol').mockReturnValue('NOT_CRU')

    expect(() => crust.transferXTokens(invalidInput)).toThrowError(InvalidCurrencyError)
  })
})
